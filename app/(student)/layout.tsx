import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { StudentTabs } from "@/components/student-tabs";
import { AppProvider } from "@/lib/context/app-context";
import { FacilitySheet } from "@/components/facility/facility-sheet";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <AppProvider>
        <AppHeader tabsSlot={<StudentTabs placement="inline" />} />
        <StudentTabs placement="bottom" />
        {children}
        <FacilitySheet />
      </AppProvider>
    </Suspense>
  );
}