const { addonBuilder } = require("stremio-addon-sdk");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const TMDB_KEY = "f9c647e90d881403fa2569b88fc3bc79";

if (!TMDB_KEY) {
    console.warn("WARNING: TMDB_KEY environment variable is not set.");
}

const GENRES = {
    "Action": 28,
    "Adventure": 12,
    "Comedy": 35,
    "Crime": 80,
    "Documentary": 99,
    "Drama": 18,
    "Family": 10751,
    "Fantasy": 14,
    "History": 36,
    "Horror": 27,
    "Music": 10402,
    "Mystery": 9648,
    "Romance": 10749,
    "Science Fiction": 878,
    "Thriller": 53
};

// Check if urls.json has a valid URL
const urlsPath = path.join(__dirname, "urls.json");
let urlsData = {};

try {
    if (fs.existsSync(urlsPath)) {
        urlsData = JSON.parse(
            fs.readFileSync(urlsPath, "utf8")
        );
    }
} catch (e) {
    console.error("Error reading urls.json:", e);
}

const hasUrl =
    urlsData &&
    urlsData.url &&
    urlsData.url.trim() !== "";

// ============================================================
// CINEFLOW MANIFEST
// ============================================================

const manifest = {
    id: "org.cineflow.addon",
    version: "1.0.0",
    name: "Cineflow",
    description:
        "Cineflow — Malayalam movie catalog powered by TMDB with Cinemeta compatibility",

    // Direct image URL from GitHub repository
    logo:
        "https://raw.githubusercontent.com/datainterpretor/Cineflow/main/cineflow.png",

    resources: [
        "catalog",
        "meta",
        "stream"
    ],

    types: [
        "movie"
    ],

    catalogs: [

        // ----------------------------------------------------
        // NEW RELEASES
        // ----------------------------------------------------
        {
            type: "movie",
            id: "malluflix_catalog",
            name: "Now Running",
            extra: [
                {
                    name: "skip"
                }
            ]
        },

        // ----------------------------------------------------
        // OTT RELEASED
        // ----------------------------------------------------
        {
            type: "movie",
            id: "malluflix_ott",
            name: "OTT Released",
            extra: [
                {
                    name: "skip"
                }
            ]
        },

        // ----------------------------------------------------
        // FUTURE RELEASES
        // ----------------------------------------------------
        {
            type: "movie",
            id: "malluflix_future",
            name: " Future Releases",
            extra: [
                {
                    name: "skip"
                }
            ]
        },

        // ----------------------------------------------------
        // GENRE CATALOGS
        // ----------------------------------------------------
        ...Object.keys(GENRES).map(name => ({
            type: "movie",
            id: `malluflix_genre_${name
                .toLowerCase()
                .replace(/\s+/g, "_")}`,
            name: `Cineflow ${name}`,
            extra: [
                {
                    name: "skip"
                }
            ]
        })),

        // ----------------------------------------------------
        // OPTIONAL DIRECT STREAM
        // ----------------------------------------------------
        ...(hasUrl
            ? [
                  {
                      type: "movie",
                      id: "malluflix_streams",
                      name: "Cineflow Direct Streams",
                      extra: [
                          {
                              name: "skip"
                          }
                      ]
                  }
              ]
            : [])
    ],

    // IMPORTANT:
    // These are internal IDs. Keep them unchanged for now.
    idPrefixes: [
        "tt",
        "malluflix_"
    ]
};

const builder = new addonBuilder(manifest);

// ============================================================
// CACHE
// ============================================================

const CACHE_EXPIRY = 24 * 60 * 60 * 1000;
const cache = new Map();

async function fetchWithCache(url, config = {}) {

    const key =
        url +
        JSON.stringify(config.params || {});

    const cached = cache.get(key);

    if (
        cached &&
        Date.now() - cached.timestamp < CACHE_EXPIRY
    ) {
        console.log(`Cache hit for: ${url}`);
        return cached.data;
    }

    console.log(`Cache miss for: ${url}. Fetching...`);

    const response = await axios.get(
        url,
        config
    );

    cache.set(key, {
        data: response.data,
        timestamp: Date.now()
    });

    return response.data;
}

// ============================================================
// TMDB → IMDb ID
// ============================================================

async function tmdbToImdb(tmdbId) {

    if (!TMDB_KEY) {
        console.error(
            "TMDB_KEY is missing. Cannot convert TMDB ID to IMDb ID."
        );

        return null;
    }

    try {

        const data = await fetchWithCache(
            `https://api.themoviedb.org/3/movie/${tmdbId}/external_ids`,
            {
                params: {
                    api_key: TMDB_KEY
                }
            }
        );

        return data.imdb_id;

    } catch (error) {

        console.error(
            `Failed to get IMDb ID for TMDB ${tmdbId}:`,
            error.message
        );

        return null;
    }
}

// ============================================================
// CINEFLOW CATALOG
// ============================================================

builder.defineCatalogHandler(
    async ({ type, id, extra }) => {

        // ----------------------------------------------------
        // DIRECT STREAM CATALOG
        // ----------------------------------------------------

        if (id === "malluflix_streams") {

            if (!hasUrl) {
                return {
                    metas: []
                };
            }

            return {
                metas: [
                    {
                        id: "malluflix_direct_stream",
                        type: "movie",
                        name: "Cineflow Direct Stream",
                        poster:
                            "https://raw.githubusercontent.com/datainterpretor/Cineflow/main/cineflow.png",
                        description:
                            "Direct play from urls.json"
                    }
                ]
            };
        }

        // ----------------------------------------------------
        // VALIDATE CATALOG
        // ----------------------------------------------------

        const isGenreCatalog =
            id.startsWith("malluflix_genre_");

        if (
            type !== "movie" ||
            (
                ![
                    "malluflix_catalog",
                    "malluflix_ott",
                    "malluflix_future"
                ].includes(id) &&
                !isGenreCatalog
            )
        ) {
            return {
                metas: []
            };
        }

        // ----------------------------------------------------
        // PAGINATION
        // ----------------------------------------------------

        const skip =
            extra?.skip
                ? parseInt(extra.skip)
                : 0;

        const page =
            Math.round(skip / 20) + 1;

        const today =
            new Date()
                .toISOString()
                .split("T")[0];

        // ----------------------------------------------------
        // BASE TMDB PARAMETERS
        // ----------------------------------------------------

        const params = {
            api_key: TMDB_KEY,
            with_original_language: "ml",
            sort_by: "primary_release_date.desc"
        };

        // ----------------------------------------------------
        // OTT RELEASES
        // ----------------------------------------------------

        if (id === "malluflix_ott") {

            params["release_date.lte"] = today;

            params.with_release_type = "4|5";

            params.region = "IN";

            params.sort_by =
                "release_date.desc";
        }

        // ----------------------------------------------------
        // FUTURE RELEASES
        // ----------------------------------------------------

        else if (id === "malluflix_future") {

            params["primary_release_date.gte"] =
                today;

            params.sort_by =
                "primary_release_date.asc";
        }

        // ----------------------------------------------------
        // GENRE
        // ----------------------------------------------------

        else if (isGenreCatalog) {

            const genreName =
                id.replace(
                    "malluflix_genre_",
                    ""
                );

            const genreId =
                Object.entries(GENRES)
                    .find(
                        ([name]) =>
                            name
                                .toLowerCase()
                                .replace(/\s+/g, "_") ===
                            genreName
                    )?.[1];

            if (genreId) {

                params["primary_release_date.lte"] =
                    today;

                params.with_genres =
                    genreId.toString();

                params.sort_by =
                    "primary_release_date.desc";
            }
        }

        // ----------------------------------------------------
        // DEFAULT NEW RELEASES
        // ----------------------------------------------------

        else {

            params["primary_release_date.lte"] =
                today;

            params.sort_by =
                "primary_release_date.desc";
        }

        // ----------------------------------------------------
        // FETCH 3 TMDB PAGES
        // ----------------------------------------------------

        const promises =
            [page, page + 1, page + 2].map(
                p =>
                    fetchWithCache(
                        "https://api.themoviedb.org/3/discover/movie",
                        {
                            params: {
                                ...params,
                                page: p
                            }
                        }
                    )
            );

        const responses =
            await Promise.all(promises);

        const results =
            responses.flatMap(
                r => r.results || []
            );

        // ----------------------------------------------------
        // CONVERT TMDB → IMDb
        // ----------------------------------------------------

        const batchSize = 5;

        const validMetas = [];

        for (
            let i = 0;
            i < results.length;
            i += batchSize
        ) {

            const chunk =
                results.slice(
                    i,
                    i + batchSize
                );

            const chunkPromises =
                chunk.map(
                    async m => {

                        const imdb =
                            await tmdbToImdb(
                                m.id
                            );

                        if (!imdb) {
                            return null;
                        }

                        return {
                            id: imdb,
                            type: "movie",
                            name: m.title,

                            poster:
                                m.poster_path
                                    ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
                                    : null,

                            description:
                                m.overview
                        };
                    }
                );

            const chunkResults =
                await Promise.all(
                    chunkPromises
                );

            validMetas.push(
                ...chunkResults.filter(
                    m => m !== null
                )
            );
        }

        return {
            metas: validMetas
        };
    }
);

// ============================================================
// CINEMETA METADATA
// ============================================================

builder.defineMetaHandler(
    async ({ type, id }) => {

        if (type !== "movie") {
            return {
                meta: null
            };
        }

        // ----------------------------------------------------
        // DIRECT STREAM METADATA
        // ----------------------------------------------------

        if (
            id === "malluflix_direct_stream"
        ) {

            return {
                meta: {
                    id:
                        "malluflix_direct_stream",

                    type: "movie",

                    name:
                        "Cineflow Direct Stream",

                    poster:
                        "https://raw.githubusercontent.com/datainterpretor/Cineflow/main/cineflow.png",

                    description:
                        "Direct play from urls.json",

                    background:
                        "https://raw.githubusercontent.com/datainterpretor/Cineflow/main/cineflow.png"
                }
            };
        }

        // ----------------------------------------------------
        // CINEMETA
        // ----------------------------------------------------

        const data =
            await fetchWithCache(
                `https://v3-cinemeta.strem.io/meta/movie/${id}.json`
            );

        return {
            meta:
                data.meta || data
        };
    }
);

// ============================================================
// STREAM HANDLER
// ============================================================

builder.defineStreamHandler(
    async ({ type, id }) => {

        if (
            type !== "movie" ||
            id !== "malluflix_direct_stream"
        ) {
            return {
                streams: []
            };
        }

        if (hasUrl) {

            return {
                streams: [
                    {
                        title:
                            "Cineflow Direct Stream",

                        url:
                            urlsData.url
                    }
                ]
            };
        }

        return {
            streams: []
        };
    }
);

// ============================================================
// EXPORT
// ============================================================

module.exports =
    builder.getInterface();
