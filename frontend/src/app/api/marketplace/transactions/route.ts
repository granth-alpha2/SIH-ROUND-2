import { NextResponse } from "next/server";
import { marketplaceService } from "@/lib/marketplace-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const farmerId = searchParams.get("farmerId") || undefined;
  const type = searchParams.get("type") || undefined;
  const id = searchParams.get("id") || undefined;

  try {
    if (id) {
      const tx = await marketplaceService.getTransactionById(id);
      if (!tx) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Transaction not found." } },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, transaction: tx });
    }

    const transactions = await marketplaceService.listTransactions({ farmerId, type });
    return NextResponse.json({
      success: true,
      total: transactions.length,
      transactions,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_FAILED", message: "Failed to list transactions." } },
      { status: 500 }
    );
  }
}

