interface ProgressBarProps {
  progress: number;
  label?: string;
}

export function ProgressBar({ progress, label }: ProgressBarProps) {
  return (
    <div class="mt-4">
      {label && (
        <p class="text-sm font-medium text-gray-700 mb-1">{label}</p>
      )}
      <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          class="bg-blue-600 h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <p class="text-xs text-gray-500 mt-1 text-right">
        {Math.round(progress)}%
      </p>
    </div>
  );
}
