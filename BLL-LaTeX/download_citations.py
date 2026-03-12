import re
import os
import asyncio
import argparse
import urllib.request
from playwright.async_api import (
    async_playwright,
    TimeoutError as PlaywrightTimeoutError,
)


def parse_bib_urls(bib_path):
    """Parses a .bib file and extracts a dictionary of {citation_key: url}."""
    with open(bib_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Regex to match entries: @type{key, ... url={URL} ... }
    # This is a simple regex that works for typical bibtex formatting.
    entries = {}

    # Split by '@' to process each entry individually
    raw_entries = content.split("@")
    for raw in raw_entries[1:]:  # Skip the first empty split
        # Extract the citation key
        key_match = re.search(r"^[^{]+\{([^,]+),", raw)
        if not key_match:
            continue
        key = key_match.group(1).strip()

        # Extract the URL (handles url={...} or url="..." formats)
        url_match = re.search(r'url\s*=\s*[\{"]([^}"]+)[\}"]', raw, re.IGNORECASE)
        if url_match:
            entries[key] = url_match.group(1).strip()

    return entries


async def download_as_pdf(key, url, output_dir, browser):
    """Navigates to the URL and saves it as a PDF."""
    pdf_path = os.path.join(output_dir, f"{key}.pdf")

    if os.path.exists(pdf_path):
        print(f"[SKIP] {key}.pdf already exists.")
        return True

    print(f"[FETCH] Downloading {key} from {url} ...")

    # Ignore invalid or example URLs
    if "example.org" in url or "example.com" in url:
        print(f"[WARN] Skipping example URL for {key}: {url}")
        return False

    # If the URL is already a PDF, download it directly instead of using Playwright
    if url.lower().endswith(".pdf"):
        try:
            print(f"  -> Direct PDF detected. Downloading using urllib...")
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                },
            )
            with (
                urllib.request.urlopen(req) as response,
                open(pdf_path, "wb") as out_file,
            ):
                out_file.write(response.read())
            print(f"[SUCCESS] Saved {key}.pdf (direct download)")
            return True
        except Exception as e:
            print(f"[ERROR] Failed direct download for {key} ({url}): {e}")
            return False

    page = await browser.new_page(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    )
    try:
        # Wait until domcontentloaded instead of networkidle to avoid strict timeouts on pages with many trackers
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=45000)
            # Wait a bit extra for dynamic rendering (like React/Expo docs)
            await page.wait_for_timeout(3000)
        except PlaywrightTimeoutError:
            print(
                f"  -> [WARN] Timeout during load, attempting to print whatever loaded so far..."
            )

        # Print to PDF
        await page.pdf(
            path=pdf_path,
            format="A4",
            print_background=True,
            margin={"top": "1cm", "right": "1cm", "bottom": "1cm", "left": "1cm"},
        )
        print(f"[SUCCESS] Saved {key}.pdf")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to download {key} ({url}): {e}")
        return False
    finally:
        await page.close()


async def main():
    parser = argparse.ArgumentParser(
        description="Download BibTeX URLs as PDFs for physical printing."
    )
    parser.add_argument("--bib", default="references.bib", help="Path to the .bib file")
    parser.add_argument(
        "--out", default="printed_sources", help="Output directory for PDFs"
    )
    args = parser.parse_args()

    if not os.path.exists(args.bib):
        print(f"Error: Could not find '{args.bib}'")
        return

    # Create output directory
    os.makedirs(args.out, exist_ok=True)

    print(f"Parsing {args.bib} for URLs...")
    urls = parse_bib_urls(args.bib)
    print(f"Found {len(urls)} sources with URLs.\n")

    async with async_playwright() as p:
        # Launch Chromium (headless)
        browser = await p.chromium.launch(headless=True)

        success_count = 0
        for key, url in urls.items():
            success = await download_as_pdf(key, url, args.out, browser)
            if success:
                success_count += 1

        await browser.close()

    print(f"\nDone! Successfully downloaded {success_count}/{len(urls)} sources.")
    print(f"You can find your PDFs ready for printing in the '{args.out}/' directory.")


if __name__ == "__main__":
    asyncio.run(main())
