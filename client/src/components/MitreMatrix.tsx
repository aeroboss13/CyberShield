import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Search, Eye, ExternalLink, Grid3X3, List } from "lucide-react";
import type { MitreTactic } from "@/lib/types";
import TechniqueModal from "./TechniqueModal";

export default function MitreMatrix() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMatrix, setSelectedMatrix] = useState("Enterprise");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTechnique, setSelectedTechnique] = useState<string | null>(null);

  const { data: tactics, isLoading } = useQuery<MitreTactic[]>({
    queryKey: ["/api/mitre/tactics"],
  });

  const filteredTactics = tactics?.filter(tactic => 
    !searchQuery || 
    tactic.tacticName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tactic.techniques.some(tech => 
      tech.techniqueName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.techniqueId.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (isLoading) {
    return (
      <Card className="cyber-bg-slate border-slate-700">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-600 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 bg-slate-600 rounded"></div>
              ))}
            </div>
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
              <Target className="w-8 h-8 cyber-text-blue" />
              <span>MITRE ATT&CK Framework</span>
            </h2>
            <p className="cyber-text-muted mt-1">Live data from MITRE's official GitHub repository</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold cyber-text-blue">{filteredTactics?.length || 0}</div>
              <div className="text-xs cyber-text-dim">Tactics</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold cyber-text-green">
                {filteredTactics?.reduce((acc, tactic) => acc + tactic.techniques.length, 0) || 0}
              </div>
              <div className="text-xs cyber-text-dim">Techniques</div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedMatrix} onValueChange={setSelectedMatrix}>
            <SelectTrigger className="cyber-input w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="cyber-bg-surface border cyber-border">
              <SelectItem value="Enterprise">🏢 Enterprise</SelectItem>
              <SelectItem value="Mobile">📱 Mobile</SelectItem>
              <SelectItem value="ICS">⚙️ ICS</SelectItem>
            </SelectContent>
          </Select>
          
          <Input
            placeholder="Search tactics and techniques..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="cyber-input flex-1"
          />
          
          <div className="flex space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              onClick={() => setViewMode('grid')}
              className="px-3"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              className="px-3"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tactics Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTactics?.map((tactic) => (
            <div key={tactic.tacticId} className="matrix-cell rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold cyber-text-blue text-lg">{tactic.tacticName}</h3>
                  <Badge className="cyber-bg-blue text-white mt-1">
                    {tactic.tacticId}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold cyber-text-green">{tactic.techniques.length}</div>
                  <div className="text-xs cyber-text-dim">Techniques</div>
                </div>
              </div>
              
              <p className="text-white text-sm mb-4 leading-relaxed">{tactic.tacticDescription}</p>
              
              <div className="space-y-2 mb-4">
                {tactic.techniques.slice(0, 4).map((technique) => (
                  <div
                    key={technique.techniqueId}
                    onClick={() => setSelectedTechnique(technique.techniqueId)}
                    className="cyber-bg-surface-light rounded-lg p-3 text-sm hover:cyber-bg-surface transition-all cursor-pointer border cyber-border hover:border-blue-500"
                  >
                    <div className="flex items-center justify-between">
                      <span className="cyber-text-green font-mono font-semibold">{technique.techniqueId}</span>
                      <Button size="sm" variant="ghost" className="p-1 h-6 w-6">
                        <Eye className="w-3 h-3" />
                      </Button>
                    </div>
                    <span className="text-white block mt-1">{technique.techniqueName}</span>
                  </div>
                ))}
                
                {tactic.techniques.length > 4 && (
                  <Button 
                    variant="ghost" 
                    className="w-full cyber-text-blue hover:cyber-bg-surface-light"
                    onClick={() => setSelectedTechnique(tactic.techniques[4]?.techniqueId || tactic.techniques[0]?.techniqueId)}
                  >
                    View all {tactic.techniques.length} techniques
                  </Button>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button className="cyber-button-secondary flex-1">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  MITRE
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTactics?.map((tactic) => (
            <div key={tactic.tacticId} className="cyber-bg-surface rounded-xl p-6 border cyber-border">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-bold cyber-text-blue text-xl">{tactic.tacticName}</h3>
                    <Badge className="cyber-bg-blue text-white">
                      {tactic.tacticId}
                    </Badge>
                    <Badge variant="outline" className="border-gray-600 text-gray-400">
                      {tactic.techniques.length} techniques
                    </Badge>
                  </div>
                  <p className="text-white mb-4">{tactic.tacticDescription}</p>
                </div>
                <Button className="cyber-button-secondary">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {tactic.techniques.map((technique) => (
                  <div
                    key={technique.techniqueId}
                    onClick={() => setSelectedTechnique(technique.techniqueId)}
                    className="cyber-bg-surface-light rounded-lg p-3 cursor-pointer hover:cyber-bg-surface transition-all border cyber-border hover:border-blue-500"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="cyber-text-green font-mono text-sm font-semibold">
                        {technique.techniqueId}
                      </span>
                      <Eye className="w-4 h-4 cyber-text-dim" />
                    </div>
                    <span className="text-white text-sm">{technique.techniqueName}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {filteredTactics?.length === 0 && (
        <div className="text-center cyber-text-muted py-12">
          <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No tactics or techniques found matching your search.</p>
          <p className="text-sm mt-2">Try adjusting your search terms or matrix selection.</p>
        </div>
      )}

      {/* Technique Details Modal */}
      <TechniqueModal
        techniqueId={selectedTechnique}
        isOpen={!!selectedTechnique}
        onClose={() => setSelectedTechnique(null)}
      />
    </div>
  );
}
