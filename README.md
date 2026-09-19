# Cineflow

Cineflow is a Stremio addon focused on Malayalam movies. It provides Malayalam movie catalogs such as new releases, OTT releases, future releases, and genre-based catalogs.

Cineflow is designed to work with **Stremio** and **Nuvio Companion**.

## Features

- Malayalam movie catalogs
- New Releases
- OTT Released
- Future Releases
- Genre catalogs
- TMDB-powered movie discovery
- Cinemeta-compatible movie metadata
- Optional direct-stream catalog when configured
- Does **not** advertise global search support, so Cineflow catalogs are not requested as search results by clients such as Nuvio

## Installation

### Stremio

1. Open Stremio.
2. Open the **Addons** section.
3. Choose **Add addon** / **Install from URL**.
4. Paste the Cineflow manifest URL:

```text
https://cineflow-8w0j.onrender.com/manifest.json
```

5. Install the addon.
6. Open **Discover** and select the Cineflow catalogs.

### Nuvio Companion

1. Open Nuvio Companion.
2. Open **Addons**.
3. Choose the option to add an addon by URL.
4. Paste:

```text
https://cineflow-8w0j.onrender.com/manifest.json
```

5. Install Cineflow.
6. Cineflow catalogs can then be used from the catalog/discover sections.

Cineflow does not declare a `search` capability. This is intentional: its catalogs remain available for browsing, while the addon does not participate in global text searches.


## Configuration

The addon uses a TMDB API key for movie discovery. For deployment, keep the API key outside the public repository and provide it through the server environment.

## Disclaimer

Cineflow is an addon project. This repository does not host or distribute movie files. Availability of metadata or streams depends on the configured services and sources.

## Credits

Based on the original MalluFlix addon structure.

Modified and maintained as Cineflow by [datainterpretor](https://github.com/datainterpretor).
