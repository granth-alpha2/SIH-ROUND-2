import asyncio
import json
import os
import re
from playwright.async_api import async_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

async def fetch_ncdex_live(symbol="KAPAS"):
    print(f"Fetching live NCDEX data for {symbol}...")
    captured_data = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-blink-features=AutomationControlled",
                "--disable-infobars"
            ]
        )

        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )

        page = await context.new_page()

        async def on_response(response):
            url = response.url
            try:
                if any(k in url.lower() for k in ["spot", "chart", "futures", "quote", "bhavcopy", "market-data", "api"]):
                    content_type = response.headers.get("content-type", "")
                    if "json" in content_type:
                        data = await response.json()
                        captured_data.append({"url": url, "data": data})
                        print(f"CAPTURED JSON from: {url}")
            except Exception as e:
                pass

        page.on("response", on_response)

        target_url = f"https://ncdex.com/products/{symbol}"
        print(f"Opening {target_url}...")
        try:
            await page.goto(target_url, wait_until="networkidle", timeout=30000)
        except Exception as e:
            print("Navigation finished/timed out:", e)

        await page.wait_for_timeout(3000)

        title = await page.title()
        print(f"Page title: {title}")

        # Extract chart data directly from DOM / highcharts / SVG
        dom_charts = await page.evaluate('''() => {
            const out = { spots: [], futures: [] };

            // Look for SVG text elements in charts
            const svgTexts = Array.from(document.querySelectorAll('svg text')).map(t => t.textContent.trim());
            out.svgTexts = svgTexts;

            // Look for Highcharts or Chart instances
            if (window.Highcharts && window.Highcharts.charts) {
                out.highchartsData = window.Highcharts.charts.filter(Boolean).map(c => ({
                    title: c.title?.textStr,
                    series: c.series.map(s => ({
                        name: s.name,
                        data: s.data.map(d => ({ x: d.category || d.x, y: d.y }))
                    }))
                }));
            }

            // Look for ApexCharts
            if (window.ApexCharts) {
                out.hasApex = true;
            }

            // Scrape table data if present
            const tables = Array.from(document.querySelectorAll('table')).map(tbl => {
                const rows = Array.from(tbl.querySelectorAll('tr')).map(r => 
                    Array.from(r.querySelectorAll('th, td')).map(c => c.textContent.trim())
                );
                return rows;
            });
            out.tables = tables;

            return out;
        }''')

        print("DOM Charts extraction completed.")
        print(f"SVG text count: {len(dom_charts.get('svgTexts', []))}")
        print(f"Highcharts instances: {len(dom_charts.get('highchartsData', []))}")
        print(f"Tables found: {len(dom_charts.get('tables', []))}")

        result = {
            "symbol": symbol,
            "targetUrl": target_url,
            "title": title,
            "capturedApiData": captured_data,
            "domCharts": dom_charts
        }

        with open(f"data/raw/ncdex_live_{symbol}.json", "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)
        print(f"Saved to data/raw/ncdex_live_{symbol}.json")

        await browser.close()
        return result

if __name__ == "__main__":
    asyncio.run(fetch_ncdex_live("KAPAS"))

