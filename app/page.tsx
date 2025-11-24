"use client";

import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { StudentTabs } from "@/components/student-tabs";

type TabId = "map" | "directory" | "chat";

const TAB_CONTENT: Record<TabId, { title: string; body: string }> = {
  map: {
    title: "Explore the campus map",
    body: "Soon: interactive Leaflet map with category pins and selection highlight.",
  },
  directory: {
    title: "Browse the directory",
    body: "Soon: searchable building list with categories, rooms, and details.",
  },
  chat: {
    title: "Ask the assistant",
    body: "Soon: chat with Gemini to find locations and highlight them on the map.",
  },
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>("map");
  const content = TAB_CONTENT[activeTab];

  return (
    <>
      <AppHeader
        tabsSlot={
          <StudentTabs placement="inline" activeTab={activeTab} onTabChange={setActiveTab} />
        }
      />
      <StudentTabs placement="bottom" activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 bg-background px-4 py-10 md:px-6">
        <section
          id={`${activeTab}-panel`}
          role="tabpanel"
          aria-label={`${activeTab} panel`}
          className="rounded-xl border border-border bg-card p-6 shadow-card"
          tabIndex={0}
        >
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            {activeTab === "map" && "Map"}
            {activeTab === "directory" && "Directory"}
            {activeTab === "chat" && "Chat"}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-foreground">{content.title}</h1>
          <p className="mt-3 text-base text-muted-foreground">{content.body}</p>
        </section>
      </main>
    </>
  );
}