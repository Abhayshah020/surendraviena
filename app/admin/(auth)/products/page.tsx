
"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Plus,
  Search,
  SlidersHorizontal,
  Package,
  Loader2,
  X,
  Pencil,
  Power,
  RotateCcw,
  ChevronRight,
  IndianRupee,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Filter,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { formatNPR } from "../../../../lib/utils/currency";
import ProductForm from "../../../../components/products/product-form";
import { useAppDialog } from "../../../../components/app-dialog";

export interface Product {
  id: string;
  name: string;
  imageUrl: string | null;
  imageKey?: string | null;
  costPrice: string | null;
  sellingPrice: string;
  isActive: boolean;
}

type ProductStatus = "all" | "active" | "inactive";

const LIMIT = 10;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const { alert, confirm } = useAppDialog();

  // Applied filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProductStatus>("all");

  // Temporary filter values
  const [filterSearch, setFilterSearch] = useState("");
  const [filterStatus, setFilterStatus] =
    useState<ProductStatus>("all");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteActionLoading, setDeleteActionLoading] = useState<string | null>(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [selected, setSelected] = useState<Product | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);

  const [error, setError] = useState("");

  async function hardDeleteProduct(product: Product) {
    const confirmed = await confirm(
      `Permanently delete "${product.name}"?\n\nThis action cannot be undone.`,
      {
        title: "Delete Product Permanently?",
        confirmText: "Delete Product",
        cancelText: "Cancel",
        variant: "danger",
      }
    );

    if (!confirmed) return;

    try {
      setDeleteActionLoading(product.id);

      const response = await fetch(
        `/api/admin/products/${product.id}/hard-delete`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        await alert(data.message || "Unable to delete product.", {
          title: response.status === 409
            ? "Product cannot be deleted"
            : "Deletion failed",
          variant: response.status === 409
            ? "warning"
            : "error",
        });

        return;
      }

      // Close details drawer
      setDetailsOpen(false);
      setSelected(null);

      // Refresh product listing
      await fetchProducts(1, false);

    } catch (error) {
      await alert(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
        {
          title: "Deletion failed",
          variant: "error",
        }
      );
    } finally {
      setDeleteActionLoading(null);
    }
  }

  const fetchProducts = useCallback(
    async (
      nextPage: number,
      append = false,
      searchValue = search,
      statusValue = status,
      signal?: AbortSignal
    ) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError("");
      }

      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          limit: String(LIMIT),
          search: searchValue,
          status: statusValue,
        });

        const response = await fetch(
          `/api/admin/products?${params.toString()}`,
          { signal }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to fetch products."
          );
        }

        setProducts((previous) =>
          append
            ? [...previous, ...data.products]
            : data.products
        );

        setPage(data.pagination.page);
        setTotal(data.pagination.total);
        setHasNextPage(data.pagination.hasNextPage);

      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load products."
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [search, status]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      await fetchProducts(1, false, search, status, controller.signal);
    }

    loadProducts();

    return () => {
      controller.abort();
    };
  }, []);

  function applyFilters() {
    setSearch(filterSearch.trim());
    setStatus(filterStatus);
    setFilterOpen(false);

    fetchProducts(
      1,
      false,
      filterSearch.trim(),
      filterStatus
    );
  }

  function resetFilters() {
    setFilterSearch("");
    setFilterStatus("all");

    setSearch("");
    setStatus("all");

    fetchProducts(1, false, "", "all");
    setFilterOpen(false);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    // setDetailsOpen(false);
    setFormOpen(true);
  }

  function closeForm(product: Product) {
    setFormOpen(false);
    setEditing(null);
    setSelected(product)
    fetchProducts(1, false);
  }

  function openDetails(product: Product) {
    setSelected(product);
    setDetailsOpen(true);
  }

  async function changeProductStatus(
    product: Product,
    action: "deactivate" | "reactivate"
  ) {
    const isDeactivating = action === "deactivate";
    const confirmed = await confirm(
      '',
      {
        title: `Deactivate "${product.name}"?`,
        confirmText: "Deactivate",
        cancelText: "Cancel",
        variant: "danger",
      }
    );
    if (
      isDeactivating &&
      !confirmed
    ) {
      return;
    }

    try {
      setActionLoading(product.id);

      const response = await fetch(
        isDeactivating
          ? `/api/admin/products/${product.id}`
          : `/api/admin/products/${product.id}/reactivate`,
        {
          method: isDeactivating ? "DELETE" : "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update product."
        );
      }

      setSelected((previous) =>
        previous?.id === product.id
          ? {
            ...previous,
            isActive: !isDeactivating,
          }
          : previous
      );

      await fetchProducts(1, false);

    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Unable to update product."
      );
    } finally {
      setActionLoading(null);
    }
  }

  const activeFilters =
    (search ? 1 : 0) +
    (status !== "all" ? 1 : 0);

  return (
    <main className="relative min-h-[calc(100dvh-70px)] bg-[#F6F8F7] text-gray-800 pb-28 sm:pb-8">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#F6F8F7]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">

          <div className="hidden sm:flex items-center justify-between ">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Products
            </h1>
            <button
              onClick={openCreate}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 active:scale-[0.98] px-4 py-3 text-white font-semibold shadow-sm transition"
            >
              <Plus size={19} />
              <span className="hidden sm:inline">
                Add product
              </span>
              <span className="sm:hidden">
                Add
              </span>
            </button>
          </div>
          {/* Search and filter */}
          <div className="sm:mt-5 flex gap-2">

            <button
              onClick={() => {
                setFilterSearch(search);
                setFilterStatus(status);
                setFilterOpen(true);
              }}
              className="relative flex-1 flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 text-left shadow-sm hover:border-teal-300 transition"
            >
              <Search
                size={20}
                className="text-gray-400 shrink-0"
              />

              <span className="text-sm text-gray-500 truncate">
                {search || "Search and filter products"}
              </span>

              <SlidersHorizontal
                size={19}
                className="ml-auto text-teal-700 shrink-0"
              />

              {activeFilters > 0 && (
                <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 rounded-full bg-teal-700 text-white text-xs font-bold">
                  {activeFilters}
                </span>
              )}
            </button>

            <button
              onClick={() => fetchProducts(1, false)}
              disabled={loading}
              aria-label="Refresh products"
              className="flex items-center justify-center w-12 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                size={19}
                className={loading ? "animate-spin" : ""}
              />
            </button>

          </div>
        </div>
      </header>

      {/* Product listing */}
      <section className="max-w-7xl mx-auto  px-4 sm:px-6 lg:px-8">

        <div className="flex items-center justify-between mb-4">

          <p className="text-xs text-gray-500 mt-1">
            Inventory {loading
              ? "Loading products..."
              : `${products.length} of ${total} products`}
          </p>

          {activeFilters > 0 && (
            <button
              onClick={resetFilters}
              className="text-sm font-semibold text-teal-700"
            >
              Clear filters
            </button>
          )}

        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle size={19} />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col px-4 items-center justify-center py-24">
            <Loader2
              size={32}
              className="animate-spin text-teal-700"
            />

            <p className="text-sm text-gray-500 mt-4">
              Loading products...
            </p>
          </div>
        ) : products.length === 0 ? (

          <div className="border border-gray-200 bg-white py-16 px-10 text-center">

            <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-50 flex items-center justify-center">
              <Package
                size={30}
                className="text-teal-700"
              />
            </div>

            <h3 className="font-bold text-gray-900 mt-5">
              No products found
            </h3>

            <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
              Try changing your search filters or add a new pharmacy product.
            </p>

            <button
              onClick={resetFilters}
              className="mt-5 rounded-xl bg-teal-700 px-5 py-3 text-white font-semibold text-sm"
            >
              Clear filters
            </button>

          </div>

        ) : (
          <>
            {/* Product cards */}
            <div className="bg-white border border-gray-200 sm:rounded-2xl overflow-hidden shadow-sm">

              {products.map((product) => (

                <button
                  key={product.id}
                  onClick={() => openDetails(product)}
                  className="group w-full min-w-0 text-left bg-white border border-gray-200/90 p-3 sm:p-4 shadow-[0_2px_10px_rgba(0,0,0,0.025)] hover:border-teal-200 hover:shadow-md active:scale-[0.99] transition"
                >

                  <div className="flex items-center gap-3">

                    {/* Image */}
                    <div className="w-[60px] h-[60px] shrink-0 rounded-xl overflow-hidden bg-[#F0F5F3] flex items-center justify-center">

                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package
                          size={28}
                          className="text-teal-700/60"
                        />
                      )}

                    </div>

                    {/* Main information */}
                    <div className="flex-1 min-w-0">

                      <div className="flex items-start justify-between gap-2">

                        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">
                          {product.name}
                        </h3>

                        <ChevronRight
                          size={18}
                          className="shrink-0 text-gray-400 group-hover:text-teal-700 transition"
                        />

                      </div>
                      <div className="mt-2 flex justify-between">
                        <p className="text-sm font-bold text-teal-800 mt-2">
                          {formatNPR(product.sellingPrice)}
                        </p>

                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold rounded-full px-2.5 py-1 ${product.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${product.isActive
                            ? "bg-emerald-500"
                            : "bg-gray-400"
                            }`} />

                          {product.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>

                      </div>

                    </div>

                  </div>

                </button>

              ))}

            </div>

            {/* Load more */}
            {hasNextPage && (

              <div className="flex flex-col items-center pt-4">

                <button
                  onClick={() =>
                    fetchProducts(page + 1, true)
                  }
                  disabled={loadingMore}
                  className="flex items-center rounded-2xl justify-center gap-2 w-full sm:w-auto min-w-52  border border-teal-100 bg-white px-6 py-3.5 font-semibold text-teal-800 hover:bg-teal-50 active:scale-[0.98] transition disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <Loader2
                        size={19}
                        className="animate-spin"
                      />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load more products
                      <ChevronRight size={18} />
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-400 mt-3">
                  Showing {products.length} of {total} products
                </p>

              </div>

            )}

          </>

        )}

      </section>

      {/* =====================================================
                FILTER TOP DRAWER
            ====================================================== */}

      <div
        className={`fixed inset-0 z-[100] transition ${filterOpen
          ? "visible"
          : "invisible pointer-events-none"
          }`}
      >

        <button
          aria-label="Close filters"
          onClick={() => setFilterOpen(false)}
          className={`absolute inset-0 bg-gray-900/30 transition-opacity duration-300 ${filterOpen ? "opacity-100" : "opacity-0"
            }`}
        />

        <section
          className={`absolute top-0 left-0 right-0 bg-white rounded-b-3xl shadow-xl transition-transform duration-300 ease-out ${filterOpen
            ? "translate-y-0"
            : "-translate-y-full"
            }`}
        >

          <div className="max-w-2xl mx-auto">

            <div className="flex items-center justify-between p-5 border-b border-gray-100">

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                  <Filter
                    size={20}
                    className="text-teal-700"
                  />
                </div>

                <div>
                  <h2 className="font-bold text-lg text-gray-900">
                    Search & filters
                  </h2>
                  <p className="text-xs text-gray-500">
                    Find the products you need
                  </p>
                </div>
              </div>

              <button
                onClick={() => setFilterOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={22} />
              </button>

            </div>

            <div className="p-5 space-y-6">

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Product name
                </label>

                <div className="relative">

                  <Search
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    value={filterSearch}
                    onChange={(e) =>
                      setFilterSearch(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        applyFilters();
                      }
                    }}
                    placeholder="Enter product name..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 py-3.5 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />

                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Product status
                </label>

                <div className="grid grid-cols-3 gap-2">

                  {(
                    [
                      ["all", "All"],
                      ["active", "Active"],
                      ["inactive", "Inactive"],
                    ] as const
                  ).map(([value, label]) => (

                    <button
                      key={value}
                      onClick={() =>
                        setFilterStatus(value)
                      }
                      className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${filterStatus === value
                        ? "border-teal-700 bg-teal-50 text-teal-800"
                        : "border-gray-200 text-gray-600 bg-white"
                        }`}
                    >
                      {label}
                    </button>

                  ))}

                </div>
              </div>

            </div>

            <div className="p-5 pt-0 flex gap-3">

              <button
                onClick={resetFilters}
                className="flex-1 rounded-xl border border-gray-200 py-3.5 font-semibold text-gray-700"
              >
                Reset
              </button>

              <button
                onClick={applyFilters}
                className="flex-[1.5] rounded-xl bg-teal-700 py-3.5 text-white font-bold hover:bg-teal-800 transition"
              >
                Apply filters
              </button>

            </div>

            <div className="h-[env(safe-area-inset-bottom)]" />

          </div>

        </section>

      </div>

      {/* =====================================================
                PRODUCT DETAILS BOTTOM DRAWER
            ====================================================== */}

      <div
        className={`fixed inset-0 z-[110] transition ${detailsOpen
          ? "opacity-100 translate-y-0"
          : "pointer-events-none opacity-0 translate-y-[100%]"
          }`}
      >

        <section
          className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-[28px] shadow-2xl max-h-[88dvh] overflow-hidden flex flex-col transition-transform duration-300 ease-out `}
        >

          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 shrink-0" />

          {selected && (

            <>

              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">

                <h2 className="text-lg font-bold text-gray-900 mt-1">
                  Product details
                </h2>

                <button
                  onClick={() => setDetailsOpen(false)}
                  className="p-2 rounded-full bg-gray-100 text-gray-600"
                  aria-label="Close"
                >
                  <X size={21} />
                </button>

              </div>

              <div className="flex-1 overflow-y-auto p-5 pb-8">

                <div className="flex items-center gap-4">

                  <div className="w-22 h-22 rounded-2xl bg-[#F0F5F3] overflow-hidden flex items-center justify-center shrink-0">

                    {selected.imageUrl ? (
                      <img
                        src={selected.imageUrl}
                        alt={selected.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package
                        size={35}
                        className="text-teal-700/60"
                      />
                    )}

                  </div>

                  <div className="min-w-0">

                    <h3 className="text-l font-bold text-gray-900 break-words">
                      {selected.name}
                    </h3>

                    <span className={`inline-flex items-center gap-1.5 mt-1 text-xs font-semibold rounded-full px-3 py-1.5 ${selected.isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-gray-100 text-gray-500"
                      }`}>
                      <CheckCircle2 size={14} />
                      {selected.isActive
                        ? "Active product"
                        : "Inactive product"}
                    </span>

                  </div>

                </div>

                <div className="grid grid-cols-2 gap-3 mt-7">

                  <div className="rounded-2xl bg-teal-50 p-4">

                    <p className="text-xs font-medium text-teal-700">
                      Selling price
                    </p>

                    <p className="text-sm font-bold text-teal-900 mt-2">
                      {formatNPR(selected.sellingPrice)}
                    </p>

                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4">

                    <p className="text-xs font-medium text-gray-500">
                      Cost price
                    </p>

                    <p className="text-sm font-bold text-gray-900 mt-2">
                      {selected.costPrice
                        ? formatNPR(selected.costPrice)
                        : "—"}
                    </p>

                  </div>

                </div>

                <div className="mt-6 rounded-2xl border border-gray-100 p-4">

                  <h4 className="font-bold text-gray-900 mb-4">
                    Product information
                  </h4>

                  <div className="flex justify-between gap-3 text-sm py-2">
                    <span className="text-gray-500">
                      Product name
                    </span>
                    <span className="font-semibold text-gray-800 text-right break-all">
                      {selected.name}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 text-sm py-2 border-t border-gray-100">
                    <span className="text-gray-500">
                      Selling price
                    </span>
                    <span className="font-semibold text-gray-800">
                      {formatNPR(selected.sellingPrice)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 text-sm py-2 border-t border-gray-100">
                    <span className="text-gray-500">
                      Cost price
                    </span>
                    <span className="font-semibold text-gray-800">
                      {selected.costPrice
                        ? formatNPR(selected.costPrice)
                        : "Not specified"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 text-sm py-2 border-t border-gray-100">
                    <span className="text-gray-500">
                      Status
                    </span>
                    <span className="font-semibold text-gray-800">
                      {selected.isActive
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>

                </div>

              </div>

              {/* Fixed detail actions */}


              <div className="border-t border-gray-100 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">

                <div className="grid grid-cols-5 gap-2.5">

                  {/* Edit: 3 grid columns */}
                  <button
                    onClick={() => openEdit(selected)}
                    className="col-span-3 flex items-center justify-center gap-2 rounded-xl bg-teal-700 text-white font-bold py-3.5 hover:bg-teal-800 active:scale-[0.98] transition"
                  >
                    <Pencil size={18} />
                    Edit product
                  </button>

                  {/* Deactivate / Reactivate: 1 grid column */}
                  {selected.isActive ? (
                    <button
                      disabled={actionLoading === selected.id}
                      onClick={() =>
                        changeProductStatus(selected, "deactivate")
                      }
                      aria-label="Deactivate product"
                      title="Deactivate product"
                      className="col-span-1 flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition disabled:opacity-50"
                    >
                      {actionLoading === selected.id ? (
                        <Loader2 size={19} className="animate-spin" />
                      ) : (
                        <Power size={19} />
                      )}
                    </button>
                  ) : (
                    <button
                      disabled={actionLoading === selected.id}
                      onClick={() =>
                        changeProductStatus(selected, "reactivate")
                      }
                      aria-label="Reactivate product"
                      title="Reactivate product"
                      className="col-span-1 flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50"
                    >
                      {actionLoading === selected.id ? (
                        <Loader2 size={19} className="animate-spin" />
                      ) : (
                        <RotateCcw size={19} />
                      )}
                    </button>
                  )}

                  {/* Permanent delete: 1 grid column */}
                  <button
                    disabled={deleteActionLoading === selected.id}
                    onClick={() => hardDeleteProduct(selected)}
                    aria-label="Permanently delete product"
                    title="Permanently delete product"
                    className="col-span-1 flex items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50"
                  >
                    {deleteActionLoading === selected.id ? (
                      <Loader2 size={19} className="animate-spin" />
                    ) : (
                      <Trash2 size={19} />
                    )}
                  </button>

                </div>

              </div>
            </>

          )}

        </section>

      </div>

      {/* =====================================================
    SIMPLE ADD PRODUCT BOTTOM DRAWER
====================================================== */}

      <section
        className="
          sm:hidden
          fixed
          z-[80]
          bottom-0
          left-0
          right-0
          w-full
          bg-white
          rounded-t-[28px]
          shadow-[0_-8px_30px_rgba(0,0,0,0.08)]
          flex
          flex-col
          pb-[env(safe-area-inset-bottom)]
        "
      >
        {/* Drawer handle */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Products
          </h1>

          <button
            onClick={openCreate}
            className="
              flex shrink-0 items-center justify-center gap-2
              rounded-xl bg-teal-700 hover:bg-teal-800
              active:scale-[0.98]
              px-4 py-3
              text-white font-semibold shadow-sm transition
            "
          >
            <Plus size={19} />
            <span>Add</span>
          </button>
        </div>
      </section>

      {/* =====================================================
                CREATE / EDIT BOTTOM DRAWER
            ====================================================== */}

      <div
        className={`fixed inset-0 z-[120] transition duration-300 ease-in-out ${formOpen
          ? " translate-y-0"
          : " pointer-events-none  translate-y-[100%]"
          }`}
      >
        <section
          className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-[28px] shadow-2xl max-h-[94dvh] flex flex-col transition-transform `}
        >

          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 shrink-0" />

          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">

            <div>

              <h2 className="text-xl font-bold text-gray-900 mt-1">
                {editing
                  ? "Edit product"
                  : "Add new product"}
              </h2> 
            </div>

            <button
              onClick={() => setFormOpen(false)}
              className="p-2 rounded-full bg-gray-100 text-gray-600"
              aria-label="Close"
            >
              <X size={21} />
            </button>

          </div>

          <div className="flex-1 overflow-y-auto px-5 pt-5">

            <ProductForm
              key={editing?.id ?? "new-product"}
              isOpen={formOpen}
              initialProduct={editing ?? undefined}
              onSuccess={closeForm}
              onCancel={() => setFormOpen(false)}
            />

          </div>

        </section>

      </div>

    </main>
  );
}
