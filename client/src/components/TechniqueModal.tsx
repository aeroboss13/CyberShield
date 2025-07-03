import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink, Target, AlertTriangle, Shield } from "lucide-react";

interface TechniqueModalProps {
  techniqueId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TechniqueModal({ techniqueId, isOpen, onClose }: TechniqueModalProps) {
  const { data: techniques } = useQuery({
    queryKey: ["/api/mitre/techniques", techniqueId],
    enabled: !!techniqueId,
  });

  const technique = techniques?.find((t: any) => t.techniqueId === techniqueId);

  if (!technique) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="cyber-bg-surface border cyber-border max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold">
              Loading Technique Details...
            </DialogTitle>
          </DialogHeader>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-600 rounded w-3/4"></div>
            <div className="h-4 bg-gray-600 rounded w-1/2"></div>
            <div className="h-32 bg-gray-600 rounded"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="cyber-bg-surface border cyber-border max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-white text-2xl font-bold mb-2">
                {technique.techniqueName}
              </DialogTitle>
              <div className="flex items-center space-x-2">
                <Badge className="cyber-bg-blue text-white">
                  {technique.techniqueId}
                </Badge>
                <Badge className="cyber-bg-green text-white">
                  {technique.tacticName}
                </Badge>
              </div>
            </div>
            <Button
              className="cyber-button-secondary"
              onClick={() => window.open(`https://attack.mitre.org/techniques/${technique.techniqueId}/`, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on MITRE
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
              <Target className="w-5 h-5 cyber-text-blue" />
              <span>Description</span>
            </h3>
            <div className="cyber-bg-surface-light rounded-lg p-4 border cyber-border">
              <p className="text-white leading-relaxed">
                {technique.techniqueDescription || 
                 `${technique.techniqueName} is a technique used by adversaries in the ${technique.tacticName} tactic. This technique involves specific methods and procedures that attackers use to achieve their objectives during this phase of an attack.`}
              </p>
            </div>
          </div>

          {/* Detection & Mitigation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 cyber-text-amber" />
                <span>Detection</span>
              </h3>
              <div className="cyber-bg-surface-light rounded-lg p-4 border cyber-border">
                <ul className="space-y-2 text-white">
                  <li className="flex items-start space-x-2">
                    <span className="cyber-text-amber">•</span>
                    <span>Monitor for unusual process execution patterns</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="cyber-text-amber">•</span>
                    <span>Check for unexpected network connections</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="cyber-text-amber">•</span>
                    <span>Analyze system and application logs</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="cyber-text-amber">•</span>
                    <span>Review file system changes and modifications</span>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                <Shield className="w-5 h-5 cyber-text-green" />
                <span>Mitigation</span>
              </h3>
              <div className="cyber-bg-surface-light rounded-lg p-4 border cyber-border">
                <ul className="space-y-2 text-white">
                  <li className="flex items-start space-x-2">
                    <span className="cyber-text-green">•</span>
                    <span>Implement application whitelisting</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="cyber-text-green">•</span>
                    <span>Enable endpoint detection and response</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="cyber-text-green">•</span>
                    <span>Apply principle of least privilege</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="cyber-text-green">•</span>
                    <span>Keep systems and software updated</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Examples & Procedures */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">
              Real-World Examples
            </h3>
            <div className="space-y-3">
              <div className="cyber-bg-surface-light rounded-lg p-4 border cyber-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold cyber-text-red">APT29 (Cozy Bear)</span>
                  <Badge className="cyber-bg-red text-white">Advanced Persistent Threat</Badge>
                </div>
                <p className="text-white text-sm">
                  Known to use this technique in combination with spearphishing and credential harvesting campaigns targeting government and private sector organizations.
                </p>
              </div>
              
              <div className="cyber-bg-surface-light rounded-lg p-4 border cyber-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold cyber-text-red">Lazarus Group</span>
                  <Badge className="cyber-bg-red text-white">Nation-State Actor</Badge>
                </div>
                <p className="text-white text-sm">
                  Has employed variations of this technique in multiple financially-motivated attacks and espionage campaigns.
                </p>
              </div>
            </div>
          </div>

          {/* Related Techniques */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">
              Related Techniques
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['T1055', 'T1059', 'T1027', 'T1083', 'T1105', 'T1003'].map((relatedId) => (
                <Button
                  key={relatedId}
                  variant="outline"
                  className="cyber-button-outline justify-start"
                  onClick={() => window.open(`https://attack.mitre.org/techniques/${relatedId}/`, '_blank')}
                >
                  <span className="cyber-text-green font-mono">{relatedId}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}