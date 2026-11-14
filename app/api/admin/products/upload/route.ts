
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/auth/api-guard";
import { createProductUploadUrl, deleteProductImage, isAllowedImageType, MAX_IMAGE_SIZE } from "../../../../../lib/r2/storage";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { response } = await requireAdmin(request);
    if (response) return response;

    const body = await request.json();

    if (
      !isAllowedImageType(body.contentType) ||
      typeof body.size !== "number" ||
      !Number.isFinite(body.size) ||
      body.size <= 0 ||
      body.size > MAX_IMAGE_SIZE
    ) {
      return NextResponse.json(
        {
          message: "Only JPEG, PNG and WebP images up to 300 KB are allowed.",
        },
        { status: 400 }
      );
    }

    const result = await createProductUploadUrl(
      body.contentType
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("R2 upload URL error:", error);

    return NextResponse.json(
      { message: "Unable to prepare image upload." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { response } = await requireAdmin(request);
    if (response) return response;

    const body = await request.json();
    const imageKey = body?.imageKey;

    if (
      typeof imageKey !== "string" ||
      !imageKey.startsWith("products/")
    ) {
      return NextResponse.json(
        { message: "A valid product image key is required." },
        { status: 400 }
      );
    }

    await deleteProductImage(imageKey);

    return NextResponse.json({
      message: "Product image deleted successfully.",
    });
  } catch (error) {
    console.error("Product image deletion error:", error);

    return NextResponse.json(
      { message: "Unable to delete product image. Please try again." },
      { status: 500 }
    );
  }
}