// js/search.js
// Search results page: shows movie/tv cards with badges (quality + runtime/season) and metadata.

document.addEventListener("DOMContentLoaded", () => {
    const API_KEY = "2051710e2b77f17652a595dbc3a52425";
    const BASE = "https://api.themoviedb.org/3";
    const IMG = "https://image.tmdb.org/t/p/w300";
  
    const headerH2 = document.querySelector(".Results-header h2");
    const grid = document.querySelector(".Results-grid");
    const pagination = document.querySelector(".Results-pagination");
  
    let currentPage = 1;
    let totalPages = 1;
    const perPage = 20; // TMDB default
    const maxVisiblePages = 10;
  
    // read query
    function getParams() {
      const p = new URLSearchParams(window.location.search);
      return {
        q: (p.get("q") || p.get("query") || "").trim(),
        page: Math.max(1, parseInt(p.get("page") || "1", 10))
      };
    }
  
    function updateUrl(params) {
      const p = new URLSearchParams(window.location.search);
      if (params.q !== undefined) p.set("q", params.q);
      if (params.page !== undefined) p.set("page", params.page);
      const url = `${location.pathname}?${p.toString()}`;
      history.replaceState({}, "", url);
    }
  
    function escapeHtml(s = "") {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }
  
    function formatRuntime(minutes) {
      if (minutes === null || minutes === undefined || Number.isNaN(Number(minutes))) return null;
      const m = Number(minutes);
      const h = Math.floor(m / 60);
      const mm = m % 60;
      return h > 0 ? `${h}h ${mm}m` : `${mm}m`;
    }
  
    // Basic quality mapping
    function computeQuality(score) {
      if (typeof score !== "number" || Number.isNaN(score)) return "HD";
      if (score >= 8.0) return "4K";
      if (score >= 6.5) return "1080p";
      if (score >= 4.5) return "HD";
      return "720p";
    }
  
    // fetch TMDB search/multi
    async function performSearch(q, page = 1) {
      if (!q) return { results: [], total_pages: 0 };
      const url = `${BASE}/search/multi?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(q)}&page=${page}`;
      try {
        const r = await fetch(url);
        if (!r.ok) throw new Error("Search failed: " + r.status);
        const data = await r.json();
        return { results: data.results || [], total_pages: data.total_pages || 0 };
      } catch (err) {
        console.error("performSearch error:", err);
        return { results: [], total_pages: 0 };
      }
    }
  
    // fetch per-item details (lazy updates)
    async function fetchDetails(id, type) {
      try {
        if (type === "movie") {
          const r = await fetch(`${BASE}/movie/${id}?api_key=${API_KEY}&language=en-US`);
          if (!r.ok) return null;
          return await r.json();
        } else if (type === "tv") {
          const r = await fetch(`${BASE}/tv/${id}?api_key=${API_KEY}&language=en-US`);
          if (!r.ok) return null;
          return await r.json();
        } else return null;
      } catch (err) {
        console.warn("fetchDetails failed", id, type, err);
        return null;
      }
    }
  
    // card skeleton
    function createCardSkeleton(item) {
      const title = escapeHtml(item.title || item.name || "Untitled");
      const year = (item.release_date || item.first_air_date || "").slice(0, 4) || "N/A";
      const type = item.media_type || (item.title ? "Movie" : "TV");
      const posterUrl = item.poster_path ? (IMG + item.poster_path) : "images/no-poster.png";
  
      const card = document.createElement("div");
      card.className = "movie-card";
      card.dataset.id = item.id;
      card.dataset.type = type.toLowerCase() === "movie" ? "movie" : "tv";
  
      card.innerHTML = `
        <div class="poster">
          <img loading="lazy" src="${posterUrl}" alt="${title}">
          <span class="badge badge-quality quality" style="display:none"></span>
          <span class="badge season-badge" style="display:none"></span>
          <span class="badge duration-badge" style="display:none"></span>
        </div>
        <h3>${title}</h3>
        <div class="meta">
          <span class="year">${year}</span>
          <span class="duration-text">—</span>
          <span class="type">${type === "movie" ? "Movie" : "TV Show"}</span>
        </div>
      `;
  
      card.addEventListener("click", (e) => {
        if (e.target.tagName.toLowerCase() === "a") return;
        const t = card.dataset.type === "movie" ? "movie" : "tv";
        window.location.href = `${t}-detail.html?id=${item.id}`;
      });
  
      return card;
    }
  
    // render
    async function renderPage(items) {
      grid.innerHTML = "";
      if (!items.length) {
        grid.innerHTML = `<p class="no-results">No results found.</p>`;
        return;
      }
  
      const frag = document.createDocumentFragment();
  
      items.forEach(it => {
        const card = createCardSkeleton(it);
        frag.appendChild(card);
  
        // update quality from search payload quickly
        const qualityBadge = card.querySelector(".badge-quality") || card.querySelector(".quality");
        if (typeof it.vote_average === "number") {
          const q = computeQuality(it.vote_average);
          qualityBadge.textContent = q;
          qualityBadge.classList.remove("quality-4k","quality-1080","quality-720","quality-hd");
          if (q === "4K") qualityBadge.classList.add("quality-4k");
          else if (q === "1080p") qualityBadge.classList.add("quality-1080");
          else if (q === "720p") qualityBadge.classList.add("quality-720");
          else qualityBadge.classList.add("quality-hd");
          qualityBadge.style.display = "";
        } else {
          qualityBadge.textContent = "HD";
          qualityBadge.classList.add("quality-hd");
          qualityBadge.style.display = "";
        }
  
        // lazy details fetch
        (async () => {
          const type = it.media_type === "movie" ? "movie" : "tv";
          const details = await fetchDetails(it.id, type);
          if (!details) return;
  
          const durBadge = card.querySelector(".duration-badge");
          const seasonBadge = card.querySelector(".season-badge");
          const durText = card.querySelector(".duration-text");
          const yearSpan = card.querySelector(".year");
  
          // update year
          const dateStr = (details.release_date || details.first_air_date) || "";
          if (dateStr) yearSpan.textContent = String(dateStr).slice(0, 4) || "N/A";
  
          // short movies filter (lazy remove)
          if (type === "movie" && typeof details.runtime === "number" && details.runtime <= 40) {
            card.remove();
            return;
          }
  
          // update quality again
          if (typeof details.vote_average === "number") {
            const q = computeQuality(details.vote_average);
            qualityBadge.textContent = q;
            qualityBadge.classList.remove("quality-4k","quality-1080","quality-720","quality-hd");
            if (q === "4K") qualityBadge.classList.add("quality-4k");
            else if (q === "1080p") qualityBadge.classList.add("quality-1080");
            else if (q === "720p") qualityBadge.classList.add("quality-720");
            else qualityBadge.classList.add("quality-hd");
            qualityBadge.style.display = "";
          }
  
          // runtime or seasons
          if (type === "movie") {
            const runtime = details.runtime;
            const formatted = formatRuntime(runtime);
            if (formatted) {
              durBadge.textContent = formatted;
              durBadge.style.display = "";
              durText.textContent = formatted;
            }
            seasonBadge.style.display = "none";
          } else {
            if (details.number_of_seasons) {
              seasonBadge.textContent = `Season ${details.number_of_seasons}`;
              seasonBadge.style.display = "";
            }
            if (details.number_of_episodes) {
              durText.textContent = `EP ${details.number_of_episodes}`;
            }
            durBadge.style.display = "none";
          }
        })();
      });
  
      grid.appendChild(frag);
    }
  
    // pagination
    function renderPagination() {
      pagination.innerHTML = "";
      if (!totalPages || totalPages <= 1) return;
  
      const prev = document.createElement("button");
      prev.innerHTML = "&lt;";
      prev.disabled = currentPage === 1;
      prev.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;
          updateUrl({ q: getParams().q, page: currentPage });
          load(currentPage);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
      pagination.appendChild(prev);
  
      const startPage = Math.floor((currentPage - 1) / maxVisiblePages) * maxVisiblePages + 1;
      const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);
      for (let i = startPage; i <= endPage; i++) {
        const b = document.createElement("button");
        b.textContent = i;
        if (i === currentPage) b.classList.add("active");
        b.addEventListener("click", () => {
          if (currentPage !== i) {
            currentPage = i;
            updateUrl({ q: getParams().q, page: currentPage });
            load(currentPage);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        });
        pagination.appendChild(b);
      }
  
      const next = document.createElement("button");
      next.innerHTML = "&gt;";
      next.disabled = currentPage === totalPages;
    next.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;
        updateUrl({ q: getParams().q, page: currentPage });
        load(currentPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
    pagination.appendChild(next);
  }

  // main loader
  async function load(page = 1) {
    const params = getParams();
    const q = params.q;
    if (!q) {
      if (headerH2) headerH2.textContent = "Search Results";
      grid.innerHTML = `<p class="no-results">Please enter a search query.</p>`;
      pagination.innerHTML = "";
      return;
    }

    currentPage = page || params.page || 1;
    if (headerH2) headerH2.textContent = `Search Results for "${q}"`;

    grid.innerHTML = `<div class="loader">Loading...</div>`;
    pagination.innerHTML = "";

    const res = await performSearch(q, currentPage);
    totalPages = Math.min(res.total_pages || 0, 500);

    // only movies and tv
    let items = (res.results || []).filter(i => i.media_type === "movie" || i.media_type === "tv");

    // sort newest → oldest
    items.sort((a, b) => {
      const ta = Date.parse(a.release_date || a.first_air_date || "") || 0;
      const tb = Date.parse(b.release_date || b.first_air_date || "") || 0;
      return tb - ta;
    });

    await renderPage(items);
    renderPagination();
  }

  // init
  (function init() {
    const p = getParams();
    currentPage = p.page;
    load(currentPage);
  })();
});
