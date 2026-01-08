import React, { PropsWithChildren } from 'react';
import { UserButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

interface LayoutProps extends PropsWithChildren {
  title: string;
  showSwitcher?: boolean;
}

export default function Layout({ children, title }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-gray-100 font-sans">
      <nav className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link to="/workspaces" className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Andromeda Lab
          </Link>
          <div className="h-6 w-px bg-border"></div>
          <h1 className="text-sm font-medium text-gray-400">{title}</h1>
        </div>
        <div className="flex items-center gap-4">
            <Link to="/admin/setup-meta" className="text-xs text-gray-500 hover:text-white transition">Admin</Link>
          <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: 'w-8 h-8' } }} />
        </div>
      </nav>
      <main className="max-w-7xl mx-auto p-6">
        {children}
      </main>
    </div>
  );
}