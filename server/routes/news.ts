import { Router } from 'express';
import { NewsService } from '../services/news-service.js';
import { ContentExtractorService } from '../services/content-extractor.js';

const router = Router();
const newsService = new NewsService();
const contentExtractor = new ContentExtractorService();

// News service will auto-initialize when needed

// Cleanup content extractor cache every hour
setInterval(() => {
  contentExtractor.cleanup();
}, 60 * 60 * 1000);

// Get all news articles
router.get('/', async (req, res) => {
  try {
    const articles = await newsService.getAllNews();
    res.json(articles);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news articles' });
  }
});

// Get full content for a specific article
router.get('/:id/full', async (req, res) => {
  try {
    const articleId = req.params.id;
    const articles = await newsService.getAllNews();
    const article = articles.find((a: any) => a.id.toString() === articleId);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    if (!article.link) {
      return res.status(400).json({ error: 'No source URL available for this article' });
    }
    
    const extractedContent = await contentExtractor.extractFullContent(article.link, articleId);
    
    if (!extractedContent.success) {
      return res.status(200).json({ 
        success: false,
        error: extractedContent.error,
        fallback: 'RSS summary available',
        articleId: article.id,
        sourceUrl: article.link,
        content: '',
        title: '',
        extractedAt: new Date().toISOString(),
        originalSummary: article.summary
      });
    }
    
    res.json({
      success: true,
      articleId: article.id,
      sourceUrl: article.link,
      title: extractedContent.title || article.title,
      content: extractedContent.content,
      extractedAt: extractedContent.extractedAt.toISOString(),
      originalSummary: article.summary
    });
    
  } catch (error) {
    console.error('Error extracting full content:', error);
    res.status(500).json({ 
      error: 'Content extraction failed',
      fallback: 'RSS summary available' 
    });
  }
});

export { router as newsRouter };