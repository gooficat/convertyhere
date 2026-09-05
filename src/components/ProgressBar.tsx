interface ProgressBarProps {
  progress: number;
  label?: string;
}

export function ProgressBar({ progress, label }: ProgressBarProps) {
  return (
    <div class="mt-2">
      {label && (
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
          <p class="text-xs font-medium text-slate-500 dark:text-slate-400">{Math.round(progress)}%</p>
        </div>
      )}
      <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
        <div
          class="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-300 ease-out relative"
          style={{ width: `${Math.min(progress, 100)}%` }}
        >
          {progress > 0 && progress < 100 && (
            <div class="absolute inset-0 bg-white/20 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
