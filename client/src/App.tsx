import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Dashboard from "@/pages/dashboard";
import ProfilePage from "@/pages/profile";
import AdminPage from "@/pages/admin";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import SearchPage from "@/pages/search";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/cve-database" component={Dashboard} />
      <Route path="/mitre" component={Dashboard} />
      <Route path="/news" component={Dashboard} />
      <Route path="/search" component={SearchPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <div className="min-h-screen cyber-bg-dark">
              <Toaster />
              <Router />
            </div>
          </TooltipProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
