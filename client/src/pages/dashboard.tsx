import { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import SocialFeed from "@/components/SocialFeed";
import MitreMatrix from "@/components/MitreMatrix";
import CVEDatabase from "@/components/CVEDatabase";
import SecurityNews from "@/components/SecurityNews";
import type { TabType } from "@/lib/types";

interface DashboardProps {
  initialTab?: TabType;
}

export default function Dashboard({ initialTab = 'feed' }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const tabs = [
    { id: 'feed' as const, label: 'Social Feed' },
    { id: 'mitre' as const, label: 'MITRE ATT&CK' },
    { id: 'cve' as const, label: 'CVE Database' },
    { id: 'news' as const, label: 'Security News' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'feed':
        return <SocialFeed />;
      case 'mitre':
        return <MitreMatrix />;
      case 'cve':
        return <CVEDatabase />;
      case 'news':
        return <SecurityNews />;
      default:
        return <SocialFeed />;
    }
  };

  return (
    <div className="min-h-screen cyber-bg-dark text-white">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1 fade-in">
            <Sidebar />
          </aside>
          
          <main className="lg:col-span-3 slide-in-left">
            {/* Tab Navigation */}
            <div className="mb-8">
              <div className="cyber-bg-surface rounded-xl p-1 border cyber-border">
                <nav className="flex space-x-1">
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
