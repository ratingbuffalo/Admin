// js/southafrican-movies.js
document.addEventListener("DOMContentLoaded", () => {
    const moviesGrid = document.querySelector(".southafrican-grid");
    const pagination = document.querySelector(".southafrican-pagination");
    let currentPage = 1;
    const itemsPerPage = 20; // ✅ show max 20 cards per page
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
  
    async function fetchSouthAfricanMovies(pages = 10) {
      let results = [];
      for (let p = 1; p <= pages; p++) {
        const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_origin_country=ZA&page=${p}`;
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
      const rawMovies = await fetchSouthAfricanMovies(10); // fetch first 10 pages (~200 movies)
  
      // ✅ Filter valid years first
      let validMovies = rawMovies.filter(m => {
        const year = parseInt((m.release_date || "").split("-")[0], 10);
        return year >= MIN_YEAR && year <= CURRENT_YEAR;
      });
  
      // ✅ Fetch runtimes BEFORE pagination
      const withRuntime = [];
      for (const movie of validMovies) {
        try {
          const details = await fetchMovieDetails(movie.id);
          if (details && typeof details.runtime === "number" && details.runtime >= 40) {
            withRuntime.push({ ...movie, runtime: details.runtime });
          }
        } catch {
          // skip movies with no runtime
        }
      }
  
      // ✅ Sort by year DESC (2025 → 2000)
      allMovies = withRuntime.sort((a, b) => {
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
  
      // Manual pagination AFTER filtering + sorting
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const pageMovies = allMovies.slice(start, end);
  
      moviesGrid.innerHTML = "";
  
      if (pageMovies.length === 0) {
        moviesGrid.innerHTML = `<p class="error">No South African movies found between 2000–${CURRENT_YEAR}.</p>`;
        pagination.innerHTML = "";
        return;
      }
  
      for (const movie of pageMovies) {
        const posterUrl = movie.poster_path ? TMDB_IMG_URL + movie.poster_path : "images/logo.png";
        const title = escapeHtml(movie.title || movie.name || "Untitled");
        const year = movie.release_date ? movie.release_date.split("-")[0] : "N/A";
        const formatted = formatRuntime(movie.runtime);
  
        const card = document.createElement("div");
        card.className = "movie-card";
        card.dataset.id = movie.id;
  
        card.innerHTML = `
          <div class="poster">
            <img src="${posterUrl}" alt="${title}" width="300" height="450" loading="lazy">
            <span class="badge">HD</span>
            <span class="duration">${formatted || "N/A"}</span>
          </div>
          <h3>${title}</h3>
          <div class="meta">
            <span class="year">${year}</span>
            <span class="duration-text">${formatted || "N/A"}</span>
            <span class="type">Movie</span>
          </div>
        `;
  
        card.addEventListener("click", () => {
          window.location.href = `movie-detail.html?id=${movie.id}`;
        });
  
        moviesGrid.appendChild(card);
      }
  
      renderPagination();
    }
  
    function renderPagination() {
      pagination.innerHTML = "";
      const totalPages = Math.ceil(allMovies.length / itemsPerPage);
  
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
  
      for (let i = 1; i <= totalPages; i++) {
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
  