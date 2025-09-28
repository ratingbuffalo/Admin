// js/musical-movies.js
document.addEventListener("DOMContentLoaded", () => {
    const moviesGrid = document.querySelector(".musical-grid");
    const pagination = document.querySelector(".musical-pagination");
    let currentPage = 1;
    const itemsPerPage = 20;
    const CURRENT_YEAR = new Date().getFullYear();
    const MIN_YEAR = 2000;
    let allMovies = [];
  
    function formatRuntime(minutes) {
      if (!minutes && minutes !== 0) return null;
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
  
    function escapeHtml(str) {
      return String(str || "").replace(/[&<>"']/g, m => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
      }[m]));
    }
  
    async function fetchMusicalMovies(pages = 5) {
      let results = [];
      for (let p = 1; p <= pages; p++) {
        const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=10402&page=${p}`;
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();
        if (data && Array.isArray(data.results)) {
          results = results.concat(data.results);
        }
      }
      return results;
    }
  
    async function prepareMovies() {
      const rawMovies = await fetchMusicalMovies(10);
  
      // ✅ Filter movies between 2000–current year
      allMovies = rawMovies.filter(m => {
        const year = parseInt((m.release_date || "").split("-")[0], 10);
        return year >= MIN_YEAR && year <= CURRENT_YEAR;
      });
  
      // ✅ Sort by year (newest first)
      allMovies.sort((a, b) => {
        const yearA = parseInt((a.release_date || "").split("-")[0], 10) || 0;
        const yearB = parseInt((b.release_date || "").split("-")[0], 10) || 0;
        return yearB - yearA;
      });
    }
  
    async function loadMovies(page = 1) {
      if (!moviesGrid || !pagination) return;
  
      moviesGrid.innerHTML = `<div class="loader">Loading...</div>`;
  
      if (allMovies.length === 0) {
        await prepareMovies();
      }
  
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const pageMovies = allMovies.slice(start, end);
  
      moviesGrid.innerHTML = "";
  
      if (pageMovies.length === 0) {
        moviesGrid.innerHTML = `<p class="error">No Musical movies found between 2000–${CURRENT_YEAR}.</p>`;
        pagination.innerHTML = "";
        return;
      }
  
      for (const movie of pageMovies) {
        const posterUrl = movie.poster_path ? TMDB_IMG_URL + movie.poster_path : "images/logo.png";
        const title = escapeHtml(movie.title || movie.name || "Untitled");
        const year = movie.release_date ? movie.release_date.split("-")[0] : "N/A";
  
        const card = document.createElement("div");
        card.className = "movie-card";
        card.dataset.id = movie.id;
  
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
            <span class="type">Movie</span>
          </div>
        `;
  
        card.addEventListener("click", () => {
          window.location.href = `movie-detail.html?id=${movie.id}`;
        });
  
        moviesGrid.appendChild(card);
  
        // ✅ Fetch runtime async & remove <40min
        (async () => {
          try {
            const details = await fetchMovieDetails(movie.id);
            const durBadge = card.querySelector(".duration");
            const durText = card.querySelector(".duration-text");
            if (details && typeof details.runtime === "number" && details.runtime >= 40) {
              const formatted = formatRuntime(details.runtime);
              if (formatted) {
                durBadge.textContent = formatted; durBadge.classList.remove("na");
                durText.textContent = formatted; durText.classList.remove("na");
              }
            } else {
              card.remove();
            }
          } catch {
            card.remove();
          }
        })();
      }
  
      renderPagination();
    }
  
    function renderPagination() {
      pagination.innerHTML = "";
  
      const totalPages = Math.ceil(allMovies.length / itemsPerPage);
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
          loadMovies(currentPage);
        }
      });
      pagination.appendChild(prevBtn);
  
      for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        if (i === currentPage) btn.classList.add("active");
        btn.addEventListener("click", () => {
          currentPage = i;
          loadMovies(currentPage);
        });
        pagination.appendChild(btn);
      }
  
      const nextBtn = document.createElement("button");
      nextBtn.innerHTML = "&gt;";
      nextBtn.disabled = currentPage === totalPages;
      nextBtn.addEventListener("click", () => {
        if (currentPage < totalPages) {
          currentPage++;
          loadMovies(currentPage);
        }
      });
      pagination.appendChild(nextBtn);
    }
  
    loadMovies(currentPage);
  });
  