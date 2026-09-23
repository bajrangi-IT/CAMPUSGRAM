import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  className?: string;
  fullPage?: boolean;
}

export function LoadingState({
  message = 'Loading...',
  className,
  fullPage = false,
}: LoadingStateProps) {
  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-card border border-slate-200/80">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
        {message && (
          <p className="mt-4 text-sm font-medium text-slate-600 animate-pulse">
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center',
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
      {message && <p className="text-sm font-medium text-slate-500">{message}</p>}
    </div>
  );
}
