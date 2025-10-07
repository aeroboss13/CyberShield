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
      <div className="cyber-bg-surface rounded-lg sm:rounded-xl p-3 sm:p-6 border cyber-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center space-x-2 sm:space-x-3">
              <Target className="w-5 sm:w-8 h-5 sm:h-8 cyber-text-blue flex-shrink-0" />
              <span className="hidden sm:inline">MITRE ATT&CK Framework</span>
              <span className="sm:hidden text-base">ATT&CK</span>
            </h2>
            <p className="cyber-text-muted mt-1 text-xs sm:text-sm">Live data from MITRE's official GitHub repository</p>
          </div>
          <div className="flex justify-start sm:justify-end">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className="text-center">
                <div className="text-base sm:text-2xl font-bold cyber-text-blue">{filteredTactics?.length || 0}</div>
                <div className="text-xs cyber-text-dim">Tactics</div>
              </div>
              <div className="text-center">
                <div className="text-base sm:text-2xl font-bold cyber-text-green">
                  {filteredTactics?.reduce((acc, tactic) => acc + tactic.techniques.length, 0) || 0}
                </div>
                <div className="text-xs cyber-text-dim">Techniques</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <Select value={selectedMatrix} onValueChange={setSelectedMatrix}>
            <SelectTrigger className="cyber-input w-full sm:w-48 text-sm sm:text-base" data-testid="select-matrix">
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
            className="cyber-input flex-1 text-sm sm:text-base"
            data-testid="input-search-mitre"
          />
          
          <div className="flex space-x-2 w-full sm:w-auto">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              onClick={() => setViewMode('grid')}
              className="px-3 sm:px-4 flex-1 sm:flex-initial"
              data-testid="button-view-grid"
            >
              <Grid3X3 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline text-sm">Grid</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              className="px-3 sm:px-4 flex-1 sm:flex-initial"
              data-testid="button-view-list"
            >
              <List className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline text-sm">List</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tactics Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {filteredTactics?.map((tactic) => (
            <div key={tactic.tacticId} className="matrix-cell rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6" data-testid={`card-tactic-${tactic.tacticId}`}>
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold cyber-text-blue text-base sm:text-lg truncate pr-2">{tactic.tacticName}</h3>
                  <Badge className="cyber-bg-blue text-white mt-1 text-xs">
                    {tactic.tacticId}
                  </Badge>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg sm:text-2xl font-bold cyber-text-green">{tactic.techniques.length}</div>
                  <div className="text-xs cyber-text-dim whitespace-nowrap">Tech</div>
                </div>
              </div>
              
              <p className="text-white text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed line-clamp-3">{tactic.tacticDescription}</p>
              
              <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                {tactic.techniques.slice(0, 3).map((technique) => (
                  <div
                    key={technique.techniqueId}
                    onClick={() => setSelectedTechnique(technique.techniqueId)}
                    className="cyber-bg-surface-light rounded p-2 sm:p-3 text-xs sm:text-sm hover:cyber-bg-surface transition-all cursor-pointer border cyber-border hover:border-blue-500"
                    data-testid={`technique-${technique.techniqueId}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="cyber-text-green font-mono font-semibold text-xs sm:text-sm">{technique.techniqueId}</span>
                      <Button size="sm" variant="ghost" className="p-0.5 sm:p-1 h-5 w-5 sm:h-6 sm:w-6">
                        <Eye className="w-3 h-3" />
                      </Button>
                    </div>
                    <span className="text-white block mt-1 line-clamp-1 text-xs sm:text-sm">{technique.techniqueName}</span>
                  </div>
                ))}
                
                {tactic.techniques.length > 3 && (
                  <Button 
                    variant="ghost" 
                    className="w-full cyber-text-blue hover:cyber-bg-surface-light text-xs sm:text-sm py-1.5 sm:py-2"
                    onClick={() => setSelectedTechnique(tactic.techniques[3]?.techniqueId || tactic.techniques[0]?.techniqueId)}
                    data-testid={`button-view-all-${tactic.tacticId}`}
                  >
                    View all {tactic.techniques.length} techniques
                  </Button>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button className="cyber-button-secondary flex-1 text-xs sm:text-sm py-1.5 sm:py-2" data-testid={`button-mitre-${tactic.tacticId}`}>
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">MITRE</span>
                  <span className="sm:hidden">Info</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredTactics?.map((tactic) => (
            <div key={tactic.tacticId} className="cyber-bg-surface rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border cyber-border" data-testid={`card-list-tactic-${tactic.tacticId}`}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-bold cyber-text-blue text-base sm:text-lg lg:text-xl">{tactic.tacticName}</h3>
                    <Badge className="cyber-bg-blue text-white text-xs">
                      {tactic.tacticId}
                    </Badge>
                    <Badge variant="outline" className="border-gray-600 text-gray-400 text-xs">
                      {tactic.techniques.length} tech
                    </Badge>
                  </div>
                  <p className="text-white text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-none">{tactic.tacticDescription}</p>
                </div>
                <Button className="cyber-button-secondary text-xs sm:text-sm w-full sm:w-auto sm:ml-4" data-testid={`button-details-${tactic.tacticId}`}>
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">View Details</span>
                  <span className="sm:hidden">Details</span>
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {tactic.techniques.map((technique) => (
                  <div
                    key={technique.techniqueId}
                    onClick={() => setSelectedTechnique(technique.techniqueId)}
                    className="cyber-bg-surface-light rounded p-2 sm:p-3 cursor-pointer hover:cyber-bg-surface transition-all border cyber-border hover:border-blue-500"
                    data-testid={`list-technique-${technique.techniqueId}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="cyber-text-green font-mono text-xs sm:text-sm font-semibold">
                        {technique.techniqueId}
                      </span>
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4 cyber-text-dim flex-shrink-0" />
                    </div>
                    <span className="text-white text-xs sm:text-sm line-clamp-2">{technique.techniqueName}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {filteredTactics?.length === 0 && (
        <div className="text-center cyber-text-muted py-8 sm:py-12 px-4" data-testid="empty-state-mitre">
          <Target className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 opacity-50" />
          <p className="text-base sm:text-lg">No tactics or techniques found matching your search.</p>
          <p className="text-xs sm:text-sm mt-2">Try adjusting your search terms or matrix selection.</p>
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
