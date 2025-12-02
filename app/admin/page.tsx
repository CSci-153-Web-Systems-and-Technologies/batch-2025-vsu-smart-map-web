export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
          <h3 className="font-semibold leading-none tracking-tight">Facilities</h3>
          <p className="text-sm text-muted-foreground mt-2">Manage campus buildings and locations.</p>
        </div>
        <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
          <h3 className="font-semibold leading-none tracking-tight">Submissions</h3>
          <p className="text-sm text-muted-foreground mt-2">Review pending contribution requests.</p>
        </div>
      </div>
    </div>
  );
}
