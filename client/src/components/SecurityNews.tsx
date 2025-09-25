import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Globe, Clock, TrendingUp, MessageSquare, Share } from "lucide-react";
import NewsModal from "./NewsModal";
import type { NewsArticleType } from "@/lib/types";

export default function SecurityNews() {
  const [selectedArticle, setSelectedArticle] = useState<NewsArticleType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shouldFocusComments, setShouldFocusComments] = useState(false);

  const { data: news, isLoading } = useQuery<NewsArticleType[]>({
    queryKey: ["/api/news"],
  });

  const openArticle = (article: NewsArticleType, focusComments = false) => {
    setSelectedArticle(article);
    setIsModalOpen(true);
    setShouldFocusComments(focusComments);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedArticle(null);
    setShouldFocusComments(false);
  };

  const handleShare = (article: NewsArticleType) => {
    // Generate link to article in our project
    const projectUrl = `${window.location.origin}${window.location.pathname}?article=${article.id}`;
    const shareText = `${article.title}\n\n${projectUrl}`;
    
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: `Check out this security news: ${article.title}`,
        url: projectUrl
      }).catch(err => {
        console.log('Error sharing:', err);
        copyToClipboard(shareText);
      });
    } else {
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => {})
        .catch(() => copyTextManually(text));
    } else {
      copyTextManually(text);
    }
  };
  
  const copyTextManually = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        // Link copied silently
      } else {
        alert('Please copy this text manually: ' + text);
      }
    } catch (err) {
      alert('Please copy this text manually: ' + text);
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const handleDiscuss = (article: NewsArticleType) => {
    // Open article modal with comments section focused
    openArticle(article, true);
  };

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
        return 'bg-red-500/20 text-red-400';
      case 'zeroday':
      case 'ransomware':
        return 'bg-orange-500/20 text-orange-400';
      case 'ai':
      case 'infrastructure':
        return 'bg-blue-500/20 text-blue-400';
      case 'federal':
      case 'directive':
        return 'bg-green-500/20 text-green-400';
      case 'cisa':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="cyber-bg-slate border-slate-700">
            <CardContent className="pt-6">
              <div className="animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-24 h-16 bg-slate-600 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-600 rounded w-1/4"></div>
                    <div className="h-6 bg-slate-600 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-600 rounded w-full"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="cyber-bg-surface rounded-xl p-4 sm:p-6 border cyber-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-3">
              <Globe className="w-6 sm:w-8 h-6 sm:h-8 cyber-text-green" />
              <span>Security News</span>
            </h2>
            <p className="cyber-text-muted mt-1">Latest cybersecurity news from trusted sources</p>
          </div>
          <div className="flex justify-center sm:justify-end">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold cyber-text-green">{news?.length || 0}</div>
                <div className="text-xs cyber-text-dim">Articles</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold cyber-text-blue">Live</div>
                <div className="text-xs cyber-text-dim">Updates</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* News Feed */}
      <div className="space-y-4">
        {news?.map((article) => (
          <div key={article.id} className="news-card rounded-xl p-4 sm:p-6">
            <article className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
              {article.imageUrl && (
                <div className="flex-shrink-0">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full sm:w-32 h-48 sm:h-24 rounded-lg object-cover border cyber-border"
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-3">
                  <Badge className="cyber-bg-green text-white">
                    {article.source}
                  </Badge>
                  <div className="flex items-center space-x-1 cyber-text-dim">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">{formatTimestamp(article.publishedAt)}</span>
                  </div>
                </div>
                
                <h3 
                  className="text-xl font-bold text-white mb-3 leading-tight hover:cyber-text-green cursor-pointer transition-colors line-clamp-2"
                  onClick={() => openArticle(article)}
                >
                  {article.title}
                </h3>
                
                <p className="text-white mb-4 leading-relaxed line-clamp-3">{article.summary}</p>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex flex-wrap gap-2">
                    {article.tags.slice(0, 4).map((tag, index) => (
                      <span
                        key={index}
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getTagColor(tag)}`}
                      >
                        #{tag}
                      </span>
                    ))}
                    {article.tags.length > 4 && (
                      <span className="cyber-text-dim text-xs px-2 py-1">
                        +{article.tags.length - 4} more
                      </span>
                    )}
                  </div>
                  
                  {/* Mobile: Stack buttons vertically, Desktop: Horizontal */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                    <div className="flex space-x-2 sm:space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="cyber-text-muted hover:cyber-text-blue flex-1 sm:flex-none"
                        onClick={() => handleDiscuss(article)}
                        data-testid={`button-discuss-${article.id}`}
                      >
                        <MessageSquare className="w-4 h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Discuss</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="cyber-text-muted hover:cyber-text-blue flex-1 sm:flex-none"
                        onClick={() => handleShare(article)}
                        data-testid={`button-share-${article.id}`}
                      >
                        <Share className="w-4 h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Share</span>
                      </Button>
                    </div>
                    <Button
                      className="cyber-button-secondary w-full sm:w-auto"
                      onClick={() => openArticle(article)}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Read More
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          </div>
        ))}
      </div>
      
      {news?.length === 0 && (
        <div className="text-center cyber-text-muted py-12">
          <Globe className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No security news available at the moment.</p>
          <p className="text-sm mt-2">Check back soon for the latest updates.</p>
        </div>
      )}

      <NewsModal
        article={selectedArticle}
        isOpen={isModalOpen}
        onClose={closeModal}
        shouldFocusComments={shouldFocusComments}
      />
    </div>
  );
}
