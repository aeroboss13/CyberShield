import { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import SocialFeed from "@/components/SocialFeed";
import MitreMatrix from "@/components/MitreMatrix";
import CVEDatabase from "@/components/CVEDatabase";
import SecurityNews from "@/components/SecurityNews";
import type { TabType } from "@/lib/types";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('feed');

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
    <div className="min-h-screen cyber-bg-dark text-slate-100">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <Sidebar />
          </aside>
          
          <main className="lg:col-span-3">
            {/* Tab Navigation */}
            <div className="mb-8">
              <div className="border-b border-slate-700">
                <nav className="-mb-px flex space-x-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`border-b-2 py-2 px-1 font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'border-cyber-blue text-cyber-blue'
                          : 'border-transparent text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            {renderTabContent()}
          </main>
        </div>
      </div>
    </div>
  );
}
