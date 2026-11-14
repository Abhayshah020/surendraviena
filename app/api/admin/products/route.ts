
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth/api-guard";
import { products } from "../../../../lib/db/schema";
import { db } from "../../../../lib/db";
import { productSchema } from "../../../../lib/validations/product";

export const runtime = "nodejs";


export async function GET(request: NextRequest) {
    try {
        const { response } = await requireAdmin(request);
        if (response) return response;

        const params = request.nextUrl.searchParams;

        const page = Math.max(1, Number(params.get("page")) || 1);
        const limit = Math.min(
            100,
            Math.max(1, Number(params.get("limit")) || 20)
        );

        const search = params.get("search")?.trim() || "";

        const requestedStatus = params.get("status");

        const status =
            requestedStatus === "active" ||
                requestedStatus === "inactive" ||
                requestedStatus === "all"
                ? requestedStatus
                : params.get("includeInactive") === "true"
                    ? "all"
                    : "active";

        const conditions = [];

        if (status === "active") {
            conditions.push(eq(products.isActive, true));
        } else if (status === "inactive") {
            conditions.push(eq(products.isActive, false));
        }

        if (search) {
            conditions.push(
                ilike(products.name, `%${search}%`)
            );
        }

        const where = conditions.length
            ? and(...conditions)
            : undefined;

        const [items, count] = await Promise.all([
            db
                .select()
                .from(products)
                .where(where)
                .orderBy(desc(products.createdAt))
                .limit(limit)
                .offset((page - 1) * limit),

            db
                .select({
                    total: sql<number>`count(*)::int`,
                })
                .from(products)
                .where(where),
        ]);

        const total = count[0]?.total ?? 0;
        const totalPages = Math.ceil(total / limit);

        return NextResponse.json({
            products: items,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
            },
        });
    } catch (error) {
        console.error("Products GET error:", error);

        return NextResponse.json(
            { message: "Unable to fetch products." },
            { status: 500 }
        );
    }
}


export async function POST(request: NextRequest) {
    try {
        const { response } = await requireAdmin(request);
        if (response) return response;

        const body = await request.json();
        const parsed = productSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    message: "Invalid product information.",
                    errors: parsed.error.flatten(),
                },
                { status: 400 }
            );
        }

        const data = parsed.data;

        if (Boolean(data.imageUrl) !== Boolean(data.imageKey)) {
            return NextResponse.json(
                { message: "Image URL and image key must be supplied together." },
                { status: 400 }
            );
        }

        const [product] = await db
            .insert(products)
            .values({
                name: data.name,
                costPrice: data.costPrice ?? null,
                sellingPrice: data.sellingPrice,
                imageUrl: data.imageUrl ?? null,
                imageKey: data.imageKey ?? null,
            })
            .returning();

        return NextResponse.json(
            {
                message: "Product created successfully.",
                product,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Products POST error:", error);

        return NextResponse.json(
            { message: "Unable to create product." },
            { status: 500 }
        );
    }
}
