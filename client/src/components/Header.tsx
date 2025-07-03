import { Search, Shield, Bell, Settings, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="cyber-bg-surface border-b cyber-border sticky top-0 z-50 backdrop-blur-lg bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 cyber-gradient rounded-xl flex items-center justify-center shadow-lg cyber-glow">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 cyber-bg-green rounded-full pulse-red"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold cyber-text-red">SecHub</h1>
                <p className="text-xs cyber-text-dim">Cybersecurity Platform</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <Input
                type="text"
                placeholder="Search CVEs, threats, techniques..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="cyber-input w-80 pl-10 pr-4 h-10 rounded-lg transition-all duration-300 focus:w-96"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 cyber-text-dim transition-colors group-focus-within:cyber-text-blue" />
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="relative cyber-bg-surface-light hover:cyber-bg-surface border cyber-border rounded-lg p-2"
              >
                <Bell className="w-5 h-5 cyber-text-muted" />
                <span className="absolute -top-1 -right-1 w-2 h-2 cyber-bg-red rounded-full"></span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="cyber-bg-surface-light hover:cyber-bg-surface border cyber-border rounded-lg p-2"
              >
                <Activity className="w-5 h-5 cyber-text-green" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="cyber-bg-surface-light hover:cyber-bg-surface border cyber-border rounded-lg p-2"
              >
                <Settings className="w-5 h-5 cyber-text-muted" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-2 pl-4 border-l cyber-border">
              <div className="w-9 h-9 cyber-gradient rounded-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-lg">
                <span className="text-white font-semibold text-sm">JS</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-white">John Smith</p>
                <p className="text-xs cyber-text-dim">Security Analyst</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
