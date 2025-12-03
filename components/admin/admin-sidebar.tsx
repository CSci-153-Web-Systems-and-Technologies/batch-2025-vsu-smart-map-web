'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building, FileText, Map as MapIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/facilities', label: 'Facilities', icon: Building },
  { href: '/admin/submissions', label: 'Submissions', icon: FileText },
];

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

function SidebarContent({ pathname, onClose }: { pathname: string; onClose: () => void }) {
  return (
    <div className="flex h-full flex-col bg-card text-card-foreground">
      {/* Brand Section */}
      <div className="flex items-center px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <MapIcon className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-lg font-bold tracking-tight">SmartMap</h1>
            <p className="text-xs font-medium text-muted-foreground">Admin Workspace</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mb-2 px-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Main Menu</p>
        </div>
        <nav className="space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-border p-4">
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </div>
            <span className="text-xs font-medium text-muted-foreground">System Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetContent side="left" className="w-72 p-0 border-r-0 [&>button]:hidden">
        <SheetTitle className="px-6 pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Admin Navigation
        </SheetTitle>
        <SidebarContent pathname={pathname} onClose={onClose} />
      </SheetContent>
    </Sheet>
  );
}
