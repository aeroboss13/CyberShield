import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ExternalLink, 
  AlertTriangle, 
  Shield, 
  Download,
  Code,
  Calendar,
  Gauge,
  Target,
  Eye,
  Copy
} from "lucide-react";
import type { CVE, Exploit } from "@shared/schema";

// Extended CVE type with details for frontend
type CVEWithDetails = CVE;

interface CVEDetailModalProps {
  cve: CVEWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CVEDetailModal({ cve, isOpen, onClose }: CVEDetailModalProps) {
  const [selectedExploit, setSelectedExploit] = useState<string | null>(null);

  const { data: exploits, isLoading: exploitsLoading } = useQuery({
    queryKey: ["/api/cves", cve?.cveId, "exploits", cve?.edbId],
    queryFn: async () => {
      if (!cve?.cveId) return [];
      const params = new URLSearchParams();
      if (cve.edbId) {
        params.append('edbId', cve.edbId);
      }
      const url = `/api/cves/${encodeURIComponent(cve.cveId)}/exploits${params.toString() ? `?${params.toString()}` : ''}`;
      console.log(`Fetching exploits from: ${url}`);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch exploits');
      return response.json();
    },
    enabled: !!cve?.cveId,
  });

  if (!cve) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'cyber-bg-red';
      case 'high': return 'cyber-bg-amber';
      case 'medium': return 'cyber-bg-blue';
      case 'low': return 'cyber-bg-green';
      default: return 'cyber-bg-gray';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="cyber-bg-surface border cyber-border max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-white text-2xl font-bold mb-3">
                {cve.cveId}: {cve.title}
              </DialogTitle>
              <div className="flex items-center space-x-3 mb-4">
                <Badge className={`${getSeverityColor(cve.severity)} text-white`}>
                  {cve.severity.toUpperCase()}
                </Badge>
                {cve.cvssScore && (
                  <Badge className="cyber-bg-blue text-white flex items-center space-x-1">
                    <Gauge className="w-3 h-3" />
                    <span>CVSS {cve.cvssScore}</span>
                  </Badge>
                )}
                {cve.activelyExploited && (
                  <Badge className="cyber-bg-red text-white pulse-red flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>ACTIVELY EXPLOITED</span>
                  </Badge>
                )}
                <Button
                  size="sm"
                  className="cyber-button-secondary"
                  onClick={() => window.open(`https://nvd.nist.gov/vuln/detail/${cve.cveId}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  NVD
                </Button>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 cyber-bg-surface-light">
            <TabsTrigger value="overview" className="cyber-text-muted data-[state=active]:cyber-text-blue">
              Overview
            </TabsTrigger>
            <TabsTrigger value="exploits" className="cyber-text-muted data-[state=active]:cyber-text-blue">
              Exploits ({exploits?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="details" className="cyber-text-muted data-[state=active]:cyber-text-blue">
              Technical Details
            </TabsTrigger>
            <TabsTrigger value="timeline" className="cyber-text-muted data-[state=active]:cyber-text-blue">
              Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 cyber-text-amber" />
                <span>Vulnerability Description</span>
              </h3>
              <div className="cyber-bg-surface-light rounded-lg p-4 border cyber-border">
                <p className="text-white leading-relaxed">{cve.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Risk Assessment</h3>
                <div className="space-y-3">
                  <div className="cyber-bg-surface-light rounded-lg p-3 border cyber-border">
                    <div className="flex justify-between items-center">
                      <span className="text-white">Severity Level</span>
                      <Badge className={`${getSeverityColor(cve.severity)} text-white`}>
                        {cve.severity.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  {cve.cvssScore && (
                    <div className="cyber-bg-surface-light rounded-lg p-3 border cyber-border">
                      <div className="flex justify-between items-center">
                        <span className="text-white">CVSS Score</span>
                        <span className="cyber-text-blue font-semibold">{cve.cvssScore}/10.0</span>
                      </div>
                    </div>
                  )}
                  <div className="cyber-bg-surface-light rounded-lg p-3 border cyber-border">
                    <div className="flex justify-between items-center">
                      <span className="text-white">Active Exploitation</span>
                      <span className={cve.activelyExploited ? "cyber-text-red" : "cyber-text-green"}>
                        {cve.activelyExploited ? "YES" : "NO"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Vendor Information</h3>
                <div className="space-y-3">
                  {cve.vendor && (
                    <div className="cyber-bg-surface-light rounded-lg p-3 border cyber-border">
                      <div className="flex justify-between items-center">
                        <span className="text-white">Affected Vendor</span>
                        <span className="cyber-text-blue font-semibold">{cve.vendor}</span>
                      </div>
                    </div>
                  )}
                  <div className="cyber-bg-surface-light rounded-lg p-3 border cyber-border">
                    <div className="flex justify-between items-center">
                      <span className="text-white">CVE ID</span>
                      <div className="flex items-center space-x-2">
                        <span className="cyber-text-green font-mono">{cve.cveId}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(cve.cveId)}
                          className="p-1 h-6 w-6"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Tags & Categories</h3>
              <div className="flex flex-wrap gap-2">
                {cve.tags && cve.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="border-gray-600 text-gray-300">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="exploits" className="space-y-4">
            {exploitsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse cyber-bg-surface-light rounded-lg p-4">
                    <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : exploits && exploits.length > 0 ? (
              <div className="space-y-4">
                {exploits.map((exploit: Exploit) => (
                  <div key={exploit.id} className="cyber-bg-surface-light rounded-lg p-4 border cyber-border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">{exploit.title}</h4>
                        <p className="text-gray-300 text-sm mb-2">{exploit.description}</p>
                        <div className="flex items-center space-x-3">
                          <Badge className="cyber-bg-blue text-white">
                            {exploit.exploitType}
                          </Badge>
                          <Badge variant="outline" className="border-gray-600 text-gray-400">
                            {exploit.platform}
                          </Badge>
                          {exploit.verified && (
                            <Badge className="cyber-bg-green text-white">
                              <Shield className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {exploit.exploitCode && (
                          <Button
                            size="sm"
                            className="cyber-button-secondary"
                            onClick={() => setSelectedExploit(selectedExploit === exploit.id ? null : exploit.id)}
                          >
                            <Code className="w-4 h-4 mr-1" />
                            {selectedExploit === exploit.id ? 'Hide' : 'Code'}
                          </Button>
                        )}
                        {exploit.sourceUrl && (
                          <Button
                            size="sm"
                            className="cyber-button-primary"
                            onClick={() => exploit.sourceUrl && window.open(exploit.sourceUrl, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Source
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {selectedExploit === exploit.id && exploit.exploitCode && (
                      <div className="mt-4">
                        <div className="cyber-bg-dark rounded-lg p-4 border cyber-border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="cyber-text-green text-sm font-mono">Exploit Code</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => exploit.exploitCode && copyToClipboard(exploit.exploitCode)}
                              className="cyber-text-muted hover:cyber-text-blue"
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </Button>
                          </div>
                          <pre className="text-green-400 text-sm overflow-x-auto">
                            <code>{exploit.exploitCode}</code>
                          </pre>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-3 text-xs cyber-text-dim">
                      Published: {formatDate(exploit.datePublished)} • Author: {exploit.author || 'Unknown'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center cyber-text-muted py-8">
                <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No exploits found for this CVE</p>
                <p className="text-sm mt-2">Check back later or search exploit databases manually</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Technical Information</h3>
              {(() => {
                let references = [];
                try {
                  references = cve.references ? JSON.parse(cve.references) : [];
                } catch (e) {
                  references = [];
                }
                
                return references.length > 0 ? (
                  <div className="cyber-bg-surface-light rounded-lg p-4 border cyber-border">
                    <h4 className="cyber-text-blue font-semibold mb-3">References to Advisories, Solutions, and Tools</h4>
                    <div className="space-y-3">
                      {references.map((ref: any, index: number) => (
                        <div key={index} className="border-l-2 border-cyan-500 pl-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">{ref.source || 'Reference'}</span>
                            <a
                              href={ref.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="cyber-text-blue hover:text-cyan-300 transition-colors text-sm flex items-center"
                              data-testid={`link-reference-${index}`}
                            >
                              View Resource
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          </div>
                          <div className="text-white text-sm mt-1 break-all">
                            {ref.url}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="cyber-bg-surface-light rounded-lg p-4 border cyber-border text-center">
                    <p className="text-gray-400">No technical references available for this CVE</p>
                  </div>
                );
              })()}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <div className="space-y-4">
              {cve.publishedDate && (
                <div className="flex items-center space-x-4 cyber-bg-surface-light rounded-lg p-4 border cyber-border">
                  <Calendar className="w-5 h-5 cyber-text-blue" />
                  <div>
                    <div className="text-white font-semibold">Published</div>
                    <div className="text-gray-400 text-sm">{formatDate(cve.publishedDate)}</div>
                  </div>
                </div>
              )}
              
              {cve.updatedDate && (
                <div className="flex items-center space-x-4 cyber-bg-surface-light rounded-lg p-4 border cyber-border">
                  <Calendar className="w-5 h-5 cyber-text-green" />
                  <div>
                    <div className="text-white font-semibold">Last Updated</div>
                    <div className="text-gray-400 text-sm">{formatDate(cve.updatedDate)}</div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}