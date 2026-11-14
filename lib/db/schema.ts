
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";
import {
  check,
  numeric,
} from "drizzle-orm/pg-core";

import { sql } from "drizzle-orm";
// ========================================
// SUPER ADMIN ACCOUNTS
// ========================================

export const admins = pgTable(
  "admins",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    fullName: varchar("full_name", { length: 150 }),

    phone: varchar("phone", { length: 30 }),

    email: varchar("email", { length: 255 })
      .notNull()
      .unique(),

    passwordHash: text("password_hash").notNull(),

    role: varchar("role", { length: 30 })
      .notNull()
      .default("SUPER_ADMIN"),

    isActive: boolean("is_active")
      .notNull()
      .default(true),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("admins_email_idx").on(table.email),
  ]
);

// ========================================
// LOGIN OTP CHALLENGES
// ========================================

export const adminLoginOtps = pgTable(
  "admin_login_otps",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    adminId: uuid("admin_id")
      .notNull()
      .references(() => admins.id, { onDelete: "cascade" }),

    otpHash: text("otp_hash").notNull(),

    attempts: integer("attempts")
      .notNull()
      .default(0),

    resendCount: integer("resend_count")
      .notNull()
      .default(0),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }).notNull(),

    lastSentAt: timestamp("last_sent_at", {
      withTimezone: true,
    }).notNull(),

    verifiedAt: timestamp("verified_at", {
      withTimezone: true,
    }),

    consumedAt: timestamp("consumed_at", {
      withTimezone: true,
    }),

    ipAddress: varchar("ip_address", { length: 64 }),

    userAgent: text("user_agent"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("admin_otps_admin_id_idx").on(table.adminId),
    index("admin_otps_expiry_idx").on(table.expiresAt),
  ]
);

// ========================================
// AUTHENTICATED ADMIN SESSIONS
// ========================================

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    adminId: uuid("admin_id")
      .notNull()
      .references(() => admins.id, { onDelete: "cascade" }),

    sessionTokenHash: varchar("session_token_hash", {
      length: 64,
    })
      .notNull()
      .unique(),

    ipAddress: varchar("ip_address", { length: 64 }),

    userAgent: text("user_agent"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }).notNull(),

    lastActivityAt: timestamp("last_activity_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    revokedAt: timestamp("revoked_at", {
      withTimezone: true,
    }),
  },
  (table) => [
    index("admin_sessions_admin_id_idx").on(table.adminId),
    index("admin_sessions_expiry_idx").on(table.expiresAt),
  ]
);

// ========================================
// ADMIN LOGIN AUDIT HISTORY
// ========================================

export const adminLoginAudit = pgTable(
  "admin_login_audit",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    adminId: uuid("admin_id").references(() => admins.id, {
      onDelete: "set null",
    }),

    attemptedEmail: varchar("attempted_email", {
      length: 255,
    }),

    eventType: varchar("event_type", {
      length: 50,
    }).notNull(),

    ipAddress: varchar("ip_address", { length: 64 }),

    userAgent: text("user_agent"),

    metadata: jsonb("metadata").$type<
      Record<string, unknown>
    >(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("admin_audit_admin_id_idx").on(table.adminId),
    index("admin_audit_event_type_idx").on(table.eventType),
    index("admin_audit_created_at_idx").on(table.createdAt),
    index("admin_audit_email_idx").on(table.attemptedEmail),
  ]
);

// ========================================
// ADMIN RATE LIMITS (SECURITY MEASURE)
// ========================================

export const adminRateLimits = pgTable(
  "admin_rate_limits",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    key: varchar("key", { length: 64 }).notNull(),

    windowStart: timestamp("window_start", {
      withTimezone: true,
    }).notNull(),

    count: integer("count").notNull().default(0),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("admin_rate_limits_key_window_unique").on(
      table.key,
      table.windowStart
    ),
    index("admin_rate_limits_expiry_idx").on(
      table.expiresAt
    ),
  ]
);


// ========================================
// PHARMACY PRODUCTS
// ========================================

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", { length: 255 })
      .notNull(),

    // Cloudflare R2 image information
    imageUrl: text("image_url"),

    imageKey: text("image_key"),

    // Purchase cost (optional)
    costPrice: numeric("cost_price", {
      precision: 12,
      scale: 2,
    }),

    // Current selling price
    sellingPrice: numeric("selling_price", {
      precision: 12,
      scale: 2,
    }).notNull(),

    isActive: boolean("is_active")
      .notNull()
      .default(true),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("products_name_idx").on(table.name),
    index("products_active_idx").on(table.isActive),

    check(
      "products_selling_price_check",
      sql`${table.sellingPrice} >= 0`
    ),

    check(
      "products_cost_price_check",
      sql`${table.costPrice} IS NULL OR ${table.costPrice} >= 0`
    ),
  ]
);

// ========================================
// PHARMACY SALES
// ========================================

export const sales = pgTable(
  "sales",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Human-readable invoice number
    invoiceNumber: varchar("invoice_number", {
      length: 50,
    })
      .notNull()
      .unique(),

    customerName: varchar("customer_name", {
      length: 150,
    })
      .notNull()
      .default("Anonymous Customer"),

    customerPhone: varchar("customer_phone", {
      length: 30,
    }),

    soldAt: timestamp("sold_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    // Total before discount
    subtotal: numeric("subtotal", {
      precision: 12,
      scale: 2,
    }).notNull(),

    // Total bill discount
    discountAmount: numeric("discount_amount", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),

    // Final payable amount
    totalAmount: numeric("total_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    // Completed or VOID
    status: varchar("status", {
      length: 20,
    })
      .notNull()
      .default("COMPLETED"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("sales_sold_at_idx").on(table.soldAt),

    index("sales_customer_phone_idx").on(
      table.customerPhone
    ),

    index("sales_status_idx").on(table.status),

    check(
      "sales_subtotal_check",
      sql`${table.subtotal} >= 0`
    ),

    check(
      "sales_discount_check",
      sql`${table.discountAmount} >= 0 AND ${table.discountAmount} <= ${table.subtotal}`
    ),

    check(
      "sales_total_check",
      sql`${table.totalAmount} >= 0`
    ),

    check(
      "sales_status_check",
      sql`${table.status} IN ('COMPLETED', 'VOID')`
    ),
  ]
);

// ========================================
// PHARMACY SALE ITEMS
// ========================================

export const saleItems = pgTable(
  "sale_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    saleId: uuid("sale_id")
      .notNull()
      .references(() => sales.id, {
        onDelete: "cascade",
      }),

    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, {
        onDelete: "restrict",
      }),

    // Historical product name
    productName: varchar("product_name", {
      length: 255,
    }).notNull(),

    quantity: integer("quantity")
      .notNull(),

    // Historical selling price
    unitPrice: numeric("unit_price", {
      precision: 12,
      scale: 2,
    }).notNull(),

    // Historical purchase cost
    unitCost: numeric("unit_cost", {
      precision: 12,
      scale: 2,
    }),

    // quantity * unitPrice
    lineTotal: numeric("line_total", {
      precision: 12,
      scale: 2,
    }).notNull(),

    // Proportional allocation of bill discount
    lineDiscount: numeric("line_discount", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("sale_items_sale_id_idx").on(table.saleId),
    index("sale_items_product_id_idx").on(table.productId),

    check(
      "sale_items_quantity_check",
      sql`${table.quantity} > 0`
    ),

    check(
      "sale_items_unit_price_check",
      sql`${table.unitPrice} >= 0`
    ),

    check(
      "sale_items_line_total_check",
      sql`${table.lineTotal} >= 0`
    ),

    check(
      "sale_items_line_discount_check",
      sql`${table.lineDiscount} >= 0 AND ${table.lineDiscount} <= ${table.lineTotal}`
    ),
  ]
);