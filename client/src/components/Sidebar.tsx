import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Database, 
  Globe, 
  Shield, 
  TrendingUp,
  Users,
  Activity,
  Award,
  Plus,
  UserX,
  Search,
} from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { UserAvatar } from "@/components/UserAvatar";
import { PublicUser, ThreatOverview } from "@shared/schema";


export default function Sidebar() {
  const { t } = useLanguage();
  
  const { data: currentUser, error } = useQuery<PublicUser>({
    queryKey: ["/api/users/current"],
    retry: false,
    throwOnError: false
  });

  // Check if user is authenticated
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
      {/* User Profile Card */}
      <div className="cyber-bg-surface rounded-xl p-6 border cyber-border">
        {isAuthenticated ? (
          <>
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative">
                <UserAvatar 
                  src={currentUser.avatar} 
                  name={currentUser.name} 
                  size="xl"
                  data-testid="avatar-sidebar"
                />
                <div className="absolute -bottom-1 -right-1">
                  <Badge className="cyber-bg-green cyber-text text-xs px-2 py-1">
                    <Activity className="w-3 h-3 mr-1" />
{t('sidebar.online')}
                  </Badge>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold cyber-text text-lg">{currentUser.name}</h3>
                <p className="cyber-text-muted text-sm">{currentUser.role || 'Security Professional'}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <Award className="w-3 h-3 cyber-text-amber" />
                  <span className="cyber-text-amber text-xs font-medium">
                    {currentUser.role === 'admin' ? 'Administrator' : 'Member'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="cyber-text-muted">Reputation Progress</span>
                  <span className="cyber-text-blue font-semibold">
                    {currentUser.reputation ? `${(currentUser.reputation / 1000).toFixed(1)}k` : '0'} / 15k
                  </span>
                </div>
                <Progress 
                  value={currentUser.reputation ? Math.min(100, (currentUser.reputation / 15000) * 100) : 0} 
                  className="h-2 cyber-bg-dark" 
                />
              </div>
              
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="cyber-bg-surface-light rounded-lg p-3 border cyber-border">
                  <div className="cyber-text-green font-bold text-xl">
                    {currentUser.postCount || 0}
                  </div>
                  <div className="cyber-text-dim text-xs">{t('sidebar.posts')}</div>
                </div>
                <div className="cyber-bg-surface-light rounded-lg p-3 border cyber-border">
                  <div className="cyber-text-blue font-bold text-xl">
                    {currentUser.likesReceived || 0}
                  </div>
                  <div className="cyber-text-dim text-xs">{t('sidebar.likes')}</div>
                </div>
                <div className="cyber-bg-surface-light rounded-lg p-3 border cyber-border">
                  <div className="cyber-text-amber font-bold text-xl">
                    {currentUser.cveSubmissions || 0}
                  </div>
                  <div className="cyber-text-dim text-xs">{t('cves')}</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 cyber-bg-surface-light rounded-xl flex items-center justify-center mx-auto">
              <UserX className="w-8 h-8 cyber-text-muted" />
            </div>
            <div>
              <h3 className="font-bold cyber-text text-lg">{t('not.signed.in')}</h3>
              <p className="cyber-text-muted text-sm">{t('sign.in.to.access')}</p>
            </div>
            <div className="space-y-2">
              <Link href="/login">
                <Button className="w-full cyber-button-primary">
                  {t('sign.in')}
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" className="w-full cyber-button-secondary">
                  {t('create.account')}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>



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
