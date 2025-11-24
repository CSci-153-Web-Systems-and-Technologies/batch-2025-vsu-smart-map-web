import { AppHeader } from "@/components/app-header";

export default function HomePage() {
  return (
    <>
      <AppHeader />
      <main className="flex min-h-screen flex-col items-center justify-center bg-background">
        <h1 className="text-4xl font-bold">VSU SmartMap</h1>
        <p className="mt-4 text-lg text-muted-foreground">Coming Soon</p>
      </main>
    </>
  );
}
