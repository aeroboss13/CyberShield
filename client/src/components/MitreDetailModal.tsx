import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink, Calendar, Target, Shield, Code } from "lucide-react";

interface MitreTechnique {
  id: number;
  tacticId: string;
  tacticName: string;
  tacticDescription: string;
  techniqueId: string;
  techniqueName: string;
  techniqueDescription: string;
}

interface MitreDetailModalProps {
  technique: MitreTechnique | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MitreDetailModal({ technique, isOpen, onClose }: MitreDetailModalProps) {
  if (!technique) return null;

  const getTacticColor = (tacticId: string) => {
    const colors: { [key: string]: string } = {
      'TA0001': 'bg-red-500',      // Initial Access
      'TA0002': 'bg-orange-500',   // Execution
      'TA0003': 'bg-yellow-500',   // Persistence
      'TA0004': 'bg-green-500',    // Privilege Escalation
      'TA0005': 'bg-blue-500',     // Defense Evasion
      'TA0006': 'bg-purple-500',   // Credential Access
      'TA0007': 'bg-pink-500',     // Discovery
      'TA0008': 'bg-indigo-500',   // Lateral Movement
      'TA0009': 'bg-teal-500',     // Collection
      'TA0010': 'bg-cyan-500',     // Exfiltration
      'TA0011': 'bg-lime-500',     // Command and Control
      'TA0040': 'bg-amber-500',    // Impact
    };
    return colors[tacticId] || 'bg-gray-500';
  };

  const getTacticIcon = (tacticId: string) => {
    switch (tacticId) {
      case 'TA0001': return <Target className="w-5 h-5" />;
      case 'TA0002': return <Code className="w-5 h-5" />;
      case 'TA0003': return <Shield className="w-5 h-5" />;
      case 'TA0004': return <AlertTriangle className="w-5 h-5" />;
      case 'TA0005': return <Shield className="w-5 h-5" />;
      case 'TA0006': return <Target className="w-5 h-5" />;
      case 'TA0007': return <Target className="w-5 h-5" />;
      case 'TA0008': return <Target className="w-5 h-5" />;
      case 'TA0009': return <Target className="w-5 h-5" />;
      case 'TA0010': return <Target className="w-5 h-5" />;
      case 'TA0011': return <Target className="w-5 h-5" />;
      case 'TA0040': return <AlertTriangle className="w-5 h-5" />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto cyber-bg-surface border cyber-border">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`cyber-bg-surface-light p-3 rounded-lg text-red-400`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold cyber-text">
                  {technique.techniqueName}
                </DialogTitle>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="outline" className="cyber-border">
                    MITRE ATT&CK
                  </Badge>
                  <Badge className={`${getTacticColor(technique.tacticId)} text-white`}>
                    {technique.tacticName}
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="cyber-bg-surface-light hover:cyber-bg-surface border cyber-border"
              onClick={() => window.open(`https://attack.mitre.org/techniques/${technique.techniqueId}`, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on MITRE
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Technique ID Section */}
          <div>
            <h3 className="text-sm font-semibold cyber-text mb-2 flex items-center">
              <Code className="w-4 h-4 mr-2" />
              Technique ID
            </h3>
            <div className="cyber-bg-surface-light p-3 rounded-lg">
              <code className="text-sm cyber-text font-mono">
                {technique.techniqueId}
              </code>
            </div>
          </div>

          {/* Description Section */}
          <div>
            <h3 className="text-sm font-semibold cyber-text mb-2">Description</h3>
            <div className="cyber-bg-surface-light p-4 rounded-lg">
              <p className="cyber-text-dim leading-relaxed whitespace-pre-wrap">
                {technique.techniqueDescription}
              </p>
            </div>
          </div>

          {/* Tactic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold cyber-text mb-2 flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Tactic
              </h3>
              <div className="cyber-bg-surface-light p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg ${getTacticColor(technique.tacticId)} text-white`}>
                    {getTacticIcon(technique.tacticId)}
                  </div>
                  <div>
                    <div className="font-medium cyber-text">{technique.tacticName}</div>
                    <div className="text-sm cyber-text-dim">{technique.tacticId}</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold cyber-text mb-2 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Technique
              </h3>
              <div className="cyber-bg-surface-light p-3 rounded-lg">
                <div className="font-medium cyber-text">{technique.techniqueName}</div>
                <div className="text-sm cyber-text-dim">{technique.techniqueId}</div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="border-t cyber-border pt-4">
            <h3 className="text-sm font-semibold cyber-text mb-2">Additional Information</h3>
            <div className="cyber-bg-surface-light p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm cyber-text-dim">Technique ID:</span>
                <code className="text-sm cyber-text font-mono">{technique.techniqueId}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-sm cyber-text-dim">Tactic:</span>
                <span className="text-sm cyber-text">{technique.tacticName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm cyber-text-dim">Tactic ID:</span>
                <code className="text-sm cyber-text font-mono">{technique.tacticId}</code>
              </div>
            </div>
          </div>

          {/* MITRE ATT&CK Reference */}
          <div className="border-t cyber-border pt-4">
            <h3 className="text-sm font-semibold cyber-text mb-2">MITRE ATT&CK Reference</h3>
            <div className="cyber-bg-surface-light p-4 rounded-lg">
              <p className="text-sm cyber-text-dim mb-3">
                This technique is part of the MITRE ATT&CK framework, a globally-accessible knowledge base of adversary tactics and techniques based on real-world observations.
              </p>
              <Button
                variant="outline"
                onClick={() => window.open(`https://attack.mitre.org/techniques/${technique.techniqueId}`, '_blank')}
                className="cyber-bg-surface-light hover:cyber-bg-surface border cyber-border"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on MITRE ATT&CK
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t cyber-border">
          <Button
            variant="outline"
            onClick={() => window.open(`https://attack.mitre.org/techniques/${technique.techniqueId}`, '_blank')}
            className="cyber-bg-surface-light hover:cyber-bg-surface border cyber-border"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open on MITRE
          </Button>
          <Button
            onClick={onClose}
            className="cyber-button-primary"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

