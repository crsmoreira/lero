#!/usr/bin/env python3
"""Insert mobile header into karsten.html after the product context wrapper."""
import pathlib

# Marker: right after <div class="vtex-product-context-provider"><div class="flex flex-column min-vh-100 w-100">
# We insert the mobile header before <script type="application/ld+json">
SEARCH = '<div class="flex flex-column min-vh-100 w-100"><script type="application/ld+json">'
# We want: <div class="flex flex-column min-vh-100 w-100"> + HEADER + <script type="application/ld+json">

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
        '<div class="flex flex-column min-vh-100 w-100">' + fragment + "\n<script type=\"application/ld+json\">",
        1,
    )
    html_path.write_text(new_html, encoding="utf-8")
    print("Mobile header inserted successfully.")

if __name__ == "__main__":
    main()
