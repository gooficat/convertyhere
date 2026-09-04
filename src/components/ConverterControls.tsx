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

  return (
    <div class="space-y-4 mt-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Output Format
        </label>
        <select
          value={format.value}
          onChange={(e) => {
            const f = formats.find((fmt) => fmt.value === (e.target as HTMLSelectElement).value);
            if (f) setFormat(f);
          }}
          disabled={converting}
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          {formats.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Quality Preset
        </label>
        <select
          value={preset.value}
          onChange={(e) => {
            const p = presets.find(
              (pr) => pr.value === (e.target as HTMLSelectElement).value
            );
            if (p) setPreset(p);
          }}
          disabled={converting}
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          {presets.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={() => onConvert(format, preset)}
        disabled={converting}
        class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-md transition-colors"
      >
        {converting ? "Converting..." : "Convert"}
      </button>
    </div>
  );
}
