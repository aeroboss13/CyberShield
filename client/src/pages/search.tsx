import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, Shield, AlertTriangle, Bug, FileText, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "../contexts/LanguageContext";
import HighlightText from "../components/HighlightText";
import SearchResultModal from "../components/SearchResultModal";

interface SearchResult {
  type: 'cve' | 'exploit' | 'mitre' | 'post';
  id: string;
  title: string;
  description: string;
  severity?: string;
  date?: string;
  source?: string;
  tags?: string[];
  // Дополнительные поля для CVE
  cvssScore?: number | null;
  vendor?: string;
  updatedDate?: string;
  activelyExploited?: boolean;
  edbId?: string | null;
  references?: string;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  // Get search query from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (query) {
      setSearchQuery(query);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setSelectedResult(result);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedResult(null);
  };

  // CVE Search
  const { data: cveResults, isLoading: cveLoading, error: cveError } = useQuery({
    queryKey: ["/api/cves", { search: searchQuery, page: 1, limit: 10 }],
    enabled: searchQuery.length > 2 && (activeTab === "all" || activeTab === "cves"),
    staleTime: 30000,
  });

  // Exploit Search
  const { data: exploitResults, isLoading: exploitLoading } = useQuery({
    queryKey: ["/api/exploits/search", { q: searchQuery }],
    enabled: searchQuery.length > 2 && (activeTab === "all" || activeTab === "exploits"),
    staleTime: 30000,
  });

  // MITRE Search
  const { data: mitreResults, isLoading: mitreLoading } = useQuery({
    queryKey: ["/api/mitre/search", { q: searchQuery }],
    enabled: searchQuery.length > 2 && (activeTab === "all" || activeTab === "mitre"),
    staleTime: 30000,
  });

  // Posts Search (mock data for now)
  const postsResults = searchQuery.length > 2 ? [
    {
      type: 'post' as const,
      id: '1',
      title: `Security Analysis: ${searchQuery}`,
      description: `Detailed analysis of ${searchQuery} vulnerability and its impact on enterprise systems.`,
      date: '2025-09-25',
      source: 'Security Team',
      tags: ['analysis', 'vulnerability', 'enterprise']
    }
  ] : [];

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cve': return <Shield className="w-4 h-4" />;
      case 'exploit': return <Bug className="w-4 h-4" />;
      case 'mitre': return <AlertTriangle className="w-4 h-4" />;
      case 'post': return <FileText className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const allResults: SearchResult[] = [
    ...(cveResults?.data?.map((cve: any) => ({
      type: 'cve' as const,
      id: cve.cveId,
      title: cve.title,
      description: cve.description,
      severity: cve.severity,
      date: cve.publishedDate,
      source: 'NVD',
      tags: cve.tags,
      // Дополнительные поля для CVE
      cvssScore: cve.cvssScore,
      vendor: cve.vendor,
      updatedDate: cve.updatedDate,
      activelyExploited: cve.activelyExploited,
      edbId: cve.edbId,
      references: cve.references
    })) || []),
    ...(exploitResults?.map((exploit: any) => ({
      type: 'exploit' as const,
      id: exploit.id,
      title: exploit.title,
      description: exploit.description,
      date: exploit.date,
      source: exploit.source,
      tags: exploit.tags
    })) || []),
    ...(mitreResults?.map((technique: any) => ({
      type: 'mitre' as const,
      id: technique.techniqueId,
      title: technique.techniqueName,
      description: technique.techniqueDescription,
      source: 'MITRE ATT&CK',
      tags: [technique.tacticName]
    })) || []),
    ...postsResults
  ];

  const filteredResults = activeTab === "all" 
    ? allResults 
    : allResults.filter(result => result.type === activeTab);

  const isLoading = cveLoading || exploitLoading || mitreLoading;

  return (
    <div className="min-h-screen cyber-bg">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold cyber-text mb-4">Search Results</h1>
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Search CVEs, exploits, MITRE techniques, posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="cyber-input w-full pl-12 pr-4 h-12 text-lg"
              />
              <button
                type="submit"
                className="absolute left-4 top-3.5 hover:cyber-text-blue transition-colors"
              >
                <Search className="w-5 h-5 cyber-text-dim" />
              </button>
            </form>
          </div>
        </div>

        {/* Results Tabs */}
        {searchQuery.length > 2 && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All ({allResults.length})</TabsTrigger>
              <TabsTrigger value="cves">CVEs ({cveResults?.data?.length || 0})</TabsTrigger>
              <TabsTrigger value="exploits">Exploits ({exploitResults?.length || 0})</TabsTrigger>
              <TabsTrigger value="mitre">MITRE ({mitreResults?.length || 0})</TabsTrigger>
              <TabsTrigger value="posts">Posts ({postsResults.length})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-blue mx-auto mb-4"></div>
                  <p className="cyber-text-dim">Searching...</p>
                </div>
              ) : cveError ? (
                <div className="text-center py-12">
                  <div className="text-red-500 mb-4">Search Error</div>
                  <p className="cyber-text-dim">Error: {cveError.message}</p>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 cyber-text-dim mx-auto mb-4" />
                  <h3 className="text-xl font-semibold cyber-text mb-2">No results found</h3>
                  <p className="cyber-text-dim">Try different keywords or check your spelling</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredResults.map((result, index) => (
                    <Card 
                      key={`${result.type}-${result.id}-${index}`} 
                      className="cyber-bg-surface border cyber-border hover:cyber-bg-surface-light transition-colors cursor-pointer hover:shadow-lg"
                      onClick={() => handleResultClick(result)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="cyber-bg-surface-light p-2 rounded-lg">
                              {getTypeIcon(result.type)}
                            </div>
                            <div>
                              <CardTitle className="cyber-text text-lg">
                                <HighlightText 
                                  text={result.title} 
                                  searchQuery={searchQuery}
                                />
                              </CardTitle>
                              <div className="text-sm cyber-text-dim mt-1">
                                <HighlightText 
                                  text={result.id} 
                                  searchQuery={searchQuery}
                                />
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="cyber-border">
                                  {result.type.toUpperCase()}
                                </Badge>
                                {result.severity && (
                                  <Badge className={`${getSeverityColor(result.severity)} text-white`}>
                                    {result.severity}
                                  </Badge>
                                )}
                                {result.source && (
                                  <span className="text-sm cyber-text-dim">{result.source}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {result.date && (
                              <span className="text-sm cyber-text-dim">{result.date}</span>
                            )}
                            <ExternalLink className="w-4 h-4 cyber-text-dim opacity-50" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="cyber-text-dim mb-3">
                          <HighlightText 
                            text={result.description} 
                            searchQuery={searchQuery}
                          />
                        </p>
                        {result.tags && result.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {result.tags.map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="secondary" className="cyber-bg-surface-light">
                                <HighlightText 
                                  text={tag} 
                                  searchQuery={searchQuery}
                                />
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Empty State */}
        {searchQuery.length <= 2 && (
          <div className="text-center py-16">
            <Search className="w-20 h-20 cyber-text-dim mx-auto mb-6" />
            <h2 className="text-2xl font-semibold cyber-text mb-4">Search the Platform</h2>
            <p className="cyber-text-dim text-lg mb-8">
              Find CVEs, exploits, MITRE techniques, and security posts
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <Card className="cyber-bg-surface border cyber-border p-6">
                <Shield className="w-8 h-8 cyber-text-blue mx-auto mb-3" />
                <h3 className="font-semibold cyber-text mb-2">CVEs</h3>
                <p className="text-sm cyber-text-dim">Common Vulnerabilities and Exposures</p>
              </Card>
              <Card className="cyber-bg-surface border cyber-border p-6">
                <Bug className="w-8 h-8 cyber-text-orange mx-auto mb-3" />
                <h3 className="font-semibold cyber-text mb-2">Exploits</h3>
                <p className="text-sm cyber-text-dim">Proof-of-concept exploits</p>
              </Card>
              <Card className="cyber-bg-surface border cyber-border p-6">
                <AlertTriangle className="w-8 h-8 cyber-text-red mx-auto mb-3" />
                <h3 className="font-semibold cyber-text mb-2">MITRE ATT&CK</h3>
                <p className="text-sm cyber-text-dim">Attack techniques and tactics</p>
              </Card>
              <Card className="cyber-bg-surface border cyber-border p-6">
                <FileText className="w-8 h-8 cyber-text-green mx-auto mb-3" />
                <h3 className="font-semibold cyber-text mb-2">Posts</h3>
                <p className="text-sm cyber-text-dim">Security research and analysis</p>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Search Result Modal */}
      <SearchResultModal
        result={selectedResult}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        searchQuery={searchQuery}
      />
    </div>
  );
}
