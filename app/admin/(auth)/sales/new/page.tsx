
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Loader2,
  Pill,
  CheckCircle2,
  X,
  ChevronRight,
  UserRound,
  Phone,
  Receipt,
  Package,
} from "lucide-react";

import { formatNPR } from "../../../../../lib/utils/currency";

export interface ProductBatch {
  id: string;
  batchNumber: string;
  costPrice: string;
  sellingPrice: string;
  quantity: number;
  expiryDate: string;
  receivedAt: string;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  imageUrl: string | null;
  isActive: boolean;

  batches: ProductBatch[];
  totalStock: number;
  availableStock: number;
}

interface CartItem extends Product {
  quantity: number;
}

function getEligibleBatches(product: Product) {
  return product.batches
    .filter(
      (batch) =>
        batch.isActive &&
        batch.quantity > 0
    )
    .sort((a, b) => {
      const expiryComparison =
        a.expiryDate.localeCompare(b.expiryDate);

      if (expiryComparison !== 0) return expiryComparison;

      const receivedComparison =
        new Date(a.receivedAt).getTime() -
        new Date(b.receivedAt).getTime();

      if (receivedComparison !== 0) return receivedComparison;

      return a.id.localeCompare(b.id);
    });
}

function getEstimatedLineTotal(
  product: Product,
  requestedQuantity: number
) {
  let remaining = requestedQuantity;
  let lineTotal = 0;

  const batches = getEligibleBatches(product);

  for (const batch of batches) {
    if (remaining <= 0) break;

    const allocated = Math.min(
      remaining,
      batch.quantity
    );

    lineTotal +=
      Number(batch.sellingPrice) * allocated;

    remaining -= allocated;
  }

  if (remaining > 0) {
    return null;
  }

  return lineTotal;
}

function getNextBatchPrice(product: Product) {
  const batch = getEligibleBatches(product)[0];

  return batch ? Number(batch.sellingPrice) : null;
}

export default function NewSalePage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  const [customerName, setCustomerName] = useState("Anonymous Customer");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discount, setDiscount] = useState("0");

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [cartOpen, setCartOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [loadingMore, setLoadingMore] = useState(false);
  const [stayOnPage, setStayOnPage] = useState(false);
  const [saleSuccess, setSaleSuccess] = useState("");

  const [productError, setProductError] = useState("");

  const abortControllerRef = useRef<AbortController | null>(null);

  function handleStayOnPageChange(checked: boolean) {
    setStayOnPage(checked);

    try {
      localStorage.setItem(
        "pharmacy_stay_on_sales_page",
        String(checked)
      );
    } catch {
      return;
    }
  }

  const fetchProducts = useCallback(
    async (targetPage: number, query: string, append = false) => {
      // Cancel any previous request
      abortControllerRef.current?.abort();

      setProductError("");

      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoadingProducts(true);
      }

      try {
        const params = new URLSearchParams({
          page: String(targetPage),
          limit: "20",
        });

        if (query) {
          params.set("search", query);
        }

        const response = await fetch(
          `/api/admin/products?${params.toString()}`,
          { signal: controller.signal }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load products.");
        }

        if (controller.signal.aborted) return;

        setProducts((previous) =>
          append ? [...previous, ...data.products] : data.products
        );

        setPage(data.pagination.page);
        setHasNextPage(data.pagination.hasNextPage);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setProductError(
          err instanceof Error
            ? err.message
            : "Unable to load products."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingProducts(false);
          setLoadingMore(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    fetchProducts(1, "");

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchProducts]);

  // Search only when submitted
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchProducts(1, search.trim(), false);
  };

  // Load the next 20 products
  const handleLoadMore = () => {
    if (!hasNextPage || loadingMore || loadingProducts) return;

    fetchProducts(page + 1, search.trim(), true);
  };

  const subtotal = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const lineTotal = getEstimatedLineTotal(
          item,
          item.quantity
        );

        return sum + (lineTotal ?? 0);
      }, 0),
    [cart]
  );

  const discountValue = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, subtotal - discountValue);

  const totalQuantity = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  function getQuantity(id: string) {
    return cart.find((item) => item.id === id)?.quantity || 0;
  }

  function addProduct(product: Product) {
    setError("");
    setSaleSuccess("");

    setCart((current) => {
      const existing = current.find(
        (item) => item.id === product.id
      );

      const currentQuantity = existing?.quantity || 0;

      if (currentQuantity >= product.availableStock) {
        setError(
          `Only ${product.availableStock} units of ${product.name} are currently available.`
        );
        return current;
      }

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });
  }

  function changeQuantity(id: string, amount: number) {
    setCart((current) =>
      current
        .map((item) => {
          if (item.id !== id) return item;

          const nextQuantity = item.quantity + amount;

          if (nextQuantity > item.availableStock) {
            setError(
              `Only ${item.availableStock} units of ${item.name} are available.`
            );

            return item;
          }

          return {
            ...item,
            quantity: nextQuantity,
          };
        })
        .filter((item) => item.quantity > 0)
    );
  }

  function removeProduct(id: string) {
    setCart((current) => current.filter((item) => item.id !== id));
  }

  async function completeSale() {
    setError("");

    if (!cart.length) {
      setError("Add at least one product.");
      return;
    }

    if (discountValue > subtotal) {
      setError("Discount cannot exceed the subtotal.");
      return;
    }

    if (!/^\d{1,10}(\.\d{1,2})?$/.test(discount.trim() || "0")) {
      setError("Enter a valid discount amount.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/admin/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: customerName.trim() || "Anonymous Customer",
          customerPhone: customerPhone.trim() || null,
          discountAmount: discount.trim() || "0",
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to complete sale.");
      }

      if (stayOnPage) {
        // Reset the bill for the next customer
        setCart([]);
        setCustomerName("Anonymous Customer");
        setCustomerPhone("");
        setDiscount("0");
        setCartOpen(false);

        fetchProducts(1, "");

        setSaleSuccess(
          `Sale ${data.sale.invoiceNumber} completed successfully.`
        );

        return;
      }
      router.push(`/admin/sales/${data.sale.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    try {
      setStayOnPage(
        localStorage.getItem("pharmacy_stay_on_sales_page") === "true"
      );
    } catch {
      setStayOnPage(false);
    }
  }, []);


  // Reusable cart content for desktop sidebar and mobile drawer.
  const cartContent = (
    <>
      {/* CART ITEMS */}
      <div className="p-3 sm:p-4 space-y-3 max-h-[340px] sm:max-h-[400px] overflow-y-auto">

        {cart.length === 0 ? (
          <div className="py-10 text-center">
            <ShoppingCart
              className="mx-auto text-gray-300 mb-3"
              size={34}
            />

            <p className="font-semibold text-gray-700 text-sm">
              Your bill is empty
            </p>

            <p className="text-xs text-gray-400 mt-1">
              Select products to get started.
            </p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.id}
              className="border-b border-gray-100 pb-3 last:border-0"
            >
              <div className="flex justify-between gap-2">

                <p className="text-sm font-semibold text-gray-800 min-w-0">
                  {item.name}
                </p>

                <button
                  onClick={() => removeProduct(item.id)}
                  className="shrink-0 text-red-500 p-1 rounded-lg hover:bg-red-50"
                  aria-label="Remove product"
                >
                  <Trash2 size={16} />
                </button>

              </div>

              <div className="flex justify-between items-center mt-2">

                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">

                  <button
                    onClick={() => changeQuantity(item.id, -1)}
                    className="p-2 hover:bg-gray-100 active:bg-gray-200"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>

                  <span className="min-w-9 text-center text-sm font-bold tabular-nums">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => changeQuantity(item.id, 1)}
                    className="p-2 hover:bg-gray-100 active:bg-gray-200"
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>

                </div>

                <div className="text-right">
                  <p className="text-[10px] text-gray-400">
                    Batch-based pricing
                  </p>

                  <p className="font-bold text-sm text-gray-900">
                    {formatNPR(
                      getEstimatedLineTotal(item, item.quantity) ?? 0
                    )}
                  </p>
                </div>

              </div>
            </div>
          ))
        )}

      </div>

      {/* CUSTOMER DETAILS */}
      <div className="px-3 sm:px-4 pt-3 border-t border-gray-100 space-y-3">

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Customer name
          </label>

          <div className="relative">
            <UserRound
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Anonymous Customer"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Phone number (optional)
          </label>

          <div className="relative">
            <Phone
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Customer phone number"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Bill discount (NPR)
          </label>

          <input
            type="number"
            min="0"
            max={subtotal}
            step="0.01"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

      </div>

      {/* TOTALS */}
      <div className="p-3 sm:p-4 mt-2 border-t border-dashed border-gray-200 space-y-2.5">

        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-medium">{formatNPR(subtotal)}</span>
        </div>

        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-gray-500">Discount</span>
          <span className="text-red-600 font-medium">
            - {formatNPR(discountValue)}
          </span>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span className="font-bold text-gray-800 text-sm">
            Total payable
          </span>

          <span className="text-xl font-extrabold text-teal-800 tabular-nums">
            {formatNPR(total)}
          </span>
        </div>

      </div>

      {/* ERROR */}
      {error && (
        <div className="mx-3 sm:mx-4 mb-3 rounded-lg bg-red-50 border border-red-100 text-red-700 p-3 text-xs">
          {error}
        </div>
      )}

      {/* COMPLETE SALE */}

      {/* SALE SUCCESS */}
      {saleSuccess && (
        <div
          role="status"
          className="mx-3 sm:mx-4 mb-3 rounded-xl border border-green-200 bg-green-50 p-3 text-xs font-medium text-green-800"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={17} className="shrink-0" />
            <span>{saleSuccess}</span>
          </div>
          <p className="mt-1 ml-6 text-green-700">
            Ready for the next customer.
          </p>
        </div>
      )}

      {/* STAY ON PAGE PREFERENCE */}
      <div className="px-3 sm:px-4 pb-3">
        <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 cursor-pointer hover:bg-gray-100 transition">
          <input
            type="checkbox"
            checked={stayOnPage}
            onChange={(e) => handleStayOnPageChange(e.target.checked)}
            className="h-5 w-5 shrink-0 accent-teal-700 cursor-pointer"
          />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-800">
              Stay on this page after sale
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Automatically clear the bill for the next customer.
            </p>
          </div>
        </label>
      </div>

      {/* COMPLETE SALE */}
      <div className="p-3 sm:p-4 pt-0">
        <button
          type="button"
          disabled={submitting || cart.length === 0}
          onClick={completeSale}
          className="w-full rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold py-3.5 flex justify-center items-center gap-2 disabled:opacity-50 active:scale-[0.99] transition"
        >
          {submitting ? (
            <Loader2 size={19} className="animate-spin" />
          ) : (
            <CheckCircle2 size={19} />
          )}

          {submitting ? "Processing sale..." : "Complete sale"}
        </button>
      </div>

    </>
  );

  return (
    <main className="min-h-[calc(100dvh-70px)] bg-[#F7F9F8] p-3 sm:p-6 lg:p-8 pb-28 sm:pb-6">

      <div className="max-w-[1600px] mx-auto">
        {/* PAGE HEADER */}
        <div className="hidden sm:block mb-4 sm:mb-6 flex items-center justify-between">

          <div className="sm:flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <Package size={15} className="text-teal-700" />
            {products.length} products available
          </div>

        </div>

        {productError && (
          <div className="my-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {productError}
          </div>
        )}

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_370px] 2xl:grid-cols-[minmax(0,1fr)_400px] gap-4 sm:gap-6 items-start">

          {/* PRODUCT SELECTION */}
          <section className="sm:rounded-2xl overflow-hidden ">

            {/* SEARCH HEADER */}
            <div className="">

              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-sm sm:text-lg text-gray-900">
                  Select products
                </h2>

                <div className="sm:hidden text-xs text-gray-400">
                  {products.length} products
                </div>
              </div>

              <form onSubmit={handleSearch} className="w-full">
                <div className="relative flex items-center w-full">
                  <Search
                    size={18}
                    className="absolute left-3.5 text-gray-400 pointer-events-none"
                  />

                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search medicine or product..."
                    className="w-full h-12 pl-11 pr-14 text-sm text-gray-800 placeholder:text-gray-400 bg-white border border-gray-200 rounded-xl outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />

                  <button
                    type="submit"
                    aria-label="Search products"
                    className="absolute right-1.5 flex items-center justify-center w-9 h-9 rounded-lg bg-teal-600 text-white hover:bg-teal-700 active:scale-95 transition-all"
                  >
                    <Search size={17} />
                  </button>
                </div>
              </form>

            </div>

            {/* PRODUCTS */}
            <div className="pt-2.5">

              {loadingProducts ? (
                <div className="py-16 flex flex-col items-center gap-3">
                  <Loader2 className="animate-spin text-teal-700" size={26} />
                  <p className="text-xs text-gray-400">
                    Loading products...
                  </p>
                </div>
              ) : products.length === 0 ? (
                <div className="py-16 text-center">
                  <Pill className="mx-auto text-gray-300 mb-3" size={35} />

                  <p className="font-semibold text-gray-700 text-sm">
                    No products found
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    Try another product name.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2 sm:gap-3">

                  {products.map((product) => {
                    const quantity = getQuantity(product.id);
                    const remainingStock = Math.max(
                      0,
                      product.availableStock - quantity
                    );
                    const nextBatchPrice = getNextBatchPrice(product);
                    const outOfStock = remainingStock <= 0;

                    return (
                      <button
                        type="button"
                        key={product.id}
                        disabled={outOfStock}
                        onClick={() => addProduct(product)}
                        className={`relative text-left border rounded-xl p-2.5 sm:p-3 transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${quantity > 0
                          ? "border-teal-300 bg-teal-50/50"
                          : "border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50/30"
                          }`}
                      >

                        {/* SELECTED QUANTITY */}
                        {quantity > 0 && (
                          <span className="absolute top-2 right-2 min-w-5 h-5 px-1 rounded-full bg-teal-700 text-white text-[10px] font-bold flex items-center justify-center">
                            {quantity}
                          </span>
                        )}

                        <div className="flex items-center gap-2.5 min-w-0">

                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt=""
                              loading="lazy"
                              className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg bg-gray-50 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                              <Pill size={20} className="text-teal-700" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-2 leading-4">
                              {product.name}
                            </p>

                            <p className="text-xs sm:text-sm font-bold text-teal-700 mt-1">
                              {nextBatchPrice !== null
                                ? formatNPR(nextBatchPrice)
                                : "Unavailable"}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1">
                              {outOfStock
                                ? "Out of stock"
                                : `${remainingStock} available`}
                            </p>
                          </div>

                        </div>

                        <div className="mt-2.5 pt-2 border-t border-gray-100 flex justify-between items-center">

                          <span className="text-[10px] sm:text-xs font-semibold text-teal-700">
                            {quantity > 0 ? "Add another" : "Add to bill"}
                          </span>

                          <div className="w-6 h-6 rounded-lg bg-teal-50 flex items-center justify-center">
                            <Plus size={14} className="text-teal-700" />
                          </div>

                        </div>

                      </button>
                    );
                  })}

                </div>
              )}

              {/* Load more */}
              {products.length > 0 && hasNextPage && (
                <div className="flex justify-center py-3">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore || loadingProducts}
                    className="min-h-11 rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition"
                  >
                    {loadingMore ? "Loading more products..." : "Load more products"}
                  </button>
                </div>
              )}

              {/* End of products */}
              {products.length > 0 && !hasNextPage && !loadingProducts && (
                <p className="py-5 text-center text-xs text-gray-400">
                  You've reached the end of the product list.
                </p>
              )}

            </div>

          </section>

          {/* DESKTOP CART SIDEBAR */}
          <section className="hidden xl:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm sticky top-5">

            <div className="p-4 border-b border-gray-100 flex justify-between items-center">

              <div>
                <h2 className="font-bold text-base text-gray-900">
                  Current bill
                </h2>

                <p className="text-xs text-gray-400 mt-0.5">
                  {totalQuantity} items · {cart.length} products
                </p>
              </div>

              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
                <ShoppingCart size={19} className="text-teal-700" />
              </div>

            </div>

            {cartContent}

          </section>

        </div>

      </div>

      {/* MOBILE + TABLET FIXED BILL BAR */}

      {cart.length > 0 && (
        <div
          className="
      xl:hidden
      fixed inset-x-0 bottom-0 z-40
      bg-white
      border-t border-gray-100
      shadow-[0_-6px_25px_rgba(15,23,42,0.09)]
      px-4 pt-3
      pb-[calc(12px+env(safe-area-inset-bottom))]
    "
        >
          {/* Drawer handle */}
          <div className="flex justify-center mb-3">
            <div className="w-9 h-1 rounded-full bg-gray-300" />
          </div>

          <div className="max-w-3xl mx-auto flex items-center gap-3">

            {/* Cart summary */}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="
          flex items-center gap-3
          flex-1 min-w-0
          text-left rounded-xl
          active:opacity-70 transition
        "
            >
              <div className="relative w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center shrink-0">
                <ShoppingCart
                  size={21}
                  strokeWidth={2}
                  className="text-teal-700"
                />

                <span className="
            absolute -top-1.5 -right-1.5
            min-w-5 h-5 px-1
            rounded-full bg-teal-700
            border-2 border-white
            text-white text-[10px] font-bold
            flex items-center justify-center
          ">
                  {cart.length}
                </span>
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-medium text-gray-500">
                  Current bill · {totalQuantity} units
                </p>

                <p className="text-lg font-extrabold text-gray-900 tracking-tight truncate mt-0.5">
                  {formatNPR(total)}
                </p>
              </div>
            </button>

            {/* View bill button */}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="
          flex items-center justify-center gap-2
          min-h-12
          rounded-xl
          bg-teal-700 hover:bg-teal-800
          active:scale-[0.97]
          text-white
          px-5 py-3
          font-semibold text-sm
          shadow-sm shadow-teal-700/20
          shrink-0
          transition-all duration-150
        "
            >
              <span>View bill</span>
              <ChevronRight size={17} strokeWidth={2.5} />
            </button>

          </div>
        </div>
      )}


      {/* MOBILE + TABLET CART DRAWER */}

      <div
        className={`fixed inset-0 z-[100] xl:hidden transition-all duration-300 ease-in-out ${cartOpen
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-full opacity-0 pointer-events-none"
          }`}
      >
        {/* BOTTOM DRAWER */}
        <section className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl sm:rounded-t-3xl shadow-2xl max-h-[90dvh] flex flex-col">

          {/* DRAWER HEADER */}
          <div className="shrink-0 px-4 pt-3 pb-3 border-b border-gray-100">

            <div className="flex justify-center mb-3">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="flex justify-between items-center">

              <div>
                <h2 className="font-bold text-base sm:text-lg text-gray-900">
                  Current bill
                </h2>

                <p className="text-xs text-gray-400 mt-0.5">
                  {totalQuantity} items · {cart.length} products
                </p>
              </div>

              <button
                onClick={() => setCartOpen(false)}
                aria-label="Close bill"
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
              >
                <X size={19} />
              </button>

            </div>

          </div>

          {/* SCROLLABLE DRAWER CONTENT */}
          <div className="overflow-y-auto overscroll-contain min-h-0 flex-1 pb-2">
            {cartContent}
          </div>

        </section>

      </div>
    </main>
  );
}
