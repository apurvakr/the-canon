# The Canon

**115 papers · 9 themes · one library.** An interactive guide to the papers that most shaped how we understand economics and political philosophy — each one summarised, rated for difficulty, linked to the source, and woven into a 3-D map of connected ideas.

## What's inside
- A full-bleed landing page with a registration form (Formspree).
- An editorial **Index** of all 115 papers, grouped into 9 thematic clusters.
- A **Connections** view — a rotating 3-D globe of the papers and their idea-threads.
- A reading page for every paper.

## Run it locally
It's a static site — no build step. Either:
- Open `index.html` directly in a browser, **or**
- Serve the folder (recommended, avoids any file:// quirks):
  ```bash
  python3 -m http.server 8000
  # then visit http://localhost:8000
  ```

## Deploy on GitHub Pages
1. Push this folder's contents to a GitHub repo.
2. Repo **Settings → Pages → Build and deployment → Deploy from a branch → `main` / root**.
3. Your site goes live at `https://<your-username>.github.io/<repo>/`.

## Notes
- React, ReactDOM and Babel load from a CDN (unpkg); fonts from Google Fonts; author portraits from Wikimedia Commons. An internet connection is required.
- The landing form posts to the Formspree endpoint set at the top of `canon/landing.jsx`.
