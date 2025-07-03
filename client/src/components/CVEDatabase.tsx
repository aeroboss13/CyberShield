import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { CVEWithDetails } from "@/lib/types";

export default function CVEDatabase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("All Severities");

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

  return (
    <Card className="cyber-bg-slate border-slate-700">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">CVE Database</h2>
          <div className="flex space-x-4">
            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger className="w-40 cyber-bg-gray border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="cyber-bg-gray border-slate-600">
                <SelectItem value="All Severities">All Severities</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              placeholder="Search CVE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 cyber-bg-gray border-slate-600 text-white placeholder-slate-400 focus:ring-cyber-blue focus:border-cyber-blue"
            />
          </div>
        </div>

        <div className="space-y-4">
          {cves?.map((cve) => (
            <div key={cve.cveId} className="cyber-bg-gray rounded-lg p-6 border border-slate-600">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-mono cyber-text-red font-semibold text-lg">{cve.cveId}</h3>
                    <Badge className={getSeverityColor(cve.severity)}>
                      {cve.severity}
                    </Badge>
                    {cve.activelyExploited && (
                      <Badge className="bg-yellow-500/20 text-yellow-400">
                        Actively Exploited
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-slate-300 mb-4">{cve.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">CVSS Score:</span>
                      <span className={`font-bold ml-2 ${getCVSSColor(cve.cvssScore)}`}>
                        {cve.cvssScore || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Published:</span>
                      <span className="text-slate-300 ml-2">{cve.publishedDate || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Updated:</span>
                      <span className="text-slate-300 ml-2">{cve.updatedDate || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Vendor:</span>
                      <span className="text-slate-300 ml-2">{cve.vendor || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <Button className="cyber-bg-blue hover:bg-blue-700 text-white text-sm">
                    View Details
                  </Button>
                  <Button className="cyber-bg-green hover:bg-emerald-600 text-white text-sm">
                    Exploits
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {cve.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-slate-500/20 text-slate-400 px-3 py-1 rounded-full text-xs font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {cves?.length === 0 && (
          <div className="text-center text-slate-400 py-8">
            <p>No CVEs found matching your search criteria.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
