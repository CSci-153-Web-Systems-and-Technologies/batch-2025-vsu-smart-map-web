"use client";

import { Suspense, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { StudentTabs } from "@/components/student-tabs";
import { AppProvider } from "@/lib/context/app-context";

type TabId = "map" | "directory" | "chat";

function getActiveTab(pathname: string): TabId {
  if (pathname.startsWith("/directory")) return "directory";
  if (pathname.startsWith("/chat")) return "chat";
  return "map";
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = getActiveTab(pathname);

  const handleTabChange = useCallback(
    (tab: TabId) => {
      if (tab === activeTab) return;

      if (tab === "map") {
        router.push("/", { scroll: false });
      } else if (tab === "directory") {
        router.push("/directory", { scroll: false });
      } else {
        router.push("/chat", { scroll: false });
      }
    },
    [activeTab, router],
  );

  return (
    <Suspense>
      <AppProvider>
        <AppHeader
          tabsSlot={
            <StudentTabs
              placement="inline"
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          }
        />
        <StudentTabs
          placement="bottom"
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
        {children}
      </AppProvider>
    </Suspense>
  );
}