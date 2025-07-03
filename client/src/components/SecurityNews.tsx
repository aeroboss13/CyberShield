import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import type { NewsArticleType } from "@/lib/types";

export default function SecurityNews() {
  const { data: news, isLoading } = useQuery<NewsArticleType[]>({
    queryKey: ["/api/news"],
  });

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
      {news?.map((article) => (
        <Card key={article.id} className="cyber-bg-slate border-slate-700">
          <CardContent className="pt-6">
            <article className="flex items-start space-x-4">
              {article.imageUrl && (
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-24 h-16 rounded-lg object-cover flex-shrink-0"
                />
              )}
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-slate-400 text-sm">{article.source}</span>
                  <span className="text-slate-500 text-sm">• {formatTimestamp(article.publishedAt)}</span>
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-2 hover:text-cyber-blue cursor-pointer transition-colors">
                  {article.title}
                </h3>
                
                <p className="text-slate-300 mb-4">{article.summary}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag, index) => (
                      <span
                        key={index}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getTagColor(tag)}`}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  <Button
                    variant="ghost"
                    className="cyber-text-blue hover:text-blue-400 font-medium text-sm p-0 h-auto"
                  >
                    Read More
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </article>
          </CardContent>
        </Card>
      ))}
      
      {news?.length === 0 && (
        <Card className="cyber-bg-slate border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center text-slate-400">
              <p>No security news available at the moment.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
