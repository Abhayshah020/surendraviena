
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Ban,
  Loader2,
  Trash2,
  CalendarDays,
  Phone,
  Receipt,
  UserRound,
  Package,
  ChevronRight,
  FileDown,
} from "lucide-react";

import { formatNPR } from "../../../../../lib/utils/currency";
import { useAppDialog } from "../../../../../components/app-dialog";
import { formatBSDateTimeShort } from "../../../../../lib/date/nepali-date";
import { useCalendarPreference } from "../../../../../hooks/use-calendar-preference";

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

interface Item {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  unitCost: string | null;
  lineTotal: string;
  lineDiscount: string;
}

export default function InvoicePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { confirm } = useAppDialog();
  const { useBS, toggleCalendar } = useCalendarPreference();

  const [sale, setSale] = useState<Sale | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<
    "void" | "delete" | null
  >(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const loadInvoice = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/admin/sales/${params.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load invoice.");
      }

      setSale(data.sale);
      setItems(data.items);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load invoice."
      );
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-NP", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kathmandu",
    });
  };

  async function voidOrCompleteSale({ status }: { status: "VOID" | "COMPLETED" }) {
    const confirmed = await confirm(
      `Are you sure you want to ${status === "COMPLETED" ? "void" : "compelte"} this invoice?`,
      {
        title: `${status === "COMPLETED" ? "Void" : "Complete"} This Invoice`,
        confirmText: `${status === "COMPLETED" ? "Void" : "Complete"}`,
        cancelText: "Cancel",
        variant: "danger",
      }
    );

    if (
      !confirmed
    ) {
      return;
    }

    try {
      setActionLoading("void");

      const response = await fetch(`/api/admin/sales/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: status === "VOID" ? "COMPLETED" : "VOID" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to void sale.");
      }

      await loadInvoice();
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Unable to void sale."
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteSale() {
    const confirmed = await confirm(
      '',
      {
        title: `Permanently Delete Invoice ${sale?.invoiceNumber}?`,
        confirmText: "DELETE",
        cancelText: "Cancel",
        variant: "danger",
      }
    );

    if (!confirmed) return;

    try {
      setActionLoading("delete");

      const response = await fetch(`/api/admin/sales/${params.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete sale.");
      }

      router.replace("/admin/sales");
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Unable to delete sale."
      );
      setActionLoading(null);
    }
  }

  async function downloadInvoicePdf(sale: Sale, items: Item[]) {
    try {
      setDownloadingPdf(true);

      const [{ default: jsPDF }, { default: autoTable }] =
        await Promise.all([
          import("jspdf"),
          import("jspdf-autotable"),
        ]);

      const doc = new jsPDF("p", "mm", "a4");

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const right = pageWidth - margin;

      const money = (value: string | number) =>
        `NPR ${Number(value || 0).toLocaleString("en-NP", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      const date = useBS ? formatBSDateTimeShort(sale.soldAt) : formatDate(sale.soldAt)

      // PHARMACY HEADER
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42);
      doc.text("Pharmacy", margin, 22);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("Biratnagar, Nepal", margin, 29);
      doc.text("Pharmacy contact information", margin, 34);

      // INVOICE DETAILS
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(15, 118, 110);
      doc.text("INVOICE", right, 22, { align: "right" });

      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(sale.invoiceNumber, right, 29, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(date, right, 35, { align: "right" });

      doc.setDrawColor(226, 232, 240);
      doc.line(margin, 42, right, 42);

      // CUSTOMER INFORMATION
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("CUSTOMER", margin, 51);
      doc.text("PAYMENT STATUS", right, 51, { align: "right" });

      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(sale.customerName || "Anonymous Customer", margin, 58);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(
        sale.customerPhone || "No phone provided",
        margin,
        64
      );

      doc.setFont("helvetica", "bold");
      doc.setTextColor(
        sale.status === "COMPLETED" ? 21 : 220,
        sale.status === "COMPLETED" ? 128 : 38,
        sale.status === "COMPLETED" ? 61 : 38
      );

      doc.text(sale.status, right, 59, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.text("Date: " + date, right, 65, { align: "right" });

      // ITEMS TABLE
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("Purchased Items", margin, 79);

      autoTable(doc, {
        startY: 84,
        margin: { left: margin, right: margin },
        head: [[
          "Product",
          "Qty",
          "Unit Price",
          "Discount",
          "Total",
        ]],
        body: items.map((item) => [
          item.productName,
          String(item.quantity),
          money(item.unitPrice),
          money(item.lineDiscount),
          money(
            Number(item.lineTotal) - Number(item.lineDiscount)
          ),
        ]),
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 3,
          textColor: [51, 65, 85],
          lineColor: [226, 232, 240],
          lineWidth: 0.15,
          valign: "middle",
        },
        headStyles: {
          fillColor: [15, 118, 110],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { halign: "center", cellWidth: 15 },
          2: { halign: "right", cellWidth: 30 },
          3: { halign: "right", cellWidth: 27 },
          4: { halign: "right", cellWidth: 30 },
        },
      });

      // TOTALS
      let y = (doc as any).lastAutoTable.finalY + 12;

      // Move totals to a new page if insufficient space
      if (y > pageHeight - 55) {
        doc.addPage();
        y = 25;
      }

      const labelX = right - 65;
      const valueX = right;

      const addTotal = (
        label: string,
        value: string,
        color: [number, number, number] = [71, 85, 105]
      ) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...color);
        doc.text(label, labelX, y);
        doc.text(value, valueX, y, { align: "right" });
        y += 8;
      };

      addTotal("Subtotal", money(sale.subtotal));
      addTotal("Discount", `- ${money(sale.discountAmount)}`, [220, 38, 38]);

      // GRAND TOTAL
      doc.setFillColor(240, 253, 250);
      doc.roundedRect(labelX - 4, y - 5, 69, 15, 2, 2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("Grand Total", labelX, y + 4);

      doc.setFontSize(12);
      doc.setTextColor(15, 118, 110);
      doc.text(money(sale.totalAmount), valueX, y + 4, {
        align: "right",
      });

      // FOOTER
      const footerY = Math.min(y + 30, pageHeight - 15);

      doc.setDrawColor(226, 232, 240);
      doc.line(margin, footerY - 7, right, footerY - 7);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(
        "Thank you for visiting our pharmacy.",
        pageWidth / 2,
        footerY,
        { align: "center" }
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        "This is a computer-generated invoice.",
        pageWidth / 2,
        footerY + 5,
        { align: "center" }
      );

      // PAGE NUMBERS
      const pageCount = doc.getNumberOfPages();

      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 7,
          { align: "center" }
        );
      }

      // DOWNLOAD
      const safeFilename = String(sale.invoiceNumber)
        .replace(/[^a-zA-Z0-9-_]/g, "_");

      doc.save(`${safeFilename}.pdf`);

    } catch (error) {
      console.error("Invoice PDF error:", error);
      setError("Unable to generate invoice PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  }


  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 size={28} className="animate-spin text-teal-700" />
        <p className="text-sm text-gray-500">Loading invoice...</p>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <main className="min-h-[60vh] flex flex-col items-center justify-center p-5 text-center">
        <Receipt size={35} className="text-gray-300 mb-3" />

        <p className="font-semibold text-gray-800">
          Unable to open invoice
        </p>

        <p className="text-sm text-red-500 mt-2">
          {error || "Invoice not found."}
        </p>

        <button
          onClick={() => router.push("/admin/sales")}
          className="mt-5 px-4 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-semibold"
        >
          Back to sales
        </button>
      </main>
    );
  }

  const isBusy = actionLoading !== null;

  return (
    <main className="min-h-dvh bg-[#F7F9F8] px-3 py-4 sm:px-6 sm:py-6 lg:px-8">

      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5">

        {/* HEADER */}
        <header className="flex items-center justify-between gap-3 print:hidden">

          <button
            onClick={() => router.push("/admin/sales")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            <ArrowLeft size={18} />
            <span>Sales</span>
          </button>

          <span className="text-xs text-gray-400 hidden sm:block">
            Sales / Invoice details
          </span>

        </header>

        {/* ACTION BAR */}
        <section className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm print:hidden">

          <div className="flex items-center justify-between gap-3 mb-3">

            <div className="min-w-0">
              <p className="text-xs text-gray-500">
                Invoice details
              </p>

              <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                {sale.invoiceNumber}
              </h1>
            </div>

            <span
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${sale.status === "COMPLETED"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
                }`}
            >
              {sale.status}
            </span>

          </div>

          <div className="grid grid-cols-2 sm:flex sm:justify-end gap-2">
            <button
              type="button"
              onClick={() => downloadInvoicePdf(sale, items)}
              disabled={isBusy || downloadingPdf}
              className="flex items-center justify-center gap-2 rounded-lg bg-teal-700 text-white px-3 py-2.5 text-xs sm:text-sm font-semibold hover:bg-teal-800 disabled:opacity-50"
            >
              {downloadingPdf ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <FileDown size={16} />
              )}

              {downloadingPdf ? "Generating PDF..." : "Download PDF"}
            </button>
            {/* {sale.status === "COMPLETED" && ( */}
            <button
              onClick={() => voidOrCompleteSale({ status: sale.status })}
              disabled={isBusy}
              className="flex items-center justify-center gap-2 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 px-3 py-2.5 text-xs sm:text-sm font-semibold hover:bg-orange-100 disabled:opacity-50"
            >
              {actionLoading === "void" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Ban size={16} />
              )}
              {sale.status === "COMPLETED" ? "Void sale" : "Revert Void"}
            </button>
            {/* )} */}

            <button
              onClick={deleteSale}
              disabled={isBusy}
              className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2.5 text-xs sm:text-sm font-semibold hover:bg-red-100 disabled:opacity-50 col-span-2 sm:col-span-1"
            >
              {actionLoading === "delete" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              Delete permanently
            </button>

          </div>
        </section>

        {/* INVOICE */}
        <article
          id="invoice"
          className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-7 lg:p-9 print:shadow-none print:border-0 print:rounded-none print:p-0"
        >

          {/* INVOICE HEADER */}
          <div className="flex justify-between items-start gap-3 pb-5 border-b border-gray-100">

            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
                Pharmacy
              </h2>

              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Biratnagar, Nepal
              </p>

              <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                Pharmacy contact information
              </p>
            </div>

            <div className="text-right shrink-0">
              <h3 className="text-lg sm:text-2xl font-extrabold tracking-wide text-teal-800">
                INVOICE
              </h3>

              <p className="text-xs sm:text-sm font-bold text-gray-800 mt-1">
                {sale.invoiceNumber}
              </p>
            </div>

          </div>

          {/* CUSTOMER INFORMATION */}
          <div className="grid grid-cols-2 gap-3 sm:gap-6 py-5 border-b border-gray-100">

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-2">
                <UserRound size={15} className="text-teal-700" />
                <p className="text-[10px] sm:text-xs font-bold tracking-wide text-gray-400">
                  CUSTOMER
                </p>
              </div>

              <p className="text-sm sm:text-base font-bold text-gray-900 break-words">
                {sale.customerName}
              </p>

              <div className="flex items-center gap-1.5 mt-1 text-gray-500">
                <Phone size={12} />

                <p className="text-xs">
                  {sale.customerPhone || "No phone provided"}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5 mb-2">
                <p className="text-[10px] sm:text-xs font-bold tracking-wide text-gray-400">
                  PAYMENT STATUS
                </p>
              </div>

              <span
                className={`inline-flex px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold ${sale.status === "COMPLETED"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
                  }`}
              >
                {sale.status}
              </span>

              <div className="flex items-center justify-end gap-1 mt-2 text-gray-400"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleCalendar();
                }}
              >
                <CalendarDays size={12} />
                <span className="text-[10px]">
                  {useBS ? formatBSDateTimeShort(sale.soldAt) : formatDate(sale.soldAt)}
                </span>
              </div>
            </div>

          </div>

          {/* ITEMS HEADING */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <Package size={17} className="text-teal-700" />

              <h3 className="text-sm font-bold text-gray-900">
                Purchased items
              </h3>
            </div>

            <span className="text-xs text-gray-400">
              {items.length} items
            </span>
          </div>

          {/* MOBILE ITEM CARDS */}
          <div className="sm:hidden divide-y divide-gray-100 border-y border-gray-100">

            {items.map((item, index) => (
              <div key={item.id} className="py-3 space-y-2">

                <div className="flex justify-between items-start gap-3">
                  <div className="flex gap-2 min-w-0">
                    <span className="text-[10px] text-gray-400 mt-0.5">
                      {index + 1}.
                    </span>

                    <p className="text-sm font-semibold text-gray-800 break-words">
                      {item.productName}
                    </p>
                  </div>

                  <p className="text-sm font-bold text-gray-900 shrink-0">
                    {formatNPR(
                      Number(item.lineTotal) -
                      Number(item.lineDiscount)
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-4 text-[11px] text-gray-500">

                  <span>
                    Qty: <strong className="text-gray-700">{item.quantity}</strong>
                  </span>

                  <span>
                    Price: {formatNPR(item.unitPrice)}
                  </span>

                  {Number(item.lineDiscount) > 0 && (
                    <span className="text-red-600">
                      Discount: {formatNPR(item.lineDiscount)}
                    </span>
                  )}

                </div>

              </div>
            ))}

          </div>

          {/* TABLET + DESKTOP ITEMS TABLE */}
          <div className="hidden sm:block overflow-x-auto border-y border-gray-100">

            <table className="w-full text-sm">

              <thead>
                <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
                  <th className="py-3 font-semibold">Product</th>
                  <th className="py-3 text-center font-semibold">Qty</th>
                  <th className="py-3 text-right font-semibold">Unit price</th>
                  <th className="py-3 text-right font-semibold">Discount</th>
                  <th className="py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.id}>

                    <td className="py-3.5 font-medium text-gray-800">
                      {item.productName}
                    </td>

                    <td className="py-3.5 text-center text-gray-600">
                      {item.quantity}
                    </td>

                    <td className="py-3.5 text-right text-gray-600 whitespace-nowrap">
                      {formatNPR(item.unitPrice)}
                    </td>

                    <td className="py-3.5 text-right text-red-600 whitespace-nowrap">
                      {formatNPR(item.lineDiscount)}
                    </td>

                    <td className="py-3.5 text-right font-semibold text-gray-900 whitespace-nowrap">
                      {formatNPR(
                        Number(item.lineTotal) -
                        Number(item.lineDiscount)
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>

          {/* TOTALS */}
          <div className="flex justify-end pt-5">

            <div className="w-full sm:max-w-xs space-y-3">

              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-800">
                  {formatNPR(sale.subtotal)}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-gray-500">Discount</span>
                <span className="font-medium text-red-600">
                  - {formatNPR(sale.discountAmount)}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-3 flex justify-between items-center gap-3">

                <span className="text-sm font-bold text-gray-900">
                  Grand total
                </span>

                <span className="text-lg sm:text-xl font-extrabold text-teal-800 whitespace-nowrap">
                  {formatNPR(sale.totalAmount)}
                </span>

              </div>

            </div>

          </div>

          {/* FOOTER */}
          <div className="mt-8 pt-5 border-t border-gray-100 text-center">

            <p className="text-xs font-semibold text-gray-700">
              Thank you for visiting our pharmacy.
            </p>

            <p className="text-[10px] text-gray-400 mt-1">
              This is a computer-generated invoice.
            </p>

          </div>

        </article>

      </div>

      {/* PRINT STYLES */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }

          body {
            background: white !important;
          }

          body * {
            visibility: hidden;
          }

          #invoice,
          #invoice * {
            visibility: visible;
          }

          #invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: none;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .sm\\:hidden {
            display: none !important;
          }

          .hidden.sm\\:block {
            display: block !important;
          }
        }
      `}</style>

    </main>
  );
}
