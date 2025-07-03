import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Database, Globe } from "lucide-react";

export default function Sidebar() {
  const { data: currentUser } = useQuery({
    queryKey: ["/api/users/current"],
  });

  return (
    <div className="space-y-6">
      {/* User Profile Card */}
      <Card className="cyber-bg-slate border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 cyber-bg-blue rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {currentUser?.name?.split(' ').map((n: string) => n[0]).join('') || 'JS'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-white">{currentUser?.name || 'John Smith'}</h3>
              <p className="text-slate-400 text-sm">{currentUser?.role || 'Senior Security Analyst'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="cyber-text-green font-bold text-lg">
                {currentUser?.postCount || 847}
              </div>
              <div className="text-slate-400 text-xs">Posts</div>
            </div>
            <div>
              <div className="cyber-text-blue font-bold text-lg">
                {currentUser?.reputation ? `${(currentUser.reputation / 1000).toFixed(1)}k` : '12.5k'}
              </div>
              <div className="text-slate-400 text-xs">Reputation</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="cyber-bg-slate border-slate-700">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button className="w-full cyber-bg-red hover:bg-red-700 text-white">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Report Incident
            </Button>
            <Button className="w-full cyber-bg-blue hover:bg-blue-700 text-white">
              <Database className="w-4 h-4 mr-2" />
              New CVE Alert
            </Button>
            <Button className="w-full cyber-bg-green hover:bg-emerald-600 text-white">
              <Globe className="w-4 h-4 mr-2" />
              Share Intel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
