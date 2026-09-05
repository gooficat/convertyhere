import { useState } from "preact/hooks";
import type { ConversionFormat, ConversionPreset } from "../types";
import { VIDEO_FORMATS, IMAGE_FORMATS, VIDEO_PRESETS, IMAGE_PRESETS } from "../constants";

interface ConverterControlsProps {
  isVideo: boolean;
  onConvert: (format: ConversionFormat, preset: ConversionPreset) => void;
  converting: boolean;
}

export function ConverterControls({
  isVideo,
  onConvert,
  converting,
}: ConverterControlsProps) {
  const [format, setFormat] = useState<ConversionFormat>(
    isVideo ? VIDEO_FORMATS[0] : IMAGE_FORMATS[0]
  );
  const [preset, setPreset] = useState<ConversionPreset>(
    isVideo ? VIDEO_PRESETS[0] : IMAGE_PRESETS[0]
  );

  const formats = isVideo ? VIDEO_FORMATS : IMAGE_FORMATS;
  const presets = isVideo ? VIDEO_PRESETS : IMAGE_PRESETS;

  const formatIcons: Record<string, string> = {
    mp4: "🎬",
    webm: "🎬",
    avi: "🎬",
    mov: "🎬",
    mkv: "🎬",
    gif: "🖼️",
    png: "🖼️",
    jpeg: "🖼️",
    webp: "🖼️",
    bmp: "🖼️",
    tiff: "🖼️",
    ico: "🖼️",
  };

  return (
    <div class="space-y-5">
      <div>
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
          Output Format
        </label>
        <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {formats.map((f) => (
            <button
              key={f.value}
              onClick={() => setFormat(f)}
              disabled={converting}
              class={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                format.value === f.value
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                  : "border-slate-200 dark:border-slate-600 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              } ${converting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span class="text-xl">{formatIcons[f.ext]}</span>
              <span class="text-xs font-medium">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
          Quality
        </label>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {presets.map((p) => (
            <button
              key={p.value}
              onClick={() => setPreset(p)}
              disabled={converting}
              className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 transition-all ${
                preset.value === p.value
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                  : "border-slate-200 dark:border-slate-600 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              } ${converting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span class="text-sm font-semibold">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => onConvert(format, preset)}
        disabled={converting}
        class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-200 flex items-center justify-center gap-2"
      >
        {converting ? (
          <>
            <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Converting...
          </>
        ) : (
          <>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Convert Now
          </>
        )}
      </button>
    </div>
  );
}
