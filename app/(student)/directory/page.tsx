import { Suspense } from "react";
import { getFacilities } from "@/lib/supabase/queries/facilities";
import { createClient } from "@/lib/supabase/server-client";
import { DirectoryContainer } from "@/components/directory";

export const metadata = {
  title: "Directory | VSU SmartMap",
  description: "Browse all campus facilities and points of interest",
};

function DirectorySkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-full max-w-md rounded-md bg-muted" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-muted" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-48 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export default async function DirectoryPage() {
  const client = await createClient();
  const { data: facilities, error } = await getFacilities({ client });

  if (error) {
    console.error("Failed to fetch facilities:", error);
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg text-destructive">
          Failed to load facilities. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6 pb-24 md:pb-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Campus Directory
        </h1>
        <p className="mt-1 text-muted-foreground">
          Browse all buildings and points of interest
        </p>
      </header>

      <Suspense fallback={<DirectorySkeleton />}>
        <DirectoryContainer facilities={facilities ?? []} />
      </Suspense>
    </main>
  );
}
