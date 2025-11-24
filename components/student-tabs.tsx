"use client";

import { useCallback } from "react";
import { ListOrdered, MapPinned, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type TabId = "map" | "directory" | "chat";
type Placement = "inline" | "bottom";

interface StudentTab {
  id: TabId;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface StudentTabsProps {
  tabs?: StudentTab[];
  activeTab: TabId;
  onTabChange: (id: TabId) => void;
  className?: string;
  placement?: Placement;
}

const defaultTabs: StudentTab[] = [
  { id: "map", label: "Map", icon: MapPinned },
  { id: "directory", label: "Directory", icon: ListOrdered },
  { id: "chat", label: "Chat", icon: MessageSquare },
];

export function StudentTabs({
  tabs = defaultTabs,
  activeTab,
  onTabChange,
  className,
  placement = "inline",
}: StudentTabsProps) {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      const lastIndex = tabs.length - 1;
      let nextIndex = index;

      if (event.key === "ArrowRight") nextIndex = index === lastIndex ? 0 : index + 1;
      if (event.key === "ArrowLeft") nextIndex = index === 0 ? lastIndex : index - 1;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = lastIndex;

      if (nextIndex !== index) {
        event.preventDefault();
        onTabChange(tabs[nextIndex].id as TabId);
      }
    },
    [tabs, onTabChange],
  );

  const isInline = placement === "inline";
  const wrapperClasses = isInline
    ? "hidden md:block border-b border-border/80 bg-card/90 backdrop-blur"
    : "md:hidden fixed inset-x-0 bottom-0 border-t border-border/80 bg-card/95 backdrop-blur pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-2";
  const innerClasses = isInline
    ? "mx-auto flex max-w-6xl items-stretch justify-center gap-2 px-4 py-2 md:px-6"
    : "flex items-center justify-around px-4";

  return (
    <nav
      role="tablist"
      aria-label="Student navigation"
      className={cn(wrapperClasses, className)}
    >
      <div className={innerClasses}>
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          const tabIndex = isActive ? 0 : -1;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tab.id}-panel`}
              tabIndex={tabIndex}
              type="button"
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                "group relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "text-foreground"
                  : "hover:bg-muted hover:text-foreground",
              )}
            >
              {Icon ? <Icon className="h-4 w-4" aria-hidden /> : null}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden sr-only">{tab.label}</span>
              {isActive && (
                <span
                  aria-hidden
                  className="absolute inset-x-2 bottom-1 h-1 rounded-full bg-primary transition-all"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}