"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useAppDialog } from "../app-dialog";

interface UploadedImage {
  imageUrl: string;
  imageKey: string;
  file?: File;
}

interface Props {
  value: UploadedImage | null;
  onChange: (value: UploadedImage | null) => void;
}

const MAX_INPUT_SIZE = 10 * 1024 * 1024;
const MAX_UPLOAD_SIZE = 300 * 1024;
const MAX_DIMENSION = 600;

// Keep your existing compressProductImage function here.
async function compressProductImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);

  try {
    let width = bitmap.width;
    let height = bitmap.height;

    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(width, height)
    );

    width = Math.round(width * scale);
    height = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Unable to process the selected image.");
    }

    const qualities = [0.82, 0.72, 0.62, 0.52, 0.42];

    for (let attempt = 0; attempt < 12; attempt++) {
      canvas.width = width;
      canvas.height = height;

      context.clearRect(0, 0, width, height);
      context.drawImage(bitmap, 0, 0, width, height);

      const quality = qualities[attempt % qualities.length];

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(
          resolve,
          "image/webp",
          quality
        );
      });

      if (!blob) {
        throw new Error("Image compression failed.");
      }

      if (blob.size <= MAX_UPLOAD_SIZE) {
        return new File(
          [blob],
          `${file.name.replace(/\.[^.]+$/, "")}.webp`,
          {
            type: "image/webp",
            lastModified: Date.now(),
          }
        );
      }

      // Reduce dimensions before trying another compression cycle.
      if ((attempt + 1) % qualities.length === 0) {
        width = Math.max(1, Math.round(width * 0.85));
        height = Math.max(1, Math.round(height * 0.85));
      }
    }

    throw new Error(
      "Unable to compress this image below 300 KB. Please select another image."
    );
  } finally {
    bitmap.close();
  }
}

export default function ProductImageUpload({
  value,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function selectImage(file?: File) {
    if (!file) return;

    setError("");

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    ) {
      setError("Please select a JPG, PNG or WebP image.");
      return;
    }

    if (file.size > MAX_INPUT_SIZE) {
      setError("Original image cannot exceed 10 MB.");
      return;
    }

    try {
      setLoading(true);

      const compressedFile = await compressProductImage(file);
      const newPreview = URL.createObjectURL(compressedFile);

      setPreviewUrl(newPreview);

      onChange({
        imageUrl: newPreview,
        imageKey: "",
        file: compressedFile,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Image processing failed."
      );
    } finally {
      setLoading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function removeImage() {
    if (!value) return;

    onChange(null);
    setPreviewUrl("");
    setError("");
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => selectImage(e.target.files?.[0])}
      />

      {value ? (
        <div className="relative w-36 h-36 rounded-xl overflow-hidden border border-gray-200">
          <img
            src={value.imageUrl}
            alt="Product"
            className="w-full h-full object-cover"
          />

          <button
            type="button"
            onClick={removeImage}
            disabled={loading}
            className="absolute top-2 right-2 bg-white p-2 rounded-lg shadow hover:bg-red-50 transition disabled:opacity-50"
            aria-label="Remove image"
          >
            <Trash2 size={16} className="text-red-600" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
          className="w-36 h-36 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-2 hover:bg-gray-100 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <ImagePlus size={25} />
          )}

          <span className="text-sm font-medium">
            {loading ? "Processing..." : "Add image"}
          </span>
        </button>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <p className="text-xs text-gray-500">
        WebP optimized automatically. Maximum 300 KB.
      </p>
    </div>
  );
}