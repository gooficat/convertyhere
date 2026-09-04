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
      class={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragging
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 hover:border-gray-400"
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
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v12m0 0v4m0-4H28m-4 12h4"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <p class="mt-2 text-sm text-gray-600">{label}</p>
        <p class="mt-1 text-xs text-gray-500">or drag and drop</p>
      </div>
    </div>
  );
}
