import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Role } from "@prisma/client";
import { productPriceUpdateSchema } from "@/lib/validation/product-price";

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
    console.error("[PRODUCT_PRICE_GET]", error);
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

    const price = await prisma.productPrice.findUnique({
      where: { id: params.id },
    });

    if (!price) {
      return new NextResponse("Product price not found", { status: 404 });
    }

    // Si se establece como actual, necesitamos manejar la lógica de otros precios actuales
    // Típicamente, editar un registro existente para que sea actual podría requerir una transacción
    // Por simplicidad, solo actualizamos. La lógica de creación maneja mejor el escenario "nuevo actual".
    // Si el usuario establece manualmente isCurrent=true aquí, probablemente deberíamos actualizar otros a false.
    
    let updatedPrice;
    
    if (body.isCurrent === true && !price.isCurrent) {
       updatedPrice = await prisma.$transaction(async (tx) => {
         // Marcar otros como no actuales
         await tx.productPrice.updateMany({
           where: {
             productId: price.productId,
             supplierId: price.supplierId,
             isCurrent: true,
             id: { not: params.id },
           },
           data: { isCurrent: false },
         });
         
         return tx.productPrice.update({
           where: { id: params.id },
           data: body,
         });
       });
    } else {
       updatedPrice = await prisma.productPrice.update({
        where: { id: params.id },
        data: body,
      });
    }

    return NextResponse.json(updatedPrice);
  } catch (error) {
    console.error("[PRODUCT_PRICE_PATCH]", error);
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
    console.error("[PRODUCT_PRICE_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
