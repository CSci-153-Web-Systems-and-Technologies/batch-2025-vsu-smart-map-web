import Link from "next/link";
import { Menu, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Map", href: "#map" },
  { label: "Directory", href: "#directory" },
  { label: "Chat", href: "#chat" },
];

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-card/95 shadow-card backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-2 py-1 transition hover:bg-muted"
          aria-label="VSU SmartMap home"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-card">
            <MapPinned className="h-5 w-5" aria-hidden />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-primary">VSU</span>
            <span className="text-base font-bold text-foreground">SmartMap</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition",
                "hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <Button
            size="sm"
            variant="secondary"
            className="hidden sm:inline-flex"
            type="button"
          >
            Submit a location
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="md:hidden"
            type="button"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </Button>
        </div>
      </div>
    </header>
  );
}