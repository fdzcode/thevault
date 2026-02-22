"use client";

import { useCallback, useRef, useState } from "react";

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
}

export function ImageUpload({
  value,
  onChange,
  maxImages = 10,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previews, setPreviews] = useState<
    { file: File; previewUrl: string }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  const validateFiles = useCallback(
    (files: File[]): File[] | null => {
      const remaining = maxImages - value.length;
      if (remaining <= 0) {
        setError(`Maximum ${maxImages} images allowed`);
        return null;
      }

      const validFiles: File[] = [];
      for (const file of files) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setError(
            `"${file.name}" is not a supported format. Use JPEG, PNG, WebP, or GIF.`,
          );
          return null;
        }
        if (file.size > MAX_FILE_SIZE) {
          setError(`"${file.name}" exceeds the 5MB size limit.`);
          return null;
        }
        validFiles.push(file);
      }

      if (validFiles.length > remaining) {
        setError(
          `You can only add ${remaining} more image${remaining === 1 ? "" : "s"}.`,
        );
        return null;
      }

      return validFiles;
    },
    [maxImages, value.length],
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const validated = validateFiles(files);
      if (!validated || validated.length === 0) return;

      const newPreviews = validated.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      setPreviews((prev) => [...prev, ...newPreviews]);

      setUploading(true);
      setProgress(0);
      setError(null);

      try {
        const formData = new FormData();
        validated.forEach((file) => formData.append("files", file));

        const xhr = new XMLHttpRequest();

        const uploadPromise = new Promise<string[]>((resolve, reject) => {
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setProgress(pct);
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText) as {
                  urls: string[];
                };
                resolve(data.urls);
              } catch {
                reject(new Error("Invalid response from server"));
              }
            } else {
              try {
                const data = JSON.parse(xhr.responseText) as {
                  error: string;
                };
                reject(new Error(data.error));
              } catch {
                reject(new Error("Upload failed"));
              }
            }
          });

          xhr.addEventListener("error", () => {
            reject(new Error("Upload failed. Please check your connection."));
          });

          xhr.open("POST", "/api/upload");
          xhr.send(formData);
        });

        const urls = await uploadPromise;
        onChange([...value, ...urls]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Upload failed. Try again.",
        );
      } finally {
        newPreviews.forEach((p) => URL.revokeObjectURL(p.previewUrl));
        setPreviews((prev) =>
          prev.filter(
            (p) => !newPreviews.some((np) => np.previewUrl === p.previewUrl),
          ),
        );
        setUploading(false);
        setProgress(0);
      }
    },
    [validateFiles, onChange, value],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        void uploadFiles(droppedFiles);
      }
    },
    [uploadFiles],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
      if (selectedFiles.length > 0) {
        void uploadFiles(selectedFiles);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [uploadFiles],
  );

  const handleRemove = useCallback(
    (index: number) => {
      const updated = value.filter((_, i) => i !== index);
      onChange(updated);
    },
    [value, onChange],
  );

  const handleClickZone = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClickZone}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 transition ${
          dragActive
            ? "border-amber-600/50 bg-amber-600/5"
            : "border-amber-600/20 bg-[var(--input-bg)] hover:border-amber-600/50 hover:bg-[var(--glass-card-bg)]"
        } ${value.length >= maxImages ? "pointer-events-none opacity-50" : ""}`}
      >
        <svg
          className="mb-2 h-8 w-8 text-[var(--text-muted)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-sm text-[var(--text-muted)]">
          <span className="font-medium text-[var(--text-heading)]">Click to upload</span> or
          drag and drop
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          JPEG, PNG, WebP, or GIF (max 5MB each)
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {value.length} / {maxImages} images
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple={maxImages > 1}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload progress */}
      {uploading && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F4E5C3] transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
          {previews.map((p, i) => (
            <div
              key={`preview-${i}`}
              className="relative aspect-square overflow-hidden rounded-xl border border-[var(--divider)] bg-[var(--card-bg)]"
            >
              <img
                src={p.previewUrl}
                alt={`Uploading ${i + 1}`}
                className="h-full w-full object-cover opacity-50"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded images */}
      {value.length > 0 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
          {value.map((url, i) => (
            <div
              key={`uploaded-${i}`}
              className="group relative aspect-square overflow-hidden rounded-xl border border-[var(--divider)] bg-[var(--card-bg)]"
            >
              <img
                src={url}
                alt={`Image ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(i);
                }}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
                aria-label={`Remove image ${i + 1}`}
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {i === 0 && value.length > 1 && (
                <span className="absolute bottom-1 left-1 rounded-lg bg-[#D4AF37] px-1.5 py-0.5 text-[10px] font-semibold text-black">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
