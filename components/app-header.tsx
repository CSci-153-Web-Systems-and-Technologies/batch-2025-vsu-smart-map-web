"use client";

import Link from "next/link";
import Image from "next/image";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/context/app-context";
import { Search } from "lucide-react";
import type { ReactNode } from "react";

type AppHeaderProps = {
  tabsSlot?: ReactNode;
};

export function AppHeader({ tabsSlot }: AppHeaderProps) {
  const { searchQuery, setSearchQuery } = useApp();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-6 gap-4">
        {/* Logo Area */}
        <Link
          href="/"
          className="flex items-center gap-2 transition hover:opacity-80 shrink-0"
          aria-label="VSU SmartMap home"
        >
          <Image
            src="/icons/icon-192x192.png"
            alt="VSU SmartMap"
            width={32}
            height={32}
            className="rounded-lg"
            priority
          />
          <div className="flex flex-col leading-none hidden sm:flex">
            <span className="text-xs font-bold text-primary tracking-wide">VSU</span>
            <span className="text-sm font-extrabold text-foreground tracking-tight">SmartMap</span>
          </div>
        </Link>

        {/* Search Bar - Centered/Leftish */}
        <div className="flex-1 max-w-md ml-2 md:ml-8">
          <div className="relative group">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="search"
              placeholder="Search buildings or facilities..."
              className="w-full rounded-full border border-input bg-muted/50 pl-9 pr-4 py-2 text-sm shadow-sm transition-all focus-visible:bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Navigation - Right Side */}
        <div className="flex items-center gap-2 ml-auto">
          {tabsSlot && (
            <div className="hidden md:flex items-center gap-1 mr-2" aria-label="Primary navigation">
              {tabsSlot}
            </div>
          )}

          <div className="h-4 w-[1px] bg-border mx-1 hidden md:block" />

          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}