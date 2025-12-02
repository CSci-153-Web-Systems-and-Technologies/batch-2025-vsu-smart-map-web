interface ChatTimestampProps {
  date: Date;
}

export function ChatTimestamp({ date }: ChatTimestampProps) {
  const formatted = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  return (
    <time
      dateTime={date.toISOString()}
      className="text-xs text-muted-foreground"
    >
      {formatted}
    </time>
  );
}
