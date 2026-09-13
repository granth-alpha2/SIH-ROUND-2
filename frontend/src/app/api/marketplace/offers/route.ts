import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifyJWT } from "@/lib/auth";
import { marketplaceService } from "@/lib/marketplace-service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.listingId || !body?.offeredQuantityQuintals || !body?.offeredPriceInrPerQuintal) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "listingId, offeredQuantityQuintals, and offeredPriceInrPerQuintal are required." } },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  let buyerId = body.buyerId || "usr_buyer_demo";
  let buyerName = body.buyerName || "M/s Kisan Agro Traders";
  let buyerPhone = body.buyerPhone || "9814122334";

  if (token) {
    const session = await verifyJWT(token);
    if (session) {
      buyerId = session.sub;
      buyerName = session.name || buyerName;
      buyerPhone = session.phone || buyerPhone;
    }
  }

  try {
    const offer = await marketplaceService.createOffer({
      listingId: body.listingId,
      buyerId,
      buyerName,
      buyerPhone,
      buyerCompany: body.buyerCompany,
      offeredQuantityQuintals: Number(body.offeredQuantityQuintals),
      offeredPriceInrPerQuintal: Number(body.offeredPriceInrPerQuintal),
      message: body.message,
      deliveryLocation: body.deliveryLocation,
    });

    return NextResponse.json({
      success: true,
      message: "Offer submitted successfully to farmer.",
      offer,
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create offer.";
    return NextResponse.json(
      { success: false, error: { code: "OFFER_ERROR", message } },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const offerId = body?.offerId;
  const action = body?.action; // 'ACCEPT', 'REJECT'
  const farmerId = body?.farmerId || "usr_farmer_demo";

  if (!offerId) {
    return NextResponse.json(
      { success: false, error: { code: "MISSING_OFFER_ID", message: "offerId is required." } },
      { status: 400 }
    );
  }

  if (action === "ACCEPT") {
    try {
      const result = await marketplaceService.acceptOffer({
        offerId,
        farmerId,
      });

      return NextResponse.json({
        success: true,
        message: "Offer accepted. Direct purchase transaction generated.",
        offer: result.offer,
        transaction: result.transaction,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to accept offer.";
      return NextResponse.json(
        { success: false, error: { code: "ACCEPT_ERROR", message } },
        { status: 400 }
      );
    }
  }

  return NextResponse.json(
    { success: false, error: { code: "UNKNOWN_ACTION", message: "Supported action is 'ACCEPT'." } },
    { status: 400 }
  );
}

