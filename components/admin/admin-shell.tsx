'use client';

import { useState } from 'react';
import { AdminSidebar } from './admin-sidebar';
import { AdminHeader } from './admin-header';
import { cn } from '@/lib/utils';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-foreground">
      <div className="flex min-h-screen overflow-hidden">
        <div
          className={cn(
            'flex min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out'
          )}
        >
          <AdminHeader onMenuClick={() => setSidebarOpen((prev) => !prev)} />
          <main id="main-content" tabIndex={-1} className="flex-1 px-4 py-6 sm:px-6 lg:px-10 outline-none">
            <div className="mx-auto w-full max-w-7xl space-y-6">
              {children}
            </div>
          </main>
        </div>

        <AdminSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
    </div>
  );
}
