import { ThreatOverview } from "@shared/schema";
import { CVEService } from "./cve-service";
import { NewsService } from "./news-service";

export class ThreatOverviewService {
  private static instance: ThreatOverviewService;
  private cache: { data: ThreatOverview; timestamp: number } | null = null;
  private cacheTime = 15 * 60 * 1000; // 15 minutes

  private cveService: CVEService;
  private newsService: NewsService;

  constructor(cveService: CVEService, newsService: NewsService) {
    this.cveService = cveService;
    this.newsService = newsService;
  }

  static getInstance(cveService?: CVEService, newsService?: NewsService): ThreatOverviewService {
    if (!ThreatOverviewService.instance) {
      if (!cveService || !newsService) {
        throw new Error('CVEService and NewsService are required for first initialization');
      }
      ThreatOverviewService.instance = new ThreatOverviewService(cveService, newsService);
    }
    return ThreatOverviewService.instance;
  }

  async getThreatOverview(): Promise<ThreatOverview> {
    // Check cache
    if (this.cache && Date.now() - this.cache.timestamp < this.cacheTime) {
      return this.cache.data;
    }

    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Get CVE data for today
      const { cvesToday, criticalHighToday, kevAddedToday } = await this.getCVEMetrics(today);
      
      // Get news data for today
      const { topicCounts, headlines, newsCount } = await this.getNewsMetrics(today);
      
      // Calculate 7-day trend
      const trend7Day = await this.calculate7DayTrend();
      
      // Calculate threat level and rationale
      const { level, rationale } = this.calculateThreatLevel(
        criticalHighToday, 
        kevAddedToday, 
        topicCounts, 
        cvesToday
      );

      const overview: ThreatOverview = {
        date: today,
        level,
        metrics: {
          cvesToday,
          criticalHighToday,
          kevAddedToday,
          topicCounts,
        },
        headlines: headlines.slice(0, 3), // Top 3 headlines
        trend7Day,
        rationale
      };

      // Cache the result
      this.cache = {
        data: overview,
        timestamp: Date.now()
      };

      return overview;
    } catch (error) {
      console.error('Error generating threat overview:', error);
      // Return fallback data
      return this.getFallbackOverview();
    }
  }

  private async getCVEMetrics(today: string) {
    try {
      // Get recent CVEs (last 30 days to include today)
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const cveData = await this.cveService.getCVEsPaginated({
        search: '',
        severity: '',
        page: 1,
        limit: 1000
      });

      const todaysCVEs = cveData.data.filter(cve => 
        cve.publishedDate?.startsWith(today)
      );

      const criticalHighToday = todaysCVEs.filter(cve => 
        cve.severity === 'CRITICAL' || cve.severity === 'HIGH'
      ).length;

      const kevAddedToday = todaysCVEs.filter(cve => 
        cve.activelyExploited
      ).length;

      return {
        cvesToday: todaysCVEs.length,
        criticalHighToday,
        kevAddedToday
      };
    } catch (error) {
      console.error('Error fetching CVE metrics:', error);
      return { cvesToday: 0, criticalHighToday: 0, kevAddedToday: 0 };
    }
  }

  private async getNewsMetrics(today: string) {
    try {
      const allNews = await this.newsService.getAllNews();
      
      // Filter news from today
      const todaysNews = allNews.filter(article => {
        if (!article.publishedAt) return false;
        const articleDate = new Date(article.publishedAt).toISOString().split('T')[0];
        return articleDate === today;
      });

      // Classify topics by keywords
      const topicKeywords = {
        'ransomware': ['ransomware', 'encrypt', 'ransom'],
        'breach': ['breach', 'leak', 'data breach', 'stolen data'],
        'malware': ['malware', 'trojan', 'virus', 'backdoor'],
        'phishing': ['phishing', 'spear phishing', 'email attack'],
        'apt': ['apt', 'advanced persistent', 'nation state'],
        'zero-day': ['zero-day', 'zero day', '0-day'],
        'vulnerability': ['vulnerability', 'cve', 'exploit', 'patch']
      };

      const topicCounts: Record<string, number> = {};
      Object.keys(topicKeywords).forEach(topic => {
        topicCounts[topic] = 0;
      });

      todaysNews.forEach(article => {
        const content = (article.title + ' ' + article.summary).toLowerCase();
        Object.entries(topicKeywords).forEach(([topic, keywords]) => {
          if (keywords.some(keyword => content.includes(keyword))) {
            topicCounts[topic]++;
          }
        });
      });

      // Get top headlines
      const headlines = todaysNews
        .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
        .map(article => ({
          title: article.title,
          source: article.source,
          link: article.link || undefined
        }));

      return {
        topicCounts,
        headlines,
        newsCount: todaysNews.length
      };
    } catch (error) {
      console.error('Error fetching news metrics:', error);
      return { 
        topicCounts: {}, 
        headlines: [], 
        newsCount: 0 
      };
    }
  }

  private async calculate7DayTrend() {
    try {
      // This is a simplified trend calculation
      // In a real implementation, you might store historical data
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];
      
      const cveData = await this.cveService.getCVEsPaginated({
        search: '',
        severity: '',
        page: 1,
        limit: 1000
      });

      const allNews = await this.newsService.getAllNews();
      const weekNews = allNews.filter(article => {
        if (!article.publishedAt) return false;
        const articleDate = new Date(article.publishedAt);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return articleDate >= weekAgo;
      });

      return {
        cvesAvg: Math.round(cveData.data.length / 7),
        newsAvg: Math.round(weekNews.length / 7)
      };
    } catch (error) {
      console.error('Error calculating 7-day trend:', error);
      return null;
    }
  }

  private calculateThreatLevel(
    criticalHighToday: number, 
    kevAddedToday: number, 
    topicCounts: Record<string, number>, 
    cvesToday: number
  ): { level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL', rationale: string } {
    
    // Calculate threat score
    let score = 0;
    score += criticalHighToday * 2;
    score += kevAddedToday * 3;
    score += (topicCounts.ransomware || 0) * 2;
    score += (topicCounts['zero-day'] || 0) * 3;
    score += (topicCounts.apt || 0) * 2;
    score += (topicCounts.breach || 0) * 1;

    let level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    let rationale: string;

    if (score >= 15) {
      level = 'CRITICAL';
      rationale = `Критический уровень угроз: ${criticalHighToday} критических уязвимостей, ${kevAddedToday} активно эксплуатируемых. Повышенная активность в области ${Object.entries(topicCounts).filter(([_, count]) => count > 0).map(([topic]) => topic).join(', ')}.`;
    } else if (score >= 8) {
      level = 'HIGH';
      rationale = `Высокий уровень угроз: ${criticalHighToday} критических уязвимостей обнаружено сегодня. Активность в сферах: ${Object.entries(topicCounts).filter(([_, count]) => count > 0).map(([topic]) => topic).join(', ')}.`;
    } else if (score >= 3) {
      level = 'MODERATE';
      rationale = `Умеренный уровень угроз: ${cvesToday} новых уязвимостей за сегодня. Мониторим активность в области кибербезопасности.`;
    } else {
      level = 'LOW';
      rationale = `Низкий уровень угроз: спокойная обстановка в сфере кибербезопасности. ${cvesToday} уязвимостей обнаружено сегодня.`;
    }

    return { level, rationale };
  }

  private getFallbackOverview(): ThreatOverview {
    const today = new Date().toISOString().split('T')[0];
    return {
      date: today,
      level: 'MODERATE',
      metrics: {
        cvesToday: 0,
        criticalHighToday: 0,
        kevAddedToday: 0,
        topicCounts: {}
      },
      headlines: [{
        title: 'Сервис временно недоступен',
        source: 'Pabit',
        link: ''
      }],
      trend7Day: null,
      rationale: 'Данные аналитики угроз временно недоступны. Проверяем соединение с источниками данных.'
    };
  }
}