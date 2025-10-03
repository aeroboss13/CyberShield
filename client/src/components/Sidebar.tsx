import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Database, 
  Globe, 
  Shield, 
  TrendingUp,
  Users,
  Plus,
  Search,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ThreatOverview } from "@shared/schema";
import type { PublicUser } from "@shared/schema";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";


export default function Sidebar() {
  const { t } = useLanguage();

  // Check if user is authenticated
  const { data: currentUser, error } = useQuery<PublicUser>({
    queryKey: ["/api/users/current"],
    retry: false,
    throwOnError: false
  });
  const isAuthenticated = !error && currentUser;

  // Get threat overview data for Global Threat Level
  const { data: threatOverview, isLoading: threatLoading } = useQuery<ThreatOverview>({
    queryKey: ["/api/threat/overview"],
    retry: 1,
    throwOnError: false,
    refetchInterval: 15 * 60 * 1000, // Refresh every 15 minutes
  });

  return (
    <div className="space-y-6">



      {/* Global Threat Level Analytics */}
      <div className="cyber-bg-surface rounded-xl p-6 border cyber-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold cyber-text text-sm">{t('sidebar.threat.level')}</h3>
          {threatLoading ? (
            <div className="w-20 h-6 bg-gray-600 animate-pulse rounded"></div>
          ) : (
            <Badge 
              className={`text-black font-semibold ${
                threatOverview?.level === 'CRITICAL' ? 'cyber-bg-red pulse-red' :
                threatOverview?.level === 'HIGH' ? 'cyber-bg-orange' :
                threatOverview?.level === 'MODERATE' ? 'cyber-bg-amber' :
                'cyber-bg-green'
              }`}
              data-testid="threat-level"
            >
              {threatOverview?.level || 'UNKNOWN'}
            </Badge>
          )}
        </div>

        {/* Threat Metrics */}
        {threatOverview && !threatLoading && (
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 cyber-text-red" />
                <span className="cyber-text text-xs">{t('sidebar.cves.today')}</span>
              </div>
              <span className="cyber-text-red font-semibold text-sm" data-testid="metric-cves-today">
                {threatOverview.metrics.cvesToday}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 cyber-text-amber" />
                <span className="cyber-text text-xs">{t('sidebar.critical.high')}</span>
              </div>
              <span className="cyber-text-amber font-semibold text-sm" data-testid="metric-critical-high">
                {threatOverview.metrics.criticalHighToday}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 cyber-text-green" />
                <span className="cyber-text text-xs">{t('sidebar.kev.added')}</span>
              </div>
              <span className="cyber-text-green font-semibold text-sm">
                {threatOverview.metrics.kevAddedToday}
              </span>
            </div>
          </div>
        )}

        {/* Today's Top Headlines */}
        {threatOverview?.headlines && threatOverview.headlines.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="cyber-text text-xs font-semibold mb-2">{t('sidebar.headlines')}</h4>
            <div className="space-y-1">
              {threatOverview.headlines.slice(0, 3).map((headline, index) => (
                <div key={index} className="text-xs">
                  {headline.link ? (
                    <a 
                      href={headline.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="cyber-text-blue hover:text-blue-300 transition-colors"
                      data-testid={`link-headline-${index}`}
                    >
                      • {headline.title}
                    </a>
                  ) : (
                    <span className="cyber-text-muted">• {headline.title}</span>
                  )}
                  <div className="text-gray-400 text-xs ml-2">
                    {headline.source}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Threat Analysis */}
        <div className={`rounded-lg p-3 border ${
          threatOverview?.level === 'CRITICAL' ? 'cyber-bg-red-dark border-red-500' :
          threatOverview?.level === 'HIGH' ? 'cyber-bg-orange-dark border-orange-500' :
          threatOverview?.level === 'MODERATE' ? 'cyber-bg-amber-dark border-amber-500' :
          'cyber-bg-green-dark border-green-500'
        }`}>
          <p className={`text-xs leading-relaxed ${
            threatOverview?.level === 'CRITICAL' ? 'text-red-200' :
            threatOverview?.level === 'HIGH' ? 'text-orange-200' :
            threatOverview?.level === 'MODERATE' ? 'text-amber-200' :
            'text-green-200'
          }`}>
            {threatLoading ? (
              <span className="animate-pulse">Анализируем глобальную ситуацию...</span>
            ) : (
              threatOverview?.rationale || 'Анализ уровня угроз недоступен.'
            )}
          </p>
        </div>

        {/* 7-Day Trend */}
        {threatOverview?.trend7Day && (
          <div className="mt-3 pt-3 border-t border-gray-600">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-3 h-3 cyber-text-blue" />
              <span className="cyber-text text-xs font-semibold">{t('sidebar.trend')}</span>
            </div>
            <div className="text-xs text-gray-300">
              Avg: {threatOverview.trend7Day.cvesAvg} CVEs/day, {threatOverview.trend7Day.newsAvg} news/day
            </div>
          </div>
        )}
      </div>

      {/* InfoSearch Quick Access */}
      {isAuthenticated && (
        <div className="cyber-bg-surface rounded-xl p-6 border cyber-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold cyber-text text-sm">Пробив данных</h3>
            <Search className="w-4 h-4 cyber-text-blue" />
          </div>
          <p className="cyber-text-muted text-xs mb-4">
            Поиск информации в базах данных
          </p>
          <Link href="/infosearch">
            <Button className="w-full cyber-button-primary" data-testid="button-infosearch">
              <Search className="mr-2 h-4 w-4" />
              Открыть пробив
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
