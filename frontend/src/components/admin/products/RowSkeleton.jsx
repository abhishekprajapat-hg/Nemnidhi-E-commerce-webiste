export default function RowSkeleton() {
  return (
    <div className="animate-pulse border-b border-[var(--nm-border)] px-4 py-4 last:border-b-0">
      <div className="flex items-start gap-3 md:items-center">
        <div className="mt-1 h-4 w-4 rounded bg-[var(--nm-bg-elevated)] md:mt-0" />
        <div className="h-16 w-16 rounded-xl bg-[var(--nm-bg-elevated)]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-52 rounded bg-[var(--nm-bg-elevated)]" />
          <div className="h-3 w-36 rounded bg-[var(--nm-bg-elevated)]" />
        </div>
        <div className="hidden h-4 w-20 rounded bg-[var(--nm-bg-elevated)] md:block" />
        <div className="hidden h-4 w-16 rounded bg-[var(--nm-bg-elevated)] md:block" />
        <div className="hidden h-8 w-44 rounded-full bg-[var(--nm-bg-elevated)] md:block" />
      </div>
    </div>
  );
}
