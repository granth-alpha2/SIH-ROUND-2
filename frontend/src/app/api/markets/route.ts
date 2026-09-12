import { NextResponse } from "next/server";
import { marketService } from "@/lib/market-service";
import { ncdexService } from "@/lib/ncdex-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const crop = searchParams.get("crop") || undefined;
  const state = searchParams.get("state") || undefined;
  const provider = searchParams.get("provider") || undefined;
  const includeNcdex = searchParams.get("includeNcdex") === "true" || provider === "ncdex" || provider === "all";
  const productGroup = searchParams.get("productGroup") || undefined;

  try {
    const prices = await marketService.getMandiPrices({ crop, state });

    let ncdexPayload = undefined;
    if (includeNcdex) {
      const [futures, summary, spreads] = await Promise.all([
        ncdexService.getFuturesPrices({
          productGroup,
          commodity: crop,
          cropSlug: crop
        }),
        ncdexService.getBhavCopySummary(),
        ncdexService.getPremiumDiscountSpreads()
      ]);

      ncdexPayload = {
        summary,
        futures,
        spreads,
        productGroups: ncdexService.getProductGroups()
      };
    }

    return NextResponse.json({
      success: true,
      total: prices.length,
      markets: prices,
      ncdex: ncdexPayload
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "MARKET_FETCH_FAILED", message: "Could not fetch mandi market prices." } },
      { status: 500 }
    );
  }
}

