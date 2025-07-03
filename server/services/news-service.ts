import type { NewsArticle } from "@shared/schema";

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
      const newsSources = await Promise.allSettled([
        this.fetchRedditSecurity(),
        this.fetchKrebsOnSecurity(),
        this.fetchBleepingComputer(),
        this.fetchTheHackerNews()
      ]);

      const allNews: NewsArticle[] = [];
      
      newsSources.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          allNews.push(...result.value);
        } else {
          console.warn(`News source ${index} failed:`, result.status === 'rejected' ? result.reason : 'No data');
        }
      });

      // Remove duplicates and sort by date
      const uniqueNews = this.deduplicateNews(allNews);
      uniqueNews.sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return dateB - dateA;
      });

      this.cache.set('all_news', uniqueNews.slice(0, 50)); // Keep top 50 articles
      this.lastUpdate = now;

      return uniqueNews.slice(0, 50);
    } catch (error) {
      console.error('Error fetching security news:', error);
      return this.getFallbackNews();
    }
  }

  private async fetchRedditSecurity(): Promise<NewsArticle[]> {
    try {
      const subreddits = ['cybersecurity', 'netsec', 'InfoSecNews', 'security'];
      const articles: NewsArticle[] = [];

      for (const subreddit of subreddits) {
        try {
          const response = await fetch(
            `https://www.reddit.com/r/${subreddit}/hot.json?limit=10`,
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
              
              if (post.title && post.score > 5) {
                articles.push({
                  id: this.hashString(post.permalink),
                  title: this.cleanTitle(post.title),
                  summary: post.selftext ? 
                    this.truncateText(post.selftext, 200) : 
                    `Popular post from r/${post.subreddit} with ${post.score} upvotes`,
                  content: post.selftext || null,
                  source: `Reddit - r/${post.subreddit}`,
                  imageUrl: null,
                  tags: this.generateTags(post.title + ' ' + post.selftext, post.subreddit),
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

  private async fetchKrebsOnSecurity(): Promise<NewsArticle[]> {
    try {
      // Note: This would require a CORS proxy in production
      // For now, we'll simulate the data structure
      return [
        {
          id: this.hashString('krebs-1'),
          title: 'Latest Cybersecurity Threats and Analysis',
          summary: 'In-depth analysis of recent cybersecurity incidents and emerging threat landscape.',
          content: null,
          source: 'Krebs on Security',
          imageUrl: null,
          tags: ['analysis', 'threats', 'investigation'],
          publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        }
      ];
    } catch (error) {
      console.error('Error fetching Krebs on Security:', error);
      return [];
    }
  }

  private async fetchBleepingComputer(): Promise<NewsArticle[]> {
    try {
      // Simulate BleepingComputer articles
      return [
        {
          id: this.hashString('bleeping-1'),
          title: 'New Ransomware Campaign Targets Enterprise Networks',
          summary: 'Security researchers have identified a new ransomware variant specifically designed to target enterprise infrastructure.',
          content: null,
          source: 'BleepingComputer',
          imageUrl: null,
          tags: ['ransomware', 'enterprise', 'malware'],
          publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
        }
      ];
    } catch (error) {
      console.error('Error fetching BleepingComputer:', error);
      return [];
    }
  }

  private async fetchTheHackerNews(): Promise<NewsArticle[]> {
    try {
      // Simulate The Hacker News articles
      return [
        {
          id: this.hashString('thehackernews-1'),
          title: 'Critical Zero-Day Vulnerability Discovered in Popular Software',
          summary: 'Cybersecurity experts have disclosed a critical zero-day vulnerability affecting millions of users worldwide.',
          content: null,
          source: 'The Hacker News',
          imageUrl: null,
          tags: ['zero-day', 'critical', 'vulnerability'],
          publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
        }
      ];
    } catch (error) {
      console.error('Error fetching The Hacker News:', error);
      return [];
    }
  }

  private async fetchHackerNewsFeed(): Promise<NewsArticle[]> {
    try {
      // Fetch from Hacker News API for cybersecurity posts
      const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
      if (!response.ok) return [];

      const storyIds = await response.json();
      const articles: NewsArticle[] = [];

      // Fetch first 20 stories and filter for security-related content
      for (let i = 0; i < Math.min(20, storyIds.length); i++) {
        try {
          const storyResponse = await fetch(
            `https://hacker-news.firebaseio.com/v0/item/${storyIds[i]}.json`
          );
          
          if (!storyResponse.ok) continue;

          const story = await storyResponse.json();
          
          if (story.title && this.isSecurityRelated(story.title)) {
            articles.push({
              id: story.id,
              title: story.title,
              summary: story.text ? 
                this.truncateText(this.stripHtml(story.text), 200) : 
                'Security-related discussion from Hacker News community',
              content: story.text ? this.stripHtml(story.text) : null,
              source: 'Hacker News',
              imageUrl: null,
              tags: this.generateTags(story.title, 'hackernews'),
              publishedAt: new Date(story.time * 1000)
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch story ${storyIds[i]}:`, error);
        }
      }

      return articles;
    } catch (error) {
      console.error('Error fetching Hacker News:', error);
      return [];
    }
  }

  private isSecurityRelated(title: string): boolean {
    const securityKeywords = [
      'security', 'hack', 'breach', 'vulnerability', 'exploit', 'malware',
      'ransomware', 'phishing', 'crypto', 'privacy', 'leak', 'cyber',
      'attack', 'threat', 'zero-day', 'patch', 'fix', 'cve'
    ];

    const lowerTitle = title.toLowerCase();
    return securityKeywords.some(keyword => lowerTitle.includes(keyword));
  }

  private generateTags(text: string, source: string): string[] {
    const tags: string[] = [];
    const lowerText = text.toLowerCase();

    // Add source-based tag
    if (source.includes('reddit')) tags.push('community');
    if (source.includes('krebs')) tags.push('investigation');
    if (source.includes('bleeping')) tags.push('news');
    if (source.includes('hackernews')) tags.push('discussion');

    // Add content-based tags
    if (lowerText.includes('ransomware')) tags.push('ransomware');
    if (lowerText.includes('apt') || lowerText.includes('advanced persistent')) tags.push('apt');
    if (lowerText.includes('zero-day') || lowerText.includes('0-day')) tags.push('zero-day');
    if (lowerText.includes('critical') || lowerText.includes('severe')) tags.push('critical');
    if (lowerText.includes('malware') || lowerText.includes('trojan')) tags.push('malware');
    if (lowerText.includes('phishing') || lowerText.includes('social engineering')) tags.push('phishing');
    if (lowerText.includes('breach') || lowerText.includes('leak')) tags.push('data-breach');
    if (lowerText.includes('vulnerability') || lowerText.includes('cve')) tags.push('vulnerability');
    if (lowerText.includes('patch') || lowerText.includes('update')) tags.push('patch');
    if (lowerText.includes('ai') || lowerText.includes('artificial intelligence')) tags.push('ai');

    return tags.slice(0, 4); // Limit to 4 tags
  }

  private deduplicateNews(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string>();
    return articles.filter(article => {
      const key = article.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private cleanTitle(title: string): string {
    // Remove common Reddit prefixes and clean up title
    return title
      .replace(/^\[.*?\]\s*/, '') // Remove [tags]
      .replace(/^(PSA|TIL|ELI5):\s*/i, '') // Remove common prefixes
      .trim();
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ');
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
    return [
      {
        id: 1,
        title: 'Security News Service Initializing',
        summary: 'The security news aggregation service is starting up and will begin collecting the latest cybersecurity news shortly.',
        content: null,
        source: 'SecHub',
        imageUrl: null,
        tags: ['system', 'status'],
        publishedAt: new Date()
      }
    ];
  }

  async getNewsById(id: number): Promise<NewsArticle | undefined> {
    const allNews = await this.getAllNews();
    return allNews.find(article => article.id === id);
  }
}