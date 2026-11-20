
import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { requireAdmin } from "../../../../../lib/auth/api-guard";
import { db } from "../../../../../lib/db";


type AnalyticsRange =
  | "1week"
  | "1month"
  | "3months"
  | "6months"
  | "12months"
  | "all";

const RANGE_CONFIG: Record<
  AnalyticsRange,
  { interval: string; bucket: string; step: string }
> = {
  "1week": {
    interval: "7 days",
    bucket: "day",
    step: "1 day",
  },
  "1month": {
    interval: "1 month",
    bucket: "day",
    step: "1 day",
  },
  "3months": {
    interval: "3 months",
    bucket: "week",
    step: "1 week",
  },
  "6months": {
    interval: "6 months",
    bucket: "month",
    step: "1 month",
  },
  "12months": {
    interval: "12 months",
    bucket: "month",
    step: "1 month",
  },
  all: {
    interval: "0 days",
    bucket: "month",
    step: "1 month",
  },
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const { response } = await requireAdmin(request);
    if (response) return response;

    const params = request.nextUrl.searchParams;

    const requestedRange = params.get("range");
    const range: AnalyticsRange =
      requestedRange &&
        Object.prototype.hasOwnProperty.call(
          RANGE_CONFIG,
          requestedRange
        )
        ? (requestedRange as AnalyticsRange)
        : "1week";

    const requestedProductId = params.get("productId");
    const productId =
      requestedProductId && requestedProductId !== "ALL"
        ? requestedProductId
        : null;

    if (productId && !UUID_REGEX.test(productId)) {
      return NextResponse.json(
        { message: "Invalid product selected." },
        { status: 400 }
      );
    }

    const config = RANGE_CONFIG[range];

    const result = await db.execute(sql`
      WITH clock AS (
        SELECT
          NOW() AT TIME ZONE 'Asia/Kathmandu' AS local_now
      ),

      bounds AS (
        SELECT
          CASE
            WHEN ${range} = 'all' THEN
              COALESCE(
                (
                  SELECT MIN(
                    s.sold_at AT TIME ZONE 'Asia/Kathmandu'
                  )
                  FROM sales s
                  WHERE s.status = 'COMPLETED'
                ),
                clock.local_now
              )
            ELSE
              clock.local_now - ${config.interval}::interval
          END AS start_at,

          clock.local_now AS end_at

        FROM clock
      ),

      completed_sales AS (
        SELECT
          s.id,
          s.total_amount,
          s.sold_at AT TIME ZONE 'Asia/Kathmandu'
            AS local_sold_at

        FROM sales s
        CROSS JOIN bounds b

        WHERE
          s.status = 'COMPLETED'

          AND s.sold_at AT TIME ZONE 'Asia/Kathmandu'
            >= b.start_at

          AND s.sold_at AT TIME ZONE 'Asia/Kathmandu'
            <= b.end_at

          AND (
            ${productId}::uuid IS NULL

            OR EXISTS (
              SELECT 1
              FROM sale_items filter_si
              WHERE
                filter_si.sale_id = s.id
                AND filter_si.product_id = ${productId}::uuid
            )
          )
      ),

      /*
       * One row per sale.
       *
       * Overall analytics:
       *   Revenue = sales.total_amount
       *   Units = all sale_items.quantity
       *
       * Product analytics:
       *   Revenue = product line_total - line_discount
       *   Units = selected product quantity
       */
      sale_metrics AS (
        SELECT
          cs.id,
          cs.local_sold_at,

          CASE
            WHEN ${productId}::uuid IS NULL
              THEN cs.total_amount

            ELSE
              COALESCE(
                SUM(
                  si.line_total - si.line_discount
                ),
                0
              )
          END AS revenue,

          COALESCE(
            SUM(si.quantity),
            0
          )::numeric AS units_sold

        FROM completed_sales cs

        LEFT JOIN sale_items si
          ON si.sale_id = cs.id

          AND (
            ${productId}::uuid IS NULL
            OR si.product_id = ${productId}::uuid
          )

        GROUP BY
          cs.id,
          cs.local_sold_at,
          cs.total_amount
      ),

      sales_summary AS (
        SELECT
          COUNT(*)::int AS total_sales,

          COALESCE(
            SUM(revenue),
            0
          )::numeric AS total_revenue,

          COALESCE(
            SUM(units_sold),
            0
          )::numeric AS total_units_sold

        FROM sale_metrics
      ),

      sales_by_period AS (
        SELECT
          DATE_TRUNC(
            ${config.bucket},
            local_sold_at
          ) AS period,

          COUNT(*)::int AS sales_count,

          COALESCE(
            SUM(revenue),
            0
          )::numeric AS revenue

        FROM sale_metrics

        GROUP BY 1
      ),

      products_by_period AS (
        SELECT
          DATE_TRUNC(
            ${config.bucket},
            local_sold_at
          ) AS period,

          COALESCE(
            SUM(units_sold),
            0
          )::numeric AS units_sold

        FROM sale_metrics

        GROUP BY 1
      ),

      periods AS (
        SELECT generate_series(
          DATE_TRUNC(
            ${config.bucket},
            b.start_at
          ),

          DATE_TRUNC(
            ${config.bucket},
            b.end_at
          ),

          ${config.step}::interval

        ) AS period

        FROM bounds b
      )

      SELECT
        p.period,

        COALESCE(
          sbp.sales_count,
          0
        )::int AS sales_count,

        COALESCE(
          sbp.revenue,
          0
        )::numeric AS revenue,

        COALESCE(
          pbp.units_sold,
          0
        )::numeric AS units_sold,

        ss.total_sales,
        ss.total_revenue,
        ss.total_units_sold

      FROM periods p

      LEFT JOIN sales_by_period sbp
        ON sbp.period = p.period

      LEFT JOIN products_by_period pbp
        ON pbp.period = p.period

      CROSS JOIN sales_summary ss

      ORDER BY p.period ASC
    `);

    const rows = result.rows as Array<{
      period: Date | string;
      sales_count: number;
      revenue: string | number;
      units_sold: string | number;
      total_sales: number;
      total_revenue: string | number;
      total_units_sold: string | number;
    }>;

    const firstRow = rows[0];

    return NextResponse.json({
      range,
      productId,

      summary: {
        totalSales: Number(firstRow?.total_sales ?? 0),
        totalRevenue: Number(firstRow?.total_revenue ?? 0),
        totalUnitsSold: Number(
          firstRow?.total_units_sold ?? 0
        ),
      },

      chart: rows.map((row) => ({
        period: row.period,
        salesCount: Number(row.sales_count),
        revenue: Number(row.revenue),
        unitsSold: Number(row.units_sold),
      })),
    });
  } catch (error) {
    console.error("Sales analytics GET error:", error);

    return NextResponse.json(
      { message: "Unable to fetch sales analytics." },
      { status: 500 }
    );
  }
}
