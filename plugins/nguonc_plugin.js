// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "nguonc",
        "name": "Phim NguonC",
        "version": "1.3.0",
        "baseUrl": "https://phim.nguonc.com",
        "iconUrl": "https://raw.githubusercontent.com/youngbi/repo/main/plugins/nguonC.png",
        "isEnabled": true,
        "type": "MOVIE",
        "playerType": "embed"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim-dang-chieu', title: 'Phim Đang Chiếu', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-le', title: 'Phim Lẻ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-bo', title: 'Phim Bộ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'tv-shows', title: 'TV Shows', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'hoat-hinh', title: 'Hoạt Hình', type: 'Horizontal', path: 'the-loai' },
        { slug: 'phim-moi-cap-nhat', title: 'Phim Mới Cập Nhật', type: 'Grid', path: 'phim-moi-cap-nhat' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim đang chiếu', slug: 'phim-dang-chieu' },
        { name: 'Phim lẻ', slug: 'phim-le' },
        { name: 'Phim bộ', slug: 'phim-bo' },
        { name: 'TV Shows', slug: 'tv-shows' },
        { name: 'Hoạt hình', slug: 'hoat-hinh' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Mới cập nhật', value: 'updated' },
            { name: 'Mới nhất', value: 'new' },
            { name: 'Lượt xem', value: 'view' }
        ]
    });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        var sort = filters.sort || "updated"; // updated, view, year

        // Handle "Phim Mới Cập Nhật" specially if no filter
        if (slug === 'phim-moi-cap-nhat' && !filters.category && !filters.country && !filters.year) {
            return "https://phim.nguonc.com/api/films/phim-moi-cap-nhat?page=" + page;
        }

        // Priority 1: Category Support //v1/api/the-loai/{slug}
        if (filters.category) {
            return "https://phim.nguonc.com/api/films/the-loai/" + filters.category + "?page=" + page + "&sort=" + sort;
        }

        // Priority 2: Country Support //v1/api/quoc-gia/{slug}
        if (filters.country) {
            return "https://phim.nguonc.com/api/films/quoc-gia/" + filters.country + "?page=" + page + "&sort=" + sort;
        }

        // Priority 3: Year Support //v1/api/nam-phat-hanh/{year}
        if (filters.year) {
            return "https://phim.nguonc.com/api/films/nam-phat-hanh/" + filters.year + "?page=" + page + "&sort=" + sort;
        }

        // --- Slug-based Logic (if no active filter) ---

        // Handle Years (4 digits)
        if (/^\d{4}$/.test(slug)) {
            return "https://phim.nguonc.com/api/films/nam-phat-hanh/" + slug + "?page=" + page + "&sort=" + sort;
        }

        // Handle specific Lists (Danh sách)
        var listSlugs = ['phim-le', 'phim-bo', 'phim-dang-chieu', 'tv-shows', 'subteam'];
        // Note: 'hoat-hinh' is sometimes a list, sometimes a category. 
        // On NguonC, 'hoat-hinh' is usually in 'the-loai' but let's check standard lists.
        // NguonC commonly puts 'phim-hoat-hinh' in lists or 'hoat-hinh' in genres.

        if (listSlugs.indexOf(slug) >= 0) {
            // If slug is 'hoat-hinh', prefer 'the-loai' logic unless we know it's a list
            if (slug !== 'hoat-hinh') {
                return "https://phim.nguonc.com/api/films/danh-sach/" + slug + "?page=" + page + "&sort=" + sort;
            }
        }

        // Handle Countries (Fallback if slug matches country list)
        var countrySlugs = [
            'au-my', 'anh', 'trung-quoc', 'indonesia', 'viet-nam', 'phap', 'hong-kong',
            'han-quoc', 'nhat-ban', 'thai-lan', 'dai-loan', 'nga', 'ha-lan',
            'philippines', 'an-do', 'quoc-gia-khac'
        ];
        if (countrySlugs.indexOf(slug) >= 0) {
            return "https://phim.nguonc.com/api/films/quoc-gia/" + slug + "?page=" + page + "&sort=" + sort;
        }

        // Default to Genres (Thể loại)
        return "https://phim.nguonc.com/api/films/the-loai/" + slug + "?page=" + page + "&sort=" + sort;

    } catch (e) {
        return "https://phim.nguonc.com/api/films/phim-moi-cap-nhat?page=1";
    }
}

function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    return "https://phim.nguonc.com/api/films/search?keyword=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    if (slug.indexOf("http") === 0) return slug;
    return "https://phim.nguonc.com/api/film/" + slug;
}

// Just returning the home page to trigger the parser, which will return hardcoded data
function getUrlCategories() { return "https://phim.nguonc.com"; }
function getUrlCountries() { return "https://phim.nguonc.com"; }
function getUrlYears() { return "https://phim.nguonc.com"; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        // Handle NguonC structure: sometimes data is array directly (search), sometimes an object (list)
        var data = response.data || {};
        var items = [];

        if (Array.isArray(data)) {
            items = data;
        } else if (Array.isArray(response.items)) {
            items = response.items;
        } else if (data.items && Array.isArray(data.items)) {
            items = data.items;
        }

        // Handle NguonC 'paginate' structure
        // User provided: "paginate": { "current_page": 1, ... }
        var paginate = response.paginate || response.pagination || (data.params && data.params.pagination) || {};

        var movies = items.map(function (item) {
            return {
                id: item.slug,
                title: item.name,
                posterUrl: getImageUrl(item.thumb_url),
                backdropUrl: getImageUrl(item.poster_url),
                year: item.year || 0,
                quality: item.quality || "",
                // Handle different field names for current episode
                episode_current: item.current_episode || item.episode_current || "",
                // Handle different field names for language
                lang: item.language || item.lang || ""
            };
        });

        // Determine pagination values
        var currentPage = paginate.current_page || paginate.currentPage || 1;
        var totalItems = paginate.total_items || paginate.totalItems || 0;
        var itemsPerPage = paginate.items_per_page || paginate.itemsPerPage || paginate.totalItemsPerPage || 24;

        // Calculate total pages if not provided directly
        var totalPages = paginate.total_page || paginate.totalPages || 0;
        if (totalPages === 0 && itemsPerPage > 0) {
            totalPages = Math.ceil(totalItems / itemsPerPage);
        }
        if (totalPages === 0) totalPages = 1;

        return JSON.stringify({
            items: movies,
            pagination: {
                currentPage: currentPage,
                totalPages: totalPages,
                totalItems: totalItems,
                itemsPerPage: itemsPerPage
            }
        });
    } catch (error) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(apiResponseJson) {
    return parseListResponse(apiResponseJson);
}

function parseMovieDetail(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        // Normalize movie object (supports standard and potential variants)
        var movie = response.movie || response.data?.item || response.data || {};

        // Normalize episodes
        var rawEpisodes = movie.episodes || response.episodes || response.data?.item?.episodes || [];

        var servers = [];
        if (Array.isArray(rawEpisodes)) {
            rawEpisodes.forEach(function (server) {
                var episodes = [];
                var serverItems = server.items || server.server_data || [];

                if (Array.isArray(serverItems)) {
                    serverItems.forEach(function (ep) {
                        var embed = ep.embed || ep.link_embed || "";
                        var m3u8 = ep.m3u8 || ep.link_m3u8 || "";

                        // Use Embed URL as ID to allow scraping Referer/M3u8 details
                        // If no embed, use m3u8 directly.
                        var link = embed || m3u8;

                        if (link) {
                            episodes.push({
                                id: link,
                                name: ep.name || ep.episode_name || "",
                                slug: ep.slug || ep.episode_slug || ""
                            });
                        }
                    });
                }

                if (episodes.length > 0) {
                    servers.push({
                        name: server.server_name || server.name || "Server",
                        episodes: episodes
                    });
                }
            });
        }

        // Helper to extract category/country/year
        // Handles both { "1": { group: ..., list: [...] } } AND typical arrays
        var extractGroup = function (categoryObj, groupName) {
            if (!categoryObj) return "";

            // If it's an object with keys "1", "2"...
            for (var key in categoryObj) {
                var group = categoryObj[key];
                if (group && group.group && group.group.name === groupName && group.list && group.list.length > 0) {
                    return group.list.map(function (item) { return item.name; }).join(", ");
                }
            }
            return "";
        };

        var extractedYear = extractGroup(movie.category, "Năm");

        return JSON.stringify({
            id: movie.slug || "",
            title: movie.name || "",
            posterUrl: getImageUrl(movie.thumb_url),
            backdropUrl: getImageUrl(movie.poster_url),
            description: (movie.description || movie.content || "").replace(/<[^>]*>/g, ""),
            year: parseInt(movie.year || extractedYear) || 0,
            rating: parseFloat(movie.view) || 0,
            quality: movie.quality || "",
            servers: servers,
            episode_current: movie.current_episode || movie.episode_current || "",
            lang: movie.language || movie.lang || "",
            casts: movie.casts || movie.actor || "", // Fallback to 'actor' if casts is missing
            director: movie.director || "",
            category: extractGroup(movie.category, "Thể loại"),
            country: extractGroup(movie.category, "Quốc gia"),
            view: parseInt(movie.view) || 0,
            status: movie.status || ""
        });
    } catch (error) {
        return "{}";
    }
}


function parseDetailResponse(html, fallbackUrl) {
    try {
        // Try to extract direct m3u8 from embed HTML
        var m3u8Regex = /file:\s*["']([^"']+\.m3u8[^"']*)["']|source:\s*["']([^"']+\.m3u8[^"']*)["']|src:\s*["']([^"']+\.m3u8[^"']*)["']|["']([^"']+\.m3u8[^"']*)["']/;
        var match = html.match(m3u8Regex);
        var m3u8 = match ? (match[1] || match[2] || match[3] || match[4]) : "";

        // Use direct m3u8 if found, otherwise fall back to embed URL (WebView)
        var streamUrl = m3u8 || fallbackUrl || "";

        // Inject into WebView to block VAST ad requests and strip jwplayer advertising config
        var customJs = "(function(){" +
            "var _jw=null;" +
            "try{Object.defineProperty(window,'jwplayer',{" +
            "configurable:true,enumerable:true," +
            "get:function(){return _jw;}," +
            "set:function(val){" +
            "_jw=function(){" +
            "var p=val.apply(this,arguments);" +
            "if(p&&p.setup){" +
            "var os=p.setup.bind(p);" +
            "p.setup=function(c){" +
            "if(c){delete c.advertising;delete c.vast;delete c.schedule;delete c.plugins;" +
            "if(c.playlist&&Array.isArray(c.playlist)){" +
            "c.playlist.forEach(function(item){delete item.adschedule;delete item.advertising;});}" +
            "}return os(c);};" +
            "}return p;};" +
            "Object.keys(val).forEach(function(k){try{_jw[k]=val[k];}catch(e){}});" +
            "}}});}catch(e){}" +
            "var _t=setInterval(function(){" +
            "if(window.jwplayer&&!window.jwplayer._patched){clearInterval(_t);" +
            "var orig=window.jwplayer;" +
            "var w=function(){var p=orig.apply(this,arguments);" +
            "if(p&&p.setup){var os=p.setup.bind(p);" +
            "p.setup=function(c){if(c){delete c.advertising;delete c.vast;delete c.schedule;}return os(c);};" +
            "}return p;};w._patched=true;" +
            "Object.keys(orig).forEach(function(k){try{w[k]=orig[k];}catch(e){}});" +
            "window.jwplayer=w;}},5);" +
            "var AD=['githubusercontent.com/hiller','6789x.site','streamc.xyz/1.mp4','vsbet','colatv','doubleclick','googlesyndication'];" +
            "var xo=XMLHttpRequest.prototype.open,xs=XMLHttpRequest.prototype.send;" +
            "XMLHttpRequest.prototype.open=function(m,u){" +
            "this._b=u&&AD.some(function(d){return u.indexOf(d)>-1;});" +
            "if(!this._b)return xo.apply(this,arguments);};" +
            "XMLHttpRequest.prototype.send=function(d){if(this._b)return;return xs.apply(this,arguments);};" +
            "var of=window.fetch;" +
            "if(of)window.fetch=function(u,o){var s=typeof u==='string'?u:(u&&u.url)||'';" +
            "if(AD.some(function(d){return s.indexOf(d)>-1;}))" +
            "return Promise.resolve(new Response('',{status:200}));" +
            "return of.apply(this,arguments);};" +
            "})();";
    } catch (error) { return "{}"; }
}

// Hardcoded Categories (Genres)
function parseCategoriesResponse(apiResponseJson) {
    var genres = [
        { name: "Hành Động", slug: "hanh-dong" },
        { name: "Phiêu Lưu", slug: "phieu-luu" },
        { name: "Hoạt Hình", slug: "hoat-hinh" },
        { name: "Hài", slug: "phim-hai" },
        { name: "Hình Sự", slug: "hinh-su" },
        { name: "Tài Liệu", slug: "tai-lieu" },
        { name: "Chính Kịch", slug: "chinh-kich" },
        { name: "Gia Đình", slug: "gia-dinh" },
        { name: "Giả Tưởng", slug: "gia-tuong" },
        { name: "Lịch Sử", slug: "lich-su" },
        { name: "Kinh Dị", slug: "kinh-di" },
        { name: "Nhạc", slug: "phim-nhac" },
        { name: "Bí Ẩn", slug: "bi-an" },
        { name: "Lãng Mạn", slug: "lang-man" },
        { name: "Khoa Học Viễn Tưởng", slug: "khoa-hoc-vien-tuong" },
        { name: "Gây Cấn", slug: "gay-can" },
        { name: "Chiến Tranh", slug: "chien-tranh" },
        { name: "Tâm Lý", slug: "tam-ly" },
        { name: "Tình Cảm", slug: "tinh-cam" },
        { name: "Cổ Trang", slug: "co-trang" },
        { name: "Miền Tây", slug: "mien-tay" },
        { name: "Phim 18+", slug: "phim-18" }
    ];
    return JSON.stringify(genres);
}

// Hardcoded Countries
function parseCountriesResponse(apiResponseJson) {
    var countries = [
        { name: "Âu Mỹ", value: "au-my" },
        { name: "Anh", value: "anh" },
        { name: "Trung Quốc", value: "trung-quoc" },
        { name: "Indonesia", value: "indonesia" },
        { name: "Việt Nam", value: "viet-nam" },
        { name: "Pháp", value: "phap" },
        { name: "Hồng Kông", value: "hong-kong" },
        { name: "Hàn Quốc", value: "han-quoc" },
        { name: "Nhật Bản", value: "nhat-ban" },
        { name: "Thái Lan", value: "thai-lan" },
        { name: "Đài Loan", value: "dai-loan" },
        { name: "Nga", value: "nga" },
        { name: "Hà Lan", value: "ha-lan" },
        { name: "Philippines", value: "philippines" },
        { name: "Ấn Độ", value: "an-do" },
        { name: "Quốc gia khác", value: "quoc-gia-khac" }
    ];
    return JSON.stringify(countries);
}

// Hardcoded Years
function parseYearsResponse(apiResponseJson) {
    var years = [];
    for (var i = 2026; i >= 2004; i--) {
        years.push({ name: i.toString(), value: i.toString() });
    }
    return JSON.stringify(years);
}

function getImageUrl(path) {
    if (!path) return "";
    if (path.indexOf("http") === 0) return path;
    // Base image URL for NguonC
    return "https://img.phimapi.com/" + path;
}
