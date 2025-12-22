import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BottomTabBar, TabId } from '@/components/layout/BottomTabBar';
import { ChatTab } from '@/components/tabs/ChatTab';
import { BoardTab } from '@/components/tabs/BoardTab';
import { ProfileTab } from '@/components/tabs/ProfileTab';
import { SettingsTab } from '@/components/tabs/SettingsTab';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>('chat');

  const renderTab = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatTab onNavigateToBoard={() => setActiveTab('board')} />;
      case 'board':
        return <BoardTab />;
      case 'profile':
        return <ProfileTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <ChatTab onNavigateToBoard={() => setActiveTab('board')} />;
    }
  };

  return (
    <AppLayout>
      <div className="h-screen flex flex-col">
        {renderTab()}
      </div>
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </AppLayout>
  );
};

export default Index;
