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
  Plus
} from "lucide-react";

export default function Sidebar() {
  const { data: currentUser } = useQuery({
    queryKey: ["/api/users/current"],
  });

  return (
    <div className="space-y-6">
      {/* User Profile Card */}
      <div className="cyber-bg-surface rounded-xl p-6 border cyber-border">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            <div className="w-16 h-16 cyber-gradient rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">
                {currentUser?.name?.split(' ').map((n: string) => n[0]).join('') || 'JS'}
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1">
              <Badge className="cyber-bg-green text-white text-xs px-2 py-1">
                <Activity className="w-3 h-3 mr-1" />
                Online
              </Badge>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white text-lg">{currentUser?.name || 'John Smith'}</h3>
            <p className="cyber-text-muted text-sm">{currentUser?.role || 'Senior Security Analyst'}</p>
            <div className="flex items-center space-x-1 mt-1">
              <Award className="w-3 h-3 cyber-text-amber" />
              <span className="cyber-text-amber text-xs font-medium">Level 7 Analyst</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="cyber-text-muted">Reputation Progress</span>
              <span className="cyber-text-blue font-semibold">
                {currentUser?.reputation ? `${(currentUser.reputation / 1000).toFixed(1)}k` : '12.5k'} / 15k
              </span>
            </div>
            <Progress value={85} className="h-2 cyber-bg-dark" />
          </div>
          
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="cyber-bg-surface-light rounded-lg p-3 border cyber-border">
              <div className="cyber-text-green font-bold text-xl">
                {currentUser?.postCount || 847}
              </div>
              <div className="cyber-text-dim text-xs">Posts</div>
            </div>
            <div className="cyber-bg-surface-light rounded-lg p-3 border cyber-border">
              <div className="cyber-text-blue font-bold text-xl">156</div>
              <div className="cyber-text-dim text-xs">Likes</div>
            </div>
            <div className="cyber-bg-surface-light rounded-lg p-3 border cyber-border">
              <div className="cyber-text-amber font-bold text-xl">23</div>
              <div className="cyber-text-dim text-xs">CVEs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="cyber-bg-surface rounded-xl p-6 border cyber-border">
        <h3 className="font-bold text-white mb-4 flex items-center space-x-2">
          <Plus className="w-5 h-5 cyber-text-blue" />
          <span>Quick Actions</span>
        </h3>
        <div className="space-y-3">
          <Button className="w-full cyber-button-primary justify-start">
            <AlertTriangle className="w-4 h-4 mr-3" />
            Report Security Incident
          </Button>
          <Button className="w-full cyber-button-secondary justify-start">
            <Database className="w-4 h-4 mr-3" />
            Submit CVE Analysis
          </Button>
          <Button className="w-full cyber-button-secondary justify-start">
            <Globe className="w-4 h-4 mr-3" />
            Share Threat Intel
          </Button>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="cyber-bg-surface rounded-xl p-6 border cyber-border">
        <h3 className="font-bold text-white mb-4 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 cyber-text-green" />
          <span>Activity</span>
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 cyber-text-blue" />
              <span className="text-white text-sm">Threats Analyzed</span>
            </div>
            <span className="cyber-text-blue font-semibold">127</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 cyber-text-green" />
              <span className="text-white text-sm">Community Rank</span>
            </div>
            <span className="cyber-text-green font-semibold">#42</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 cyber-text-amber" />
              <span className="text-white text-sm">This Week</span>
            </div>
            <span className="cyber-text-amber font-semibold">+15 pts</span>
          </div>
        </div>
      </div>

      {/* Threat Level Indicator */}
      <div className="cyber-bg-surface rounded-xl p-6 border cyber-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-white text-sm">Global Threat Level</h3>
          <Badge className="cyber-bg-amber text-black pulse-red">
            ELEVATED
          </Badge>
        </div>
        <div className="cyber-bg-amber-dark rounded-lg p-3 border border-amber-500">
          <p className="text-amber-200 text-xs leading-relaxed">
            Increased APT activity detected. Monitor for spearphishing campaigns and credential theft attempts.
          </p>
        </div>
      </div>
    </div>
  );
}
