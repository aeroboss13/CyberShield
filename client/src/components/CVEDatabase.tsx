import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Eye, Code, ExternalLink, Calendar, User, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import CVEDetailModal from "./CVEDetailModal";
import type { CVEWithDetails } from "@/lib/types";

interface PaginatedCVEResult {
  data: CVEWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function CVEDatabase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("All Severities");
  const [selectedCVE, setSelectedCVE] = useState<CVEWithDetails | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(100); // 100 CVEs per page
  
  // Debounced search query to reduce API calls
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  
  // Debounce search input and reset page on search
  useMemo(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 500); // 500ms delay
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);
  
  // Reset page when severity filter changes
  const handleSeverityChange = (severity: string) => {
    setSelectedSeverity(severity);
    setCurrentPage(1);
  };

  const { data: cveResult, isLoading } = useQuery<PaginatedCVEResult>({
    queryKey: ["/api/cves", { search: debouncedSearchQuery, severity: selectedSeverity, page: currentPage, limit: pageSize }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearchQuery.trim()) {
        params.append('search', debouncedSearchQuery.trim());
      }
      if (selectedSeverity && selectedSeverity !== 'All Severities') {
        params.append('severity', selectedSeverity);
      }
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());
      
      const url = `/api/cves?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch CVEs');
      }
      return response.json();
    },
    staleTime: 60000, // 1 minute
    refetchInterval: false,
    enabled: true
  });
  
  const cves = cveResult?.data || [];
  const pagination = cveResult ? {
    total: cveResult.total,
    totalPages: cveResult.totalPages,
    currentPage: cveResult.page,
    hasNext: cveResult.hasNext,
    hasPrev: cveResult.hasPrev
  } : null;

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
            <div className="text-center text-cyan-400 py-4">
              Loading CVEs from NVD database...
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-600 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
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
              <div className="text-2xl font-bold cyber-text-red">{pagination?.total.toLocaleString() || 0}</div>
              <div className="text-xs cyber-text-dim">Total CVEs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold cyber-text-amber">
                {cves?.filter(cve => cve.activelyExploited).length || 0}
              </div>
              <div className="text-xs cyber-text-dim">On This Page</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold cyber-text-blue">{pagination?.currentPage || 1}</div>
              <div className="text-xs cyber-text-dim">Current Page</div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedSeverity} onValueChange={handleSeverityChange}>
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
                
                {/* EDB-ID Section - если есть */}
                {cve.edbId && (
                  <div className="mb-4 p-3 rounded-lg cyber-bg-surface border cyber-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Code className="w-4 h-4 cyber-text-red" />
                        <div>
                          <span className="cyber-text-dim text-sm">ExploitDB ID</span>
                          <div className="text-white font-mono font-bold">EDB-{cve.edbId}</div>
                        </div>
                      </div>
                      <a 
                        href={`https://www.exploit-db.com/exploits/${cve.edbId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-3 py-1 rounded cyber-bg-red hover:opacity-80 transition-opacity text-white text-sm font-medium"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>View Exploit</span>
                      </a>
                    </div>
                  </div>
                )}
                
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
                <Button 
                  className="cyber-button-secondary"
                  onClick={() => setSelectedCVE(cve)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Details
                </Button>
                <Button 
                  className="cyber-button-primary"
                  onClick={() => setSelectedCVE(cve)}
                >
                  <Code className="w-4 h-4 mr-2" />
                  Exploits
                </Button>
                <Button 
                  variant="outline" 
                  className="border-gray-600 text-gray-400 hover:text-white hover:border-gray-500"
                  onClick={() => window.open(`https://nvd.nist.gov/vuln/detail/${cve.cveId}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  NVD
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between cyber-bg-surface rounded-xl p-4 border cyber-border">
          <div className="text-sm cyber-text-muted">
            Showing {((pagination.currentPage - 1) * pageSize) + 1} to {Math.min(pagination.currentPage * pageSize, pagination.total)} of {pagination.total.toLocaleString()} CVEs
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!pagination.hasPrev || isLoading}
              className="cyber-button-secondary"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = Math.max(1, Math.min(pagination.totalPages - 4, pagination.currentPage - 2)) + i;
                if (page > pagination.totalPages) return null;
                
                return (
                  <Button
                    key={page}
                    variant={page === pagination.currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    disabled={isLoading}
                    className={page === pagination.currentPage ? "cyber-button-primary" : "cyber-button-secondary"}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!pagination.hasNext || isLoading}
              className="cyber-button-secondary"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
      
      {cves?.length === 0 && !isLoading && (
        <div className="text-center cyber-text-muted py-12">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No CVEs found matching your search criteria.</p>
          <p className="text-sm mt-2">Try adjusting your filters or search terms.</p>
        </div>
      )}

      {/* Bottom Pagination (duplicate for convenience) */}
      {pagination && pagination.totalPages > 1 && cves.length > 0 && (
        <div className="flex items-center justify-center space-x-2 cyber-bg-surface rounded-xl p-4 border cyber-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={!pagination.hasPrev || isLoading}
            className="cyber-button-secondary"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          
          <span className="text-sm cyber-text-muted px-4">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!pagination.hasNext || isLoading}
            className="cyber-button-secondary"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* CVE Detail Modal */}
      <CVEDetailModal
        cve={selectedCVE}
        isOpen={!!selectedCVE}
        onClose={() => setSelectedCVE(null)}
      />
    </div>
  );
}
