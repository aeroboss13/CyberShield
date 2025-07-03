import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Clock, Globe, Share, MessageSquare, X } from "lucide-react";
import type { NewsArticleType } from "@/lib/types";

interface NewsModalProps {
  article: NewsArticleType | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function NewsModal({ article, isOpen, onClose }: NewsModalProps) {
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
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(`${article.title}\n\n${article.summary}\n\nSource: ${article.source}`);
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
          <div className="cyber-bg-slate rounded-lg p-6 border border-slate-700">
            <div className="flex items-center space-x-2 mb-4">
              <Globe className="w-5 h-5 cyber-text-blue" />
              <span className="font-medium text-white">Article Details</span>
            </div>
            
            <div className="mb-6">
              {/* Always show the fullest available content */}
              <div className="text-white leading-relaxed mb-4 text-base">
                {article.content && article.content.length > article.summary.length ? 
                  article.content : 
                  article.summary}
              </div>
              
              {/* Show additional context if content is longer than summary */}
              {article.content && article.content.length > article.summary.length && (
                <div className="cyber-bg-surface rounded-lg p-4 border border-slate-600 mb-4">
                  <p className="cyber-text-muted text-sm">
                    📄 Full content extracted from RSS feed
                  </p>
                </div>
              )}
              
              <div className="cyber-bg-surface rounded-lg p-4 border border-slate-600">
                <p className="cyber-text-muted text-sm mb-3">
                  This summary was aggregated from RSS feeds. For the complete article with full details, images, and analysis, visit the original source.
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs cyber-text-dim">
                  <div className="flex items-center space-x-2">
                    <span>Source:</span>
                    <span className="font-mono">{article.source}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>Published:</span>
                    <span className="font-mono">{new Date(article.publishedAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>Article ID:</span>
                    <span className="font-mono">#{article.id}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>Category:</span>
                    <span className="font-mono">Security News</span>
                  </div>
                </div>
              </div>
            </div>
            
            <Button
              className="cyber-button-primary w-full"
              onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(article.title + ' ' + article.source)}`, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Search for Original Article
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
              >
                <Share className="w-4 h-4 mr-1" />
                Share
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="cyber-text-muted hover:cyber-text-blue"
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
        </div>
      </DialogContent>
    </Dialog>
  );
}