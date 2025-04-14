import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface SidebarButtonProps {
    href: string;
    icon: React.ReactNode;
    text: string;
    isActive: boolean;
}

const SidebarButton: React.FC<SidebarButtonProps> = ({ href, icon, text, isActive }) => {
    return (
      <Link href={href}>
        <div
          className={`flex items-center px-4 py-3 mb-2 rounded transition-colors ${
            isActive
              ? 'bg-blue-200 text-white'
              : 'text-gray-200 hover:bg-blue-100 hover:text-white'
          }`}
        >
          <div className="mr-3">{icon}</div>
          <span>{text}</span>
        </div>
      </Link>
    );
  };
  
  const Sidebar: React.FC = () => {
    const router = useRouter();
    const currentPath = router.pathname;
  
    return (
      <div className="w-64 h-screen flex-shrink-0 bg-white shadow-md">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-blue-600">Data Explorer</h1>
        </div>
        <nav className="p-4">
          <SidebarButton
            href="/"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7l5-3 5 3 5-3v10l-5 3-5-3-5 3V7z"></path>
              </svg>
            }
            text="クエリエディタ"
            isActive={currentPath === '/'}
          />
          <SidebarButton
            href="/graph"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            }
            text="グラフビュー"
            isActive={currentPath === '/graph'}
          />
          <SidebarButton
            href="/one-on-one"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            }
            text="1on1ミーティング"
            isActive={currentPath === '/one-on-one'}
          />
        </nav>
      </div>
    );
  };
  
  export default Sidebar;