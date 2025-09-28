// movie-detail.js (final updated)
// Fetch and display Movie/TV details from TMDB and implement vidsrc player injection

const API_KEY = "2051710e2b77f17652a595dbc3a52425"; // replace with your TMDB key if needed
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/original";

const params = new URLSearchParams(window.location.search);
const itemId = params.get("id");
const itemType = (params.get("type") || "movie").toLowerCase(); // 'movie' or 'tv'
const paramSeason = params.get("season");
const paramEpisode = params.get("episode");

// DOM
const backdropEl = document.getElementById("backdrop");
const posterEl = document.getElementById("poster");
const titleEl = document.getElementById("title");
const overviewEl = document.getElementById("overview");
const ratingEl = document.getElementById("rating");
const votesEl = document.getElementById("votes");
const imdbEl = document.getElementById("imdb");
const releaseDateEl = document.getElementById("release-date");
const runtimeEl = document.getElementById("runtime");
const genresEl = document.getElementById("genres");
const castsEl = document.getElementById("casts");
const countriesEl = document.getElementById("countries");
const productionEl = document.getElementById("production");
const relatedEl = document.getElementById("related");
const breadcrumbTitle = document.getElementById("breadcrumb-title");

// Player related DOM
const playerContainer = document.getElementById("video-player-container");
const playerCenter = document.getElementById("player-center");
const playButton = document.getElementById("play-button");
const playerTitle = document.getElementById("player-title");
const playerYear = document.getElementById("player-year");

// Related pagination DOM
const relatedPaginationEl = document.getElementById("related-pagination");

// Utility: format year
function getYearFromDate(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d)) return "N/A";
  return d.getFullYear();
}

/* -------------------------
   SEO Updater
   ------------------------- */
   function updateSeoFromTmdb(item, type = "movie") {
    const title = item.title || item.name || "Untitled";
    const year = getYearFromDate(item.release_date || item.first_air_date);
    const fullTitle = year !== "N/A" ? `${title} (${year}) | Watch Free on F2Movies` : `${title} | Watch Free on F2Movies`;
    const desc = item.overview?.substring(0, 160) || "Watch free HD movies and TV shows on F2Movies.";
    const poster = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "images/placeholder.jpg";
    const url = `${window.location.origin}/movie-detail.html?id=${item.id}&type=${type}`;
  
    // Title & Description
    document.title = fullTitle;
    document.getElementById("seo-title")?.setAttribute("content", fullTitle);
    document.getElementById("seo-description")?.setAttribute("content", desc);
  
    // Open Graph
    document.getElementById("og-title")?.setAttribute("content", fullTitle);
    document.getElementById("og-description")?.setAttribute("content", desc);
    document.getElementById("og-image")?.setAttribute("content", poster);
    document.getElementById("og-url")?.setAttribute("content", url);
  
    // Twitter
    document.getElementById("twitter-title")?.setAttribute("content", fullTitle);
    document.getElementById("twitter-description")?.setAttribute("content", desc);
    document.getElementById("twitter-image")?.setAttribute("content", poster);
  
    // Canonical
    document.getElementById("canonical-link")?.setAttribute("href", url);
  
    // JSON-LD
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": type === "tv" ? "TVSeries" : "Movie",
      "name": title,
      "image": poster,
      "description": desc,
      "datePublished": item.release_date || item.first_air_date,
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": item.vote_average,
        "ratingCount": item.vote_count
      }
    };
    document.getElementById("json-ld").textContent = JSON.stringify(jsonLd);
  }
  

// Build vidsrc embed url per your spec
function buildVidsrcUrl({ type, id, season, episode }) {
  if (type === "tv") {
    // require season and episode
    if (!season || !episode) {
      console.warn("TV embed missing season/episode, using defaults S01E01");
      season = season || 1;
      episode = episode || 1;
    }
    return `https://vidsrc.me/embed/tv/${id}/${season}/${episode}`;
  } else {
    return `https://vidsrc.me/embed/movie/${id}`;
  }
}

// Replace playerCenter content with a loader element
function showLoader() {
  playerCenter.innerHTML = "";
  const loader = document.createElement("div");
  loader.className = "dotted-loader";
  loader.setAttribute("aria-hidden", "true");
  playerCenter.appendChild(loader);
}

// Restore the original play button (if needed)
function restorePlayButton() {
  playerCenter.innerHTML = "";
  const btn = document.createElement("button");
  btn.className = "play-button";
  btn.id = "play-button";
  btn.setAttribute("aria-label", "Play");
  const span = document.createElement("span");
  span.className = "play-icon";
  btn.appendChild(span);
  // reattach event
  btn.addEventListener("click", onPlayClicked);
  playerCenter.appendChild(btn);
}

// Handle errors (display message)
function showPlayerError(message) {
  playerCenter.innerHTML = "";
  const err = document.createElement("div");
  err.className = "player-error";
  err.textContent = message || "Failed to load video. Please try again.";
  playerCenter.appendChild(err);

  // also allow retry with a small button
  const retry = document.createElement("button");
  retry.textContent = "Try again";
  retry.style.marginTop = "10px";
  retry.style.padding = "8px 12px";
  retry.style.borderRadius = "8px";
  retry.style.border = "none";
  retry.style.cursor = "pointer";
  retry.addEventListener("click", () => {
    restorePlayButton();
  });
  playerCenter.appendChild(retry);
}

// Inject responsive iframe replacing player container
function injectIframe(embedUrl) {
  const iframe = document.createElement("iframe");
  iframe.src = embedUrl;
  iframe.className = "video-iframe";
  iframe.allowFullscreen = true;
  iframe.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

  // Clear entire backdrop and append iframe
  backdropEl.innerHTML = "";
  backdropEl.appendChild(iframe);
}

// Play button handler
async function onPlayClicked() {
  try {
    // show loader immediately
    showLoader();

    // small UX delay for dotted loader: 2 seconds
    await new Promise((res) => setTimeout(res, 2000));

    // determine embed url
    const season = resolvedSeasonForEmbed;
    const episode = resolvedEpisodeForEmbed;
    const embedUrl = buildVidsrcUrl({
      type: itemType,
      id: itemId,
      season,
      episode,
    });

    // inject iframe
    injectIframe(embedUrl);
  } catch (err) {
    console.error("Error during play:", err);
    showPlayerError("An unexpected error happened.");
  }
}

/* -------------------------
   TMDB data fetching + rendering
   ------------------------- */

let resolvedSeasonForEmbed = null;
let resolvedEpisodeForEmbed = null;

// RELATED pagination state
let relatedCurrentPage = 1;
let relatedTotalPages = 1;

async function getMovieDetails() {
  try {
    const res = await fetch(
      `${BASE_URL}/movie/${itemId}?api_key=${API_KEY}&language=en-US`
    );
    const data = await res.json();
    if (!data || data.status_code) {
      console.warn("Movie data not found", data);
      return;
    }

    if (data.backdrop_path) {
      const imgUrl = `${IMG_BASE}${data.backdrop_path}`;
      backdropEl.style.setProperty("--backdrop-image", `url("${imgUrl}")`);
      backdropEl.style.backgroundImage = `url(${imgUrl})`;
    }

    if (data.poster_path) posterEl.src = `${IMG_BASE}${data.poster_path}`;

    titleEl.textContent = data.title || "Untitled";
    breadcrumbTitle.textContent = data.title || "";
    overviewEl.textContent = data.overview || "";
    ratingEl.textContent = data.vote_average ? data.vote_average.toFixed(1) : "N/A";
    votesEl.textContent = data.vote_count || 0;
    imdbEl.textContent = data.imdb_id || "N/A";
    releaseDateEl.textContent = data.release_date || "N/A";
    runtimeEl.textContent = data.runtime ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m` : "N/A";
    genresEl.textContent = data.genres?.map((g) => g.name).join(", ") || "N/A";
    countriesEl.textContent = data.production_countries?.map((c) => c.name).join(", ") || "N/A";
    productionEl.textContent = data.production_companies?.map((p) => p.name).join(", ") || "N/A";

    const year = getYearFromDate(data.release_date);
    playerTitle.textContent = data.title || "Untitled";
    playerYear.textContent = year === "N/A" ? "" : `(${year})`;

    resolvedSeasonForEmbed = null;
    resolvedEpisodeForEmbed = null;

    updateSeoFromTmdb(data, "movie");
  } catch (error) {
    console.error("Error fetching movie details:", error);
  }

  
}

async function getTvDetails() {
  try {
    const res = await fetch(
      `${BASE_URL}/tv/${itemId}?api_key=${API_KEY}&language=en-US&append_to_response=external_ids`
    );
    const data = await res.json();
    if (!data || data.status_code) {
      console.warn("TV data not found", data);
      return;
    }

    if (data.backdrop_path) {
      const imgUrl = `${IMG_BASE}${data.backdrop_path}`;
      backdropEl.style.setProperty("--backdrop-image", `url("${imgUrl}")`);
      backdropEl.style.backgroundImage = `url(${imgUrl})`;
    }

    if (data.poster_path) posterEl.src = `${IMG_BASE}${data.poster_path}`;

    titleEl.textContent = data.name || "Untitled";
    breadcrumbTitle.textContent = data.name || "";
    overviewEl.textContent = data.overview || "";
    ratingEl.textContent = data.vote_average ? data.vote_average.toFixed(1) : "N/A";
    votesEl.textContent = data.vote_count || 0;
    imdbEl.textContent = data.external_ids?.imdb_id || "N/A";
    releaseDateEl.textContent = data.first_air_date || "N/A";
    runtimeEl.textContent = (data.episode_run_time && data.episode_run_time.length) ? `${data.episode_run_time[0]}m` : "N/A";
    genresEl.textContent = data.genres?.map((g) => g.name).join(", ") || "N/A";
    countriesEl.textContent = data.production_countries?.map((c) => c.name).join(", ") || "N/A";
    productionEl.textContent = data.production_companies?.map((p) => p.name).join(", ") || "N/A";

    let season = paramSeason ? Number(paramSeason) : null;
    let episode = paramEpisode ? Number(paramEpisode) : null;

    if (!season || !episode) {
      if (data.last_episode_to_air && data.last_episode_to_air.season_number && data.last_episode_to_air.episode_number) {
        season = season || data.last_episode_to_air.season_number;
        episode = episode || data.last_episode_to_air.episode_number;
      }
    }

    if (!season || !episode) {
      if (data.seasons && data.seasons.length) {
        const candidate = data.seasons.find((s) => s.season_number > 0) || data.seasons[0];
        season = season || candidate?.season_number || 1;
        episode = episode || 1;
      } else {
        season = season || 1;
        episode = episode || 1;
      }
    }

    resolvedSeasonForEmbed = season;
    resolvedEpisodeForEmbed = episode;

    function pad(n) {
      return String(n).padStart(2, "0");
    }
    const sStr = `S${pad(season)}E${pad(episode)}`;
    playerTitle.textContent = `${data.name || "Untitled"} (${sStr})`;
    const year = getYearFromDate(data.first_air_date);
    playerYear.textContent = year === "N/A" ? "" : `(${year})`;

    updateSeoFromTmdb(data, "tv");
  } catch (error) {
    console.error("Error fetching TV details:", error);

    
  }

  

}

// Fetch credits
async function getCredits() {
  try {
    const endpoint = itemType === "tv" ? `${BASE_URL}/tv/${itemId}/credits` : `${BASE_URL}/movie/${itemId}/credits`;
    const res = await fetch(`${endpoint}?api_key=${API_KEY}&language=en-US`);
    const data = await res.json();
    if (data && data.cast) {
      castsEl.textContent = data.cast.slice(0, 6).map((a) => a.name).join(", ");
    }
  } catch (err) {
    console.error("Error fetching credits:", err);
  }
}

/* ---------------------
   RELATED section
   --------------------- */
async function getRelated(page = 1) {
  try {
    const endpoint =
      itemType === "tv"
        ? `${BASE_URL}/tv/${itemId}/recommendations`
        : `${BASE_URL}/movie/${itemId}/recommendations`;

    // Clear both containers early so pagination disappears and placeholders appear immediately
    relatedEl.innerHTML = "";
    relatedPaginationEl.innerHTML = "";

    const res = await fetch(`${endpoint}?api_key=${API_KEY}&language=en-US&page=${page}`);
    const data = await res.json();

    if (!data || !Array.isArray(data.results) || data.results.length === 0) {
      relatedEl.innerHTML = `<p style="color:#bdbdbd;padding:8px">No recommendations found.</p>`;
      relatedPaginationEl.innerHTML = "";
      return;
    }

    // ✅ sort newest → oldest
    const sorted = data.results.sort((a, b) => {
      const da = new Date(a.release_date || a.first_air_date || 0).getTime();
      const db = new Date(b.release_date || b.first_air_date || 0).getTime();
      return db - da;
    });

    relatedCurrentPage = data.page || page || 1;
    relatedTotalPages = data.total_pages || 1;

    const items = sorted.slice(0, 12);

    // Create placeholders to keep layout stable, then replace them progressively
    const placeholders = [];
    for (let i = 0; i < items.length; i++) {
      const ph = document.createElement("div");
      ph.className = "related-card placeholder";
      ph.innerHTML = `
        <div class="poster" style="background:#151515;display:block;width:100%;height:240px;"></div>
        <div class="card-info" style="padding:10px;">
          <h3 style="background:linear-gradient(90deg,#222,#2b2b2b);height:16px;width:70%;margin:0 0 8px 0;border-radius:4px;"></h3>
          <div class="meta" style="background:linear-gradient(90deg,#222,#2b2b2b);height:12px;width:50%;border-radius:4px;"></div>
        </div>
      `;
      relatedEl.appendChild(ph);
      placeholders.push(ph);
    }

    // sequentially fetch details for TV items and replace placeholders one-by-one
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      const isTV = !!item.name && !item.title;
      const poster = item.poster_path ? IMG_BASE + item.poster_path : "https://via.placeholder.com/160x240";
      const title = item.title || item.name || "Untitled";
      const year = (item.release_date || item.first_air_date || "").split("-")[0] || "";
      const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";

      let bottomBadge = "";
      let seasonsText = "";

      if (isTV) {
        try {
          const detailsRes = await fetch(`${BASE_URL}/tv/${item.id}?api_key=${API_KEY}&language=en-US`);
          const details = await detailsRes.json();
          const epCount = details.number_of_episodes ? `EP ${details.number_of_episodes}` : "EP ?";
          const seasons = details.number_of_seasons ? `Season ${details.number_of_seasons}` : "Season ?";
          bottomBadge = `<span class="card-ep bottom-left">${epCount}</span>`;
          seasonsText = seasons;
        } catch (e) {
          bottomBadge = `<span class="card-ep bottom-left">EP ?</span>`;
        }
      } else {
        bottomBadge = `<span class="card-ep bottom-left">Movie</span>`;
      }

      const url = isTV ? `tv-detail.html?id=${item.id}` : `movie-detail.html?id=${item.id}`;

      // Build final card
      const card = document.createElement("div");
      card.className = "related-card";
      card.innerHTML = `
        <a href="${url}">
          <div class="poster">
            <img src="${poster}" alt="${escapeHtml(title)}">
            <span class="card-badge top-left">⭐ ${rating}</span>
            <span class="card-badge top-right">HD</span>
            ${bottomBadge}
          </div>
          <div class="card-info">
            <h3>${escapeHtml(title)}</h3>
            <div class="meta">
              ${escapeHtml(year)}
              ${isTV ? "&middot; TV &nbsp;" + escapeHtml(seasonsText) : "&middot; Movie"}
            </div>
          </div>
        </a>
      `;

      // Replace the placeholder with the real card (preserves order)
      const ph = placeholders[idx];
      if (ph && ph.parentNode) {
        ph.parentNode.replaceChild(card, ph);
      } else {
        relatedEl.appendChild(card);
      }
    }

    renderRelatedPagination();
  } catch (err) {
    console.error("Error fetching related:", err);
    relatedEl.innerHTML = `<p style="color:#bdbdbd">Error loading recommendations.</p>`;
  }

  // after relatedEl.appendChild(card); loop is done
const cards = relatedEl.querySelectorAll(".related-card");
cards.forEach((card, i) => {
  setTimeout(() => {
    card.classList.add("show");
  }, i * 150); // stagger by 150ms
});

}

// pagination renderer (improved windowed pagination)
function renderRelatedPagination() {
  relatedPaginationEl.innerHTML = "";
  relatedPaginationEl.className = "pagination related-pagination"; // apply your styles

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Prev";
  prevBtn.disabled = relatedCurrentPage === 1;
  prevBtn.addEventListener("click", () => {
    if (relatedCurrentPage > 1) {
      relatedCurrentPage--;
      getRelated(relatedCurrentPage);
    }
  });
  relatedPaginationEl.appendChild(prevBtn);

  const maxButtons = 5;
  let startPage = Math.max(1, relatedCurrentPage - 2);
  let endPage = Math.min(relatedTotalPages, startPage + maxButtons - 1);

  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.textContent = i;
    if (i === relatedCurrentPage) pageBtn.classList.add("active");
    pageBtn.addEventListener("click", () => {
      relatedCurrentPage = i;
      getRelated(i);
    });
    relatedPaginationEl.appendChild(pageBtn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.disabled = relatedCurrentPage === relatedTotalPages;
  nextBtn.addEventListener("click", () => {
    if (relatedCurrentPage < relatedTotalPages) {
      relatedCurrentPage++;
      getRelated(relatedCurrentPage);
    }
  });
  relatedPaginationEl.appendChild(nextBtn);
}

/* Initialize */
async function init() {
  if (!itemId) {
    console.error("No id query parameter provided in URL.");
    return;
  }

  // Attach play button event (initial)
  if (playButton) {
    playButton.addEventListener("click", onPlayClicked);
  }

  // Fetch details depending on type
  if (itemType === "tv") {
    // TMDB: For tv we also fetch external_ids to maybe populate IMDB id when available
    await getTvDetails();
    await getCredits();
    await getRelated(); // defaults to page 1
  } else {
    await getMovieDetails();
    await getCredits();
    await getRelated(); // defaults to page 1
  }

  // Accessibility: if keyboard users press Enter on the button
  if (playButton) {
    playButton.addEventListener("keyup", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        onPlayClicked();
      }
    });
  }
}

init();

// small helper: escape HTML content inserted into innerHTML
function escapeHtml(str) {
  return String(str || "").replace(/[&<>"'`=\/]/g, (s) =>
    (
      {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "/": "&#x2F;",
        "`": "&#x60;",
        "=": "&#x3D;"
      }
    )[s]
  );
}
