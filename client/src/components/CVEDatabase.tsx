import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Eye, Code, ExternalLink, Calendar, User, TrendingUp } from "lucide-react";
import ExploitViewer from "./ExploitViewer";
import type { CVEWithDetails } from "@/lib/types";

export default function CVEDatabase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("All Severities");
  const [viewingExploits, setViewingExploits] = useState<string | null>(null);

  const { data: cves, isLoading } = useQuery<CVEWithDetails[]>({
    queryKey: ["/api/cves", { search: searchQuery, severity: selectedSeverity }],
  });

  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-500 text-white';
      case 'HIGH':
        return 'bg-orange-500 text-white';
      case 'MEDIUM':
        return 'bg-yellow-500 text-black';
      case 'LOW':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getCVSSColor = (score: string | null) => {
    if (!score) return 'text-slate-400';
    const numScore = parseFloat(score);
    if (numScore >= 9.0) return 'text-red-400';
    if (numScore >= 7.0) return 'text-orange-400';
    if (numScore >= 4.0) return 'text-yellow-400';
    return 'text-blue-400';
  };

  if (isLoading) {
    return (
      <Card className="cyber-bg-slate border-slate-700">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-600 rounded w-1/3"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-600 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show exploit viewer if a CVE is selected
  if (viewingExploits) {
    return (
      <ExploitViewer 
        cveId={viewingExploits} 
        onClose={() => setViewingExploits(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="cyber-bg-surface rounded-xl p-6 border cyber-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
              <AlertTriangle className="w-8 h-8 cyber-text-red" />
              <span>CVE Database</span>
            </h2>
            <p className="cyber-text-muted mt-1">Real-time vulnerability intelligence from NVD</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold cyber-text-red">{cves?.length || 0}</div>
              <div className="text-xs cyber-text-dim">Total CVEs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold cyber-text-amber">
                {cves?.filter(cve => cve.activelyExploited).length || 0}
              </div>
              <div className="text-xs cyber-text-dim">Actively Exploited</div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
            <SelectTrigger className="cyber-input w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="cyber-bg-surface border cyber-border">
              <SelectItem value="All Severities">All Severities</SelectItem>
              <SelectItem value="CRITICAL">🔴 Critical</SelectItem>
              <SelectItem value="HIGH">🟠 High</SelectItem>
              <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
              <SelectItem value="LOW">🔵 Low</SelectItem>
            </SelectContent>
          </Select>
          
          <Input
            placeholder="Search CVE ID, description, or vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="cyber-input flex-1"
          />
        </div>
      </div>

      {/* CVE Cards */}
      <div className="space-y-4">
        {cves?.map((cve) => (
          <div key={cve.cveId} className="cve-card rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <h3 className="font-mono cyber-text-red font-bold text-xl">{cve.cveId}</h3>
                  <Badge className={`${getSeverityColor(cve.severity)} px-3 py-1 text-sm font-semibold`}>
                    {cve.severity}
                  </Badge>
                  {cve.activelyExploited && (
                    <Badge className="cyber-bg-amber text-black px-3 py-1 text-sm font-semibold animate-pulse">
                      🚨 Actively Exploited
                    </Badge>
                  )}
                </div>
                
                <p className="text-white mb-4 leading-relaxed">{cve.description}</p>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 cyber-text-blue" />
                    <div>
                      <span className="cyber-text-dim text-sm">CVSS Score</span>
                      <div className={`font-bold ${getCVSSColor(cve.cvssScore)}`}>
                        {cve.cvssScore || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 cyber-text-green" />
                    <div>
                      <span className="cyber-text-dim text-sm">Published</span>
                      <div className="text-white">{cve.publishedDate || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 cyber-text-amber" />
                    <div>
                      <span className="cyber-text-dim text-sm">Updated</span>
                      <div className="text-white">{cve.updatedDate || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 cyber-text-muted" />
                    <div>
                      <span className="cyber-text-dim text-sm">Vendor</span>
                      <div className="text-white">{cve.vendor || 'N/A'}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {(cve.tags || []).map((tag, index) => (
                    <span
                      key={index}
                      className="cyber-bg-surface-light text-white px-3 py-1 rounded-full text-xs font-medium border cyber-border"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col space-y-2 ml-6">
                <Button className="cyber-button-secondary">
                  <Eye className="w-4 h-4 mr-2" />
                  Details
                </Button>
                <Button 
                  className="cyber-button-primary"
                  onClick={() => setViewingExploits(cve.cveId)}
                >
                  <Code className="w-4 h-4 mr-2" />
                  Exploits
                </Button>
                <Button 
                  variant="outline" 
                  className="border-gray-600 text-gray-400 hover:text-white hover:border-gray-500"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  NVD
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {cves?.length === 0 && (
        <div className="text-center cyber-text-muted py-12">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No CVEs found matching your search criteria.</p>
          <p className="text-sm mt-2">Try adjusting your filters or search terms.</p>
        </div>
      )}
    </div>
  );
}
