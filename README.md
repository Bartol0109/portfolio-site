# Visora Digital – Portfolio (React)

Portfolio stranica u Reactu (Vite), tamna tema s geometrijskim elementima i magic rings pozadinom.

## Kako pokrenuti

```bash
npm install
npm run dev
```

Otvori [http://localhost:5173](http://localhost:5173).

## Build za produkciju

```bash
npm run build
```

Izlaz je u mapi `dist/`. Prebaci sadržaj `dist/` na server (npr. u `public_html`).

## Struktura

- `src/` – React aplikacija
  - `main.jsx` – ulazna točka
  - `App.jsx` – routing (/, /portfolio)
  - `index.css` – globalni stilovi (kopija originalnog CSS-a)
  - `components/` – Header, Footer, MagicRings, Geo, Sidebar, Lightbox, Layout
  - `pages/` – Home, Portfolio
- `public/` – statičke datoteke (slike, favicon) – kopiraju se u root pri buildu
- `index.html` – Vite entry (root + script u src/main.jsx)

## Što prilagoditi

- **Tekst** – u `src/pages/Home.jsx` (hero, about, contact) i `src/pages/Portfolio.jsx` (projekti).
- **Contact forma** – Formspree endpoint u `Home.jsx` (`action="https://formspree.io/f/xbdzkwjj"`).
- **Boja akcenta** – u `src/index.css`: varijabla `--accent`.

Font: [Outfit](https://fonts.google.com/specimen/Outfit) (Google Fonts).
