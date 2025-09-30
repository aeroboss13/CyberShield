import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, Bug, FileText, ExternalLink, Calendar, User, Tag } from "lucide-react";
import HighlightText from "./HighlightText";
import CVEDetailModal from "./CVEDetailModal";
import TechniqueModal from "./TechniqueModal";

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

interface SearchResultModalProps {
  result: SearchResult | null;
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
}

export default function SearchResultModal({ result, isOpen, onClose, searchQuery }: SearchResultModalProps) {
  const [showCVEModal, setShowCVEModal] = React.useState(false);
  const [showMitreModal, setShowMitreModal] = React.useState(false);

  if (!result) return null;

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
      case 'cve': return <Shield className="w-6 h-6" />;
      case 'exploit': return <Bug className="w-6 h-6" />;
      case 'mitre': return <AlertTriangle className="w-6 h-6" />;
      case 'post': return <FileText className="w-6 h-6" />;
      default: return <Shield className="w-6 h-6" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'cve': return 'text-blue-400';
      case 'exploit': return 'text-orange-400';
      case 'mitre': return 'text-red-400';
      case 'post': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getExternalLink = () => {
    switch (result.type) {
      case 'cve':
        return `https://nvd.nist.gov/vuln/detail/${result.id}`;
      case 'mitre':
        return `https://attack.mitre.org/techniques/${result.id}`;
      case 'exploit':
        return `https://www.exploit-db.com/exploits/${result.id}`;
      default:
        return null;
    }
  };

  const externalLink = getExternalLink();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto cyber-bg-surface border cyber-border">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`cyber-bg-surface-light p-3 rounded-lg ${getTypeColor(result.type)}`}>
                {getTypeIcon(result.type)}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold cyber-text">
                  <HighlightText 
                    text={result.title} 
                    searchQuery={searchQuery}
                  />
                </DialogTitle>
                <div className="flex items-center space-x-2 mt-2">
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
            {externalLink && (
              <Button
                variant="outline"
                size="sm"
                className="cyber-bg-surface-light hover:cyber-bg-surface border cyber-border"
                onClick={() => window.open(externalLink, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Original
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* ID Section */}
          <div>
            <h3 className="text-sm font-semibold cyber-text mb-2 flex items-center">
              <Tag className="w-4 h-4 mr-2" />
              ID
            </h3>
            <div className="cyber-bg-surface-light p-3 rounded-lg">
              <code className="text-sm cyber-text">
                <HighlightText 
                  text={result.id} 
                  searchQuery={searchQuery}
                />
              </code>
            </div>
          </div>

          {/* Description Section */}
          <div>
            <h3 className="text-sm font-semibold cyber-text mb-2">Description</h3>
            <div className="cyber-bg-surface-light p-4 rounded-lg">
              <p className="cyber-text-dim leading-relaxed">
                <HighlightText 
                  text={result.description} 
                  searchQuery={searchQuery}
                />
              </p>
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.date && (
              <div>
                <h3 className="text-sm font-semibold cyber-text mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Date
                </h3>
                <div className="cyber-bg-surface-light p-3 rounded-lg">
                  <span className="text-sm cyber-text-dim">{result.date}</span>
                </div>
              </div>
            )}

            {result.source && (
              <div>
                <h3 className="text-sm font-semibold cyber-text mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Source
                </h3>
                <div className="cyber-bg-surface-light p-3 rounded-lg">
                  <span className="text-sm cyber-text-dim">{result.source}</span>
                </div>
              </div>
            )}
          </div>

          {/* Tags Section */}
          {result.tags && result.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold cyber-text mb-2 flex items-center">
                <Tag className="w-4 h-4 mr-2" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="cyber-bg-surface-light">
                    <HighlightText 
                      text={tag} 
                      searchQuery={searchQuery}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Additional CVE-specific information */}
          {result.type === 'cve' && (
            <div className="space-y-4">
              <div className="border-t cyber-border pt-4">
                <h3 className="text-sm font-semibold cyber-text mb-2">CVE Details</h3>
                <div className="cyber-bg-surface-light p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm cyber-text-dim">CVE ID:</span>
                    <code className="text-sm cyber-text">
                      <HighlightText 
                        text={result.id} 
                        searchQuery={searchQuery}
                      />
                    </code>
                  </div>
                  {result.severity && (
                    <div className="flex justify-between">
                      <span className="text-sm cyber-text-dim">Severity:</span>
                      <Badge className={`${getSeverityColor(result.severity)} text-white`}>
                        {result.severity}
                      </Badge>
                    </div>
                  )}
                  {result.cvssScore && (
                    <div className="flex justify-between">
                      <span className="text-sm cyber-text-dim">CVSS Score:</span>
                      <span className="text-sm cyber-text font-mono">{result.cvssScore}</span>
                    </div>
                  )}
                  {result.vendor && (
                    <div className="flex justify-between">
                      <span className="text-sm cyber-text-dim">Vendor:</span>
                      <span className="text-sm cyber-text">{result.vendor}</span>
                    </div>
                  )}
                  {result.date && (
                    <div className="flex justify-between">
                      <span className="text-sm cyber-text-dim">Published:</span>
                      <span className="text-sm cyber-text">{result.date}</span>
                    </div>
                  )}
                  {result.updatedDate && result.updatedDate !== result.date && (
                    <div className="flex justify-between">
                      <span className="text-sm cyber-text-dim">Updated:</span>
                      <span className="text-sm cyber-text">{result.updatedDate}</span>
                    </div>
                  )}
                  {result.activelyExploited && (
                    <div className="flex justify-between">
                      <span className="text-sm cyber-text-dim">Status:</span>
                      <Badge className="bg-red-500 text-white">Actively Exploited</Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MITRE-specific information */}
          {result.type === 'mitre' && (
            <div className="space-y-4">
              <div className="border-t cyber-border pt-4">
                <h3 className="text-sm font-semibold cyber-text mb-2">MITRE ATT&CK Details</h3>
                <div className="cyber-bg-surface-light p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm cyber-text-dim">Technique ID:</span>
                    <code className="text-sm cyber-text">
                      <HighlightText 
                        text={result.id} 
                        searchQuery={searchQuery}
                      />
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm cyber-text-dim">Tactic:</span>
                    <span className="text-sm cyber-text">{result.tags?.[0] || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t cyber-border">
          <div className="flex space-x-2">
            {result.type === 'cve' && (
              <Button
                variant="outline"
                onClick={() => setShowCVEModal(true)}
                className="cyber-bg-surface-light hover:cyber-bg-surface border cyber-border"
              >
                <Shield className="w-4 h-4 mr-2" />
                View CVE Details
              </Button>
            )}
            {result.type === 'mitre' && (
              <Button
                variant="outline"
                onClick={() => setShowMitreModal(true)}
                className="cyber-bg-surface-light hover:cyber-bg-surface border cyber-border"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                View MITRE Details
              </Button>
            )}
          </div>
          <div className="flex space-x-2">
            {externalLink && (
              <Button
                variant="outline"
                onClick={() => window.open(externalLink, '_blank')}
                className="cyber-bg-surface-light hover:cyber-bg-surface border cyber-border"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Original
              </Button>
            )}
            <Button
              onClick={onClose}
              className="cyber-button-primary"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Nested Modals */}
      {result.type === 'cve' && (
        <CVEDetailModal
          cve={{
            id: result.id,
            cveId: result.id,
            title: result.title,
            description: result.description,
            cvssScore: result.cvssScore,
            severity: result.severity || 'UNKNOWN',
            vendor: result.vendor || result.source || 'Unknown',
            publishedDate: result.date || '',
            updatedDate: result.updatedDate || result.date || '',
            tags: result.tags || [],
            activelyExploited: result.activelyExploited || false,
            edbId: result.edbId,
            references: result.references || '[]',
            createdAt: new Date(),
            updatedAt: new Date()
          } as any}
          isOpen={showCVEModal}
          onClose={() => setShowCVEModal(false)}
        />
      )}
      
      {result.type === 'mitre' && (
        <TechniqueModal
          techniqueId={result.id}
          isOpen={showMitreModal}
          onClose={() => setShowMitreModal(false)}
        />
      )}
    </Dialog>
  );
}
