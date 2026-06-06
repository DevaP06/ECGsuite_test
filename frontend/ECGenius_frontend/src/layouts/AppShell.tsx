import { useState } from 'react';
import Sidebar from '../components/navigation/Sidebar';
import TopBar from '../components/navigation/TopBar';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

export default function AppShell({ children, title }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <TopBar title={title} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
