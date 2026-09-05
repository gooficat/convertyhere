import { useEffect, useRef, useState } from "preact/hooks";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import type { MediaFile, ConversionState } from "./types";
import { FileUpload } from "./components/FileUpload";
import { ConverterControls } from "./components/ConverterControls";
import { ProgressBar } from "./components/ProgressBar";
import { ThemeToggle } from "./components/ThemeToggle";

export function App() {
  const [mediaFile, setMediaFile] = useState<MediaFile | null>(null);
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<ConversionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [outputExt, setOutputExt] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleFileSelect = (file: MediaFile) => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setMediaFile(file);
    setState("idle");
    setProgress(0);
    setError(null);
    setDownloadUrl(null);
    setOutputExt("");

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file.file);
      setPreviewUrl(url);
    } else if (file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file.file);
      setPreviewUrl(url);
    }
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

        ffmpeg.on("progress", ({ progress }) => {
          setProgress(Math.round(progress * 100));
        });

        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.9/dist/umd";
        const coreURL = `${baseURL}/ffmpeg-core.js`;
        const wasmURL = `${baseURL}/ffmpeg-core.wasm`;

        try {
          await ffmpeg.load({ coreURL, wasmURL });
        } catch {
          const cdnBaseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.9/dist/umd";
          await ffmpeg.load({
            coreURL: `${cdnBaseURL}/ffmpeg-core.js`,
            wasmURL: `${cdnBaseURL}/ffmpeg-core.wasm`,
          });
        }

        if (!loaded) setState("idle");
      } catch (err) {
        console.error(err);
        if (!loaded) {
          setState("error");
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load. Please refresh the page."
          );
        }
      }
    }

    loadFFmpeg();
    return () => {
      loaded = true;
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
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
          "-nostdin", "-y",
          "-i", inputName,
          "-vf", "fps=10,scale=480:-1:flags=lanczos",
          "-loop", "0",
          ...preset.ffmpegArgs,
          outputName,
        ]);
      } else {
        await ffmpeg.exec([
          "-nostdin", "-y",
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
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setMediaFile(null);
    setState("idle");
    setProgress(0);
    setError(null);
    setDownloadUrl(null);
    setOutputExt("");
    setPreviewUrl(null);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    const prompt = deferredPrompt as any;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  return (
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div class="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <header class="text-center mb-10">
          <div class="flex items-center justify-center gap-3 mb-4">
            <div class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span class={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              isOnline ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700" : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700"
            }`}>
              <span class={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-500" : "bg-amber-500"}`} />
              {isOnline ? "Online" : "Offline ready"}
            </span>
            {deferredPrompt && (
              <button
                onClick={handleInstall}
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700 dark:hover:bg-indigo-900/50 transition-colors"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Install App
              </button>
            )}
            <ThemeToggle />
          </div>
          <h1 class="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            <span class="text-indigo-600 dark:text-indigo-400">Converty</span>Here
          </h1>
          <p class="mt-3 text-base text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            Your files stay on your device. Convert images and videos right in your browser, no uploads or servers involved.
          </p>
        </header>

        <main class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-slate-900/40 border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div class="p-6 sm:p-8">
            {!mediaFile ? (
              <div class="space-y-6">
                <FileUpload
                  onFileSelect={handleFileSelect}
                  accept="image/*,video/*"
                  label="Drop your file here"
                />
                <div class="grid grid-cols-2 gap-4">
                  <div class="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-100 dark:border-slate-600">
                    <div class="flex items-center gap-2 mb-2">
                      <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Images</p>
                    </div>
                    <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      PNG, JPEG, WebP, BMP, TIFF, ICO
                    </p>
                  </div>
                  <div class="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-100 dark:border-slate-600">
                    <div class="flex items-center gap-2 mb-2">
                      <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Videos</p>
                    </div>
                    <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      MP4, WebM, AVI, MOV, MKV, GIF
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div class="space-y-6">
                <div class="flex flex-col sm:flex-row gap-4 items-start">
                  <div class="flex-shrink-0 w-full sm:w-32 h-32 bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                    {previewUrl ? (
                      isImage ? (
                        <img src={previewUrl} alt="Preview" class="w-full h-full object-cover" />
                      ) : (
                        <video src={previewUrl} class="w-full h-full object-cover" muted />
                      )
                    ) : (
                      <div class="text-3xl">
                        {isVideo ? "🎬" : isImage ? "🖼️" : "📎"}
                      </div>
                    )}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                      <div class="min-w-0">
                        <h3 class="text-sm font-semibold text-slate-900 dark:text-white truncate" title={mediaFile.name}>
                          {mediaFile.name}
                        </h3>
                        <p class="text-xs text-slate-500 mt-1">
                          {(mediaFile.size / 1024 / 1024).toFixed(2)} MB • {mediaFile.type || "Unknown"}
                        </p>
                      </div>
                      <button
                        onClick={handleRemove}
                        disabled={isBusy}
                        class="flex-shrink-0 p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 disabled:text-slate-300 transition-colors"
                        title="Remove file"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    {(isVideo || isImage) && (
                      <div class="mt-3">
                        <ConverterControls
                          isVideo={isVideo}
                          onConvert={handleConvert}
                          converting={isBusy}
                        />
                      </div>
                    )}
                    {!isVideo && !isImage && (
                      <p class="mt-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg px-3 py-2">
                        Unsupported file type. Please upload an image or video.
                      </p>
                    )}
                  </div>
                </div>

                <ProgressBar
                  progress={progress}
                  label={
                    state === "converting"
                      ? "Converting..."
                      : state === "done"
                      ? "Complete"
                      : state === "loading"
                      ? "Loading..."
                      : state === "error"
                      ? "Error"
                      : ""
                  }
                />

                {state === "done" && downloadUrl && (
                  <button
                    onClick={handleDownload}
                    class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-200 flex items-center justify-center gap-2"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Converted File
                  </button>
                )}

                {state === "error" && (
                  <div class="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-700 rounded-xl p-4">
                    <p class="text-sm text-red-700 dark:text-red-300 text-center">{error}</p>
                    <button
                      onClick={handleRemove}
                      class="mt-2 w-full text-sm text-red-600 dark:text-red-400 hover:text-red-700 font-medium"
                    >
                      Try another file
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <footer class="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-t border-slate-100 dark:border-slate-700">
            <p class="text-xs text-center text-slate-500">
              Works offline • Powered by FFmpeg
            </p>
          </footer>
        </main>
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
