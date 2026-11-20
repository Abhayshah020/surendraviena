
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


interface UploadedImage {
  imageUrl: string;
  imageKey: string;
  file?: File;
}

interface Props {
  initialProduct?: Product;
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

interface BatchFieldsProps {
  batchNumber: string;
  setBatchNumber: (value: string) => void;
  costPrice: string;
  setCostPrice: (value: string) => void;
  sellingPrice: string;
  setSellingPrice: (value: string) => void;
  quantity: string;
  setQuantity: (value: string) => void;
  expiryDate: string;
  setExpiryDate: (value: string) => void;
  inputClass: string;
}

function BatchFields({
  batchNumber,
  setBatchNumber,
  costPrice,
  setCostPrice,
  sellingPrice,
  setSellingPrice,
  quantity,
  setQuantity,
  expiryDate,
  setExpiryDate,
  inputClass,
}: BatchFieldsProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Batch number
        </label>

        <input
          type="text"
          required
          value={batchNumber}
          onChange={(e) => setBatchNumber(e.target.value)}
          placeholder="e.g. BATCH-001"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Cost price (NPR)
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            required
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            placeholder="0.00"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Selling price (NPR)
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            required
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            placeholder="0.00"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Stock quantity
          </label>

          <input
            type="number"
            min="0"
            step="1"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Expiry date
          </label>

          <input
            type="date"
            required
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
    </>
  );
}

export default function ProductForm({
  initialProduct,
  onSuccess,
  isOpen,
  onCancel,
}: Props) {
  const [name, setName] = useState("");

  const [image, setImage] = useState<UploadedImage | null>(null);

  const [initialStockEnabled, setInitialStockEnabled] = useState(false);

  const [batchNumber, setBatchNumber] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [batchEditorEnabled, setBatchEditorEnabled] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Product name is required.");
      return;
    }

    const shouldSaveBatch = initialProduct?.id
      ? batchEditorEnabled
      : initialStockEnabled;

    if (shouldSaveBatch) {
      if (!batchNumber.trim()) {
        setError("Batch number is required.");
        return;
      }

      if (!/^\d{1,10}(\.\d{1,2})?$/.test(costPrice)) {
        setError("Enter a valid cost price.");
        return;
      }

      if (!/^\d{1,10}(\.\d{1,2})?$/.test(sellingPrice)) {
        setError("Enter a valid selling price.");
        return;
      }

      if (
        !quantity.trim() ||
        !/^\d+$/.test(quantity) ||
        Number(quantity) < 0
      ) {
        setError("Enter a valid stock quantity.");
        return;
      }

      if (!expiryDate) {
        setError("Expiry date is required.");
        return;
      }
    }

    let newlyUploadedImage: R2Image | null = null;

    try {
      setLoading(true);

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

      const payload: Record<string, unknown> = {
        name: name.trim(),
        imageUrl: finalImage?.imageUrl ?? null,
        imageKey: finalImage?.imageKey ?? null,
      };

      if (shouldSaveBatch) {
        const batchData = {
          batchNumber: batchNumber.trim(),
          costPrice,
          sellingPrice,
          quantity: Number(quantity),
          expiryDate,
        };

        if (initialProduct?.id) {
          payload.batch = {
            ...batchData,
            ...(selectedBatchId
              ? { id: selectedBatchId }
              : {}),
          };
        } else {
          payload.initialBatch = batchData;
        }
      }

      const response = await fetch(
        initialProduct?.id
          ? `/api/admin/products/${initialProduct.id}`
          : "/api/admin/products",
        {
          method: initialProduct?.id ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save product.");
      }

      setImage(null);
      setName("");
      setCostPrice("");
      setSellingPrice("");
      setQuantity("");
      setExpiryDate("");
      setBatchNumber("");
      setInitialStockEnabled(false);

      onSuccess(data.product);
    } catch (err) {
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

  function selectBatch(batchId: string) {
    setSelectedBatchId(batchId);

    const selectedBatch = initialProduct?.batches?.find(
      (batch) => batch.id === batchId
    );

    if (!selectedBatch) {
      setBatchNumber("");
      setCostPrice("");
      setSellingPrice("");
      setQuantity("");
      setExpiryDate("");
      return;
    }

    setBatchNumber(selectedBatch.batchNumber);
    setCostPrice(String(selectedBatch.costPrice));
    setSellingPrice(String(selectedBatch.sellingPrice));
    setQuantity(String(selectedBatch.quantity));
    setExpiryDate(
      String(selectedBatch.expiryDate).slice(0, 10)
    );
  }

  useEffect(() => {
    if (!isOpen) return;

    setName(initialProduct?.name ?? "");

    const firstBatch = initialProduct?.batches?.[0];

    setSelectedBatchId(firstBatch?.id ?? "");
    setBatchEditorEnabled(false);

    setBatchNumber(firstBatch?.batchNumber ?? "");
    setCostPrice(
      firstBatch ? String(firstBatch.costPrice) : ""
    );
    setSellingPrice(
      firstBatch ? String(firstBatch.sellingPrice) : ""
    );
    setQuantity(
      firstBatch ? String(firstBatch.quantity) : ""
    );
    setExpiryDate(
      firstBatch?.expiryDate
        ? String(firstBatch.expiryDate).slice(0, 10)
        : ""
    );

    setInitialStockEnabled(false);

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


      {!initialProduct?.id ? (
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={initialStockEnabled}
              onChange={(e) =>
                setInitialStockEnabled(e.target.checked)
              }
              className="h-4 w-4 rounded"
            />

            <span className="text-sm font-semibold text-gray-700">
              Add initial stock
            </span>
          </label>

          {initialStockEnabled && (
            <div className="rounded-xl border border-gray-200 p-4 space-y-4">
              <h3 className="font-bold text-gray-800">
                Initial batch details
              </h3>

              {/* Batch fields */}
              <BatchFields
                batchNumber={batchNumber}
                setBatchNumber={setBatchNumber}
                costPrice={costPrice}
                setCostPrice={setCostPrice}
                sellingPrice={sellingPrice}
                setSellingPrice={setSellingPrice}
                quantity={quantity}
                setQuantity={setQuantity}
                expiryDate={expiryDate}
                setExpiryDate={setExpiryDate}
                inputClass={inputClass}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900">
                Inventory batches
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Manage batch prices, quantities and expiry dates.
              </p>
            </div>
          </div>

          {initialProduct.batches?.length ? (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select existing batch
              </label>

              <select
                value={selectedBatchId}
                onChange={(e) => selectBatch(e.target.value)}
                className={inputClass}
              >
                {initialProduct.batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batchNumber} — Stock: {batch.quantity}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              This product does not have any batches yet.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedBatchId("");
                setBatchNumber("");
                setCostPrice("");
                setSellingPrice("");
                setQuantity("");
                setExpiryDate("");
                setBatchEditorEnabled(true);
              }}
              className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800"
            >
              + Add new batch
            </button>

            {selectedBatchId && (
              <button
                type="button"
                onClick={() => setBatchEditorEnabled(true)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
              >
                Edit selected batch
              </button>
            )}
          </div>

          {batchEditorEnabled && (
            <div className="rounded-xl border border-gray-200 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800">
                  {selectedBatchId ? "Edit batch" : "New batch"}
                </h3>

                <button
                  type="button"
                  onClick={() => setBatchEditorEnabled(false)}
                  className="text-sm font-semibold text-red-600"
                >
                  Cancel
                </button>
              </div>

              {/* Batch fields */}
              <BatchFields
                batchNumber={batchNumber}
                setBatchNumber={setBatchNumber}
                costPrice={costPrice}
                setCostPrice={setCostPrice}
                sellingPrice={sellingPrice}
                setSellingPrice={setSellingPrice}
                quantity={quantity}
                setQuantity={setQuantity}
                expiryDate={expiryDate}
                setExpiryDate={setExpiryDate}
                inputClass={inputClass}
              />
            </div>
          )}
        </div>
      )}


      {/* {!initialProduct?.id && (
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={initialStockEnabled}
              onChange={(e) =>
                setInitialStockEnabled(e.target.checked)
              }
              className="h-4 w-4 rounded"
            />

            <span className="text-sm font-semibold text-gray-700">
              Add initial stock
            </span>
          </label>

          {initialStockEnabled && (
            <div className="rounded-xl border border-gray-200 p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Batch number
                </label>

                <input
                  type="text"
                  required
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g. BATCH-001"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cost price (NPR)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="0.00"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Selling price (NPR)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="0.00"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Stock quantity
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Expiry date
                  </label>

                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )} */}

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
