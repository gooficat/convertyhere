import type { ConversionFormat, ConversionPreset } from "./types";

export const VIDEO_FORMATS: ConversionFormat[] = [
  { label: "MP4 (H.264)", value: "mp4", ext: "mp4" },
  { label: "WebM (VP9)", value: "webm", ext: "webm" },
  { label: "AVI", value: "avi", ext: "avi" },
  { label: "MOV", value: "mov", ext: "mov" },
  { label: "MKV", value: "mkv", ext: "mkv" },
  { label: "GIF", value: "gif", ext: "gif" },
];

export const IMAGE_FORMATS: ConversionFormat[] = [
  { label: "PNG", value: "png", ext: "png" },
  { label: "JPEG", value: "jpeg", ext: "jpg" },
  { label: "WebP", value: "webp", ext: "webp" },
  { label: "BMP", value: "bmp", ext: "bmp" },
  { label: "TIFF", value: "tiff", ext: "tiff" },
  { label: "ICO", value: "ico", ext: "ico" },
];

export const VIDEO_PRESETS: ConversionPreset[] = [
  { label: "High Quality", value: "high", ffmpegArgs: ["-crf", "18"] },
  { label: "Medium Quality", value: "medium", ffmpegArgs: ["-crf", "23"] },
  { label: "Low Quality", value: "low", ffmpegArgs: ["-crf", "28"] },
  { label: "Fast Encode", value: "fast", ffmpegArgs: ["-preset", "ultrafast"] },
];

export const IMAGE_PRESETS: ConversionPreset[] = [
  { label: "High Quality", value: "high", ffmpegArgs: ["-q:v", "2"] },
  { label: "Medium Quality", value: "medium", ffmpegArgs: ["-q:v", "5"] },
  { label: "Low Quality", value: "low", ffmpegArgs: ["-q:v", "10"] },
];
