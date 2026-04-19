"use client";

type Props = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export function ErrorCallout({ message, onRetry, retryLabel = "Try again", className = "" }: Props) {
  return (
    <div
      className={`mt-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
      role="alert"
    >
      <p className="text-sm text-red-800">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-red-300 bg-white px-4 text-sm font-semibold text-red-900 shadow-sm transition hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-500/20"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
