#!/usr/bin/env python3
"""Insert mobile header into karsten.html (no top bar, search below row)."""
import pathlib

# Insert header as first child of main content wrapper (before product context)
SEARCH = '<div class="vtex-store__template bg-base"><div class="flex flex-column min-vh-100 w-100"><div class="vtex-product-context-provider">'

def main():
    base = pathlib.Path(__file__).resolve().parent.parent
    html_path = base / "public" / "karsten.html"
    fragment_path = base / "public" / "header_mobile_fragment.html"
    html = html_path.read_text(encoding="utf-8")
    fragment = fragment_path.read_text(encoding="utf-8")
    if SEARCH not in html:
        raise SystemExit("Marker not found in karsten.html")
    new_html = html.replace(
        SEARCH,
        '<div class="vtex-store__template bg-base"><div class="flex flex-column min-vh-100 w-100">' + fragment + '<div class="vtex-product-context-provider">',
        1,
    )
    html_path.write_text(new_html, encoding="utf-8")
    print("Mobile header inserted.")

if __name__ == "__main__":
    main()
