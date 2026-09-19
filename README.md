# Cineflow Addon

A modified version of MalluFlix that **removes global search participation** while keeping all catalogs available in Discover/Home.

---

## 🎯 Purpose

This version is designed for:

- Nuvio Companion users
- Stremio users who want cleaner search results
- Avoiding clutter from MalluFlix catalogs in global search

---

## ✅ What’s Changed

- ❌ Removed `search` capability from all catalogs
- ✅ Kept all catalogs (New Releases, OTT, Genres, etc.)
- ✅ Works normally in Discover/Home
- ✅ Fully compatible with Stremio / Nuvio

---

## ⚙️ How It Works

The original addon declares:

```js
extra: [{ name: "search" }, { name: "skip" }]

This version changes it to:

extra: [{ name: "skip" }]
```

So the addon:

❌ Does NOT appear in search results
✅ Still shows all catalogs

🚀 Installation
Option 1 — Direct Install

Paste this into Stremio / Nuvio:

https://cineflow-8w0j.onrender.com/manifest.json

🧪 Test Before Installing

Open in browser:

https://cineflow-8w0j.onrender.com/manifest.json

Check that catalogs contain:

"extra": [{ "name": "skip" }]

NOT:

"extra": [{ "name": "search" }, { "name": "skip" }]


⚠️ Disclaimer

This project is a modification of the original MalluFlix addon.

This repository does not host or distribute content
It only modifies addon behavior
Use at your own responsibility
🙌 Credits

Original MalluFlix developers
Modified by: https://github.com/datainterpretor

📌 Version
v3.0.1

