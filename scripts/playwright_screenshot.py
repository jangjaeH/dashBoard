#!/usr/bin/env python3
"""Take a page screenshot with engine fallback.

Usage:
  python scripts/playwright_screenshot.py <url> <output_path>
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from playwright.sync_api import Error, TimeoutError, sync_playwright

ENGINES = ("firefox", "webkit", "chromium")


def _launch(browser_type, engine: str):
    if engine == "chromium":
        return browser_type.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
    return browser_type.launch()


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: python scripts/playwright_screenshot.py <url> <output_path>")
        return 2

    url = sys.argv[1]
    output_path = Path(sys.argv[2])
    output_path.parent.mkdir(parents=True, exist_ok=True)

    preferred = os.getenv("PLAYWRIGHT_ENGINE")
    engines = (preferred,) + tuple(e for e in ENGINES if e != preferred) if preferred else ENGINES

    last_error: Exception | None = None

    with sync_playwright() as p:
        for engine in engines:
            browser = None
            try:
                browser_type = getattr(p, engine)
                browser = _launch(browser_type, engine)
                page = browser.new_page(viewport={"width": 1600, "height": 1000})
                page.goto(url, wait_until="domcontentloaded", timeout=90000)
                page.wait_for_timeout(1200)
                page.screenshot(path=str(output_path), full_page=True)
                print(f"ok:{engine} -> {output_path}")
                return 0
            except (TimeoutError, Error) as exc:
                last_error = exc
                print(f"[{engine}] failed: {exc}")
            finally:
                if browser:
                    try:
                        browser.close()
                    except Exception:
                        pass

    print("All engines failed")
    if last_error:
        print(f"Last error: {last_error}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
