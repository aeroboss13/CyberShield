import { Search, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="cyber-bg-slate border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 cyber-bg-red rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">SecHub</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="cyber-bg-gray text-white placeholder-slate-400 w-64 border-slate-600 focus:ring-cyber-blue focus:border-cyber-blue"
              />
              <Search className="absolute right-3 top-2.5 w-5 h-5 text-slate-400" />
            </div>
            
            <div className="w-8 h-8 cyber-bg-blue rounded-full flex items-center justify-center cursor-pointer">
              <span className="text-white font-medium text-sm">JS</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
