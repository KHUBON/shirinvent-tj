#!/usr/bin/env python3
"""Upgrade HTML headers for professional mobile drawer."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PHONE_SVG = (
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
    'stroke-linecap="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 '
    '19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 '
    '014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 '
    '16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>'
    "</svg>"
)

MENU_SVG = (
    '<span class="menu-toggle-icon menu-toggle-icon--open" aria-hidden="true">'
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
    'stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></span>'
    '<span class="menu-toggle-icon menu-toggle-icon--close" aria-hidden="true">'
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
    'stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></span>'
)

BRAND_RE = re.compile(
    r'<a class="brand" href="[^"]+">'
    r'<img class="brand-mark" src="\.\./assets/images/logo\.svg" alt="Shirinvent" width="260" height="60">'
    r"(<span class=\"brand-copy\">.*?</span>)"
    r"</a>",
    re.DOTALL,
)

BRAND_REPLACEMENT = (
    '<a class="brand" href="{href}">'
    '<img class="brand-mark brand-mark--full" src="../assets/images/logo.svg" '
    'alt="Shirinvent" width="260" height="60">'
    '<img class="brand-mark brand-mark--icon" src="../assets/images/logo-icon.svg" '
    'alt="" width="56" height="56" aria-hidden="true">'
    "{copy}</a>"
)

VIEWPORT_RE = re.compile(
    r'<meta name="viewport" content="width=device-width, initial-scale=1">'
)
VIEWPORT_NEW = (
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
)

MENU_BTN_RE = re.compile(
    r'<button class="menu-toggle" type="button" data-menu-button aria-expanded="false"[^>]*>≡</button>'
)

PHONE_BTN = (
    '<a class="header-phone" href="tel:+992934444119" aria-label="{phone_label}">'
    + PHONE_SVG
    + "</a>"
)

DRAWER_RE = re.compile(
    r'\s*<div class="shell mobile-panel" data-mobile-panel><nav>(.*?)</nav></div>\s*</header>',
    re.DOTALL,
)


def drawer_block(lang: str, nav_links: str, lang_switch: str, cta_href: str, cta_text: str) -> str:
    menu_title = "Меню" if lang == "ru" else "Меню"
    close_label = "Закрыть" if lang == "ru" else "Пӯшидан"
    phone_label = "Позвонить" if lang == "ru" else "Занг задан"
    wa_text = "WhatsApp"
    return f"""
  </header>
  <div class="mobile-overlay" data-mobile-overlay aria-hidden="true"></div>
  <aside class="mobile-drawer" data-mobile-panel id="mobile-menu" aria-hidden="true">
    <div class="mobile-drawer-head">
      <span class="mobile-drawer-title">{menu_title}</span>
      <button class="menu-close" type="button" data-menu-close aria-label="{close_label}">×</button>
    </div>
    <nav class="mobile-drawer-nav">{nav_links}</nav>
    <div class="mobile-drawer-tools">
      {lang_switch}
      <button class="theme-toggle theme-toggle--drawer" type="button" data-theme-toggle aria-pressed="true" aria-label="Тема"><span class="theme-icon-sun">☀</span><span class="theme-icon-moon">☾</span></button>
    </div>
    <div class="mobile-drawer-cta">
      <a class="cta cta-block" href="{cta_href}">{cta_text}</a>
      <a class="whatsapp cta-block" href="https://wa.me/992934444119">{wa_text}</a>
      <a class="ghost cta-block" href="tel:+992934444119">+992 93 444 41 19</a>
    </div>
  </aside>"""


def patch_file(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    lang = "ru" if "/ru/" in str(path) else "tj"

    text = VIEWPORT_RE.sub(VIEWPORT_NEW, text)

    def brand_sub(match: re.Match) -> str:
        href = re.search(r'href="([^"]+)"', match.group(0)).group(1)
        return BRAND_REPLACEMENT.format(href=href, copy=match.group(1))

    text = BRAND_RE.sub(brand_sub, text)

    phone_label = "Позвонить" if lang == "ru" else "Занг задан"
    if "header-phone" not in text:
        text = MENU_BTN_RE.sub(
            PHONE_BTN.format(phone_label=phone_label)
            + f'<button class="menu-toggle" type="button" data-menu-button aria-expanded="false" aria-controls="mobile-menu" aria-label="{"Меню" if lang == "ru" else "Меню"}">'
            + MENU_SVG
            + "</button>",
            text,
        )

    drawer_match = DRAWER_RE.search(text)
    if not drawer_match:
        return

    nav_links = drawer_match.group(1).strip()
    lang_match = re.search(r'<div class="lang-switch">(.*?)</div>', text, re.DOTALL)
    lang_switch = (
        f'<div class="lang-switch lang-switch--drawer">{lang_match.group(1)}</div>'
        if lang_match
        else ""
    )
    cta_match = re.search(
        r'<div class="header-actions">.*?<a class="cta" href="([^"]+)">([^<]+)</a>',
        text,
        re.DOTALL,
    )
    cta_href = cta_match.group(1) if cta_match else "./contacts.html#lead-form"
    cta_text = cta_match.group(2) if cta_match else ("Заявка" if lang == "ru" else "Дархост")

    text = DRAWER_RE.sub(drawer_block(lang, nav_links, lang_switch, cta_href, cta_text), text)
    path.write_text(text, encoding="utf-8")
    print(f"patched {path.relative_to(ROOT)}")


def main() -> None:
    for folder in ("ru", "tj"):
        for path in sorted((ROOT / folder).glob("*.html")):
            patch_file(path)


if __name__ == "__main__":
    main()