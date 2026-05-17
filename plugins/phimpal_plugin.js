// =============================================================================
// PhimPal Plugin - legacy.phimpal.com
// Version: 1.0.0
// ES5-only vanilla JavaScript plugin for ReVax runtime
// =============================================================================

var BASE_URL = "https://legacy.phimpal.com";

// =============================================================================
// INTERNAL UTILITY FUNCTIONS
// =============================================================================

/**
 * Decode HTML entities to their corresponding characters.
 * Handles named entities (&amp; &lt; &gt; &quot; &#39;) and numeric references (&#NNN;)
 */
function decodeEntities(str) {
    if (!str) return "";
    var result = str;
    result = result.replace(/&amp;/g, "&");
    result = result.replace(/&lt;/g, "<");
    result = result.replace(/&gt;/g, ">");
    result = result.replace(/&quot;/g, '"');
    result = result.replace(/&#39;/g, "'");
    result = result.replace(/&#(\d+);/g, function(match, dec) {
        return String.fromCharCode(parseInt(dec, 10));
    });
    return result;
}

/**
 * Strip HTML tags, decode entities, and normalize whitespace.
 */
function cleanText(text) {
    if (!text) return "";
    var result = text.replace(/<[^>]*>/g, "");
    result = decodeEntities(result);
    result = result.replace(/\s+/g, " ");
    result = result.replace(/^\s+|\s+$/g, "");
    return result;
}

/**
 * Prepend BASE_URL to relative paths starting with "/".
 * Pass through absolute URLs unchanged.
 */
function absoluteUrl(url) {
    if (!url) return "";
    if (url.indexOf("http://") === 0 || url.indexOf("https://") === 0) {
        return url;
    }
    if (url.indexOf("/") === 0) {
        return BASE_URL + url;
    }
    return url;
}

// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

/**
 * Return home screen sections for PhimPal.
 * Each section has slug, title, type, and path fields.
 */
function getHomeSections() {
    return JSON.stringify([
        { slug: "top", title: "Phim Đề Cử", type: "Horizontal", path: "" },
        { slug: "type/movie", title: "Phim Lẻ Mới", type: "Horizontal", path: "" },
        { slug: "type/show", title: "Phim Bộ Mới", type: "Horizontal", path: "" }
    ]);
}

// =============================================================================
// INTERNAL UTILITY FUNCTIONS (continued)
// =============================================================================

/**
 * Extract pagination info from HTML pagination links.
 * Returns {currentPage: N, totalPages: N}, defaulting to {currentPage:1, totalPages:1}
 */
function extractPagination(html) {
    var currentPage = 1;
    var totalPages = 1;

    if (!html) return { currentPage: currentPage, totalPages: totalPages };

    // Try to find the active/current page indicator
    var activeMatch = html.match(/<(?:li|span|a)[^>]*class="[^"]*active[^"]*"[^>]*>[\s\S]*?(\d+)[\s\S]*?<\/(?:li|span|a)>/i);
    if (activeMatch) {
        currentPage = parseInt(activeMatch[1], 10) || 1;
    }

    // Find all page numbers in pagination links
    var pageRegex = /[?&]page=(\d+)/g;
    var match;
    while ((match = pageRegex.exec(html)) !== null) {
        var pageNum = parseInt(match[1], 10);
        if (pageNum > totalPages) {
            totalPages = pageNum;
        }
    }

    // Also check for page numbers in pagination anchor text
    var pageLinkRegex = /<a[^>]*[?&]page=\d+[^>]*>[\s\S]*?<\/a>/gi;
    var pageLinks = html.match(pageLinkRegex);
    if (pageLinks) {
        for (var i = 0; i < pageLinks.length; i++) {
            var numMatch = pageLinks[i].match(/[?&]page=(\d+)/);
            if (numMatch) {
                var num = parseInt(numMatch[1], 10);
                if (num > totalPages) {
                    totalPages = num;
                }
            }
        }
    }

    // Ensure totalPages is at least currentPage
    if (currentPage > totalPages) {
        totalPages = currentPage;
    }

    return { currentPage: currentPage, totalPages: totalPages };
}

// =============================================================================
// CONFIGURATION FUNCTIONS
// =============================================================================

/**
 * Returns filter configuration with sort, category, country, and year arrays.
 * Each element has name (string) and value (string) fields.
 */
function getFilterConfig() {
    var sort = [
        { name: "Mới nhất", value: "latest" },
        { name: "Xem nhiều nhất", value: "most-viewed" },
        { name: "Đánh giá cao", value: "rating" }
    ];

    var category = [
        { name: "Hành Động", value: "hanh-dong" },
        { name: "Phiêu Lưu", value: "phieu-luu" },
        { name: "Hài", value: "hai" },
        { name: "Tình Cảm", value: "tinh-cam" },
        { name: "Lãng Mạn", value: "lang-man" },
        { name: "Chính Kịch", value: "chinh-kich" },
        { name: "Khoa Học Viễn Tưởng", value: "khoa-hoc-vien-tuong" },
        { name: "Kinh Dị", value: "kinh-di" },
        { name: "Hoạt Hình", value: "hoat-hinh" },
        { name: "Tâm Lý", value: "tam-ly" },
        { name: "Hành Động & Phiêu Lưu", value: "hanh-dong-phieu-luu" }
    ];

    var country = [
        { name: "Mỹ", value: "US" },
        { name: "Hàn Quốc", value: "KR" },
        { name: "Nhật Bản", value: "JP" },
        { name: "Trung Quốc", value: "CN" },
        { name: "Việt Nam", value: "VN" },
        { name: "Anh", value: "GB" },
        { name: "Pháp", value: "FR" },
        { name: "Thái Lan", value: "TH" },
        { name: "Ấn Độ", value: "IN" }
    ];

    var year = [];
    for (var y = 2026; y >= 2000; y--) {
        year.push({ name: String(y), value: String(y) });
    }

    return JSON.stringify({
        sort: sort,
        category: category,
        country: country,
        year: year
    });
}

// =============================================================================
// CONFIGURATION FUNCTIONS
// =============================================================================

/**
 * Returns plugin manifest as a JSON string with identity and capabilities.
 */
function getManifest() {
    return JSON.stringify({
        id: "phimpal",
        name: "PhimPal",
        version: "1.0.0",
        baseUrl: "https://legacy.phimpal.com",
        iconUrl: "https://raw.githubusercontent.com/youngbi/repo/main/plugins/phimpal.png",
        isEnabled: true,
        isAdult: false,
        type: "MOVIE",
        layoutType: "VERTICAL"
    });
}

// =============================================================================
// getPrimaryCategories - Returns primary genre categories
// =============================================================================

/**
 * Returns primary genre categories as a JSON string array.
 * Each object has name (Vietnamese genre name) and slug (URL-safe identifier).
 */
function getPrimaryCategories() {
    var categories = [
        { name: "Hành Động", slug: "hanh-dong" },
        { name: "Phiêu Lưu", slug: "phieu-luu" },
        { name: "Hài", slug: "hai" },
        { name: "Tình Cảm", slug: "tinh-cam" },
        { name: "Lãng Mạn", slug: "lang-man" },
        { name: "Chính Kịch", slug: "chinh-kich" },
        { name: "Khoa Học Viễn Tưởng", slug: "khoa-hoc-vien-tuong" },
        { name: "Kinh Dị", slug: "kinh-di" },
        { name: "Hoạt Hình", slug: "hoat-hinh" },
        { name: "Tâm Lý", slug: "tam-ly" },
        { name: "Hành Động & Phiêu Lưu", slug: "hanh-dong-phieu-luu" }
    ];
    return JSON.stringify(categories);
}

// =============================================================================
// URL GENERATION FUNCTIONS
// =============================================================================

/**
 * Generate listing URL based on slug and filters with precedence:
 * category > country > year > slug-based path.
 * Appends ?page={n} only when page > 1.
 * Returns a plain URL string (not JSON-encoded).
 */
function getUrlList(slug, filtersJson) {
    try {
        var filters = {};
        try {
            if (filtersJson && typeof filtersJson === "string") {
                filters = JSON.parse(filtersJson);
            }
        } catch (e) {
            filters = {};
        }

        // Ensure filters is an object
        if (!filters || typeof filters !== "object") {
            filters = {};
        }

        // Validate page: must be positive integer, default to 1
        var page = 1;
        if (filters && filters.page) {
            var parsed = parseInt(filters.page, 10);
            if (!isNaN(parsed) && parsed > 0 && parsed === Math.floor(parsed)) {
                page = parsed;
            }
        }

        // Normalize slug to string
        var safeSlug = (slug === null || slug === undefined) ? "" : String(slug);

        // Determine path based on filter precedence: category > country > year > slug
        var path = "";

        var category = (filters && filters.category) ? filters.category : "";
        var country = (filters && filters.country) ? filters.country : "";
        var year = (filters && filters.year) ? filters.year : "";

        if (category && typeof category === "string" && category.length > 0) {
            path = "/genre/" + category;
        } else if (country && typeof country === "string" && country.length > 0) {
            path = "/country/" + country;
        } else if (year && (typeof year === "string" || typeof year === "number") && String(year).length > 0) {
            path = "/year/" + year;
        } else if (safeSlug.length > 0) {
            path = "/" + safeSlug;
        } else {
            path = "/browse";
        }

        var url = BASE_URL + path;

        if (page > 1) {
            url = url + "?page=" + page;
        }

        return url;
    } catch (e) {
        return BASE_URL + "/browse";
    }
}

/**
 * Generate search URL with URL-encoded keyword and optional page parameter.
 * Returns a plain URL string (not JSON-encoded).
 */
function getUrlSearch(keyword, filtersJson) {
    try {
        var filters = {};
        try {
            if (filtersJson && typeof filtersJson === "string") {
                filters = JSON.parse(filtersJson);
            }
        } catch (e) {
            filters = {};
        }

        // Ensure filters is an object
        if (!filters || typeof filters !== "object") {
            filters = {};
        }

        // Handle null/undefined/non-string keyword by defaulting to empty string
        var q = (keyword === null || keyword === undefined) ? "" : String(keyword);

        // URL-encode the keyword
        var encoded = encodeURIComponent(q);

        var url = BASE_URL + "/search?q=" + encoded;

        // Append &page={n} when page > 1
        if (filters && filters.page) {
            var page = parseInt(filters.page, 10);
            if (!isNaN(page) && page > 1 && page === Math.floor(page)) {
                url = url + "&page=" + page;
            }
        }

        return url;
    } catch (e) {
        return BASE_URL + "/search?q=";
    }
}

/**
 * Generate detail page URL for a movie, TV show, season, or watch page.
 * If slug is already an absolute URL (http:// or https://), return unchanged.
 * Otherwise prepend BASE_URL + "/" + slug.
 * Returns a plain URL string (not JSON).
 */
function getUrlDetail(slug) {
    try {
        // Handle null/undefined/non-string inputs
        if (slug === null || slug === undefined) {
            return BASE_URL + "/";
        }
        var safeSlug = String(slug);
        if (safeSlug.indexOf("http://") === 0 || safeSlug.indexOf("https://") === 0) {
            return safeSlug;
        }
        return BASE_URL + "/" + safeSlug;
    } catch (e) {
        return BASE_URL + "/";
    }
}

// =============================================================================
// LISTING / SEARCH PARSE FUNCTIONS
// =============================================================================

/**
 * Internal shared function to parse listing/search HTML into items + pagination.
 * Extracts movie/show items from anchor elements and pagination info.
 * Returns a JSON string: {items:[], pagination:{currentPage, totalPages}}
 */
function _parseListingHtml(html) {
    var fallback = JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });

    if (!html || typeof html !== "string") {
        return fallback;
    }

    try {
        var items = [];

        // Match anchor elements whose href contains /movie/{slug}~{id} or /tv/{slug}~{id}
        // The pattern captures the card/item block containing the anchor, poster image, and metadata
        var cardRegex = /<a[^>]*href=["'](?:https?:\/\/[^"']*?)?\/((?:movie|tv)\/[^"']+~\d+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        var cardMatch;

        while ((cardMatch = cardRegex.exec(html)) !== null) {
            var id = cardMatch[1];
            var innerHtml = cardMatch[2];

            // Extract title - look for text content, heading elements, or title attributes
            var title = "";

            // Try to find title in heading elements inside the anchor
            var headingMatch = innerHtml.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
            if (headingMatch) {
                title = cleanText(headingMatch[1]);
            }

            // If no heading, try to find a title/alt attribute or span with title class
            if (!title) {
                var titleSpanMatch = innerHtml.match(/<(?:span|p|div)[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/(?:span|p|div)>/i);
                if (titleSpanMatch) {
                    title = cleanText(titleSpanMatch[1]);
                }
            }

            // If still no title, use the cleaned text content of the anchor
            if (!title) {
                // Remove img tags first to avoid alt text pollution, then clean
                var textContent = innerHtml.replace(/<img[^>]*>/gi, "");
                title = cleanText(textContent);
            }

            // Skip items with empty title
            if (!title) {
                continue;
            }

            // Extract poster URL from img element
            var posterUrl = "";
            var imgMatch = innerHtml.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
            if (imgMatch) {
                posterUrl = absoluteUrl(imgMatch[1]);
            }
            // Also check data-src for lazy-loaded images
            if (!posterUrl) {
                var dataSrcMatch = innerHtml.match(/<img[^>]*data-src=["']([^"']+)["'][^>]*>/i);
                if (dataSrcMatch) {
                    posterUrl = absoluteUrl(dataSrcMatch[1]);
                }
            }

            // Extract originName (Vietnamese title) - often in a secondary element
            var originName = "";
            var originMatch = innerHtml.match(/<(?:span|p|div)[^>]*class="[^"]*(?:origin|vietnamese|sub-title|alt-title)[^"]*"[^>]*>([\s\S]*?)<\/(?:span|p|div)>/i);
            if (originMatch) {
                originName = cleanText(originMatch[1]);
            }

            // Extract episode_current - look for episode status text
            var episodeCurrent = "";
            var epMatch = innerHtml.match(/<(?:span|div)[^>]*class="[^"]*(?:episode|status|ep)[^"]*"[^>]*>([\s\S]*?)<\/(?:span|div)>/i);
            if (epMatch) {
                episodeCurrent = cleanText(epMatch[1]);
            }

            items.push({
                id: id,
                title: title,
                originName: originName,
                posterUrl: posterUrl,
                episode_current: episodeCurrent
            });
        }

        var pagination = extractPagination(html);

        return JSON.stringify({ items: items, pagination: pagination });
    } catch (e) {
        return fallback;
    }
}

/**
 * Parse listing page HTML into items array and pagination object.
 * Returns a JSON string: {items:[{id, title, originName, posterUrl, episode_current}], pagination:{currentPage, totalPages}}
 */
function parseListResponse(html) {
    try {
        if (html === null || html === undefined || typeof html !== "string") {
            return '{"items":[],"pagination":{"currentPage":1,"totalPages":1}}';
        }
        return _parseListingHtml(html);
    } catch (e) {
        return '{"items":[],"pagination":{"currentPage":1,"totalPages":1}}';
    }
}

/**
 * Parse search results page HTML into items array and pagination object.
 * Search results on PhimPal have the same HTML structure as listing pages,
 * so this delegates directly to the shared internal parsing function.
 * Returns a JSON string: {items:[{id, title, originName, posterUrl, episode_current}], pagination:{currentPage, totalPages}}
 */
function parseSearchResponse(html) {
    try {
        if (html === null || html === undefined || typeof html !== "string") {
            return '{"items":[],"pagination":{"currentPage":1,"totalPages":1}}';
        }
        return _parseListingHtml(html);
    } catch (e) {
        return '{"items":[],"pagination":{"currentPage":1,"totalPages":1}}';
    }
}

// =============================================================================
// MOVIE/SHOW DETAIL PARSE FUNCTION
// =============================================================================

/**
 * Parse movie/TV show detail page HTML to extract metadata and servers.
 * Returns JSON string with title, originName, posterUrl, description, year, rating,
 * duration, category, country, director, casts, and servers array.
 * Returns "null" if no H1 title found or on error.
 *
 * For TV show pages (detected by season links matching /tv/{slug}~{id}/season/{n}):
 *   servers = [{name:"Phần 1", episodes:[{id:"tv/...", slug:"tv/...", name:"Phần 1"}]}, ...]
 * For movie pages (detected by "XEM PHIM" watch link):
 *   servers = [{name:"PhimPal", episodes:[{id:"watch/...", slug:"watch/...", name:"Tập 1"}]}]
 */
function parseMovieDetail(html) {
    try {
        if (html === null || html === undefined || html === "" || typeof html !== "string") {
            return "null";
        }

        // Extract title from H1 — return "null" if not found
        var h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        if (!h1Match) {
            return "null";
        }
        var title = cleanText(h1Match[1]);
        if (!title) {
            return "null";
        }

        // Extract originName from H2
        var originName = "";
        var h2Match = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
        if (h2Match) {
            originName = cleanText(h2Match[1]);
        }

        // Extract posterUrl from main poster img
        var posterUrl = "";
        var posterMatch = html.match(/<img[^>]*class=["'][^"']*poster[^"']*["'][^>]*src=["']([^"']+)["'][^>]*>/i);
        if (!posterMatch) {
            // Try src before class attribute order
            posterMatch = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*class=["'][^"']*poster[^"']*["'][^>]*>/i);
        }
        if (posterMatch) {
            posterUrl = absoluteUrl(posterMatch[1]);
        }

        // Extract description — look for description div/class
        var description = "";
        var descMatch = html.match(/<div[^>]*class=["'][^"']*description[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
        if (descMatch) {
            description = cleanText(descMatch[1]);
        }

        // Extract year from year span/link
        var year = 0;
        var yearMatch = html.match(/<span[^>]*class=["'][^"']*year[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
        if (yearMatch) {
            var yearText = cleanText(yearMatch[1]);
            var yearNum = parseInt(yearText, 10);
            if (!isNaN(yearNum) && yearNum > 0) {
                year = yearNum;
            }
        }
        // Fallback: look for /year/{YYYY} link
        if (year === 0) {
            var yearLinkMatch = html.match(/\/year\/(\d{4})/);
            if (yearLinkMatch) {
                year = parseInt(yearLinkMatch[1], 10) || 0;
            }
        }

        // Extract rating
        var rating = 0;
        var ratingMatch = html.match(/<span[^>]*class=["'][^"']*rating[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
        if (ratingMatch) {
            var ratingVal = parseFloat(cleanText(ratingMatch[1]));
            if (!isNaN(ratingVal)) {
                rating = ratingVal;
            }
        }

        // Extract duration
        var duration = "";
        var durationMatch = html.match(/<span[^>]*class=["'][^"']*duration[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
        if (durationMatch) {
            duration = cleanText(durationMatch[1]);
        }

        // Extract category (genres) — comma-separated genre names from /genre/ links
        var category = "";
        var genresMatch = html.match(/<div[^>]*class=["'][^"']*genres[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
        if (genresMatch) {
            var genreNames = [];
            var genreLinkRegex = /<a[^>]*href=["'][^"']*\/genre\/[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
            var genreLink;
            while ((genreLink = genreLinkRegex.exec(genresMatch[1])) !== null) {
                var gName = cleanText(genreLink[1]);
                if (gName) {
                    genreNames.push(gName);
                }
            }
            category = genreNames.join(", ");
        }
        // Fallback: search entire HTML for genre links if no genres div found
        if (!category) {
            var genreNames2 = [];
            var genreLinkRegex2 = /<a[^>]*href=["'][^"']*\/genre\/[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
            var genreLink2;
            while ((genreLink2 = genreLinkRegex2.exec(html)) !== null) {
                var gName2 = cleanText(genreLink2[1]);
                if (gName2) {
                    genreNames2.push(gName2);
                }
            }
            category = genreNames2.join(", ");
        }

        // Extract country from /country/ link
        var country = "";
        var countryMatch = html.match(/<a[^>]*href=["'][^"']*\/country\/[^"']*["'][^>]*>([\s\S]*?)<\/a>/i);
        if (countryMatch) {
            country = cleanText(countryMatch[1]);
        }

        // Extract director
        var director = "";
        var directorMatch = html.match(/<div[^>]*class=["'][^"']*director[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
        if (directorMatch) {
            director = cleanText(directorMatch[1]);
            // Remove "ĐẠO DIỄN:" prefix if present
            director = director.replace(/^[ĐĐ][ạa][oO]\s*[Dd]i[ễe]n\s*:\s*/i, "");
            director = director.replace(/^\s+|\s+$/g, "");
        }

        // Extract casts
        var casts = "";
        var castMatch = html.match(/<div[^>]*class=["'][^"']*cast[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
        if (castMatch) {
            casts = cleanText(castMatch[1]);
        }

        // Detect TV show page by presence of season links matching /tv/{slug}~{id}/season/{n}
        var servers = [];
        var seasonRegex = /<a[^>]*href=["'](?:https?:\/\/[^"']*?)?\/(tv\/[^"'~]+~\d+\/season\/(\d+))["'][^>]*>[\s\S]*?<\/a>/gi;
        var seasonMatch;
        var seasonEntries = [];
        var seenSeasonPaths = {};
        while ((seasonMatch = seasonRegex.exec(html)) !== null) {
            var seasonPath = seasonMatch[1];
            var seasonNum = seasonMatch[2];
            // Deduplicate: skip if we already saw this season path
            if (seenSeasonPaths[seasonPath]) {
                continue;
            }
            seenSeasonPaths[seasonPath] = true;
            seasonEntries.push({
                path: seasonPath,
                num: seasonNum
            });
        }

        if (seasonEntries.length > 0) {
            // TV show page: map each season to a server entry
            for (var si = 0; si < seasonEntries.length; si++) {
                var entry = seasonEntries[si];
                var seasonName = "Phần " + entry.num;
                servers.push({
                    name: seasonName,
                    episodes: [
                        {
                            id: entry.path,
                            slug: entry.path,
                            name: seasonName
                        }
                    ]
                });
            }
        } else {
            // Movie page: find "XEM PHIM" watch link with /watch/{id} href
            var watchMatch = html.match(/<a[^>]*href=["'](?:https?:\/\/[^"']*?)?\/watch\/(\d+)["'][^>]*>[\s\S]*?XEM\s*PHIM[\s\S]*?<\/a>/i);
            if (!watchMatch) {
                // Try alternate pattern: text first, then check href
                watchMatch = html.match(/<a[^>]*href=["'](?:https?:\/\/[^"']*?)?\/watch\/(\d+)["'][^>]*>[^<]*XEM[^<]*PHIM[^<]*<\/a>/i);
            }
            if (watchMatch) {
                var watchId = watchMatch[1];
                servers.push({
                    name: "PhimPal",
                    episodes: [
                        {
                            id: "watch/" + watchId,
                            slug: "watch/" + watchId,
                            name: "Tập 1"
                        }
                    ]
                });
            } else {
                // Season page: detect multiple episode links matching /watch/{id}
                var episodeLinkRegex = /<a[^>]*href=["'](?:https?:\/\/[^"']*?)?\/watch\/(\d+)["'][^>]*>([\s\S]*?)<\/a>/gi;
                var epLinkMatch;
                var episodes = [];
                var seenEpIds = {};
                while ((epLinkMatch = episodeLinkRegex.exec(html)) !== null) {
                    var epId = epLinkMatch[1];
                    var epText = cleanText(epLinkMatch[2]);
                    // Skip links with empty titles
                    if (!epText) {
                        continue;
                    }
                    // Deduplicate: skip if we already saw this episode id
                    if (seenEpIds[epId]) {
                        continue;
                    }
                    seenEpIds[epId] = true;
                    episodes.push({
                        id: "watch/" + epId,
                        slug: "watch/" + epId,
                        name: epText
                    });
                }
                if (episodes.length > 0) {
                    servers.push({
                        name: "PhimPal",
                        episodes: episodes
                    });
                }
            }
        }

        var result = {
            title: title,
            originName: originName,
            posterUrl: posterUrl,
            description: description,
            year: year,
            rating: rating,
            duration: duration,
            category: category,
            country: country,
            director: director,
            casts: casts,
            servers: servers
        };

        return JSON.stringify(result);
    } catch (e) {
        return "null";
    }
}

// =============================================================================
// WATCH PAGE STREAM RESOLUTION
// =============================================================================

/**
 * Parse watch page HTML to extract stream URL, embed status, and headers.
 * Detection priority:
 *   1. <video> src with .m3u8 or .mp4
 *   2. <source> src with .m3u8 or .mp4
 *   3. Inline JS containing .m3u8 or .mp4 URL (var sources, playerInstance.setup)
 *   4. <iframe> src (isEmbed = true)
 *
 * Returns JSON string with {url, isEmbed, headers} or "{}" if no stream found.
 */
function parseDetailResponse(html) {
    try {
        if (html === null || html === undefined || html === "" || typeof html !== "string") {
            return "{}";
        }

        var streamUrl = "";
        var isEmbed = false;

        // Priority 1: <video> element with src attribute containing .m3u8 or .mp4
        if (!streamUrl) {
            var videoSrcMatch = html.match(/<video[^>]*\ssrc=["']([^"']*\.(?:m3u8|mp4)[^"']*)["'][^>]*>/i);
            if (videoSrcMatch && videoSrcMatch[1]) {
                streamUrl = videoSrcMatch[1];
                isEmbed = false;
            }
        }

        // Priority 2: <source> element with src attribute containing .m3u8 or .mp4
        if (!streamUrl) {
            var sourceSrcMatch = html.match(/<source[^>]*\ssrc=["']([^"']*\.(?:m3u8|mp4)[^"']*)["'][^>]*>/i);
            if (sourceSrcMatch && sourceSrcMatch[1]) {
                streamUrl = sourceSrcMatch[1];
                isEmbed = false;
            }
        }

        // Priority 3: Inline JS containing .m3u8 or .mp4 URL
        // Look for patterns like: var sources = [{file: "..."}]
        // or: playerInstance.setup({ file: '...' })
        if (!streamUrl) {
            var jsUrlMatch = html.match(/["']([^"']*\.(?:m3u8|mp4)[^"']*)["']/i);
            if (jsUrlMatch && jsUrlMatch[1]) {
                // Verify it looks like a URL (starts with http or /)
                var candidate = jsUrlMatch[1];
                if (candidate.indexOf("http") === 0 || candidate.indexOf("/") === 0) {
                    streamUrl = candidate;
                    isEmbed = false;
                }
            }
        }

        // Priority 4: <iframe> src (any URL)
        if (!streamUrl) {
            var iframeSrcMatch = html.match(/<iframe[^>]*\ssrc=["']([^"']+)["'][^>]*>/i);
            if (iframeSrcMatch && iframeSrcMatch[1]) {
                streamUrl = iframeSrcMatch[1];
                isEmbed = true;
            }
        }

        // If no stream URL found, return "{}"
        if (!streamUrl) {
            return "{}";
        }

        // --- Subtitle extraction ---
        var subtitles = [];

        // Method 1: Extract <track> elements with src ending in .srt or .vtt
        var trackRegex = /<track[^>]*>/gi;
        var trackMatch;
        while ((trackMatch = trackRegex.exec(html)) !== null) {
            var trackTag = trackMatch[0];
            // Extract src attribute — must end in .srt or .vtt
            var trackSrcMatch = trackTag.match(/\ssrc=["']([^"']*\.(?:srt|vtt)[^"']*)["']/i);
            if (!trackSrcMatch) {
                continue;
            }
            var trackSrc = trackSrcMatch[1];
            // Extract srclang attribute
            var trackLangMatch = trackTag.match(/\ssrclang=["']([^"']+)["']/i);
            var trackLang = "";
            if (trackLangMatch) {
                trackLang = trackLangMatch[1];
            }
            // Fallback to label attribute if srclang is missing
            if (!trackLang) {
                var trackLabelMatch = trackTag.match(/\slabel=["']([^"']+)["']/i);
                if (trackLabelMatch) {
                    trackLang = trackLabelMatch[1];
                }
            }
            if (trackLang && trackSrc) {
                subtitles.push({
                    lang: trackLang,
                    url: absoluteUrl(trackSrc)
                });
            }
        }

        // Method 2: Extract inline JS subtitle metadata (array of {lang, file} objects)
        // Matches patterns like: var subtitles = [{lang: "vi", file: "/subtitles/vi/12345.vtt"}];
        // or: var subtitles = [{lang:"vi",file:"/subtitles/vi/12345.vtt"}];
        var jsSubRegex = /(?:var\s+\w+\s*=\s*|subtitles\s*[:=]\s*)\[([^\]]*\{[^\]]*lang[^\]]*file[^\]]*\}[^\]]*)\]/gi;
        var jsSubMatch;
        while ((jsSubMatch = jsSubRegex.exec(html)) !== null) {
            var arrContent = jsSubMatch[1];
            // Extract individual {lang: "...", file: "..."} objects
            var objRegex = /\{\s*(?:lang\s*:\s*["']([^"']+)["']\s*,\s*file\s*:\s*["']([^"']+)["']|file\s*:\s*["']([^"']+)["']\s*,\s*lang\s*:\s*["']([^"']+)["'])\s*\}/gi;
            var objMatch;
            while ((objMatch = objRegex.exec(arrContent)) !== null) {
                var subLang = objMatch[1] || objMatch[4] || "";
                var subFile = objMatch[2] || objMatch[3] || "";
                if (subLang && subFile) {
                    // Check if this subtitle is already in the array (avoid duplicates)
                    var isDuplicate = false;
                    for (var di = 0; di < subtitles.length; di++) {
                        if (subtitles[di].lang === subLang && subtitles[di].url === absoluteUrl(subFile)) {
                            isDuplicate = true;
                            break;
                        }
                    }
                    if (!isDuplicate) {
                        subtitles.push({
                            lang: subLang,
                            url: absoluteUrl(subFile)
                        });
                    }
                }
            }
        }

        var result = {
            url: streamUrl,
            isEmbed: isEmbed,
            headers: {
                "Referer": "https://legacy.phimpal.com/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        };

        // Only include subtitles field if tracks were found
        if (subtitles.length > 0) {
            result.subtitles = subtitles;
        }

        return JSON.stringify(result);
    } catch (e) {
        return "{}";
    }
}
