import Link from "next/link";
import Image from "next/image";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const navItems = [
  { label: "Map", href: "#map" },
  { label: "Directory", href: "#directory" },
  { label: "Chat", href: "#chat" },
];

type AppHeaderProps = {
  tabsSlot?: ReactNode;
};

export function AppHeader({ tabsSlot }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-card/95 shadow-card backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-2 py-1 transition hover:bg-muted"
          aria-label="VSU SmartMap home"
        >
          <Image
            src="/icons/icon-192x192.png"
            alt="VSU SmartMap"
            width={40}
            height={40}
            className="rounded-lg"
            priority
          />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-primary">VSU</span>
            <span className="text-base font-bold text-foreground">SmartMap</span>
          </div>
        </Link>

        {tabsSlot ? (
          <div className="hidden flex-1 justify-center md:flex" aria-label="Primary">
            {tabsSlot}
          </div>
        ) : (
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition",
                  "hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}