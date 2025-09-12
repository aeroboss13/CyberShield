import type { NewsArticle } from "../../shared/schema";

interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  guid?: string;
}

interface RedditPost {
  data: {
    title: string;
    selftext: string;
    url: string;
    created_utc: number;
    score: number;
    author: string;
    subreddit: string;
    permalink: string;
    num_comments?: number;
  };
}

export class NewsService {
  private static instance: NewsService;
  private cache: Map<string, NewsArticle[]> = new Map();
  private lastUpdate: number = 0;
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  static getInstance(): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
    }
    return NewsService.instance;
  }

  async getAllNews(): Promise<NewsArticle[]> {
    const now = Date.now();
    
    if (this.cache.has('all_news') && now - this.lastUpdate < this.CACHE_DURATION) {
      return this.cache.get('all_news') || [];
    }

    try {
      console.log('Fetching news from multiple sources...');
      const newsSources = await Promise.allSettled([
        this.fetchTheHackerNews(),
        this.fetchKrebsOnSecurity(),
        this.fetchBleepingComputer(),
        this.fetchSecurityWeek(),
        this.fetchHackerNewsFeed(),
        this.fetchRedditSecurity()
      ]);

      const allNews: NewsArticle[] = [];
      
      newsSources.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          allNews.push(...result.value);
        } else {
          console.warn(`News source ${index} failed:`, result.status === 'rejected' ? result.reason : 'No data');
        }
      });

      // Sort by publication date (newest first)
      const sortedNews = this.deduplicateNews(allNews).sort((a, b) => {
        const dateA = a.publishedAt && a.publishedAt !== null ? 
          (a.publishedAt instanceof Date ? a.publishedAt : new Date(a.publishedAt as string)) : 
          new Date(0);
        const dateB = b.publishedAt && b.publishedAt !== null ? 
          (b.publishedAt instanceof Date ? b.publishedAt : new Date(b.publishedAt as string)) : 
          new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      this.cache.set('all_news', sortedNews);
      this.lastUpdate = now;
      
      console.log(`Aggregated ${sortedNews.length} security news articles`);
      return sortedNews;
    } catch (error) {
      console.error('Error aggregating news:', error);
      return this.getFallbackNews();
    }
  }

  private async fetchRSSFeed(url: string, source: string): Promise<NewsArticle[]> {
    try {
      // Use free RSS2JSON service
      const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&count=10`;
      
      const response = await fetch(rss2jsonUrl, {
        headers: {
          'User-Agent': 'SecHub/1.0 (Security News Aggregator)'
        }
      });

      if (!response.ok) {
        console.warn(`RSS2JSON failed for ${source}:`, response.status);
        return this.fetchDirectRSS(url, source);
      }

      const data = await response.json();
      const articles: NewsArticle[] = [];

      if (data.status === 'ok' && data.items) {
        data.items.forEach((item: any) => {
          if (item.title && item.link && this.isSecurityRelated(item.title)) {
            // Get the fullest content available
            const fullContent = item.content || item.description || item['content:encoded'] || '';
            const summary = item.description || item.content || 'Latest cybersecurity news';
            
            articles.push({
              id: this.hashString(item.link),
              title: this.cleanTitle(item.title),
              summary: this.stripHtml(summary),
              content: this.stripHtml(fullContent),
              source: source,
              imageUrl: item.thumbnail || item.enclosure?.url || null,
              link: item.link,
              tags: this.generateTags(item.title + ' ' + (fullContent || summary), source.toLowerCase()),
              publishedAt: item.pubDate ? new Date(item.pubDate) : new Date()
            });
          }
        });
      }

      console.log(`Fetched ${articles.length} articles from ${source}`);
      return articles;
    } catch (error) {
      console.error(`Error fetching RSS for ${source}:`, error);
      return this.fetchDirectRSS(url, source);
    }
  }

  private async fetchDirectRSS(url: string, source: string): Promise<NewsArticle[]> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SecHub/1.0 (Security News Aggregator)'
        }
      });

      if (!response.ok) {
        console.warn(`Direct RSS failed for ${source}:`, response.status);
        return [];
      }

      const xmlText = await response.text();
      return this.parseRSSXML(xmlText, source);
    } catch (error) {
      console.error(`Error with direct RSS for ${source}:`, error);
      return [];
    }
  }

  private parseRSSXML(xmlText: string, source: string): NewsArticle[] {
    const articles: NewsArticle[] = [];
    
    // Simple regex-based XML parsing for RSS items
    const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi);
    
    if (itemMatches) {
      itemMatches.slice(0, 10).forEach((item) => {
        const titleMatch = item.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
        const linkMatch = item.match(/<link[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/i);
        const descMatch = item.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
        const contentMatch = item.match(/<content:encoded[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/i);
        const pubDateMatch = item.match(/<pubDate[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/pubDate>/i);
        
        const title = titleMatch?.[1]?.trim();
        const link = linkMatch?.[1]?.trim();
        const description = descMatch?.[1]?.trim();
        const fullContent = contentMatch?.[1]?.trim();
        const pubDate = pubDateMatch?.[1]?.trim();
        
        // Use full content if available, otherwise use description
        const content = fullContent || description || '';
        const summary = description || fullContent || 'Latest cybersecurity news';
        
        if (title && link && this.isSecurityRelated(title)) {
          articles.push({
            id: this.hashString(link),
            title: this.cleanTitle(title),
            summary: this.stripHtml(summary),
            content: this.stripHtml(content),
            source: source,
            imageUrl: null,
            link: link,
            tags: this.generateTags(title + ' ' + content, source.toLowerCase()),
            publishedAt: pubDate ? new Date(pubDate) : new Date()
          });
        }
      });
    }
    
    return articles;
  }

  private async fetchTheHackerNews(): Promise<NewsArticle[]> {
    return this.fetchRSSFeed('https://feeds.feedburner.com/TheHackersNews', 'The Hacker News');
  }

  private async fetchKrebsOnSecurity(): Promise<NewsArticle[]> {
    return this.fetchRSSFeed('https://krebsonsecurity.com/feed/', 'Krebs on Security');
  }

  private async fetchBleepingComputer(): Promise<NewsArticle[]> {
    return this.fetchRSSFeed('https://www.bleepingcomputer.com/feed/', 'BleepingComputer');
  }

  private async fetchSecurityWeek(): Promise<NewsArticle[]> {
    return this.fetchRSSFeed('https://www.securityweek.com/feed/', 'SecurityWeek');
  }

  private async fetchHackerNewsFeed(): Promise<NewsArticle[]> {
    try {
      const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
      if (!response.ok) return [];
      
      const storyIds = await response.json();
      const articles: NewsArticle[] = [];
      
      // Get first 10 stories
      const selectedIds = storyIds.slice(0, 10);
      
      for (const id of selectedIds) {
        try {
          const storyResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          if (!storyResponse.ok) continue;
          
          const story = await storyResponse.json();
          
          if (story.title && (story.url || story.text) && this.isSecurityRelated(story.title)) {
            articles.push({
              id: story.id,
              title: this.cleanTitle(story.title),
              summary: story.text ? this.truncateText(story.text, 200) : 'Discussion on Hacker News',
              content: story.text || '',
              source: 'Hacker News',
              imageUrl: null,
              link: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
              tags: this.generateTags(story.title, 'hacker-news'),
              publishedAt: new Date(story.time * 1000)
            });
          }
        } catch (error) {
          continue;
        }
      }
      
      return articles;
    } catch (error) {
      console.error('Error fetching Hacker News:', error);
      return [];
    }
  }

  private async fetchRedditSecurity(): Promise<NewsArticle[]> {
    try {
      const subreddits = ['cybersecurity', 'netsec', 'InfoSecNews', 'security'];
      const articles: NewsArticle[] = [];

      for (const subreddit of subreddits) {
        try {
          const response = await fetch(
            `https://www.reddit.com/r/${subreddit}/hot.json?limit=5`,
            {
              headers: {
                'User-Agent': 'SecHub/1.0 (Security News Aggregator)'
              }
            }
          );

          if (!response.ok) continue;

          const data = await response.json();
          
          if (data.data && data.data.children) {
            data.data.children.forEach((child: { data: RedditPost['data'] }) => {
              const post = child.data;
              
              if (post.title && post.score > 10 && this.isSecurityRelated(post.title)) {
                articles.push({
                  id: this.hashString(post.permalink),
                  title: this.cleanTitle(post.title),
                  summary: post.selftext ? 
                    this.truncateText(post.selftext, 200) : 
                    `Community discussion: ${post.score} upvotes, ${post.num_comments || 0} comments`,
                  content: post.selftext || null,
                  source: `Reddit - r/${post.subreddit}`,
                  imageUrl: null,
                  link: `https://reddit.com${post.permalink}`,
                  tags: this.generateTags(post.title + ' ' + (post.selftext || ''), post.subreddit),
                  publishedAt: new Date(post.created_utc * 1000)
                });
              }
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch from r/${subreddit}:`, error);
        }
      }

      return articles;
    } catch (error) {
      console.error('Error fetching Reddit security news:', error);
      return [];
    }
  }

  private isSecurityRelated(title: string): boolean {
    const securityKeywords = [
      // Core security terms
      'security', 'cybersecurity', 'infosec', 'hack', 'hacker', 'hacking',
      'breach', 'data breach', 'vulnerability', 'exploit', 'zero-day', 'zero day',
      'malware', 'ransomware', 'trojan', 'virus', 'spyware', 'adware',
      'phishing', 'spear phishing', 'social engineering',
      
      // Attack types
      'cyberattack', 'cyber attack', 'ddos', 'dos attack', 'apt', 'botnet',
      'backdoor', 'rootkit', 'keylogger', 'cryptomining', 'cryptojacking',
      'supply chain attack', 'man in the middle', 'mitm',
      
      // Technologies and concepts
      'firewall', 'antivirus', 'endpoint', 'siem', 'soc', 'incident response',
      'threat hunting', 'threat intelligence', 'penetration testing', 'pentest',
      'red team', 'blue team', 'security audit', 'security assessment',
      
      // Vulnerabilities and techniques
      'injection', 'sql injection', 'xss', 'csrf', 'rce', 'lfi', 'rfi',
      'privilege escalation', 'buffer overflow', 'authentication bypass',
      'encryption', 'decryption', 'ssl', 'tls', 'certificate',
      
      // Compliance and frameworks
      'gdpr', 'hipaa', 'pci dss', 'iso 27001', 'nist', 'mitre', 'cve', 'cvss',
      'cisa', 'fbi cyber', 'darkweb', 'dark web'
    ];

    const lowerTitle = title.toLowerCase();
    return securityKeywords.some(keyword => lowerTitle.includes(keyword));
  }

  private generateTags(text: string, source: string): string[] {
    const tags = new Set<string>();
    const lowerText = text.toLowerCase();

    // Add source-based tag
    tags.add(source);

    // Security-specific tags
    const tagMapping = {
      'malware': ['malware', 'trojan', 'virus', 'ransomware'],
      'vulnerability': ['vulnerability', 'exploit', 'zero-day', 'cve'],
      'attack': ['attack', 'breach', 'hack', 'phishing'],
      'threat-intel': ['apt', 'threat', 'intelligence', 'campaign'],
      'enterprise': ['enterprise', 'corporate', 'business'],
      'mobile': ['android', 'ios', 'mobile', 'smartphone'],
      'cloud': ['cloud', 'aws', 'azure', 'saas'],
      'crypto': ['crypto', 'bitcoin', 'blockchain', 'cryptocurrency']
    };

    Object.entries(tagMapping).forEach(([tag, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        tags.add(tag);
      }
    });

    return Array.from(tags).slice(0, 5);
  }

  private deduplicateNews(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string>();
    return articles.filter(article => {
      const key = this.cleanTitle(article.title).toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private cleanTitle(title: string): string {
    return title
      .replace(/^\[.*?\]\s*/, '') // Remove [tags] at start
      .replace(/\s+/g, ' ')
      .trim();
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[^;]+;/g, ' ') // Remove HTML entities
      .replace(/\s+/g, ' ')
      .trim();
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private getFallbackNews(): NewsArticle[] {
    const now = new Date();
    return [
      {
        id: this.hashString('fallback-1'),
        title: 'Critical Zero-Day Vulnerability Discovered in Popular Enterprise Software',
        summary: 'Security researchers have identified a critical zero-day vulnerability affecting enterprise infrastructure. The flaw allows remote code execution and has been actively exploited in the wild.',
        content: 'A critical zero-day vulnerability (CVE-2024-XXXX) has been discovered in widely-used enterprise software, allowing attackers to execute arbitrary code remotely. The vulnerability affects versions 2.0 through 3.5 and has already been exploited by advanced persistent threat (APT) groups targeting financial institutions and government agencies.',
        source: 'Security Research Labs',
        imageUrl: null,
        link: null,
        tags: ['zero-day', 'enterprise', 'rce', 'apt'],
        publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
      },
      {
        id: this.hashString('fallback-2'),
        title: 'New Ransomware Campaign Targets Healthcare Organizations',
        summary: 'A sophisticated ransomware operation has emerged, specifically targeting healthcare providers with advanced evasion techniques and double extortion tactics.',
        content: 'Healthcare organizations across North America are facing a new ransomware threat that combines advanced encryption techniques with data theft capabilities. The attackers are demanding ransom payments while threatening to release sensitive patient data on dark web marketplaces.',
        source: 'Cybersecurity News',
        imageUrl: null,
        link: null,
        tags: ['ransomware', 'healthcare', 'data-theft', 'darkweb'],
        publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000)
      },
      {
        id: this.hashString('fallback-3'),
        title: 'CISA Issues Emergency Directive on Critical Infrastructure Protection',
        summary: 'The Cybersecurity and Infrastructure Security Agency has released new guidance for protecting critical infrastructure from emerging cyber threats.',
        content: 'CISA has issued an emergency directive requiring federal agencies and critical infrastructure operators to implement additional security measures following recent attacks on power grid systems. The directive includes mandatory network segmentation and enhanced monitoring requirements.',
        source: 'CISA',
        imageUrl: null,
        link: null,
        tags: ['cisa', 'critical-infrastructure', 'directive', 'government'],
        publishedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000)
      }
    ];
  }

  async getNewsById(id: number): Promise<NewsArticle | undefined> {
    const allNews = await this.getAllNews();
    return allNews.find(article => article.id === id);
  }
}