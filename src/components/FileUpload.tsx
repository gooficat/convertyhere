import { useState, useCallback } from "preact/hooks";
import type { MediaFile } from "../types";

interface FileUploadProps {
  onFileSelect: (file: MediaFile) => void;
  accept: string;
  label: string;
}

export function FileUpload({ onFileSelect, accept, label }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer?.files;
      if (files?.[0]) {
        onFileSelect({
          file: files[0],
          name: files[0].name,
          type: files[0].type,
          size: files[0].size,
        });
      }
    },
    [onFileSelect]
  );

  const handleChange = useCallback(
    (e: Event) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;
      if (files?.[0]) {
        onFileSelect({
          file: files[0],
          name: files[0].name,
          type: files[0].type,
          size: files[0].size,
        });
      }
    },
    [onFileSelect]
  );

  return (
    <div
      class={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 ${
        isDragging
          ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/30 scale-[1.01]"
          : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 hover:bg-slate-50/50 dark:hover:bg-slate-700/50"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div class="pointer-events-none">
        <div class={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
          isDragging ? "bg-indigo-100" : "bg-slate-100 dark:bg-slate-700"
        }`}>
          <svg
            class={`w-8 h-8 transition-colors ${isDragging ? "text-indigo-600" : "text-slate-400 dark:text-slate-500 dark:text-slate-400"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <p class="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">or click to browse</p>
      </div>
    </div>
  );
}
