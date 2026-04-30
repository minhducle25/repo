// =============================================================================
// VAAPP Plugin — Phim NguonC
// Version: 1.4.0
// =============================================================================

// =============================================================================
// NHÓM 1: CẤU HÌNH
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "nguonc",
        "name": "Phim NguonC",
        "version": "1.4.0",
        "baseUrl": "https://phim.nguonc.com",
        "iconUrl": "https://raw.githubusercontent.com/youngbi/repo/main/plugins/nguonC.png",
        "isEnabled": true,
        "type": "MOVIE",
        "playerType": "auto"
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
// NHÓM 2: SINH URL
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        var sort = filters.sort || "updated";

        if (slug === 'phim-moi-cap-nhat' && !filters.category && !filters.country && !filters.year) {
            return "https://phim.nguonc.com/api/films/phim-moi-cap-nhat?page=" + page;
        }
        if (filters.category) {
            return "https://phim.nguonc.com/api/films/the-loai/" + filters.category + "?page=" + page + "&sort=" + sort;
        }
        if (filters.country) {
            return "https://phim.nguonc.com/api/films/quoc-gia/" + filters.country + "?page=" + page + "&sort=" + sort;
        }
        if (filters.year) {
            return "https://phim.nguonc.com/api/films/nam-phat-hanh/" + filters.year + "?page=" + page + "&sort=" + sort;
        }
        if (/^\d{4}$/.test(slug)) {
            return "https://phim.nguonc.com/api/films/nam-phat-hanh/" + slug + "?page=" + page + "&sort=" + sort;
        }
        var listSlugs = ['phim-le', 'phim-bo', 'phim-dang-chieu', 'tv-shows', 'subteam'];
        if (listSlugs.indexOf(slug) >= 0) {
            return "https://phim.nguonc.com/api/films/danh-sach/" + slug + "?page=" + page + "&sort=" + sort;
        }
        var countrySlugs = [
            'au-my', 'anh', 'trung-quoc', 'indonesia', 'viet-nam', 'phap', 'hong-kong',
            'han-quoc', 'nhat-ban', 'thai-lan', 'dai-loan', 'nga', 'ha-lan',
            'philippines', 'an-do', 'quoc-gia-khac'
        ];
        if (countrySlugs.indexOf(slug) >= 0) {
            return "https://phim.nguonc.com/api/films/quoc-gia/" + slug + "?page=" + page + "&sort=" + sort;
        }
        return "https://phim.nguonc.com/api/films/the-loai/" + slug + "?page=" + page + "&sort=" + sort;
    } catch (e) {
        return "https://phim.nguonc.com/api/films/phim-moi-cap-nhat?page=1";
    }
}

function getUrlSearch(keyword, filtersJson) {
    return "https://phim.nguonc.com/api/films/search?keyword=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    if (slug.indexOf("http") === 0) return slug;
    return "https://phim.nguonc.com/api/film/" + slug;
}

function getUrlCategories() { return "https://phim.nguonc.com"; }
function getUrlCountries() { return "https://phim.nguonc.com"; }
function getUrlYears() { return "https://phim.nguonc.com"; }

// =============================================================================
// NHÓM 3: PARSER
// =============================================================================

function parseListResponse(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var data = response.data || {};
        var items = [];

        if (Array.isArray(data)) {
            items = data;
        } else if (Array.isArray(response.items)) {
            items = response.items;
        } else if (data.items && Array.isArray(data.items)) {
            items = data.items;
        }

        var paginate = response.paginate || response.pagination || (data.params && data.params.pagination) || {};

        var movies = items.map(function (item) {
            return {
                id: item.slug,
                title: item.name,
                posterUrl: getImageUrl(item.thumb_url),
                backdropUrl: getImageUrl(item.poster_url),
                year: item.year || 0,
                quality: item.quality || "",
                episode_current: item.current_episode || item.episode_current || "",
                lang: item.language || item.lang || ""
            };
        });

        var currentPage = paginate.current_page || paginate.currentPage || 1;
        var totalItems = paginate.total_items || paginate.totalItems || 0;
        var itemsPerPage = paginate.items_per_page || paginate.itemsPerPage || paginate.totalItemsPerPage || 24;
        var totalPages = paginate.total_page || paginate.totalPages || 0;
        if (totalPages === 0 && itemsPerPage > 0) totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages === 0) totalPages = 1;

        return JSON.stringify({
            items: movies,
            pagination: { currentPage: currentPage, totalPages: totalPages, totalItems: totalItems, itemsPerPage: itemsPerPage }
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
        var movie = response.movie || (response.data && response.data.item) || response.data || {};
        var rawEpisodes = movie.episodes || response.episodes || (response.data && response.data.item && response.data.item.episodes) || [];

        var servers = [];
        if (Array.isArray(rawEpisodes)) {
            rawEpisodes.forEach(function (server) {
                var episodes = [];
                var serverItems = server.items || server.server_data || [];
                if (Array.isArray(serverItems)) {
                    serverItems.forEach(function (ep) {
                        var embed = ep.embed || ep.link_embed || "";
                        var m3u8 = ep.m3u8 || ep.link_m3u8 || "";
                        var link = m3u8 || embed;
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
                    servers.push({ name: server.server_name || server.name || "Server", episodes: episodes });
                }
            });
        }

        var extractGroup = function (categoryObj, groupName) {
            if (!categoryObj) return "";
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
            casts: movie.casts || movie.actor || "",
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
        var streamUrl = "";

        // ── Bước 1: Giải mã data-obf (double base64) ──
        var obfMatch = html.match(/data-obf=["']([^"']+)["']/);
        if (obfMatch) {
            try {
                // Lớp 1: decode data-obf
                var outer = JSON.parse(atob(obfMatch[1]));
                // outer = { sUb: "base64...", hD: "hash" }

                if (outer.sUb) {
                    try {
                        // Lớp 2: decode sUb
                        var inner = JSON.parse(atob(outer.sUb));
                        // inner có thể chứa URL trực tiếp hoặc field khác
                        streamUrl = inner.url || inner.stream || inner.file || inner.src || "";

                        // Nếu vẫn không có → ghép từ các field có sẵn
                        if (!streamUrl && inner.h) {
                            // Một số trường hợp cần reconstruct URL
                            streamUrl = "https://thais.hihihoho3.top/" + inner.h + "/index.m3u8";
                        }
                    } catch (e2) {
                        // sUb không phải JSON → có thể là URL thẳng sau decode
                        var decoded = atob(outer.sUb);
                        if (decoded.indexOf('http') === 0) streamUrl = decoded;
                        else streamUrl = decoded + ".m3u8";
                    }
                }

                // Nếu outer.sUb là URL base thì append .m3u8
                if (streamUrl && streamUrl.indexOf('.m3u') === -1 && streamUrl.indexOf('.mp4') === -1) {
                    streamUrl = streamUrl + ".m3u8";
                }
            } catch (e1) { }
        }

        // ── Bước 2: Fallback regex m3u8 thông thường ──
        if (!streamUrl) {
            var m3u8Regex = /file:\s*["']([^"']+\.m3u[^"']*)["']|["']([^"']+\.m3u8[^"']*)["']/;
            var match = html.match(m3u8Regex);
            streamUrl = match ? (match[1] || match[2]) : "";
        }

        // ── Bước 3: Fallback URL truyền vào ──
        if (!streamUrl && fallbackUrl && fallbackUrl !== "{}") {
            streamUrl = fallbackUrl;
        }

        // ── Custom-JS giữ nguyên ──
        var customJs = "(function(){" +
            "var _jw=null;" +
            "try{Object.defineProperty(window,'jwplayer',{configurable:true,enumerable:true," +
            "get:function(){return _jw;}," +
            "set:function(val){" +
            "_jw=function(){var p=val.apply(this,arguments);" +
            "if(p&&p.setup){var os=p.setup.bind(p);" +
            "p.setup=function(c){" +
            "if(c){delete c.advertising;delete c.vast;delete c.schedule;delete c.plugins;" +
            "if(c.advertising&&c.advertising.tag)c.advertising.tag='';" +
            "if(c.playlist&&Array.isArray(c.playlist))" +
            "c.playlist.forEach(function(i){delete i.adschedule;if(i.advertising)i.advertising.tag='';});" +
            "}return os(c);};}return p;};" +
            "Object.keys(val).forEach(function(k){try{_jw[k]=val[k];}catch(e){}});" +
            "}});}catch(e){}" +
            "var _t=setInterval(function(){" +
            "if(window.jwplayer&&!window.jwplayer._p){clearInterval(_t);" +
            "var orig=window.jwplayer;var w=function(){var p=orig.apply(this,arguments);" +
            "if(p&&p.setup){var os=p.setup.bind(p);" +
            "p.setup=function(c){if(c){delete c.advertising;delete c.vast;delete c.schedule;}return os(c);};" +
            "}return p;};w._p=true;" +
            "Object.keys(orig).forEach(function(k){try{w[k]=orig[k];}catch(e){}});" +
            "window.jwplayer=w;}},5);" +
            "var AD=['tlk.xml','vast','streamc.xyz/1.mp4','6789x.site','vsbet','colatv','doubleclick','googlesyndication','adnxs','ima3'];" +
            "var EMPTY_VAST='<VAST version=\"3.0\"/>';" +
            "var xo=XMLHttpRequest.prototype.open,xs=XMLHttpRequest.prototype.send;" +
            "XMLHttpRequest.prototype.open=function(m,u){this._u=u||'';" +
            "this._b=AD.some(function(d){return this._u.toLowerCase().indexOf(d)>-1;},this);" +
            "if(!this._b)return xo.apply(this,arguments);};" +
            "XMLHttpRequest.prototype.send=function(d){if(this._b){var self=this;" +
            "setTimeout(function(){try{" +
            "Object.defineProperty(self,'status',{get:function(){return 200;}});" +
            "Object.defineProperty(self,'responseText',{get:function(){return EMPTY_VAST;}});" +
            "Object.defineProperty(self,'response',{get:function(){return EMPTY_VAST;}});" +
            "Object.defineProperty(self,'readyState',{get:function(){return 4;}});" +
            "if(self.onreadystatechange)self.onreadystatechange();" +
            "if(self.onload)self.onload();}catch(e){}},10);return;}" +
            "return xs.apply(this,arguments);};" +
            "var of=window.fetch;if(of){window.fetch=function(u,o){" +
            "var s=(typeof u==='string'?u:(u&&u.url)||'').toLowerCase();" +
            "if(AD.some(function(d){return s.indexOf(d)>-1;}))" +
            "return Promise.resolve(new Response(EMPTY_VAST,{status:200,headers:{'Content-Type':'text/xml'}}));" +
            "return of.apply(this,arguments);};}})();";

        return JSON.stringify({
            url: streamUrl,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://embed.streamc.xyz/",
                "Custom-Js": customJs
            }
        });
    } catch (error) {
        return "{}";
    }
}

// =============================================================================
// HARDCODED: Categories / Countries / Years
// =============================================================================

function parseCategoriesResponse(apiResponseJson) {
    return JSON.stringify([
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
    ]);
}

function parseCountriesResponse(apiResponseJson) {
    return JSON.stringify([
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
    ]);
}

function parseYearsResponse(apiResponseJson) {
    var years = [];
    for (var i = 2026; i >= 2004; i--) {
        years.push({ name: i.toString(), value: i.toString() });
    }
    return JSON.stringify(years);
}

// =============================================================================
// HELPER
// =============================================================================

function getImageUrl(path) {
    if (!path) return "";
    if (path.indexOf("http") === 0) return path;
    return "https://img.phimapi.com/" + path;
}
