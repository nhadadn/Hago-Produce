import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Role } from "@prisma/client";
import { productPriceUpdateSchema } from "@/lib/validation/product-price";
import { logger } from "@/lib/logger/logger.service";
import { ProductPriceService } from "@/lib/services/product-prices/product-prices.service";

// GET /api/v1/product-prices/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const price = await prisma.productPrice.findUnique({
      where: { id: params.id },
      include: {
        product: true,
        supplier: true,
      },
    });

    if (!price) {
      return new NextResponse("Product price not found", { status: 404 });
    }

    return NextResponse.json(price);
  } catch (error) {
    logger.error("[PRODUCT_PRICE_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// PATCH /api/v1/product-prices/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    // Solo ADMIN y ACCOUNTING pueden actualizar precios
    if (user.role !== Role.ADMIN && user.role !== Role.ACCOUNTING) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const json = await req.json();
    const body = productPriceUpdateSchema.parse(json);

    try {
      const updatedPrice = await ProductPriceService.update(params.id, body);
      return NextResponse.json(updatedPrice);
    } catch (error: any) {
      if (error.message === 'Product price not found') {
        return new NextResponse("Product price not found", { status: 404 });
      }
      throw error;
    }
  } catch (error) {
    logger.error("[PRODUCT_PRICE_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// DELETE /api/v1/product-prices/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    // Solo ADMIN y ACCOUNTING pueden eliminar precios
    if (user.role !== Role.ADMIN && user.role !== Role.ACCOUNTING) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const price = await prisma.productPrice.findUnique({
      where: { id: params.id },
    });

    if (!price) {
      return new NextResponse("Product price not found", { status: 404 });
    }

    await prisma.productPrice.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error("[PRODUCT_PRICE_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
