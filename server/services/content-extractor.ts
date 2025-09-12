import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export interface ExtractedContent {
  content: string;
  title: string;
  extractedAt: Date;
  success: boolean;
  error?: string;
}

interface CacheEntry {
  content: ExtractedContent;
  expiry: number;
}

export class ContentExtractorService {
  private cache = new Map<string, CacheEntry>();
  private rateLimiter = new Map<string, { requests: number; resetTime: number }>();
  
  // Allowed domains for security (SSRF prevention) - expanded for real news sources
  private allowedDomains = [
    'thehackernews.com',
    'krebsonsecurity.com', 
    'bleepingcomputer.com',
    'securityweek.com',
    'feeds.feedburner.com',
    'threatpost.com',
    'darkreading.com',
    'cyberscoop.com',
    'zdnet.com',
    'arstechnica.com',
    'wired.com',
    'schneier.com',
    'reddit.com',
    'github.com'
  ];

  // Rate limiting: 6 requests per minute per domain
  private rateLimit = {
    maxRequests: 6,
    windowMs: 60 * 1000 // 1 minute
  };

  // Cache for 24 hours for successful extractions, 30 minutes for failures
  private cacheDuration = {
    success: 24 * 60 * 60 * 1000, // 24 hours
    failure: 30 * 60 * 1000       // 30 minutes
  };

  async extractFullContent(url: string, articleId: string): Promise<ExtractedContent> {
    // Check cache first
    const cached = this.getFromCache(url);
    if (cached) {
      console.log(`Content cache hit for ${url}`);
      return cached;
    }

    // Validate domain
    if (!this.isAllowedDomain(url)) {
      const error = 'Domain not allowed for content extraction';
      const result = this.createErrorResult(error);
      this.setCache(url, result, false);
      return result;
    }

    // Check rate limit
    if (!this.checkRateLimit(url)) {
      const error = 'Rate limit exceeded for this domain';
      const result = this.createErrorResult(error);
      return result; // Don't cache rate limit errors
    }

    try {
      console.log(`Extracting content from ${url}`);
      const content = await this.extractWithStrategies(url);
      this.setCache(url, content, content.success);
      return content;
    } catch (error) {
      console.error(`Content extraction failed for ${url}:`, error);
      const result = this.createErrorResult(`Extraction failed: ${error}`);
      this.setCache(url, result, false);
      return result;
    }
  }

  private async extractWithStrategies(url: string): Promise<ExtractedContent> {
    // Strategy 1: Mozilla Readability with JSDOM
    try {
      const readabilityResult = await this.extractWithReadability(url);
      if (readabilityResult.success && readabilityResult.content.length > 500) {
        console.log(`Readability extraction successful for ${url}`);
        return readabilityResult;
      }
    } catch (error) {
      console.warn(`Readability extraction failed for ${url}:`, error);
    }

    // Strategy 2: Basic HTML parsing fallback
    try {
      const basicResult = await this.extractWithBasicParsing(url);
      if (basicResult.success) {
        console.log(`Basic extraction successful for ${url}`);
        return basicResult;
      }
    } catch (error) {
      console.warn(`Basic extraction failed for ${url}:`, error);
    }

    return this.createErrorResult('All extraction strategies failed');
  }

  private async extractWithReadability(url: string): Promise<ExtractedContent> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SecHub/1.0; +https://sechub.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.content) {
      throw new Error('Readability failed to parse article');
    }

    // Convert HTML to clean text
    const contentDom = new JSDOM(article.content);
    const textContent = contentDom.window.document.body?.textContent || '';

    return {
      content: this.cleanText(textContent),
      title: article.title || '',
      extractedAt: new Date(),
      success: true
    };
  }

  private async extractWithBasicParsing(url: string): Promise<ExtractedContent> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SecHub/1.0; +https://sechub.com)',
        'Accept': 'text/html,application/xhtml+xml'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Try different content selectors
    const selectors = [
      'article',
      '[role="main"]',
      '.post-content',
      '.entry-content', 
      '.article-content',
      '.content',
      'main p'
    ];

    let content = '';
    let title = document.title || '';

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        content = Array.from(elements)
          .map((el: Element) => el.textContent || '')
          .join('\n\n');
        
        if (content.length > 200) {
          break; // Found substantial content
        }
      }
    }

    if (content.length < 200) {
      throw new Error('Insufficient content found with basic parsing');
    }

    return {
      content: this.cleanText(content),
      title: this.cleanText(title),
      extractedAt: new Date(),
      success: true
    };
  }

  private isAllowedDomain(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return this.allowedDomains.some(domain => 
        parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  }

  private checkRateLimit(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      const domain = parsedUrl.hostname;
      const now = Date.now();
      
      const current = this.rateLimiter.get(domain);
      
      if (!current || now > current.resetTime) {
        // Reset or initialize rate limit
        this.rateLimiter.set(domain, {
          requests: 1,
          resetTime: now + this.rateLimit.windowMs
        });
        return true;
      }
      
      if (current.requests >= this.rateLimit.maxRequests) {
        return false; // Rate limit exceeded
      }
      
      current.requests++;
      return true;
    } catch {
      return false;
    }
  }

  private getFromCache(url: string): ExtractedContent | null {
    const cached = this.cache.get(url);
    if (cached && Date.now() < cached.expiry) {
      return cached.content;
    }
    
    if (cached) {
      this.cache.delete(url); // Remove expired entry
    }
    
    return null;
  }

  private setCache(url: string, content: ExtractedContent, success: boolean): void {
    const ttl = success ? this.cacheDuration.success : this.cacheDuration.failure;
    this.cache.set(url, {
      content,
      expiry: Date.now() + ttl
    });
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')           // Collapse whitespace
      .replace(/\n\s*\n/g, '\n\n')    // Clean up line breaks
      .trim();
  }

  private createErrorResult(error: string): ExtractedContent {
    return {
      content: '',
      title: '',
      extractedAt: new Date(),
      success: false,
      error
    };
  }

  // Clean up cache periodically
  cleanup(): void {
    const now = Date.now();
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (now >= entry.expiry) {
        this.cache.delete(key);
      }
    });
  }
}