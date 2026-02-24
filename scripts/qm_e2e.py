#!/usr/bin/env python3
"""QM smoke E2E for dashboard + data-management with browser fallback."""

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


def run_qm(page, base_url: str, artifacts_dir: Path) -> None:
    page.goto(f"{base_url}/dashboard", wait_until="domcontentloaded", timeout=90000)
    page.wait_for_timeout(1200)

    canvas = page.locator('div[style*="width: 1200px"]').first
    page.locator('button[title="삼각형"]').drag_to(canvas)
    page.wait_for_timeout(200)
    page.locator('button[title="마름모"]').drag_to(canvas)
    page.wait_for_timeout(300)

    draggable = page.locator('div[draggable="true"]')
    if draggable.count() > 0:
        draggable.first.click()
        page.wait_for_timeout(200)

    page.screenshot(path=str(artifacts_dir / "qm-dashboard-flow.png"), full_page=True)

    page.goto(f"{base_url}/data-management", wait_until="domcontentloaded", timeout=90000)
    page.wait_for_timeout(900)
    page.get_by_placeholder('코드').fill('QM_TEMP_001')
    page.get_by_placeholder('MQTT topic').fill('qm/temp/topic')
    page.get_by_placeholder('설명').fill('QM 자동테스트 입력')
    page.screenshot(path=str(artifacts_dir / "qm-data-grid-flow.png"), full_page=True)


def main() -> int:
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3000"
    artifacts_dir = Path(sys.argv[2] if len(sys.argv) > 2 else "artifacts")
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    preferred = os.getenv("PLAYWRIGHT_ENGINE")
    engines = (preferred,) + tuple(e for e in ENGINES if e != preferred) if preferred else ENGINES

    last_error: Exception | None = None

    with sync_playwright() as p:
        for engine_name in engines:
            browser = None
            try:
                browser_type = getattr(p, engine_name)
                browser = _launch(browser_type, engine_name)
                page = browser.new_page(viewport={"width": 1680, "height": 1050})
                run_qm(page, base_url, artifacts_dir)
                print(f"ok:{engine_name}")
                print(f"Artifacts: {artifacts_dir / 'qm-dashboard-flow.png'}, {artifacts_dir / 'qm-data-grid-flow.png'}")
                return 0
            except (TimeoutError, Error) as exc:
                last_error = exc
                print(f"[{engine_name}] failed: {exc}")
            finally:
                if browser:
                    try:
                        browser.close()
                    except Exception:
                        pass

    print("QM failed on all engines")
    if last_error:
        print(f"Last error: {last_error}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
