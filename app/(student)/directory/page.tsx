import { getFacilities } from "@/lib/supabase/queries/facilities";
import { createClient } from "@/lib/supabase/server-client";
import { DirectoryContainer } from "@/components/directory";

export const metadata = {
  title: "Directory | VSU SmartMap",
  description: "Browse all campus facilities and points of interest",
};

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
    <main className="container mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Campus Directory
        </h1>
        <p className="mt-1 text-muted-foreground">
          Browse all buildings and points of interest
        </p>
      </header>

      <DirectoryContainer facilities={facilities ?? []} />
    </main>
  );
}
