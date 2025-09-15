import { Search, Shield, Bell, Settings, Activity, Plus, UserCog, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "../contexts/LanguageContext";
import PostModal from "./PostModal";
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  
  // Get current user to check admin privileges - handle auth errors gracefully
  const { data: currentUser, error } = useQuery({
    queryKey: ["/api/users/current"],
    retry: false, // Don't retry on auth failures
    refetchOnWindowFocus: false,
    throwOnError: false // Don't throw on 401 errors
  });

  // Check if user is authenticated (no error and has user data)
  const isAuthenticated = !error && currentUser && typeof currentUser === 'object' && 'id' in currentUser;

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      return response.json();
    },
    onSuccess: () => {
      // Clear all queries and redirect to login
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out."
      });
      setLocation("/login");
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Open search results in new window/tab or redirect
      window.open(`https://www.google.com/search?q=site:nvd.nist.gov+${encodeURIComponent(searchQuery)}+OR+site:attack.mitre.org+${encodeURIComponent(searchQuery)}`, '_blank');
    }
  };

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
            <form onSubmit={handleSearch} className="relative group">
              <Input
                type="text"
                placeholder={t('header.search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="cyber-input w-80 pl-10 pr-4 h-10 rounded-lg transition-all duration-300 focus:w-96"
              />
              <button
                type="submit"
                className="absolute left-3 top-2.5 hover:cyber-text-blue transition-colors"
              >
                <Search className="w-5 h-5 cyber-text-dim group-focus-within:cyber-text-blue" />
              </button>
            </form>
            
            {/* Theme and Language Toggle Buttons - Available to all users */}
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <LanguageToggle />
            </div>

            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <PostModal 
                  trigger={
                    <Button className="cyber-button-primary">
                      <Plus className="w-4 h-4 mr-2" />
                      {t('header.post')}
                    </Button>
                  }
                />

                {/* Admin Panel Link - Only show for administrators */}
                {isAuthenticated && (currentUser as any)?.role === "admin" && (
                  <Link href="/admin">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="cyber-bg-surface-light hover:cyber-bg-surface border cyber-border rounded-lg p-2"
                      data-testid="button-admin-panel"
                    >
                      <UserCog className="w-5 h-5 cyber-text-orange" />
                    </Button>
                  </Link>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative cyber-bg-surface-light hover:cyber-bg-surface border cyber-border rounded-lg p-2"
                  onClick={() => alert('Security alerts and notifications')}
                >
                  <Bell className="w-5 h-5 cyber-text-muted" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 cyber-bg-red rounded-full"></span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="cyber-bg-surface-light hover:cyber-bg-surface border cyber-border rounded-lg p-2"
                  onClick={() => alert('System activity and live monitoring')}
                >
                  <Activity className="w-5 h-5 cyber-text-green" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="cyber-bg-surface-light hover:cyber-bg-surface border cyber-border rounded-lg p-2"
                  onClick={() => alert('Settings and preferences')}
                >
                  <Settings className="w-5 h-5 cyber-text-muted" />
                </Button>
              </div>
            ) : null}
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-2 pl-4 border-l cyber-border">
                <Link href="/profile">
                  <div className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer"
                       data-testid="link-profile"
                  >
                    <div className="w-9 h-9 cyber-gradient rounded-lg flex items-center justify-center hover:scale-105 transition-transform shadow-lg">
                      <span className="text-white font-semibold text-sm">
                        {(currentUser as any)?.name?.charAt(0) || "U"}
                      </span>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-white">{(currentUser as any)?.name || "User"}</p>
                      <p className="text-xs cyber-text-dim">Security Professional</p>
                    </div>
                  </div>
                </Link>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="cyber-bg-surface-light hover:cyber-bg-surface border cyber-border rounded-lg p-2"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 cyber-text-muted" />
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
