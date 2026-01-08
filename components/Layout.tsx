import React from 'react';
import { UserButton, useUser } from '@clerk/clerk-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  showSwitcher?: boolean;
}

export default function Layout({ children, title }: LayoutProps) {
  const location = useLocation();
  const { user } = useUser();
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-white overflow-hidden">
      {/* Side Navigation */}
      <aside className="flex w-72 flex-col border-r border-slate-200 dark:border-[#344465] bg-surface-light dark:bg-[#111722] overflow-y-auto no-scrollbar hidden md:flex">
        <div className="flex flex-col h-full justify-between p-4">
          <div className="flex flex-col gap-4">
            {/* Brand */}
            <div className="flex gap-3 items-center px-2 py-2 mb-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 shadow-lg ring-2 ring-primary/20 flex items-center justify-center">
                 <span className="material-symbols-outlined text-white text-[20px]">orbit</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-slate-900 dark:text-white text-base font-bold leading-normal">Andromeda Lab</h1>
                <p className="text-slate-500 dark:text-[#93a5c8] text-xs font-medium leading-normal">Meta Ads Manager</p>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="flex flex-col gap-1">
              <Link to="/workspaces" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive('/workspaces') ? 'bg-primary/10 text-primary dark:bg-[#243047] dark:text-white' : 'text-slate-600 dark:text-[#93a5c8] hover:bg-slate-100 dark:hover:bg-[#243047] hover:text-primary dark:hover:text-white'}`}>
                <span className="material-symbols-outlined text-[24px] group-hover:text-primary dark:group-hover:text-white transition-colors">dashboard</span>
                <p className="text-sm font-medium leading-normal">Dashboard</p>
              </Link>
              
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-[#93a5c8] hover:bg-slate-100 dark:hover:bg-[#243047] hover:text-primary dark:hover:text-white transition-colors group">
                <span className="material-symbols-outlined text-[24px] group-hover:text-primary dark:group-hover:text-white transition-colors">campaign</span>
                <p className="text-sm font-medium leading-normal">Campaigns</p>
              </a>
              
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-[#93a5c8] hover:bg-slate-100 dark:hover:bg-[#243047] hover:text-primary dark:hover:text-white transition-colors group">
                <span className="material-symbols-outlined text-[24px] group-hover:text-primary dark:group-hover:text-white transition-colors">group</span>
                <p className="text-sm font-medium leading-normal">Audiences</p>
              </a>

              <div className="my-2 h-px bg-slate-200 dark:bg-[#344465]"></div>
              
              <p className="px-3 text-xs font-bold text-slate-400 dark:text-[#6b7c9e] uppercase tracking-wider mb-1">Configuration</p>
              
              <Link to="/admin/setup-meta" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive('/admin/setup-meta') ? 'bg-primary/10 text-primary dark:bg-[#243047] dark:text-white' : 'text-slate-600 dark:text-[#93a5c8] hover:bg-slate-100 dark:hover:bg-[#243047] hover:text-primary dark:hover:text-white'}`}>
                <span className="material-symbols-outlined text-[24px] font-variation-settings-fill">settings</span>
                <p className="text-sm font-medium leading-normal">Settings</p>
              </Link>
              
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-[#93a5c8] hover:bg-slate-100 dark:hover:bg-[#243047] hover:text-primary dark:hover:text-white transition-colors group">
                <span className="material-symbols-outlined text-[24px] group-hover:text-primary dark:group-hover:text-white transition-colors">integration_instructions</span>
                <p className="text-sm font-medium leading-normal">Integrations</p>
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-[#93a5c8] hover:bg-slate-100 dark:hover:bg-[#243047] hover:text-primary dark:hover:text-white transition-colors group">
              <span className="material-symbols-outlined text-[24px] group-hover:text-primary dark:group-hover:text-white transition-colors">help</span>
              <p className="text-sm font-medium leading-normal">Support</p>
            </a>
            
            <div className="flex items-center gap-3 px-3 py-3 mt-2 rounded-xl bg-slate-100 dark:bg-[#1a2232] border border-slate-200 dark:border-[#344465]">
              <div className="shrink-0">
                  <UserButton appearance={{ elements: { userButtonAvatarBox: 'w-8 h-8' } }} />
              </div>
              <div className="flex flex-col overflow-hidden">
                <p className="text-slate-900 dark:text-white text-sm font-bold truncate">
                    {user?.fullName || user?.firstName || 'User'}
                </p>
                <p className="text-slate-500 dark:text-[#93a5c8] text-xs truncate">
                    {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 border-b border-slate-200 dark:border-[#344465] bg-surface-light dark:bg-[#111621] z-10">
            <div className="flex flex-col gap-1">
                <nav className="flex items-center text-sm text-slate-500 dark:text-[#93a5c8] gap-2">
                    <span className="capitalize">{location.pathname.split('/')[1] || 'Home'}</span>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-primary font-medium">{title}</span>
                </nav>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</h2>
            </div>
            <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-[#344465] text-slate-600 dark:text-[#93a5c8] text-sm font-semibold hover:bg-slate-50 dark:hover:bg-[#243047] transition-all">
                    <span className="material-symbols-outlined text-[20px]">book</span>
                    Docs
                </button>
            </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-6 md:p-8">
            {children}
        </div>
      </main>
    </div>
  );
}