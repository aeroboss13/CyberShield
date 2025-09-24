import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import SocialFeed from "@/components/SocialFeed";
import MitreMatrix from "@/components/MitreMatrix";
import CVEDatabase from "@/components/CVEDatabase";
import UserReports from "@/components/UserReports";
import SecurityNews from "@/components/SecurityNews";
import type { TabType } from "@/lib/types";

export default function Dashboard() {
  const [location] = useLocation();
  
  // Determine initial tab based on URL
  const getInitialTab = (): TabType => {
    if (location === '/cve-database') return 'cve';
    if (location === '/mitre') return 'mitre';
    if (location === '/news') return 'news';
    return 'feed';
  };
  
  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab());

  const tabs = [
    { id: 'feed' as const, label: 'Social Feed', shortLabel: 'Feed' },
    { id: 'mitre' as const, label: 'MITRE ATT&CK', shortLabel: 'MITRE' },
    { id: 'cve' as const, label: 'CVE Database', shortLabel: 'CVE' },
    { id: 'user-reports' as const, label: 'User Reports', shortLabel: 'Reports' },
    { id: 'news' as const, label: 'Security News', shortLabel: 'News' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'feed':
        return <SocialFeed />;
      case 'mitre':
        return <MitreMatrix />;
      case 'cve':
        return <CVEDatabase />;
      case 'user-reports':
        return <UserReports />;
      case 'news':
        return <SecurityNews />;
      default:
        return <SocialFeed />;
    }
  };

  return (
    <div className="min-h-screen cyber-bg-dark text-white">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-8">
          <aside className="lg:col-span-1 fade-in order-2 lg:order-1">
            <div className="hidden lg:block">
              <Sidebar />
            </div>
          </aside>
          
          <main className="lg:col-span-3 slide-in-left order-1 lg:order-2">
            {/* Mobile-Optimized Tab Navigation */}
            <div className="mb-4 lg:mb-8">
              <div className="cyber-bg-surface rounded-xl p-1 border cyber-border">
                {/* Mobile: Horizontal scroll tabs */}
                <nav className="md:hidden">
                  <div className="flex space-x-1 overflow-x-auto pb-1 scrollbar-hide">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-shrink-0 py-3 px-3 font-medium text-sm rounded-lg transition-all duration-300 whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'cyber-gradient text-white shadow-lg cyber-glow-blue'
                            : 'text-gray-400 hover:text-white hover:cyber-bg-surface-light'
                        }`}
                      >
                        {tab.shortLabel}
                      </button>
                    ))}
                  </div>
                </nav>
                
                {/* Desktop: Full width tabs */}
                <nav className="hidden md:flex space-x-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 py-3 px-4 font-medium rounded-lg transition-all duration-300 ${
                        activeTab === tab.id
                          ? 'cyber-gradient text-white shadow-lg cyber-glow-blue'
                          : 'text-gray-400 hover:text-white hover:cyber-bg-surface-light'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
            
            {/* Mobile Sidebar Toggle - Show simplified sidebar on mobile */}
            <div className="lg:hidden mb-4">
              <div className="cyber-bg-surface rounded-xl p-4 border cyber-border">
                <div className="flex items-center justify-center">
                  <p className="cyber-text-dim text-sm text-center">
                    Switch to desktop view for full navigation and user profile
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="fade-in">
              {renderTabContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
