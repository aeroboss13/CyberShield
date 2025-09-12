import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Clock, Globe, Share, MessageSquare, X, Download, Loader } from "lucide-react";
import NewsComments from "./NewsComments";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { NewsArticleType, FullContentResponse } from "@/lib/types";

interface NewsModalProps {
  article: NewsArticleType | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function NewsModal({ article, isOpen, onClose }: NewsModalProps) {
  const [showFullContent, setShowFullContent] = useState(false);
  
  // Always render hooks consistently - derive values after hooks
  const articleId = article?.id;
  const hasLink = !!article?.link;
  const contentLength = (article?.content || article?.summary || '').length;
  const isProbablyTruncated = contentLength < 500;
  
  // Fetch full content when modal opens if content is short or user requests it
  const shouldAutoFetch = isOpen && hasLink && isProbablyTruncated;
  
  const { data: fullContent, isLoading: isLoadingFullContent } = useQuery<FullContentResponse>({
    queryKey: ['/api/news', articleId ?? 'none', 'full'],
    queryFn: () => fetch(`/api/news/${articleId}/full`).then(r => r.json()),
    enabled: Boolean(articleId && (shouldAutoFetch || showFullContent)),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
  
  if (!article) return null;

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return "now";
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  const getTagColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'apt':
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'zeroday':
      case 'ransomware':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'ai':
      case 'infrastructure':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'federal':
      case 'directive':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'cisa':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const handleShare = () => {
    console.log('Share button clicked!', article.title);
    
    const shareText = `${article.title}\n\n${article.link || window.location.href}`;
    
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: `Check out this security news: ${article.title}`,
        url: article.link || window.location.href
      }).catch(err => {
        console.log('Error sharing:', err);
        // Fallback to text selection
        copyToClipboardFallback(shareText);
      });
    } else {
      copyToClipboardFallback(shareText);
    }
  };
  
  const copyToClipboardFallback = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => alert('✅ Article link copied to clipboard!'))
        .catch(() => copyTextManually(text));
    } else {
      copyTextManually(text);
    }
  };
  
  const copyTextManually = (text: string) => {
    // Create temporary textarea for manual copy
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        alert('✅ Article link copied to clipboard!');
      } else {
        prompt('Copy this text manually:', text);
      }
    } catch (err) {
      console.log('Manual copy failed', err);
      prompt('Copy this text manually:', text);
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const handleDiscuss = () => {
    console.log('Discuss button clicked!', article.title);
    
    // Scroll to comments section
    const commentsSection = document.querySelector('[data-testid="news-comments-section"]');
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: 'smooth' });
      
      // Focus on the comment textarea after scrolling
      setTimeout(() => {
        const textarea = document.querySelector('[data-testid="textarea-new-comment"]') as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
        }
      }, 300);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto cyber-bg-surface border-slate-700">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-4">
            <Badge className="cyber-bg-green text-white">
              <Globe className="w-3 h-3 mr-1" />
              {article.source}
            </Badge>
            <div className="flex items-center space-x-1 cyber-text-dim">
              <Clock className="w-3 h-3" />
              <span className="text-xs">{formatTimestamp(article.publishedAt)}</span>
            </div>
          </div>
          
          <DialogTitle className="text-2xl font-bold text-white leading-tight mb-4">
            {article.title}
          </DialogTitle>
          
          <DialogDescription className="text-lg text-slate-300 leading-relaxed">
            {article.summary}
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-6 bg-slate-700" />

        {article.imageUrl && (
          <div className="mb-6">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full max-h-64 object-cover rounded-lg border cyber-border"
            />
          </div>
        )}

        <div className="space-y-6">
          {/* Full Content Section */}
          <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-6 border border-slate-300 dark:border-slate-600">
            <div className="flex items-center space-x-2 mb-4">
              <Globe className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-slate-900 dark:text-slate-100">Article Details</span>
            </div>
            
            <div className="mb-6">
              {/* Show loading state while fetching full content */}
              {(isLoadingFullContent && shouldAutoFetch) ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-6 h-6 animate-spin text-blue-500 mr-2" />
                  <span className="text-slate-600 dark:text-slate-400">Loading full article...</span>
                </div>
              ) : (
                <div 
                  className="text-slate-900 dark:text-slate-100 leading-relaxed mb-6 text-base whitespace-pre-wrap"
                  data-testid="text-article-content"
                >
                  {/* Display full content if available, otherwise use original */}
                  {(fullContent?.success ? fullContent.content : null) || article.content || article.summary}
                </div>
              )}
              
              {/* Show full content button if not already loaded and has link */}
              {!fullContent?.success && !showFullContent && hasLink && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <Download className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-blue-900 dark:text-blue-100 text-sm font-medium mb-2">Limited Content Available</p>
                      <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
                        This appears to be truncated content from the RSS feed. 
                        Load the full article with complete details and analysis.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setShowFullContent(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                        data-testid="button-load-full-content"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Load Full Article
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Success message when full content is loaded */}
              {fullContent?.success && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-green-800 dark:text-green-200 text-sm font-medium">
                      Full article content loaded • {fullContent.content.length} characters
                    </p>
                    <span className="text-green-600 dark:text-green-400 text-xs">
                      Extracted {new Date(fullContent.extractedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="bg-slate-200 dark:bg-slate-700 rounded-lg p-4 border border-slate-300 dark:border-slate-600">
                <p className="text-slate-700 dark:text-slate-300 text-sm mb-3 font-medium">
                  Article Metadata
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center space-x-2">
                    <span>Source:</span>
                    <span className="font-mono text-slate-900 dark:text-slate-100">{article.source}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>Published:</span>
                    <span className="font-mono text-slate-900 dark:text-slate-100">{new Date(article.publishedAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>Content Length:</span>
                    <span className="font-mono text-slate-900 dark:text-slate-100">{(article.content || article.summary).length} chars</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>Article ID:</span>
                    <span className="font-mono text-slate-900 dark:text-slate-100">#{article.id}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <Button
              className="cyber-button-primary w-full"
              onClick={() => {
                if (article.link) {
                  window.open(article.link, '_blank', 'noopener,noreferrer');
                } else {
                  window.open(`https://www.google.com/search?q=${encodeURIComponent(article.title + ' ' + article.source)}`, '_blank');
                }
              }}
              data-testid="button-read-full-article"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {article.link ? 'Read Full Article at Source' : 'Search for Original Article'}
            </Button>
          </div>

          {/* Tags */}
          <div>
            <h4 className="text-sm font-medium cyber-text-muted mb-3">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag, index) => (
                <span
                  key={index}
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getTagColor(tag)}`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                className="cyber-text-muted hover:cyber-text-blue"
                onClick={handleShare}
                data-testid="button-share-article"
              >
                <Share className="w-4 h-4 mr-1" />
                Share
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="cyber-text-muted hover:cyber-text-blue"
                onClick={handleDiscuss}
                data-testid="button-discuss-article"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Discuss
              </Button>
            </div>
            
            <Button
              className="cyber-button-primary"
              onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(article.title + ' ' + article.source)}`, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Search Original
            </Button>
          </div>

          {/* Comments Section */}
          <div data-testid="news-comments-section">
            <NewsComments 
              articleId={article.id} 
              articleTitle={article.title}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}