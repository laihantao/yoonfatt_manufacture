export default function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <span
      aria-label="Loading"
      role="status"
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}

// Full-area centered spinner for route `loading.tsx` files.
export function PageSpinner() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="flex flex-col items-center gap-3 text-brand-600">
        <Spinner className="h-8 w-8" />
        <span className="text-sm text-neutral-400">Loading...</span>
      </div>
    </div>
  );
}
