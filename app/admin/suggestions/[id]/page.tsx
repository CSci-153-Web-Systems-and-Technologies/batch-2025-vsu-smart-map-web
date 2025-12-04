import { notFound } from "next/navigation";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { SuggestionDiffView } from "@/components/admin/suggestions/suggestion-diff-view";
import { getFacilityById } from "@/lib/supabase/queries/facilities";
import { getSuggestionById } from "@/lib/supabase/queries/suggestions";
import { getSupabaseAdminClient } from "@/lib/supabase/server-client";
import { baseFacilitySchema } from "@/lib/validation/facility";
import { z } from "zod";

export default async function SuggestionDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { client } = await getSupabaseAdminClient({ requireServiceRole: true });
  const { data: suggestion } = await getSuggestionById(params.id, client);

  if (!suggestion) {
    notFound();
  }

  const currentFacility =
    suggestion.targetId && suggestion.type === "EDIT_FACILITY"
      ? (await getFacilityById({ id: suggestion.targetId, client })).data ?? null
      : null;

  const partialSchema = baseFacilitySchema.extend({ hasRooms: z.boolean().optional() }).partial();
  const parsedPayload = partialSchema.safeParse(suggestion.payload);
  const payload = parsedPayload.success ? parsedPayload.data : {};

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs />

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Suggestion ID: {suggestion.id}</p>
        <h1 className="text-3xl font-bold">Suggestion Review</h1>
        <p className="text-muted-foreground">
          Type: {suggestion.type.replace("_", " ")} · Status: {suggestion.status}
        </p>
      </div>

      <SuggestionDiffView
        suggestion={suggestion}
        payload={payload}
        currentFacility={currentFacility}
      />
    </div>
  );
}
