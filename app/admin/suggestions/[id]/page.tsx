import { notFound } from "next/navigation";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { SuggestionDiffView } from "@/components/admin/suggestions/suggestion-diff-view";
import { getFacilityById } from "@/lib/supabase/queries/facilities";
import { getSuggestionById } from "@/lib/supabase/queries/suggestions";
import { getSupabaseAdminClient } from "@/lib/supabase/server-client";
import type { UnifiedFacilityFormValues } from "@/lib/validation/facility";

interface SuggestionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SuggestionDetailPage({ params }: SuggestionDetailPageProps) {
  const { id } = await params;

  const { client } = await getSupabaseAdminClient({ requireServiceRole: true }).catch(
    (error) => {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY is required. Add it to .env.local and restart dev server.",
        { cause: error },
      );
    },
  );

  const { data: suggestion, error } = await getSuggestionById(id, client);

  if (error || !suggestion) {
    notFound();
  }

  const currentFacility = suggestion.targetId
    ? (await getFacilityById({ id: suggestion.targetId, client })).data
    : null;

  const payload = suggestion.payload as Partial<UnifiedFacilityFormValues>;

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Review Suggestion</h1>
          <p className="text-muted-foreground">
            Compare the proposed changes against current data.
          </p>
        </div>
      </div>

      <SuggestionDiffView
        suggestion={suggestion}
        payload={payload}
        currentFacility={currentFacility}
      />
    </div>
  );
}
