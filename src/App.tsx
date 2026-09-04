import { useEffect, useRef, useState } from "preact/hooks";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import type { MediaFile, ConversionState } from "./types";
import { FileUpload } from "./components/FileUpload";
import { ConverterControls } from "./components/ConverterControls";
import { ProgressBar } from "./components/ProgressBar";

export function App() {
  const [mediaFile, setMediaFile] = useState<MediaFile | null>(null);
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<ConversionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [outputExt, setOutputExt] = useState<string>("");
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const handleFileSelect = (file: MediaFile) => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setMediaFile(file);
    setState("idle");
    setProgress(0);
    setError(null);
    setDownloadUrl(null);
    setOutputExt("");
  };

  const isVideo = mediaFile?.type.startsWith("video") ?? false;
  const isImage = mediaFile?.type.startsWith("image") ?? false;
  const isBusy = state === "loading" || state === "converting";

  useEffect(() => {
    let loaded = false;

    async function loadFFmpeg() {
      setState("loading");
      try {
        const ffmpeg = new FFmpeg();
        ffmpegRef.current = ffmpeg;

        ffmpeg.on("log", ({ message }) => {
          console.log("[ffmpeg]", message);
        });

        ffmpeg.on("progress", ({ progress }) => {
          setProgress(Math.round(progress * 100));
        });

        const baseURL = "/ffmpeg/esm";
        const coreURL = `${baseURL}/ffmpeg-core.js`;
        const wasmURL = `${baseURL}/ffmpeg-core.wasm`;

        try {
          await ffmpeg.load({
            coreURL,
            wasmURL,
          });
        } catch (localErr) {
          console.warn("Local FFmpeg load failed, trying CDN fallback...", localErr);
          const cdnBaseURL = "https://unpkg.com/@ffmpeg/core@0.12.9/dist/umd";
          await ffmpeg.load({
            coreURL: `${cdnBaseURL}/ffmpeg-core.js`,
            wasmURL: `${cdnBaseURL}/ffmpeg-core.wasm`,
          });
        }

        if (!loaded) setState("idle");
      } catch (err) {
        console.error("FFmpeg load error:", err);
        if (!loaded) {
          setState("error");
          setError(
            err instanceof Error
              ? `Failed to load FFmpeg: ${err.message}`
              : "Failed to load FFmpeg. Please refresh the page."
          );
        }
      }
    }

    loadFFmpeg();
    return () => {
      loaded = true;
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      ffmpegRef.current?.terminate();
    };
  }, []);

  const handleConvert = async (
    format: { ext: string },
    preset: { ffmpegArgs: string[] }
  ) => {
    if (!mediaFile || !ffmpegRef.current || ffmpegRef.current.loaded === false) return;

    setState("converting");
    setProgress(0);
    setError(null);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);

    try {
      const ffmpeg = ffmpegRef.current;
      const inputName = `input${getExtension(mediaFile.name)}`;
      const outputName = `output.${format.ext}`;

      await ffmpeg.writeFile(inputName, await fetchFile(mediaFile.file));

      if (isVideo && format.ext === "gif") {
        await ffmpeg.exec([
          "-i", inputName,
          "-vf", "fps=10,scale=480:-1:flags=lanczos",
          "-loop", "0",
          ...preset.ffmpegArgs,
          outputName,
        ]);
      } else {
        await ffmpeg.exec([
          "-i", inputName,
          ...preset.ffmpegArgs,
          outputName,
        ]);
      }

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data as BlobPart], { type: getMimeType(format.ext) });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setOutputExt(format.ext);
      setState("done");

      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch (err) {
      console.error(err);
      setState("error");
      setError(err instanceof Error ? err.message : "Conversion failed. Please try another file.");
    }
  };

  const handleDownload = () => {
    if (!downloadUrl || !mediaFile) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    const baseName = mediaFile.name.replace(/\.[^/.]+$/, "");
    a.download = `${baseName}_converted.${outputExt}`;
    a.click();
  };

  const handleRemove = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setMediaFile(null);
    setState("idle");
    setProgress(0);
    setError(null);
    setDownloadUrl(null);
    setOutputExt("");
  };

  return (
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-2xl mx-auto px-4 py-12">
        <div class="text-center mb-10">
          <h1 class="text-3xl font-bold text-gray-900">
            Media Converter
          </h1>
          <p class="mt-2 text-gray-600">
            Convert images and videos locally in your browser. No uploads to any server.
          </p>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6">
          {!mediaFile ? (
            <div class="space-y-4">
              <FileUpload
                onFileSelect={handleFileSelect}
                accept="image/*,video/*"
                label="Drop an image or video here"
              />
              <div class="flex gap-4">
                <div class="flex-1">
                  <p class="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Supported Images
                  </p>
                  <p class="text-xs text-gray-500">
                    PNG, JPEG, WebP, BMP, TIFF, ICO
                  </p>
                </div>
                <div class="flex-1">
                  <p class="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Supported Videos
                  </p>
                  <p class="text-xs text-gray-500">
                    MP4, WebM, AVI, MOV, MKV, GIF
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                <div class="flex items-center gap-3">
                  <div class="text-2xl">
                    {isVideo ? "🎬" : isImage ? "🖼️" : "📎"}
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 truncate max-w-xs">
                      {mediaFile.name}
                    </p>
                    <p class="text-xs text-gray-500">
                      {(mediaFile.size / 1024 / 1024).toFixed(2)} MB •{" "}
                      {mediaFile.type || "Unknown"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemove}
                  disabled={isBusy}
                  class="text-sm text-red-600 hover:text-red-700 disabled:text-gray-400"
                >
                  Remove
                </button>
              </div>

              {(isVideo || isImage) && (
                <ConverterControls
                  isVideo={isVideo}
                  onConvert={handleConvert}
                  converting={isBusy}
                />
              )}

              {!isVideo && !isImage && (
                <p class="mt-4 text-sm text-red-600">
                  Unsupported file type. Please upload an image or video.
                </p>
              )}

              <ProgressBar
                progress={progress}
                label={
                  state === "converting"
                    ? "Converting..."
                    : state === "done"
                    ? "Complete"
                    : state === "loading"
                    ? "Loading FFmpeg..."
                    : state === "error"
                    ? "Error"
                    : ""
                }
              />

              {state === "done" && downloadUrl && (
                <button
                  onClick={handleDownload}
                  class="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
                >
                  Download Converted File
                </button>
              )}

              {state === "error" && (
                <p class="mt-4 text-sm text-red-600 text-center">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>

        <p class="mt-6 text-xs text-center text-gray-500">
          Powered by ffmpeg.wasm • All processing happens in your browser
        </p>
      </div>
    </div>
  );
}

function getExtension(filename: string): string {
  const match = filename.match(/\.[^/.]+$/);
  return match ? match[0] : "";
}

function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    mp4: "video/mp4",
    webm: "video/webm",
    avi: "video/x-msvideo",
    mov: "video/quicktime",
    mkv: "video/x-matroska",
    gif: "image/gif",
    png: "image/png",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    webp: "image/webp",
    bmp: "image/bmp",
    tiff: "image/tiff",
    ico: "image/x-icon",
  };
  return map[ext] || "application/octet-stream";
}
