import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminSubmission } from '@/lib/admin/dashboard';

interface RecentSubmissionsProps {
  submissions: AdminSubmission[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-900',
  APPROVED: 'bg-emerald-100 text-emerald-900',
  REJECTED: 'bg-rose-100 text-rose-900',
};

export function RecentSubmissions({ submissions }: RecentSubmissionsProps) {
  return (
    <Card className="border bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Recent submissions</CardTitle>
        <p className="text-sm text-muted-foreground">
          Latest contribution requests awaiting review.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {submissions.length === 0 && (
          <p className="text-sm text-muted-foreground">No submissions yet.</p>
        )}
        {submissions.map((submission) => (
          <div
            key={submission.id}
            className="flex items-center justify-between rounded-lg border bg-muted/40 p-3"
          >
            <div>
              <div className="font-medium">{submission.suggestedName}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(submission.createdAt).toLocaleDateString()}
              </div>
            </div>
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[submission.status] ?? 'bg-muted text-foreground'}`}
            >
              {submission.status}
            </span>
          </div>
        ))}

        <Link href="/admin/submissions" className="text-sm text-primary hover:underline">
          View all submissions
        </Link>
      </CardContent>
    </Card>
  );
}
