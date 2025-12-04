import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Suggestion } from "@/lib/types/suggestion";
import { cn } from "@/lib/utils";

interface SuggestionsTableProps {
  suggestions: Suggestion[];
  facilityNames: Record<string, string>;
}

const formatType = (type: Suggestion["type"]) => {
  switch (type) {
    case "ADD_FACILITY":
      return "Add Facility";
    case "EDIT_FACILITY":
      return "Edit Facility";
    case "ADD_ROOM":
      return "Add Room";
    case "EDIT_ROOM":
      return "Edit Room";
    default:
      return type;
  }
};

export function SuggestionsTable({ suggestions, facilityNames }: SuggestionsTableProps) {
  if (!suggestions.length) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
        No pending suggestions right now.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr className="text-left text-muted-foreground">
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Target</th>
            <th className="px-4 py-3 font-medium">Submitted</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {suggestions.map((suggestion) => {
            const targetName =
              suggestion.targetId && facilityNames[suggestion.targetId]
                ? facilityNames[suggestion.targetId]
                : typeof suggestion.payload?.name === "string"
                ? (suggestion.payload.name as string)
                : "New facility";

            return (
              <tr
                key={suggestion.id}
                className={cn(
                  "border-t border-border/70",
                  "hover:bg-muted/30 transition-colors"
                )}
              >
                <td className="px-4 py-3 align-middle font-medium text-foreground">
                  {formatType(suggestion.type)}
                </td>
                <td className="px-4 py-3 align-middle text-foreground">
                  {targetName}
                </td>
                <td className="px-4 py-3 align-middle text-muted-foreground">
                  {new Date(suggestion.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 align-middle text-right">
                  <Link href={`/admin/suggestions/${suggestion.id}`}>
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
