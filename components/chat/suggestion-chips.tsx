"use client";

interface SuggestionChipsProps {
  suggestions?: string[];
  onSelect: (suggestion: string) => void;
  disabled?: boolean;
}

const DEFAULT_SUGGESTIONS = [
  "Where is the registrar's office?",
  "Find the nearest CR",
  "How do I get to COE?",
  "Where can I pay tuition?",
  "Find a computer lab",
];

export function SuggestionChips({
  suggestions = DEFAULT_SUGGESTIONS,
  onSelect,
  disabled = false,
}: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onSelect(suggestion)}
          disabled={disabled}
          className="rounded-full border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
