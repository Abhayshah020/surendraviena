
"use client";

import {
  CalendarDays,
  ChevronRight,
  ChevronUp,
  Download,
  Eye,
  Filter,
  Loader2,
  Receipt,
  RefreshCw,
  Search,
  SlidersHorizontal,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import NepaliDateInput from "../../../../components/nepali-date-input";
import { formatBSDateTimeShort, getTodayAD } from "../../../../lib/date/nepali-date";
import { formatNPR } from "../../../../lib/utils/currency";
import { useCalendarPreference } from "../../../../hooks/use-calendar-preference";

type ProductOption = {
  id: string;
  name: string;
};

type AnalyticsRange =
  | "1week"
  | "1month"
  | "3months"
  | "6months"
  | "12months"
  | "all";

interface SalesAnalytics {
  range: AnalyticsRange;
  summary: {
    totalSales: number;
    totalRevenue: number;
    totalUnitsSold: number;
  };
  chart: {
    period: string;
    salesCount: number;
    revenue: number;
    unitsSold: number;
  }[];
}

interface Sale {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string | null;
  soldAt: string;
  subtotal: string;
  discountAmount: string;
  totalAmount: string;
  status: "COMPLETED" | "VOID";
}

type SalesExportFilters = {
  search: string;
  from: string;
  to: string;
  status: string;
};

export default function SalesHistoryPage() {
  const { useBS, toggleCalendar } = useCalendarPreference();
  const [items, setItems] = useState<Sale[]>([]);

  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("ALL");

  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);

  // Applied sales-list filter
  const [productId, setProductId] = useState("ALL");

  // Temporary sales-list filter selection
  const [filterProductId, setFilterProductId] = useState("ALL");

  // Independent analytics product selection
  const [analyticsProductId, setAnalyticsProductId] = useState("ALL");

  // Temporary filter values for the mobile drawer
  const [filterSearch, setFilterSearch] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [filterOpen, setFilterOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [exportingPDF, setExportingPDF] = useState(false);

  const [analyticsRange, setAnalyticsRange] =
    useState<AnalyticsRange>("1week");

  const [analytics, setAnalytics] =
    useState<SalesAnalytics | null>(null);

  const [analyticsLoading, setAnalyticsLoading] =
    useState(false);

  const [analyticsOpen, setAnalyticsOpen] = useState(false);


  const loadProductOptions = async () => {
    try {
      const response = await fetch("/api/admin/products", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load products.");
      }

      const list = Array.isArray(data)
        ? data
        : data.products ?? data.items ?? [];

      setProductOptions(
        list.map((product: ProductOption) => ({
          id: product.id,
          name: product.name,
        }))
      );
    } catch (error) {
      console.error("Failed to load product options:", error);
    }
  };

  useEffect(() => {
    loadProductOptions();
  }, []);

  const fetchSalesAnalytics = async (
    range: AnalyticsRange = analyticsRange,
    selectedProductId: string = analyticsProductId
  ) => {
    try {
      setAnalyticsLoading(true);

      const params = new URLSearchParams({
        range,
      });

      if (selectedProductId !== "ALL") {
        params.set("productId", selectedProductId);
      }

      const response = await fetch(
        `/api/admin/sales/analytics?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to fetch sales analytics."
        );
      }

      setAnalytics(data);
    } catch (error) {
      console.error("Sales analytics error:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  };


  const changeAnalyticsProduct = (selectedProductId: string) => {
    setAnalyticsProductId(selectedProductId);

    fetchSalesAnalytics(analyticsRange, selectedProductId);
  };


  useEffect(() => {
    fetchSalesAnalytics("1week");
  }, []);

  const changeAnalyticsRange = (range: AnalyticsRange) => {
    setAnalyticsRange(range);
    fetchSalesAnalytics(range);
  };

  const activeFilters = useMemo(() => {
    return [
      search.trim() !== "",
      from !== "",
      to !== "",
      status !== "ALL",
    ].filter(Boolean).length;
  }, [search, from, to, status]);


  const loadSales = useCallback(
    async (page = 1, append = false, limit = "10") => {
      try {
        setLoading(true);

        const params = new URLSearchParams({
          page: String(page),
          limit,
          search,
        });

        if (from) params.set("from", from);
        if (to) params.set("to", to);

        if (status !== "ALL") {
          params.set("status", status);
        }

        if (productId !== "ALL") {
          params.set("productId", productId);
        }

        const response = await fetch(
          `/api/admin/sales?${params.toString()}`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to fetch sales.");
        }

        if (append) {
          setItems((previous) => [...previous, ...data.sales]);
        } else {
          setItems(data.sales);
        }

        setPage(data.pagination.page);
        setTotalPages(data.pagination.totalPages);
      } catch (error) {
        console.error("Failed to load sales:", error);
      } finally {
        setLoading(false);
      }
    },
    [search, from, to, status, productId]
  );



  const fetchAllSales = async (filters: SalesExportFilters) => {
    const limit = 100;
    let allSales: typeof items = [];

    const params = new URLSearchParams({
      page: "1",
      limit: String(limit),
      search: filters.search,
    });

    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);

    if (filters.status !== "ALL") {
      params.set("status", filters.status);
    }

    // Fetch first page
    const firstResponse = await fetch(`/api/admin/sales?${params}`);

    const firstData = await firstResponse.json();

    if (!firstResponse.ok) {
      throw new Error(firstData.message || "Unable to fetch sales");
    }

    allSales = [...firstData.sales];

    const totalPages = Number(firstData.pagination?.totalPages || 1);

    // Fetch remaining pages
    for (let page = 2; page <= totalPages; page++) {
      params.set("page", String(page));

      const response = await fetch(`/api/admin/sales?${params}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Unable to fetch page ${page}`);
      }

      allSales.push(...data.sales);
    }

    return allSales;
  };

  const generateSalesPDF = async (filters: SalesExportFilters) => {
    try {
      setExportingPDF(true);

      const sales = await fetchAllSales(filters);

      if (!sales.length) {
        alert("No sales found for the selected filters.");
        return;
      }

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 12;
      const contentWidth = pageWidth - margin * 2;

      const completedSales = sales.filter(
        (sale) => sale.status === "COMPLETED"
      );

      const voidedSales = sales.filter(
        (sale) => sale.status === "VOID"
      );

      const totalSubtotal = sales.reduce(
        (sum, sale) => sum + Number(sale.subtotal || 0),
        0
      );

      const totalDiscount = sales.reduce(
        (sum, sale) => sum + Number(sale.discountAmount || 0),
        0
      );

      const totalAmount = sales.reduce(
        (sum, sale) => sum + Number(sale.totalAmount || 0),
        0
      );

      // HEADER
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(25, 45, 55);

      doc.text("SALES REPORT", margin, 17);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(110);

      doc.text(
        `Generated: ${new Date().toLocaleString("en-GB")}`,
        margin,
        23
      );

      const filterDescription = filters.from || filters.to
        ? `${filters.from || "Beginning"} to ${filters.to || "Present"}`
        : "All dates";

      doc.text(`Date range: ${filterDescription}`, margin, 28);

      doc.text(
        `Status: ${filters.status === "ALL" ? "All transactions" : filters.status}`,
        margin,
        33
      );

      if (filters.search.trim()) {
        doc.text(
          `Search: ${filters.search.trim()}`,
          margin,
          38
        );
      }

      // SUMMARY CARDS - 3 COLUMNS, 2 ROWS
      const summaryY = filters.search.trim() ? 44 : 39;
      const cardGap = 3;
      const cardWidth = (contentWidth - cardGap * 2) / 3;
      const cardHeight = 17;

      const summaryItems = [
        {
          label: "Total Transactions",
          value: String(sales.length),
        },
        {
          label: "Completed",
          value: String(completedSales.length),
        },
        {
          label: "Voided",
          value: String(voidedSales.length),
        },
        {
          label: "Subtotal",
          value: formatNPR(totalSubtotal),
        },
        {
          label: "Discount",
          value: formatNPR(totalDiscount),
        },
        {
          label: "Total Amount",
          value: formatNPR(totalAmount),
        },
      ];

      summaryItems.forEach((item, index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);

        const x = margin + col * (cardWidth + cardGap);
        const y = summaryY + row * (cardHeight + 3);

        doc.setDrawColor(225, 230, 235);
        doc.setFillColor(248, 250, 252);

        doc.roundedRect(
          x,
          y,
          cardWidth,
          cardHeight,
          2,
          2,
          "FD"
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(110);

        doc.text(item.label, x + 3, y + 6);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(30);

        doc.text(
          item.value,
          x + 3,
          y + 12
        );
      });

      // TABLE
      autoTable(doc, {
        startY: summaryY + cardHeight * 2 + 9,

        margin: {
          left: margin,
          right: margin,
          bottom: 16,
        },

        head: [[
          "S.N",
          "Invoice / Customer",
          "Date",
          "Subtotal",
          "Discount",
          "Total",
          "Status",
        ]],

        body: sales.map((sale, index) => [
          index + 1,
          `${sale.invoiceNumber || "-"}\n${sale.customerName || "-"}\n${sale.customerPhone || "No phone"}`,
          useBS ? formatBSDateTimeShort(sale.soldAt) : formatDate(sale.soldAt),
          formatNPR(sale.subtotal),
          formatNPR(sale.discountAmount),
          formatNPR(sale.totalAmount),
          sale.status,
        ]),

        theme: "grid",

        styles: {
          font: "helvetica",
          fontSize: 7,
          cellPadding: 2,
          overflow: "linebreak",
          valign: "middle",
          textColor: [45, 55, 65],
          lineColor: [225, 230, 235],
          lineWidth: 0.15,
        },

        headStyles: {
          fillColor: [15, 118, 110],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 7,
          halign: "center",
        },

        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },

        columnStyles: {
          0: {
            cellWidth: 9,
            halign: "center",
          },
          1: {
            cellWidth: 43,
          },
          2: {
            cellWidth: 22,
            halign: "center",
          },
          3: {
            cellWidth: 28,
            halign: "right",
          },
          4: {
            cellWidth: 25,
            halign: "right",
          },
          5: {
            cellWidth: 28,
            halign: "right",
            fontStyle: "bold",
          },
          6: {
            cellWidth: 22,
            halign: "center",
          },
        },

        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 6) {
            const status = String(data.cell.raw);

            if (status === "COMPLETED") {
              data.cell.styles.textColor = [21, 128, 61];
            } else if (status === "VOID") {
              data.cell.styles.textColor = [185, 28, 28];
            }
          }
        },

        didDrawPage: (data) => {
          const currentPage = data.pageNumber;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(130);

          doc.text(
            "Sales Report",
            margin,
            pageHeight - 8
          );

          doc.text(
            `Page ${currentPage}`,
            pageWidth - margin,
            pageHeight - 8,
            { align: "right" }
          );
        },
      });

      // SAVE PDF
      const filename =
        `sales-report-${filters.from || "all"}-${filters.to || "all"}.pdf`;

      doc.save(filename);

    } catch (error) {
      console.error("PDF generation failed:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to generate sales PDF."
      );

    } finally {
      setExportingPDF(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { loadSales(1, false) }, 250);
    return () => clearTimeout(timer);
  }, [loadSales]);

  const openFilters = () => {
    setFilterSearch(search);
    setFilterFrom(from);
    setFilterTo(to);
    setFilterStatus(status);
    setFilterOpen(true);
  };


  const applyFilters = () => {
    setSearch(filterSearch);
    setFrom(filterFrom);
    setTo(filterTo);
    setStatus(filterStatus);
    setProductId(filterProductId);

    setPage(1);
    setFilterOpen(false);
  };



  const clearFilters = () => {
    setFilterSearch("");
    setFilterFrom("");
    setFilterTo("");
    setFilterStatus("ALL");
    setFilterProductId("ALL");

    setSearch("");
    setFrom("");
    setTo("");
    setStatus("ALL");
    setProductId("ALL");

    setPage(1);
    setFilterOpen(false);
  };


  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-NP", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kathmandu",
    });
  };

  return (
    <main className="min-h-[calc(100dvh-70px)] bg-[#F7F9F8] p-3 sm:p-6 lg:p-8 pb-28 space-y-5 sm:space-y-6">

      {/* MOBILE SEARCH + FILTER */}
      <div className="sm:hidden flex gap-2">

        <button
          onClick={openFilters}
          className="relative flex-1 flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-3.5 py-3 text-left shadow-sm hover:border-teal-300 transition min-w-0"
        >
          <Search size={19} className="text-gray-400 shrink-0" />

          <span className="text-sm text-gray-500 truncate">
            {search || "Search and filter sales"}
          </span>

          <SlidersHorizontal
            size={19}
            className="ml-auto text-teal-700 shrink-0"
          />

          {activeFilters > 0 && (
            <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-teal-700 text-white text-xs font-bold">
              {activeFilters}
            </span>
          )}
        </button>

        <button
          onClick={() => loadSales(1, false)}
          disabled={loading}
          aria-label="Refresh sales"
          className="flex items-center justify-center w-12 shrink-0 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            size={19}
            className={loading ? "animate-spin" : ""}
          />
        </button>
      </div>

      {/* DESKTOP FILTERS */}
      <section className="hidden sm:block bg-white border border-gray-200 rounded-2xl p-4 space-y-4 shadow-sm">

        <div className="relative">
          <Search
            size={19}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search invoice, customer or phone..."
            className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              From date
            </label>

            <NepaliDateInput
              value={from}
              onChange={(value) => {
                setFrom(value);
                setPage(1);
              }}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              To date
            </label>

            <NepaliDateInput
              value={to}
              min={from || getTodayAD()}
              onChange={(value) => {
                setTo(value);
                setPage(1);
              }}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Transaction status
            </label>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full border border-gray-300 rounded-xl p-3 bg-white"
            >
              <option value="ALL">All transactions</option>
              <option value="COMPLETED">Completed</option>
              <option value="VOID">Voided</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
              Product
            </label>

            <select
              value={filterProductId}
              onChange={(e) => setFilterProductId(e.target.value)}
              className="
      w-full border border-gray-200
      rounded-xl p-3 text-sm bg-white
      outline-none focus:ring-2 focus:ring-teal-500
    "
            >
              <option value="ALL">All products</option>

              {productOptions.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>

            <p className="text-[11px] text-gray-400 mt-1">
              Show transactions containing a specific product.
            </p>
          </div>
        </div>



        <div className="flex justify-end pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() =>
              generateSalesPDF({
                search,
                from,
                to,
                status,
              })
            }
            disabled={exportingPDF}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Download size={17} />

            {exportingPDF ? "Generating PDF..." : "Download Sales PDF"}
          </button>
        </div>
      </section>

      {/* MOBILE FILTER DRAWER */}
      <div className={`fixed top-0 left-0 right-0 h-dvh z-[100] sm:hidden transition duration-300 ease-in-out ${filterOpen ? "translate-y-0" : "translate-y-[-100%]"}`}>

        {/* Drawer */}
        <div className="absolute top-0 left-0 right-0 bg-white rounded-b-3xl shadow-2xl animate-in slide-in-from-top duration-300">

          <div className="px-4 pt-5 pb-4">

            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <Filter size={19} className="text-teal-700" />
                  <h2 className="text-lg font-bold text-gray-900">
                    Filter sales
                  </h2>
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  Find transactions using the filters below.
                </p>
              </div>

              <button
                onClick={() => setFilterOpen(false)}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-4">

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                  Search
                </label>

                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    autoFocus
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    placeholder="Invoice, customer or phone..."
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                    From date
                  </label>

                  <NepaliDateInput
                    value={filterFrom}
                    onChange={setFilterFrom}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                    To date
                  </label>

                  <NepaliDateInput
                    value={filterTo}
                    min={filterFrom || getTodayAD()}
                    onChange={setFilterTo}
                  />
                </div>

              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                  Transaction status
                </label>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-white"
                >
                  <option value="ALL">All transactions</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="VOID">Voided</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                  Product
                </label>

                <select
                  value={filterProductId}
                  onChange={(e) => setFilterProductId(e.target.value)}
                  className="
      w-full border border-gray-200
      rounded-xl p-3 text-sm bg-white
      outline-none focus:ring-2 focus:ring-teal-500
    "
                >
                  <option value="ALL">All products</option>

                  {productOptions.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>

                <p className="text-[11px] text-gray-400 mt-1">
                  Show transactions containing a specific product.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                generateSalesPDF({
                  search: filterSearch,
                  from: filterFrom,
                  to: filterTo,
                  status: filterStatus,
                })
              }
              disabled={exportingPDF}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-blue-200 bg-blue-500 text-white font-semibold text-sm disabled:opacity-50"
            >
              <Download size={18} />

              {exportingPDF ? "Generating PDF..." : "Download Sales PDF"}
            </button>

            <div className="flex gap-3 mt-2">

              <button
                onClick={clearFilters}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm"
              >
                Reset
              </button>

              <button
                onClick={applyFilters}
                className="flex-[2] py-3 rounded-xl bg-teal-700 text-white font-semibold text-sm shadow-sm hover:bg-teal-800"
              >
                Apply filters
              </button>

            </div>

          </div>

          {/* Drawer handle */}
          <div className="flex justify-center pb-2">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>

        </div>
      </div>

      {/* SALES RESULTS */}
      <section className="bg-white border border-gray-200 sm:rounded-2xl overflow-hidden shadow-sm">

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-teal-700" size={27} />
            <p className="text-sm text-gray-500">Loading sales...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="border border-gray-200 bg-white py-16 px-10 text-center">

            <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-50 flex items-center justify-center">
              <Receipt
                size={30}
                className="text-teal-700"
              />
            </div>

            <h3 className="font-bold text-gray-900 mt-5">
              No sales found
            </h3>

            <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
              Try changing your search filters or add a new pharmacy product.
            </p>

            <button
              onClick={clearFilters}
              className="mt-5 rounded-xl bg-teal-700 px-5 py-3 text-white font-semibold text-sm"
            >
              Clear filters
            </button>

          </div>
        ) : (
          <>
            {/* MOBILE CARD VIEW */}
            <div className="sm:hidden divide-y divide-gray-100">

              {items.map((sale) => (
                <Link
                  key={sale.id}
                  href={`/admin/sales/${sale.id}`}
                  className="block p-3 active:bg-gray-50 transition"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0 flex-1">


                      <div className="flex items-center gap-1.5 text-gray-900">
                        <UserRound
                          size={14}
                          className="text-gray-400 shrink-0"
                        />

                        <span className="text-sm font-semibold truncate">
                          {sale.customerName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 text-gray-500"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleCalendar();
                        }}
                      >
                        <CalendarDays size={13} className="shrink-0" />
                        <span className="text-xs">
                          {useBS ? formatBSDateTimeShort(sale.soldAt) : formatDate(sale.soldAt)}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${sale.status === "COMPLETED"
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                            }`}
                        >
                          {sale.status === "COMPLETED" ? "Completed" : "Voided"}
                        </span>
                      </div>

                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end">
                      <span className="text-sm font-bold text-gray-900 mt-1">
                        {formatNPR(sale.totalAmount)}
                      </span>

                      <ChevronRight
                        size={17}
                        className="text-gray-400 mt-1"
                      />
                    </div>

                  </div>

                </Link>
              ))}

            </div>

            {/* TABLET + DESKTOP TABLE VIEW */}
            <div className="hidden sm:block overflow-x-auto">

              <table className="w-full text-sm text-left">

                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-4">S.N</th>
                    <th className="p-4">Invoice</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Subtotal</th>
                    <th className="p-4">Discount</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">View</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {items.map((sale, index) => (
                    <tr key={sale.id} className="hover:bg-gray-50">

                      <td className="p-4 font-semibold whitespace-nowrap">
                        {(page - 1) * 10 + index + 1}
                      </td>
                      <td className="p-4 font-semibold whitespace-nowrap">
                        {sale.invoiceNumber}
                      </td>

                      <td className="p-4">
                        <div className="font-medium">
                          {sale.customerName}
                        </div>

                        <div className="text-xs text-gray-500">
                          {sale.customerPhone || "No phone"}
                        </div>
                      </td>

                      <td className="p-4 whitespace-nowrap"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleCalendar()
                        }}
                      >
                        {useBS ? formatBSDateTimeShort(sale.soldAt) : formatDate(sale.soldAt)}
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        {formatNPR(sale.subtotal)}
                      </td>

                      <td className="p-4 text-red-600 whitespace-nowrap">
                        {formatNPR(sale.discountAmount)}
                      </td>

                      <td className="p-4 font-bold whitespace-nowrap">
                        {formatNPR(sale.totalAmount)}
                      </td>

                      <td className="p-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${sale.status === "COMPLETED"
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                            }`}
                        >
                          {sale.status}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <Link
                          href={`/admin/sales/${sale.id}`}
                          className="inline-flex p-2 rounded-lg text-teal-700 hover:bg-teal-50"
                          aria-label="View invoice"
                        >
                          <Eye size={19} />
                        </Link>
                      </td>

                    </tr>
                  ))}

                </tbody>
              </table>

            </div>

            {/* MOBILE: LOAD MORE */}
            {page < totalPages && (
              <div className="sm:hidden flex flex-col items-center p-4 border-t border-gray-100">

                <button
                  onClick={() => loadSales(page + 1, true)}
                  disabled={loading}
                  className="flex rounded-2xl items-center justify-center gap-2 w-full border border-teal-100 bg-white px-6 py-3.5 rounded-xl font-semibold text-teal-800 hover:bg-teal-50 active:scale-[0.98] transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={19} className="animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load more sales
                      <ChevronRight size={18} />
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-400 mt-3">
                  Page {page} of {totalPages}
                </p>

              </div>
            )}

            {/* TABLET + DESKTOP: PREVIOUS / NEXT */}
            <div className="hidden sm:flex p-4 border-t border-gray-100 justify-between items-center gap-3">

              <span className="text-sm text-gray-500 whitespace-nowrap">
                Page {page} of {Math.max(1, totalPages)}
              </span>

              <div className="flex gap-2">

                <button
                  disabled={page <= 1 || loading}
                  onClick={() => loadSales(page - 1, false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-50"
                >
                  Previous
                </button>

                <button
                  disabled={page >= totalPages || loading}
                  onClick={() => loadSales(page + 1, false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-50"
                >
                  Next
                </button>

              </div>

            </div>
          </>
        )}

      </section>

      {/* SALES ANALYTICS BOTTOM DRAWER */}
      <div className="fixed bottom-0 left-0 right-0 z-[90]">

        <section
          className={`relative bg-white border-t border-gray-200 shadow-[0_-8px_30px_rgba(0,0,0,0.10)] rounded-t-2xl overflow-hidden transition-[height] duration-300 ease-in-out ${analyticsOpen ? "h-[78dvh]" : "h-[82px]"
            }`}
        >
          {/* Drawer handle / summary */}
          <button
            type="button"
            onClick={() => setAnalyticsOpen((previous) => !previous)}
            className="w-full h-[82px] px-4 flex items-center gap-3 text-left"
          >
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-gray-300" />

            <div className="flex-1 min-w-0 pt-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Total revenue · {analyticsRange === "1week" ? "Past 1 week" : analyticsRange}
              </p>

              <p className="text-lg font-bold text-gray-900 truncate mt-0.5">
                {analyticsLoading
                  ? "Loading..."
                  : formatNPR(analytics?.summary.totalRevenue ?? 0)}
              </p>
            </div>

            <div className="text-right shrink-0 pt-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Completed sales
              </p>

              <p className="text-lg font-bold text-teal-700 mt-0.5">
                {analyticsLoading
                  ? "..."
                  : analytics?.summary.totalSales ?? 0}
              </p>
            </div>

            <div
              className={`w-9 h-9 shrink-0 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mt-2 transition-transform duration-300 ${analyticsOpen ? "rotate-180" : ""
                }`}
            >
              <ChevronUp size={20} />
            </div>
          </button>

          {/* Expanded analytics content */}
          <div
            className={`h-[calc(100%-82px)] overflow-y-auto overscroll-contain px-4 pb-6 transition-opacity duration-200 ${analyticsOpen ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
          >
            <div className="flex items-center justify-between gap-3 py-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">
                  Sales overview
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Revenue and product sales performance
                </p>
              </div>

              <button
                type="button"
                onClick={() => fetchSalesAnalytics()}
                disabled={analyticsLoading}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 disabled:opacity-50"
                aria-label="Refresh analytics"
              >
                <RefreshCw
                  size={17}
                  className={analyticsLoading ? "animate-spin" : ""}
                />
              </button>
            </div>


            {/* Analytics product selector */}
            <div className="py-3 border-b border-gray-100">
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                Analytics for
              </label>

              <select
                value={analyticsProductId}
                onChange={(e) => changeAnalyticsProduct(e.target.value)}
                disabled={analyticsLoading}
                className="
      w-full border border-gray-200
      rounded-xl px-3 py-2.5
      text-sm font-medium text-gray-800
      bg-white outline-none
      focus:ring-2 focus:ring-teal-500
      disabled:opacity-60
    "
              >
                <option value="ALL">All products · Overall sales</option>

                {productOptions.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>

              <p className="text-[11px] text-gray-400 mt-1.5">
                {analyticsProductId === "ALL"
                  ? "Showing overall completed sales performance."
                  : "Showing revenue and units for the selected product only."}
              </p>
            </div>


            {/* Date range selector */}
            <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
              {(
                [
                  ["1week", "1 Week"],
                  ["1month", "1 Month"],
                  ["3months", "3 Months"],
                  ["6months", "6 Months"],
                  ["12months", "12 Months"],
                  ["all", "All time"],
                ] as [AnalyticsRange, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => changeAnalyticsRange(value)}
                  className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${analyticsRange === value
                    ? "bg-teal-700 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="rounded-xl bg-teal-50 p-3">
                <p className="text-[10px] text-teal-700 font-medium">
                  Revenue
                </p>
                <p className="text-sm sm:text-lg font-bold text-teal-900 mt-1 break-words">
                  {formatNPR(analytics?.summary.totalRevenue ?? 0)}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-3">
                <p className="text-[10px] text-blue-700 font-medium">
                  Transactions
                </p>
                <p className="text-lg font-bold text-blue-900 mt-1">
                  {analytics?.summary.totalSales ?? 0}
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 p-3">
                <p className="text-[10px] text-amber-700 font-medium">
                  Units sold
                </p>
                <p className="text-lg font-bold text-amber-900 mt-1">
                  {analytics?.summary.totalUnitsSold ?? 0}
                </p>
              </div>
            </div>

            {analyticsLoading && !analytics ? (
              <div className="py-16 flex flex-col items-center gap-3">
                <Loader2
                  size={26}
                  className="animate-spin text-teal-700"
                />
                <p className="text-sm text-gray-500">
                  Loading sales report...
                </p>
              </div>
            ) : analytics && analytics.chart.length > 0 ? (
              <div className="space-y-4 mt-4">

                {/* Revenue chart */}
                <div className="rounded-2xl border border-gray-200 p-3 sm:p-4">
                  <div className="flex justify-between items-start gap-3 mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">
                        {analyticsProductId === "ALL"
                          ? "Revenue trend"
                          : "Product revenue trend"}
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Revenue by {analyticsRange === "1week" || analyticsRange === "1month"
                          ? "day"
                          : analyticsRange === "3months"
                            ? "week"
                            : "month"}
                      </p>
                    </div>

                    <p className="font-bold text-teal-700 text-sm">
                      {formatNPR(analytics.summary.totalRevenue)}
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <div
                      className="flex items-end gap-2 min-w-max h-40 px-1"
                    >
                      {analytics.chart.map((point, index) => {
                        const maxRevenue = Math.max(
                          ...analytics.chart.map((item) => item.revenue),
                          1
                        );

                        const height =
                          point.revenue > 0
                            ? Math.max(
                              5,
                              (point.revenue / maxRevenue) * 100
                            )
                            : 0;

                        return (
                          <div
                            key={`${point.period}-${index}`}
                            className="w-9 h-full flex flex-col justify-end items-center gap-2"
                          >
                            <div className="w-full flex-1 flex items-end justify-center">
                              <div
                                title={formatNPR(point.revenue)}
                                className="w-5 rounded-t-md bg-teal-600 transition-all duration-300"
                                style={{ height: `${height}%` }}
                              />
                            </div>

                            <span className="text-[9px] text-gray-400 whitespace-nowrap">
                              {new Date(point.period).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                }
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Product sales chart */}
                <div className="rounded-2xl border border-gray-200 p-3 sm:p-4">
                  <div className="flex justify-between items-start gap-3 mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">
                        {analyticsProductId === "ALL"
                          ? "Product sales"
                          : "Selected product sales"}
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {analyticsProductId === "ALL"
                          ? "Units sold and completed transactions"
                          : "Units and transactions containing this product"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-blue-700 text-sm">
                        {analytics.summary.totalUnitsSold} units
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {analytics.summary.totalSales} transactions
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <div className="flex items-end gap-2 min-w-max h-40 px-1">
                      {analytics.chart.map((point, index) => {
                        const maxUnits = Math.max(
                          ...analytics.chart.map((item) => item.unitsSold),
                          1
                        );

                        const height =
                          point.unitsSold > 0
                            ? Math.max(
                              5,
                              (point.unitsSold / maxUnits) * 100
                            )
                            : 0;

                        return (
                          <div
                            key={`${point.period}-${index}`}
                            className="w-9 h-full flex flex-col justify-end items-center gap-2"
                          >
                            <div className="w-full flex-1 flex items-end justify-center">
                              <div
                                title={`${point.unitsSold} units sold · ${point.salesCount} transactions`}
                                className="w-5 rounded-t-md bg-blue-500 transition-all duration-300"
                                style={{ height: `${height}%` }}
                              />
                            </div>

                            <span className="text-[9px] text-gray-400 whitespace-nowrap">
                              {new Date(point.period).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                }
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-12 text-center">
                <Receipt
                  size={30}
                  className="mx-auto text-gray-300"
                />
                <p className="text-sm font-semibold text-gray-600 mt-3">
                  No sales data available
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  There are no completed sales in this period.
                </p>
              </div>
            )}

          </div>
        </section>
      </div>
    </main>
  );
}
