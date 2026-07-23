#!/usr/bin/env python3
"""Slowly scroll the frontmost Google Chrome window without stealing input."""

from __future__ import annotations

import argparse
import subprocess
import time


SCROLL_JS = (
    "(() => { "
    "const step = __STEP__; "
    "const doc = document.scrollingElement || document.documentElement || document.body; "
    "const maxY = Math.max(0, doc.scrollHeight - window.innerHeight); "
    "let direction = Number(window.__codexAutoScrollDirection || 1); "
    "if (window.scrollY >= maxY - 2) direction = -1; "
    "if (window.scrollY <= 2) direction = 1; "
    "const nextY = Math.min(maxY, Math.max(0, window.scrollY + step * direction)); "
    "window.__codexAutoScrollDirection = direction; "
    "window.scrollTo({ top: nextY, left: window.scrollX, behavior: 'instant' }); "
    "return Math.round(nextY) + '/' + Math.round(maxY); "
    "})();"
)


def run_osascript(script: str) -> subprocess.CompletedProcess[str] | None:
    try:
        return subprocess.run(
            ["osascript"],
            input=script,
            capture_output=True,
            text=True,
            check=False,
            timeout=5,
        )
    except subprocess.TimeoutExpired:
        print("Timed out asking Chrome to scroll.", flush=True)
        return None


def scroll_chrome_tab(step: int) -> bool:
    javascript = (
        SCROLL_JS.replace("__STEP__", str(step))
        .replace("\\", "\\\\")
        .replace('"', '\\"')
    )
    script = f'''
tell application "Google Chrome"
    if not running then return "chrome-not-running"
    if (count of windows) is 0 then return "no-window"
    execute active tab of front window javascript "{javascript}"
end tell
'''
    result = run_osascript(script)
    if result is None:
        return False

    if result.returncode != 0:
        print(result.stderr.strip() or "Chrome refused JavaScript automation.", flush=True)
        return False

    message = result.stdout.strip()
    if message in {"chrome-not-running", "no-window"}:
        print(message, flush=True)
        return False

    return True


def auto_scroll(step: int, delay: float, minutes: float) -> None:
    deadline = time.monotonic() + minutes * 60
    while True:
        if time.monotonic() >= deadline:
            print("Time limit reached. Stopped.", flush=True)
            return

        if not scroll_chrome_tab(step):
            print("Stopped because Chrome could not be scrolled safely.", flush=True)
            return

        time.sleep(delay)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Slowly scroll the active tab of Chrome's front window without using "
            "mouse clicks, keyboard input, or focus-stealing activation."
        ),
    )
    parser.add_argument(
        "--step",
        type=int,
        default=12,
        help="Pixels to scroll per tick.",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=0.25,
        help="Seconds between scroll ticks.",
    )
    parser.add_argument(
        "--minutes",
        type=float,
        default=20.0,
        help="How long to run before stopping automatically.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    print(
        f"Auto-scrolling Chrome for {args.minutes:g} minutes. Press Ctrl+C to stop.",
        flush=True,
    )
    print("This script does not click, type, press keys, or activate Chrome.", flush=True)
    try:
        auto_scroll(args.step, args.delay, args.minutes)
    except KeyboardInterrupt:
        print("\nStopped.", flush=True)


if __name__ == "__main__":
    main()
