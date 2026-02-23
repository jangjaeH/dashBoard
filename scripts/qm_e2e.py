#!/usr/bin/env python3
"""QM smoke E2E for dashboard + data-management with browser fallback.

Usage:
  python scripts/qm_e2e.py [base_url] [artifacts_dir]

Defaults:
  base_url=http://127.0.0.1:3000
  artifacts_dir=artifacts
"""

from __future__ import annotations

import sys
from pathlib import Path

from playwright.sync_api import Error, TimeoutError, sync_playwright

ENGINES = ("chromium", "firefox", "webkit")


def run_qm(page, base_url: str, artifacts_dir: Path) -> None:
    # Dashboard steps
    page.goto(f"{base_url}/dashboard", wait_until="commit", timeout=90000)
    page.wait_for_timeout(1200)

    canvas = page.locator('div[style*="width: 1200px"]').first

    # add two shapes + select first element (for right panel controls)
    page.locator('button[title="삼각형"]').drag_to(canvas)
    page.wait_for_timeout(200)
    page.locator('button[title="마름모"]').drag_to(canvas)
    page.wait_for_timeout(300)

    draggable = page.locator('div[draggable="true"]')
    if draggable.count() > 0:
        draggable.first.click()
        page.wait_for_timeout(200)

    page.screenshot(path=str(artifacts_dir / "qm-dashboard-flow.png"), full_page=True)

    # Data management steps
    page.goto(f"{base_url}/data-management", wait_until="commit", timeout=90000)
    page.wait_for_timeout(900)

    # fill add form (no submit to avoid env DB dependency side effects)
    page.get_by_placeholder('코드').fill('QM_TEMP_001')
    page.get_by_placeholder('MQTT topic').fill('qm/temp/topic')
    page.get_by_placeholder('설명').fill('QM 자동테스트 입력')

    page.screenshot(path=str(artifacts_dir / "qm-data-grid-flow.png"), full_page=True)


def main() -> int:
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3000"
    artifacts_dir = Path(sys.argv[2] if len(sys.argv) > 2 else "artifacts")
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    last_error: Exception | None = None

    with sync_playwright() as p:
        for engine_name in ENGINES:
            browser_type = getattr(p, engine_name)
            try:
                browser = browser_type.launch()
                page = browser.new_page(viewport={"width": 1680, "height": 1050})
                run_qm(page, base_url, artifacts_dir)
                browser.close()
                print(f"QM success with {engine_name}")
                print(f"Artifacts: {artifacts_dir / 'qm-dashboard-flow.png'}, {artifacts_dir / 'qm-data-grid-flow.png'}")
                return 0
            except (TimeoutError, Error) as exc:
                last_error = exc
                print(f"[{engine_name}] failed: {exc}")
                try:
                    browser.close()  # type: ignore[name-defined]
                except Exception:
                    pass

    print("QM failed on all engines")
    if last_error:
        print(f"Last error: {last_error}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
