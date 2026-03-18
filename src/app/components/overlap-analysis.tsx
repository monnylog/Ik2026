export function OverlapAnalysis({ submissions }: { submissions: any[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 mb-2">
      <h3 className="text-sm font-medium text-foreground mb-2">Overlap Analysis</h3>
      <p className="text-xs text-muted-foreground">{submissions.length} submissions — ingredient overlap analysis coming soon.</p>
    </div>
  );
}
