import { Skeleton } from "./skeleton";

const skeletonCardStyle = {
  backgroundColor: "rgba(255,255,255,0.8)",
  border: "1px solid rgba(140,165,135,0.08)",
  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
};

/* ── KPI Cards skeleton ── */
export function KpiCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-xl p-4 ik26-skeleton-pulse"
          style={skeletonCardStyle}
        >
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          <Skeleton className="h-7 w-12 rounded mb-2" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
      ))}
    </div>
  );
}

/* ── Activity Feed skeleton ── */
export function ActivityFeedSkeleton() {
  return (
    <div
      className="rounded-xl p-4 ik26-skeleton-pulse"
      style={skeletonCardStyle}
    >
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-28 rounded" />
        <Skeleton className="h-7 w-20 rounded-lg" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start gap-3 py-2">
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
              <Skeleton className="h-2.5 w-24 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Timeline skeleton ── */
export function TimelineSkeleton() {
  return (
    <div
      className="rounded-xl p-4 ik26-skeleton-pulse"
      style={skeletonCardStyle}
    >
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-32 rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-16 rounded-lg" />
          <Skeleton className="h-7 w-16 rounded-lg" />
        </div>
      </div>
      <div className="space-y-4 pl-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-3 relative">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
            <Skeleton className="w-6 h-6 rounded-full shrink-0 relative z-10" />
            <div className="flex-1 space-y-1.5 pb-4">
              <Skeleton className="h-3.5 w-40 rounded" />
              <Skeleton className="h-3 w-56 rounded" />
              <Skeleton className="h-2.5 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Chef Roster skeleton ── */
export function RosterSkeleton() {
  return (
    <div
      className="rounded-xl p-4 ik26-skeleton-pulse"
      style={skeletonCardStyle}
    >
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-24 rounded" />
        <Skeleton className="h-7 w-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg"
            style={{ backgroundColor: "rgba(230,224,210,0.4)" }}
          >
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-28 rounded" />
              <Skeleton className="h-3 w-36 rounded" />
            </div>
            <Skeleton className="w-6 h-6 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Sidebar skeleton ── */
export function SidebarSkeleton() {
  return (
    <div className="w-60 h-full p-4 space-y-4" style={{ backgroundColor: "#475D56" }}>
      <Skeleton className="h-8 w-36 rounded-lg mb-6 bg-white/10" />
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <Skeleton key={i} className="h-8 w-full rounded-lg bg-white/10" />
      ))}
    </div>
  );
}

/* ── Task Board skeleton ── */
export function TaskBoardSkeleton() {
  const columns = [
    { label: "To Do", color: "rgba(107,127,142,0.08)" },
    { label: "In Progress", color: "rgba(201,169,110,0.08)" },
    { label: "Done", color: "rgba(126,158,120,0.08)" },
  ];

  return (
    <div className="space-y-4 ik26-skeleton-pulse">
      {/* Header bar skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => (
          <div
            key={col.label}
            className="rounded-xl p-3"
            style={{ backgroundColor: col.color, border: "1px solid rgba(96,108,56,0.08)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-lg p-3"
                  style={skeletonCardStyle}
                >
                  <Skeleton className="h-3.5 w-3/4 rounded mb-2" />
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-5 w-14 rounded-md" />
                    <Skeleton className="h-5 w-16 rounded-md" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="w-5 h-5 rounded-full" />
                      <Skeleton className="h-3 w-16 rounded" />
                    </div>
                    <Skeleton className="h-3 w-12 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Pre-Event Checklist skeleton ── */
export function ChecklistSkeleton() {
  return (
    <div className="space-y-4 ik26-skeleton-pulse">
      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-48 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* Progress bar */}
      <div className="rounded-xl p-4" style={skeletonCardStyle}>
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-12 rounded" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full" />
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl"
            style={skeletonCardStyle}
          >
            <Skeleton className="w-5 h-5 rounded shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-48 rounded" />
              <Skeleton className="h-3 w-28 rounded" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-16 rounded-md" />
              <Skeleton className="w-6 h-6 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Generic Card skeleton ── */
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div
      className="rounded-xl p-4 ik26-skeleton-pulse"
      style={skeletonCardStyle}
    >
      <Skeleton className="h-5 w-32 rounded mb-3" />
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-3 rounded"
            style={{ width: `${85 - i * 15}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Full Dashboard skeleton (combined) ── */
export function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Countdown bar */}
      <Skeleton className="h-16 w-full rounded-xl ik26-skeleton-pulse" />
      {/* Welcome */}
      <Skeleton className="h-12 w-full rounded-xl ik26-skeleton-pulse" />
      {/* KPI row */}
      <KpiCardsSkeleton />
      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <ActivityFeedSkeleton />
          <CardSkeleton lines={4} />
        </div>
        <div className="space-y-5">
          <CardSkeleton lines={3} />
          <CardSkeleton lines={2} />
          <CardSkeleton lines={3} />
        </div>
      </div>
    </div>
  );
}

/* ── Settings Page skeleton ── */
export function SettingsSkeleton() {
  return (
    <div className="space-y-5 ik26-skeleton-pulse max-w-2xl mx-auto">
      {/* Back button + title */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="h-6 w-40 rounded" />
      </div>
      {/* Avatar + name row */}
      <div className="rounded-xl p-5" style={skeletonCardStyle}>
        <div className="flex items-center gap-4 mb-5">
          <Skeleton className="w-16 h-16 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-3.5 w-24 rounded" />
          </div>
        </div>
        {/* Fields */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
      {/* Theme selector */}
      <div className="rounded-xl p-5" style={skeletonCardStyle}>
        <Skeleton className="h-5 w-28 rounded mb-3" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
      {/* Notification prefs */}
      <div className="rounded-xl p-5" style={skeletonCardStyle}>
        <Skeleton className="h-5 w-32 rounded mb-3" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-36 rounded" />
              <Skeleton className="h-6 w-10 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Event Timeline page skeleton ── */
export function EventTimelineSkeleton() {
  return (
    <div className="space-y-4 ik26-skeleton-pulse">
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-lg" />
        ))}
      </div>
      {/* Progress bar */}
      <div className="rounded-xl p-4" style={skeletonCardStyle}>
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      {/* Timeline items */}
      <div className="space-y-3 pl-6 border-l-2" style={{ borderColor: "rgba(201,169,110,0.15)" }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="relative">
            <div className="absolute -left-[1.65rem] top-1 w-3 h-3 rounded-full" style={{ backgroundColor: "rgba(201,169,110,0.2)" }} />
            <div className="rounded-xl p-4" style={skeletonCardStyle}>
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-5 w-24 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
              <Skeleton className="h-4 w-3/4 rounded mb-1.5" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Event Schedule page skeleton ── */
export function EventScheduleSkeleton() {
  return (
    <div className="space-y-4 ik26-skeleton-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-44 rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>
      {[1, 2, 3, 4].map((block) => (
        <div key={block} className="rounded-xl p-4" style={skeletonCardStyle}>
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          </div>
          <div className="space-y-2 pl-13">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <Skeleton className="w-2 h-2 rounded-full shrink-0" />
                <Skeleton className="h-3 w-48 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Generic page skeleton (for pages without a dedicated skeleton) ── */
export function PageSkeleton() {
  return (
    <div className="space-y-4 ik26-skeleton-pulse">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-48 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>
      {/* Filter/tab bar */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-lg" />
        ))}
      </div>
      {/* Content cards */}
      {[1, 2, 3].map((card) => (
        <div key={card} className="rounded-xl p-5" style={skeletonCardStyle}>
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-5/6 rounded" />
            <Skeleton className="h-3 w-3/4 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Comms / Chat skeleton ── */
export function CommsSkeleton() {
  return (
    <div className="space-y-3 ik26-skeleton-pulse">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-8 w-32 rounded-lg" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "flex-row-reverse" : ""}`}>
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="space-y-1.5 max-w-[70%]">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className={`h-16 ${i % 2 === 0 ? "w-48" : "w-56"} rounded-xl`} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Roster skeleton ── */
export function ChefRosterSkeleton() {
  return (
    <div className="space-y-4 ik26-skeleton-pulse">
      <div className="flex items-center gap-2 flex-wrap">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl p-4" style={skeletonCardStyle}>
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </div>
            <Skeleton className="h-3 w-full rounded mb-1.5" />
            <Skeleton className="h-3 w-2/3 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}