export type MediaFile = {
  file: File;
  name: string;
  type: string;
  size: number;
};

export type ConversionFormat = {
  label: string;
  value: string;
  ext: string;
};

export type ConversionPreset = {
  label: string;
  value: string;
  ffmpegArgs: string[];
};

export type ConversionState = "idle" | "loading" | "converting" | "done" | "error";
