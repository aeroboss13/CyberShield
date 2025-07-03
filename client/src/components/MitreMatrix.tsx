import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MitreTactic } from "@/lib/types";

export default function MitreMatrix() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMatrix, setSelectedMatrix] = useState("Enterprise");

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
    <Card className="cyber-bg-slate border-slate-700">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">MITRE ATT&CK Framework</h2>
          <div className="flex space-x-4">
            <Select value={selectedMatrix} onValueChange={setSelectedMatrix}>
              <SelectTrigger className="w-32 cyber-bg-gray border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="cyber-bg-gray border-slate-600">
                <SelectItem value="Enterprise">Enterprise</SelectItem>
                <SelectItem value="Mobile">Mobile</SelectItem>
                <SelectItem value="ICS">ICS</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              placeholder="Search techniques..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 cyber-bg-gray border-slate-600 text-white placeholder-slate-400 focus:ring-cyber-blue focus:border-cyber-blue"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredTactics?.map((tactic) => (
            <div
              key={tactic.tacticId}
              className="matrix-cell cyber-bg-gray rounded-lg p-4 border border-slate-600 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold cyber-text-blue">{tactic.tacticName}</h3>
                <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">
                  {tactic.tacticId}
                </span>
              </div>
              
              <p className="text-slate-300 text-sm mb-4">{tactic.tacticDescription}</p>
              
              <div className="space-y-2">
                {tactic.techniques.slice(0, 3).map((technique) => (
                  <div
                    key={technique.techniqueId}
                    className="cyber-bg-dark rounded p-2 text-sm hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <span className="cyber-text-green font-mono">{technique.techniqueId}</span>
                    <span className="text-slate-300 ml-2">{technique.techniqueName}</span>
                  </div>
                ))}
                
                {tactic.techniques.length > 3 && (
                  <div className="text-slate-400 text-xs text-center mt-2">
                    +{tactic.techniques.length - 3} more techniques
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {filteredTactics?.length === 0 && (
          <div className="text-center text-slate-400 py-8">
            <p>No tactics or techniques found matching your search.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
