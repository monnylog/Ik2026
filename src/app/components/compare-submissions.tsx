export function CompareSubmissions({ submissions }: { submissions: any[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 mb-4">
      <h3 className="text-sm font-medium text-foreground mb-2">Compare Submissions</h3>
      <p className="text-xs text-muted-foreground">Compare {submissions.length} submissions side by side.</p>
    </div>
  );
}
