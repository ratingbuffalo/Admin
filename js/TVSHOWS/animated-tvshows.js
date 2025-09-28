// js/animated-tvshows.js
document.addEventListener("DOMContentLoaded", () => {
    const showsGrid = document.querySelector(".animated-grid");
    const pagination = document.querySelector(".animated-pagination");
    if (!showsGrid || !pagination) return;
  
    let currentPage = 1;
    const itemsPerPage = 20;
    const CURRENT_YEAR = new Date().getFullYear();
    const MIN_YEAR = 2000;
    let allShows = [];
  
    function escapeHtml(str) {
      return String(str || "").replace(/[&<>"']/g, m => (
        {"&":"&amp;","<":"&lt;"," >":"&gt;",'"':"&quot;","'":"&#39;"}[m]
      ));
    }
  
    async function fetchAnimatedTv(pages = 5) {
      let results = [];
  
      for (let p = 1; p <= pages; p++) {
        const url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=16&page=${p}`;
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();
        if (data && Array.isArray(data.results)) {
          results = results.concat(data.results);
        }
      }
  
      // ✅ remove duplicates
      const seen = new Set();
      results = results.filter(show => {
        if (seen.has(show.id)) return false;
        seen.add(show.id);
        return true;
      });
  
      return results;
    }
  
    async function getTvDetails(id) {
      if (typeof fetchTvDetails === "function") {
        try { return await fetchTvDetails(id); } catch {}
      }
      const url = `${TMDB_BASE_URL}/tv/${id}?api_key=${TMDB_API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      return res.json();
    }
  
    async function prepareShows() {
      const rawShows = await fetchAnimatedTv(5);
  
      allShows = rawShows.filter(s => {
        const year = parseInt((s.first_air_date || "").split("-")[0], 10);
        return year >= MIN_YEAR && year <= CURRENT_YEAR;
      });
  
      // ✅ Sort DESC (latest first)
      allShows.sort((a, b) => {
        const yearA = parseInt((a.first_air_date || "").split("-")[0], 10) || 0;
        const yearB = parseInt((b.first_air_date || "").split("-")[0], 10) || 0;
        return yearB - yearA;
      });
    }
  
    async function loadShows(page = 1) {
      showsGrid.innerHTML = `<div class="loader">Loading...</div>`;
  
      if (allShows.length === 0) {
        await prepareShows();
      }
  
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const pageShows = allShows.slice(start, end);
  
      showsGrid.innerHTML = "";
  
      if (pageShows.length === 0) {
        showsGrid.innerHTML = `<p class="error">No Animated TV shows found between 2000–${CURRENT_YEAR}.</p>`;
        pagination.innerHTML = "";
        return;
      }
  
      for (const show of pageShows) {
        const posterUrl = show.poster_path ? TMDB_IMG_URL + show.poster_path : "images/logo.png";
        const title = escapeHtml(show.name || show.original_name || "Untitled");
        const year = show.first_air_date ? show.first_air_date.split("-")[0] : "N/A";
  
        const card = document.createElement("div");
        card.className = "movie-card";
        card.dataset.id = show.id;
  
        card.innerHTML = `
          <div class="poster">
            <img src="${posterUrl}" alt="${title}" width="300" height="450" loading="lazy">
            <span class="badge">HD</span>
            <span class="duration na">—</span>
          </div>
          <h3>${title}</h3>
          <div class="meta">
            <span class="year">${year}</span>
            <span class="duration-text na">—</span>
            <span class="type">TV Show</span>
          </div>
        `;
  
        card.addEventListener("click", () => {
          window.location.href = `tv-detail.html?id=${show.id}`;
        });
  
        showsGrid.appendChild(card);
  
        // async details (episodes + seasons)
        (async () => {
          try {
            const details = await getTvDetails(show.id);
            const seasons = details?.number_of_seasons || 0;
            const episodes = details?.number_of_episodes || 0;
  
            const durBadge = card.querySelector(".duration");
            const durText = card.querySelector(".duration-text");
  
            if (episodes > 0) {
              durBadge.textContent = `EP ${episodes}`;
              durBadge.classList.remove("na");
              durText.textContent = `EP ${episodes}`;
              durText.classList.remove("na");
            }
  
            if (seasons > 0) {
              const seasonBadge = document.createElement("span");
              seasonBadge.className = "duration season-badge";
              seasonBadge.textContent = `Season ${seasons}`;
              card.querySelector(".poster").appendChild(seasonBadge);
            }
          } catch {}
        })();
      }
  
      renderPagination();
    }
  
    function renderPagination() {
      pagination.innerHTML = "";
  
      const totalPages = Math.ceil(allShows.length / itemsPerPage);
      const maxButtons = 10;
      let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
      let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  
      if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
      }
  
      const prevBtn = document.createElement("button");
      prevBtn.innerHTML = "&lt;";
      prevBtn.disabled = currentPage === 1;
      prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;
          loadShows(currentPage);
        }
      });
      pagination.appendChild(prevBtn);
  
      for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        if (i === currentPage) btn.classList.add("active");
        btn.addEventListener("click", () => {
          currentPage = i;
          loadShows(currentPage);
        });
        pagination.appendChild(btn);
      }
  
      const nextBtn = document.createElement("button");
      nextBtn.innerHTML = "&gt;";
      nextBtn.disabled = currentPage === totalPages;
      nextBtn.addEventListener("click", () => {
        if (currentPage < totalPages) {
          currentPage++;
          loadShows(currentPage);
        }
      });
      pagination.appendChild(nextBtn);
    }
  
    loadShows(currentPage);
  });
  