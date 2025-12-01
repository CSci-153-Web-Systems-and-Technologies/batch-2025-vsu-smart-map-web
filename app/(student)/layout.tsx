"use client";

import { usePathname, useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { StudentTabs } from "@/components/student-tabs";
import { useCallback } from "react";

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
      if (tab === "map") {
        router.push("/");
      } else if (tab === "directory") {
        router.push("/directory");
      } else if (tab === "chat") {
        router.push("/chat");
      }
    },
    [router]
  );

  return (
    <>
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
    </>
  );
}
