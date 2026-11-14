
"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Package,
  ImagePlus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import ProductImageUpload from "./product-image-upload";
import { Product } from "../../app/admin/(auth)/products/page";

interface ProductFormData {
  id?: string;
  name: string;
  costPrice: string | null;
  sellingPrice: string;
  imageUrl: string | null;
  imageKey?: string | null;
}

interface UploadedImage {
  imageUrl: string;
  imageKey: string;
  file?: File;
}

interface Props {
  initialProduct?: ProductFormData;
  isOpen: boolean;
  onSuccess: (product: Product) => void;
  onCancel?: () => void;
}

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-[#FAFBFA] px-4 py-4 text-base text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-50";

interface R2Image {
  imageUrl: string;
  imageKey: string;
}

async function uploadProductImage(file: File): Promise<R2Image> {
  const response = await fetch("/api/admin/products/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contentType: file.type,
      size: file.size,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Image upload preparation failed.");
  }

  const uploadResponse = await fetch(data.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("Unable to upload product image.");
  }

  return {
    imageUrl: data.imageUrl,
    imageKey: data.imageKey,
  };
}

async function deleteProductImage(imageKey: string) {
  if (!imageKey) return;

  const response = await fetch("/api/admin/products/upload", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageKey }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Unable to delete old product image.");
  }
}

export default function ProductForm({
  initialProduct,
  onSuccess,
  isOpen,
  onCancel,
}: Props) {
  const [name, setName] = useState("");

  const [costPrice, setCostPrice] = useState("");

  const [sellingPrice, setSellingPrice] = useState("");

  const [image, setImage] = useState<UploadedImage | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !sellingPrice.trim()) {
      setError("Product name and selling price are required.");
      return;
    }

    if (
      costPrice.trim() &&
      !/^\d{1,10}(\.\d{1,2})?$/.test(costPrice)
    ) {
      setError("Enter a valid cost price.");
      return;
    }

    if (!/^\d{1,10}(\.\d{1,2})?$/.test(sellingPrice)) {
      setError("Enter a valid selling price.");
      return;
    }

    let newlyUploadedImage: R2Image | null = null;

    try {
      setLoading(true);

      // Upload only when the user selected a new image.
      if (image?.file) {
        newlyUploadedImage = await uploadProductImage(image.file);
      }

      const finalImage = newlyUploadedImage
        ? newlyUploadedImage
        : image && !image.file
          ? {
            imageUrl: image.imageUrl,
            imageKey: image.imageKey,
          }
          : null;

      const response = await fetch(
        initialProduct?.id
          ? `/api/admin/products/${initialProduct.id}`
          : "/api/admin/products",
        {
          method: initialProduct?.id ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            costPrice: costPrice.trim() || null,
            sellingPrice,
            imageUrl: finalImage?.imageUrl ?? null,
            imageKey: finalImage?.imageKey ?? null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to save product."
        );
      }

      // Product is saved. Now remove the previous image if it changed.
      const previousImageKey = initialProduct?.imageKey;

      if (
        previousImageKey &&
        previousImageKey !== finalImage?.imageKey
      ) {
        try {
          await deleteProductImage(previousImageKey);
        } catch (cleanupError) {
          console.error(
            "Previous product image cleanup failed:",
            cleanupError
          );
        }
      }

      setImage(null);
      setCostPrice("");
      setSellingPrice("");
      setName("");

      onSuccess(data.product);
    } catch (err) {
      // If product saving failed, clean up the newly uploaded image.
      if (newlyUploadedImage?.imageKey) {
        try {
          await deleteProductImage(newlyUploadedImage.imageKey);
        } catch (cleanupError) {
          console.error(
            "Newly uploaded image cleanup failed:",
            cleanupError
          );
        }
      }

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    setName(initialProduct?.name ?? "");
    setCostPrice(String(initialProduct?.costPrice ?? ""));
    setSellingPrice(String(initialProduct?.sellingPrice ?? ""));

    setImage(
      initialProduct?.imageUrl && initialProduct?.imageKey
        ? {
          imageUrl: initialProduct.imageUrl,
          imageKey: initialProduct.imageKey,
        }
        : null
    );

    setError("");
  }, [isOpen, initialProduct]);

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-6"
    >

      {/* Product image */}
      <section>

        <div className="flex items-center gap-2 mb-3">
          <ImagePlus
            size={19}
            className="text-teal-700"
          />

          <h3 className="font-bold text-gray-900">
            Product image
          </h3>

          <span className="text-xs text-gray-400">
            Optional
          </span>
        </div>

        <div className="rounded-2xl border border-dashed border-gray-300 bg-[#FAFBFA] p-4">
          <ProductImageUpload
            value={image}
            onChange={setImage}
          />
        </div>

      </section>

      {/* Product name */}
      <section>

        <label className="block text-sm font-bold text-gray-800 mb-2">
          Product name
          <span className="text-red-500 ml-1">*</span>
        </label>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={255}
          placeholder="e.g. Paracetamol 500mg"
          className={inputClass}
        />

        <p className="text-xs text-gray-400 mt-2">
          Enter the full name of the pharmacy product.
        </p>

      </section>

      {/* Pricing */}
      <section>

        <div className="flex items-center gap-2 mb-3">
          <Package
            size={19}
            className="text-teal-700"
          />

          <h3 className="font-bold text-gray-900">
            Product pricing
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Cost price
              <span className="text-gray-400 font-normal ml-1">
                (NPR)
              </span>
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={costPrice}
              onChange={(e) =>
                setCostPrice(e.target.value)
              }
              placeholder="Optional"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Selling price
              <span className="text-red-500 ml-1">*</span>
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={sellingPrice}
              onChange={(e) =>
                setSellingPrice(e.target.value)
              }
              placeholder="0.00"
              className={inputClass}
            />
          </div>

        </div>

      </section>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex gap-3 text-red-700">

          <AlertCircle
            size={20}
            className="shrink-0 mt-0.5"
          />

          <p className="text-sm font-medium">
            {error}
          </p>

        </div>
      )}

      {/* Footer */}

      <div className="bg-white pb-[calc(1rem+env(safe-area-inset-bottom))] flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-teal-700 text-white font-bold py-3.5 hover:bg-teal-800 transition"
        >

          {loading ? (
            <>
              <Loader2
                size={20}
                className="animate-spin"
              />
              Saving product...
            </>
          ) : (
            <>
              <CheckCircle2 size={20} />
              {initialProduct?.id
                ? "Update product"
                : "Save product"}
            </>
          )}

        </button>

        {onCancel && (
          <button
            type="button"
            onClick={() => {
              if (!initialProduct?.id) {
                setImage(null);
                setCostPrice("")
                setSellingPrice("")
                setName("")
              }
              onCancel();
            }}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-red-700 font-semibold px-4 py-3.5 disabled:opacity-50"

          >
            Cancel
          </button>
        )}

      </div>
    </form>
  );
}
