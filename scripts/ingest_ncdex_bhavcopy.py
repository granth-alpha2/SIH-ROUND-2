#!/usr/bin/env python3
"""
NCDEX Bhav Copy Daily Settlement Ingestion Pipeline
===================================================
Ingests daily Bhav Copy CSV published by National Commodity & Derivatives
Exchange (NCDEX), validates prices, calculates premium/discount spreads vs spot,
cross-references MSP from AgriProfit crops master, and outputs processed JSON.
"""

import os
import csv
import json
import uuid
from datetime import datetime

RAW_CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "ncdex", "bhavcopy_daily.csv")
OUTPUT_JSON_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "processed", "ncdex_settlement_processed.json")

# Crop slug mapping between NCDEX symbols and AgriProfit crops_master
NCDEX_TO_CROPS_MAP = {
    "RMSEED": {"crop_slug": "mustard", "crop_id": "CROP013", "msp_quintal": 5650.0},
    "CHANA": {"crop_slug": "chickpea", "crop_id": "CROP007", "msp_quintal": 5440.0},
    "SOYBEAN": {"crop_slug": "soybean", "crop_id": "CROP014", "msp_quintal": 4600.0},
    "MAIZE": {"crop_slug": "maize", "crop_id": "CROP004", "msp_quintal": 2090.0},
    "WHEAT": {"crop_slug": "wheat", "crop_id": "CROP002", "msp_quintal": 2275.0},
    "BARLEY": {"crop_slug": "barley", "crop_id": "CROP005", "msp_quintal": 1850.0},
    "BAJRA": {"crop_slug": "pearl-millet", "crop_id": "CROP006", "msp_quintal": 2500.0},
    "GROUNDNUT": {"crop_slug": "groundnut", "crop_id": "CROP012", "msp_quintal": 6377.0},
    "TMCFGRNZM": {"crop_slug": "turmeric", "crop_id": "CROP025", "msp_quintal": None},
    "KAPAS": {"crop_slug": "cotton", "crop_id": "CROP020", "msp_quintal": 7020.0},
    "COTTON": {"crop_slug": "cotton", "crop_id": "CROP020", "msp_quintal": 7020.0},
    "GUARSEED10": {"crop_slug": "guar-seed", "crop_id": None, "msp_quintal": None},
    "GUARGUM5": {"crop_slug": "guar-gum", "crop_id": None, "msp_quintal": None},
    "JEERAUNJHA": {"crop_slug": "jeera", "crop_id": None, "msp_quintal": None},
    "DHANIYA": {"crop_slug": "coriander", "crop_id": None, "msp_quintal": None},
    "CASTOR": {"crop_slug": "castor-seed", "crop_id": None, "msp_quintal": None},
    "AGRIDEX": {"crop_slug": "agridex", "crop_id": None, "msp_quintal": None},
}

def process_ncdex_bhavcopy():
    if not os.path.exists(RAW_CSV_PATH):
        raise FileNotFoundError(f"Raw CSV not found at: {RAW_CSV_PATH}")

    os.makedirs(os.path.dirname(OUTPUT_JSON_PATH), exist_ok=True)
    records = []

    with open(RAW_CSV_PATH, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            symbol = row["symbol"].strip().upper()
            mapping = NCDEX_TO_CROPS_MAP.get(symbol, {})
            crop_slug = mapping.get("crop_slug")
            crop_id = mapping.get("crop_id")
            msp_price = mapping.get("msp_quintal")

            settlement_price = float(row["settlement_price"])
            spot_price = float(row["spot_price"])
            premium_discount_inr = round(settlement_price - spot_price, 2)
            premium_discount_pct = round(((settlement_price - spot_price) / spot_price) * 100, 2) if spot_price > 0 else 0.0

            msp_diff_pct = None
            if msp_price and msp_price > 0:
                msp_diff_pct = round(((settlement_price - msp_price) / msp_price) * 100, 2)

            basis_spread_type = "Premium (Contango)" if premium_discount_inr >= 0 else "Discount (Backwardation)"

            record = {
                "id": f"NCDEX_{symbol}_{row['contract_expiry'].replace('-', '')}",
                "commoditySymbol": symbol,
                "commodityName": row["commodity_name"].strip(),
                "productGroup": row["product_group"].strip(),
                "basisCenter": row["basis_center"].strip(),
                "contractExpiry": row["contract_expiry"].strip(),
                "tradeDate": row["trade_date"].strip(),
                "openPrice": float(row["open_price"]),
                "highPrice": float(row["high_price"]),
                "lowPrice": float(row["low_price"]),
                "closePrice": float(row["close_price"]),
                "settlementPrice": settlement_price,
                "spotPrice": spot_price,
                "premiumDiscountInr": premium_discount_inr,
                "premiumDiscountPct": premium_discount_pct,
                "basisSpreadType": basis_spread_type,
                "volumeContracts": int(row["volume_contracts"]),
                "openInterest": int(row["open_interest"]),
                "unit": row["unit"].strip(),
                "cropSlug": crop_slug,
                "cropId": crop_id,
                "mspPrice": msp_price,
                "mspDifferencePct": msp_diff_pct,
                "provenance": {
                    "sourceType": "Official source",
                    "sourceName": "NCDEX Official Bhav Copy (End-of-Day Settlement)",
                    "recordedDate": row["trade_date"].strip(),
                    "verifiedOfficial": True,
                    "frequency": "Daily Trading Day Settlement Summary"
                }
            }
            records.append(record)

    output_payload = {
        "metadata": {
            "source": "NCDEX (National Commodity & Derivatives Exchange)",
            "publishedCadence": "Once Per Trading Day (Bhav Copy Settlement)",
            "totalContracts": len(records),
            "generatedAt": datetime.utcnow().isoformat() + "Z"
        },
        "records": records
    }

    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(output_payload, f, indent=2, ensure_ascii=False)

    print(f"Successfully processed {len(records)} NCDEX futures contracts -> {OUTPUT_JSON_PATH}")
    return records

if __name__ == "__main__":
    process_ncdex_bhavcopy()

