import { NextResponse } from "next/server";
import { marketService } from "@/lib/market-service";
import { ncdexService } from "@/lib/ncdex-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const crop = searchParams.get("crop") || undefined;
  const state = searchParams.get("state") || undefined;
  const district = searchParams.get("district") || undefined;
  const sellingChannel = searchParams.get("sellingChannel") || searchParams.get("channel") || undefined;
  const destination = searchParams.get("destination") || undefined;
  const season = searchParams.get("season") || undefined;
  const date = searchParams.get("date") || undefined;
  const quantityQuintals = Number(searchParams.get("quantityQuintals") || 0) || undefined;
  const marketConditions = searchParams.get("marketConditions") || undefined;
  const provider = searchParams.get("provider") || undefined;
  const includeNcdex = searchParams.get("includeNcdex") === "true" || provider === "ncdex" || provider === "all";
  const productGroup = searchParams.get("productGroup") || undefined;
  const symbol = searchParams.get("symbol") || "KAPAS";

  try {
    const prices = await marketService.getMandiPrices({
      crop,
      state,
      district,
      sellingChannel,
      destination,
      season,
      quantityQuintals,
      date,
      marketConditions,
    });

    let ncdexPayload = undefined;
    if (includeNcdex) {
      const [futures, summary, spreads, liveSync] = await Promise.all([
        ncdexService.getFuturesPrices({
          productGroup,
          commodity: crop,
          cropSlug: crop
        }),
        ncdexService.getBhavCopySummary(),
        ncdexService.getPremiumDiscountSpreads(),
        ncdexService.attemptLiveWebFetch(symbol)
      ]);

      ncdexPayload = {
        summary,
        futures,
        spreads,
        productGroups: ncdexService.getProductGroups(),
        analytics: liveSync.data,
        liveSync: {
          success: liveSync.success,
          directWebScraped: liveSync.directWebScraped,
          message: liveSync.message,
          syncedAt: new Date().toISOString()
        }
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
