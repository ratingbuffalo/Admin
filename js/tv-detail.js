// tv-detail.js
// Fetch and display TV show details from TMDB

const API_KEY = "2051710e2b77f17652a595dbc3a52425"; // 🔑 Replace with your TMDB key
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/original";

// ✅ Get TV ID from URL
const params = new URLSearchParams(window.location.search);
const tvId = params.get("id");

// ✅ Elements
const backdropEl = document.getElementById("backdrop");
const posterEl = document.getElementById("poster");
const titleEl = document.getElementById("title");
const overviewEl = document.getElementById("overview");
const ratingEl = document.getElementById("rating");
const votesEl = document.getElementById("votes");
const imdbEl = document.getElementById("imdb");
const releaseDateEl = document.getElementById("first-air-date");
const lastAirDateEl = document.getElementById("last-air-date");
const genresEl = document.getElementById("genres");
const castsEl = document.getElementById("casts");
const seasonsEl = document.getElementById("seasons");
const episodesEl = document.getElementById("episodes");
const countriesEl = document.getElementById("countries");
const productionEl = document.getElementById("production");
const relatedEl = document.getElementById("related");
const relatedPaginationEl = document.getElementById("related-pagination"); // ✅ pagination container
const breadcrumbTitle = document.getElementById("breadcrumb-title");

// ✅ Episode selector elements
const seasonSelectEl = document.getElementById("seasonSelect");
const episodeListEl = document.getElementById("episodeList");
const videoPlayerEl = document.getElementById("videoPlayer"); // small red player (YouTube)
const currentEpisodeTitleEl = document.getElementById("current-episode-title");

// ✅ Big player (decorative)
const playButtonEl = document.getElementById("play-button");

// ✅ Pagination state
let currentPage = 1;
let totalPages = 1;

// ===== ADDED GLOBALS (minimal state) =====
let tvShowName = "";               // store series name so title shows show name (not episode)
let embedFrame = null;             // the <iframe> element that will host vidsrc
let isEmbedVisible = false;        // whether embed is currently visible
let decorativeOverlay = null;      // overlay element (so we can control darkness)
//////////////////////////////////////////

// ✅ Fetch TV show details
async function getTvDetails() {
  try {
    const res = await fetch(
      `${BASE_URL}/tv/${tvId}?api_key=${API_KEY}&language=en-US&append_to_response=external_ids`
    );
    const data = await res.json();

    if (data) {
      if (data.backdrop_path) {
        backdropEl.style.backgroundImage = `url(${IMG_BASE}${data.backdrop_path})`;
      }
      if (data.poster_path) {
        posterEl.src = `${IMG_BASE}${data.poster_path}`;
      }
      titleEl.textContent = data.name || "Untitled";
      breadcrumbTitle.textContent = data.name;
      overviewEl.textContent = data.overview || "No description available.";
      ratingEl.textContent = data.vote_average
        ? data.vote_average.toFixed(1)
        : "N/A";
      votesEl.textContent = data.vote_count || 0;
      imdbEl.textContent = data.external_ids?.imdb_id || "N/A";
      releaseDateEl.textContent = data.first_air_date || "N/A";
      lastAirDateEl.textContent = data.last_air_date || "N/A";
      genresEl.textContent = data.genres?.map((g) => g.name).join(", ") || "N/A";
      seasonsEl.textContent = data.number_of_seasons || "N/A";
      episodesEl.textContent = data.number_of_episodes || "N/A";
      countriesEl.textContent = data.origin_country?.join(", ") || "N/A";
      productionEl.textContent =
        data.production_companies?.map((p) => p.name).join(", ") || "N/A";

      // ===== set global show name =====
      tvShowName = data.name || "Untitled Show";

      // ===== create a lightweight decorative overlay (only once) and keep it moderately light =====
      if (!backdropEl.querySelector(".decorative-overlay")) {
        decorativeOverlay = document.createElement("div");
        decorativeOverlay.className = "decorative-overlay";
        // inline styles so you don't need to touch CSS; lighter opacity to avoid too-dim backdrop
        decorativeOverlay.style.cssText =
          "position:absolute;inset:0;background:rgba(0,0,0,0.35);z-index:1;pointer-events:none;";
        backdropEl.appendChild(decorativeOverlay);
      } else {
        decorativeOverlay = backdropEl.querySelector(".decorative-overlay");
        decorativeOverlay.style.background = "rgba(0,0,0,0.35)";
      }

      // ensure the play button + title sit above overlay
      if (playButtonEl) {
        playButtonEl.style.zIndex = "2";
        playButtonEl.style.display = ""; // keep original display
      }
      if (currentEpisodeTitleEl) {
        currentEpisodeTitleEl.style.zIndex = "2";
        currentEpisodeTitleEl.style.display = ""; // show by default
      }

      loadTrailer(); // load general trailer
    }
  } catch (error) {
    console.error("Error fetching TV details:", error);
  }
}

// ✅ Fetch Casts
async function getTvCredits() {
  try {
    const res = await fetch(
      `${BASE_URL}/tv/${tvId}/credits?api_key=${API_KEY}&language=en-US`
    );
    const data = await res.json();
    if (data && data.cast) {
      castsEl.textContent = data.cast
        .slice(0, 5)
        .map((actor) => actor.name)
        .join(", ");
    }
  } catch (error) {
    console.error("Error fetching TV casts:", error);
  }
}

// ✅ Fetch Related TV Shows (with pagination)
async function getRelatedTvShows(page = 1) {
  try {
    const res = await fetch(
      `${BASE_URL}/tv/${tvId}/recommendations?api_key=${API_KEY}&language=en-US&page=${page}`
    );
    const data = await res.json();

    relatedEl.innerHTML = "";
    relatedPaginationEl.innerHTML = "";

    if (data && data.results && data.results.length) {
      const shows = data.results.slice(0, 12);

      for (const show of shows) {
        const detailsRes = await fetch(
          `${BASE_URL}/tv/${show.id}?api_key=${API_KEY}&language=en-US`
        );
        const details = await detailsRes.json();

        const year = show.first_air_date
          ? new Date(show.first_air_date).getFullYear()
          : "N/A";
        const poster = show.poster_path
          ? `https://image.tmdb.org/t/p/w342${show.poster_path}`
          : "images/no-poster-186x286.png";
        const episodes = details.number_of_episodes
          ? `EP ${details.number_of_episodes}`
          : "EP ?";
        const seasons = details.number_of_seasons
          ? `Season ${details.number_of_seasons}`
          : "Season ?";
        const quality = "HD";

        const card = document.createElement("div");
        card.className = "movie-card";
        card.innerHTML = `
          <a href="tv-detail.html?id=${show.id}">
            <div class="poster">
              <img src="${poster}" alt="${escapeHtml(show.name)}">
              <span class="badge">${quality}</span>
              <span class="duration">${episodes}</span>
            </div>
            <h3>${escapeHtml(show.name)}</h3>
            <div class="meta">
              <span>${year}</span>
              <span>· TV</span>
              <span class="duration-text">${seasons}</span>
            </div>
          </a>
        `;
        relatedEl.appendChild(card);
      }

      totalPages = data.total_pages;
      renderPagination();
    } else {
      relatedEl.innerHTML = `<p style="color:var(--text-muted)">No recommendations found.</p>`;
    }
  } catch (error) {
    console.error("Error fetching related TV shows:", error);
  }
}

// ✅ Render Pagination Controls
function renderPagination() {
  relatedPaginationEl.innerHTML = "";

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Prev";
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      getRelatedTvShows(currentPage);
    }
  });
  relatedPaginationEl.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    if (i > 5 && i !== currentPage) continue; // limit number buttons
    const pageBtn = document.createElement("button");
    pageBtn.textContent = i;
    if (i === currentPage) pageBtn.classList.add("active");
    pageBtn.addEventListener("click", () => {
      currentPage = i;
      getRelatedTvShows(currentPage);
    });
    relatedPaginationEl.appendChild(pageBtn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      getRelatedTvShows(currentPage);
    }
  });
  relatedPaginationEl.appendChild(nextBtn);
}

// ✅ Fetch Seasons + Episodes
async function getTvSeasonsAndEpisodes() {
  if (!seasonSelectEl) return;

  try {
    const res = await fetch(
      `${BASE_URL}/tv/${tvId}?api_key=${API_KEY}&language=en-US`
    );
    const data = await res.json();

    if (!data || !data.seasons) return;

    seasonSelectEl.innerHTML = data.seasons
      .filter((season) => season.season_number !== 0)
      .map(
        (season) => `
        <option value="${season.season_number}">
          Season ${season.season_number} (${season.episode_count} eps)
        </option>
      `
      )
      .join("");

    loadEpisodes(data.id, seasonSelectEl.value);

    seasonSelectEl.addEventListener("change", () => {
      loadEpisodes(data.id, seasonSelectEl.value);
    });
  } catch (err) {
    console.error("Error fetching seasons/episodes:", err);
  }
}

// ✅ Load Episodes
async function loadEpisodes(tvId, seasonNumber) {
  try {
    const res = await fetch(
      `${BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}&language=en-US`
    );
    const data = await res.json();

    if (!data || !data.episodes) return;

    episodeListEl.innerHTML = "";

    data.episodes.forEach((ep, idx) => {
      const btn = document.createElement("button");
      btn.textContent = `${ep.episode_number}. ${ep.name || "Untitled"}`;
      btn.addEventListener("click", () => {
        setActiveEpisode(btn);
        playEpisode(tvId, seasonNumber, ep);
      });
      episodeListEl.appendChild(btn);

      if (idx === 0 && seasonNumber == 1) {
        setActiveEpisode(btn);
        playEpisode(tvId, seasonNumber, ep);
      }
    });
  } catch (err) {
    console.error("Error loading episodes:", err);
  }
}

// ✅ Highlight active episode
function setActiveEpisode(button) {
  const buttons = episodeListEl.querySelectorAll("button");
  buttons.forEach((b) => b.classList.remove("active"));
  button.classList.add("active");
}

// =========================
// ✅ Play Episode (updated)
// - uses vidsrc
// - uses tvShowName for title
// - when embed visible and user picks a new episode we restore decorative UI first
// - we keep original DOM nodes (no permanent innerHTML wipes) so nothing else breaks
// =========================
function playEpisode(tvId, season, ep) {
  // build vidsrc embed url
  const embedUrl = `https://vidsrc.me/embed/tv/${tvId}/${season}/${ep.episode_number}`;

  // store for click handler
  window._currentEmbedUrl = embedUrl;
  window._currentEmbedSeason = season;
  window._currentEmbedEpisode = ep.episode_number;
  window._currentEpisodeObject = ep;

  // If currently showing an embed, clear it and show decorative UI again
  if (isEmbedVisible && embedFrame) {
    try {
      embedFrame.src = "";            // stop playback
    } catch (e) { /* ignore */ }
    embedFrame.style.display = "none";
    isEmbedVisible = false;

    // show decorative elements again
    if (decorativeOverlay) decorativeOverlay.style.display = "block";
    if (playButtonEl) {
      playButtonEl.style.display = "";
      playButtonEl.classList.remove("loading");
      playButtonEl.textContent = "▶";
      playButtonEl.style.pointerEvents = "auto";
    }
    if (currentEpisodeTitleEl) {
      currentEpisodeTitleEl.style.display = "";
    }
  }

  // Update decorative landing player UI to use show name (not episode title)
  if (currentEpisodeTitleEl) {
    const safeTitle = escapeHtml(ep.name || "Untitled Show");
    const sStr = String(season).padStart(2, "0");
    const eStr = String(ep.episode_number).padStart(2, "0");
    const year = ep.air_date ? `(${new Date(ep.air_date).getFullYear()})` : "";
    currentEpisodeTitleEl.innerHTML = `
      <div class="player-title">${safeTitle} (S${sStr}E${eStr})</div>
      <div class="player-subtitle">${year}</div>
    `;
    // ensure visible
    currentEpisodeTitleEl.style.display = "";
  }

  // Backdrop still (unchanged behavior)
  if (ep.still_path) {
    backdropEl.style.backgroundImage = `url(${IMG_BASE}${ep.still_path})`;
  }

  // Ensure decorative overlay exists (getTvDetails should create it, but guard here)
  if (!decorativeOverlay) {
    if (!backdropEl.querySelector(".decorative-overlay")) {
      decorativeOverlay = document.createElement("div");
      decorativeOverlay.className = "decorative-overlay";
      decorativeOverlay.style.cssText =
        "position:absolute;inset:0;background:rgba(0,0,0,0.35);z-index:1;pointer-events:none;";
      backdropEl.appendChild(decorativeOverlay);
    } else {
      decorativeOverlay = backdropEl.querySelector(".decorative-overlay");
      decorativeOverlay.style.background = "rgba(0,0,0,0.35)";
    }
  }

  // Reset play button state (show it)
  if (playButtonEl) {
    playButtonEl.classList.remove("loading");
    playButtonEl.textContent = "▶";
    playButtonEl.style.pointerEvents = "auto";
    playButtonEl.style.zIndex = "2";
  }

  // Attach decorative click handler once (uses global _currentEmbedUrl)
  if (playButtonEl && !playButtonEl._hasDecorativeHandler) {
    playButtonEl.addEventListener("click", function _decorativePlayHandler() {
      if (!window._currentEmbedUrl || playButtonEl.classList.contains("loading")) return;

      // show loader (CSS assumed to show dotted loader when .loading exists)
      playButtonEl.classList.add("loading");
      playButtonEl.textContent = "";
      playButtonEl.style.pointerEvents = "none";

// inside playEpisode → playButtonEl.addEventListener("click", ...)

setTimeout(() => {
    // create or reuse embed frame
    if (!embedFrame) {
      embedFrame = document.createElement("iframe");
      embedFrame.id = "embedFrame";
      embedFrame.frameBorder = "0";
      embedFrame.allow = "autoplay; fullscreen";
      embedFrame.allowFullscreen = true;
      // position absolutely to fill backdrop without changing backdrop sizing
      embedFrame.style.position = "absolute";
      embedFrame.style.inset = "0";
      embedFrame.style.width = "100%";
      embedFrame.style.height = "100%";
      embedFrame.style.border = "0";
      // ⬇️ FIXED: put iframe above overlay + clickable
      embedFrame.style.zIndex = "3"; 
      embedFrame.style.pointerEvents = "auto";
      embedFrame.style.borderRadius = "6px";
      backdropEl.appendChild(embedFrame);
    }
  
    // set src (vidsrc)
    embedFrame.src = window._currentEmbedUrl;
    embedFrame.style.display = "block";
  
    // hide decorative UI so embed is visible
    if (decorativeOverlay) decorativeOverlay.style.display = "none";
    if (playButtonEl) playButtonEl.style.display = "none";
    if (currentEpisodeTitleEl) currentEpisodeTitleEl.style.display = "none";
  
    isEmbedVisible = true;
  }, 1500);  
    });

    playButtonEl._hasDecorativeHandler = true;
  }

  // Update small trailer iframe (unchanged)
  loadEpisodeTrailer(tvId, ep.season_number, ep.episode_number);
}


// ✅ Update Episode Info
function updateEpisodeInfo(ep) {
  // Use show name (tvShowName) for decorative title display + (E##S##)
  if (currentEpisodeTitleEl) {
    const safeShowTitle = escapeHtml(tvShowName || "Untitled Show");
    const sStr = String(ep.season_number).padStart(2, "0");
    const eStr = String(ep.episode_number).padStart(2, "0");
    const year = ep.air_date ? `(${new Date(ep.air_date).getFullYear()})` : "";
    currentEpisodeTitleEl.innerHTML = `
      <div class="player-title">${safeShowTitle} (S${sStr}E${eStr})</div>
      <div class="player-subtitle">${year}</div>
    `;
  }

  // update backdrop still (preserve previous behaviour)
  if (ep.still_path) {
    backdropEl.style.backgroundImage = `url(${IMG_BASE}${ep.still_path})`;
  }

  // keep stored embed reference in sync for convenience
  window._currentEmbedSeason = ep.season_number;
  window._currentEmbedEpisode = ep.episode_number;
  window._currentEpisodeObject = ep;
  window._currentEmbedUrl = `https://vidsrc.me/embed/tv/${tvId}/${ep.season_number}/${ep.episode_number}`;

  // If an embed was visible, we intentionally DO NOT update the iframe right away here.
  // Instead, selecting an episode will reset the UI to decorative state (playEpisode handles that).
  // This preserves the behavior you asked for: user sees decorative player after selecting an episode,
  // then clicks play to load that episode's embed.

  loadEpisodeTrailer(tvId, ep.season_number, ep.episode_number);
}


// ✅ Load General Trailer (small red player)
async function loadTrailer() {
  try {
    const res = await fetch(
      `${BASE_URL}/tv/${tvId}/videos?api_key=${API_KEY}&language=en-US`
    );
    const data = await res.json();
    const trailer = data.results.find((v) => v.site === "YouTube");
    if (trailer) {
      videoPlayerEl.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=0&rel=0`;
    }
  } catch (err) {
    console.error("Error loading trailer:", err);
  }
}

// ✅ Load Episode Trailer (update small red player)
async function loadEpisodeTrailer(tvId, season, episode) {
  try {
    const res = await fetch(
      `${BASE_URL}/tv/${tvId}/season/${season}/episode/${episode}/videos?api_key=${API_KEY}&language=en-US`
    );
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      const trailer = data.results.find((v) => v.site === "YouTube");
      if (trailer) {
        videoPlayerEl.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=0&rel=0`;
        return;
      }
    }
    loadTrailer(); // fallback
  } catch (err) {
    console.error("Error loading episode trailer:", err);
  }
}

// ✅ Escape HTML
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
        "=": "&#x3D;",
      }
    )[s]
  );
}

// ✅ Init
getTvDetails();
getTvCredits();
getRelatedTvShows(currentPage);
getTvSeasonsAndEpisodes();
