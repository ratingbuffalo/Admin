// js/top-rated-movies.js
document.addEventListener("DOMContentLoaded", () => {
    const moviesGrid = document.querySelector(".toprated-grid");
    const pagination = document.querySelector(".toprated-pagination");
    let currentPage = 1;
    let totalPages = 1;
    const maxVisiblePages = 10;
  
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
  
    async function fetchTopRated(page = 1) {
      const url = `${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&page=${page}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch Top Rated movies");
      return await res.json();
    }
  
    async function loadMovies(page = 1) {
      if (!moviesGrid || !pagination) return;
  
      const prevHeight = moviesGrid.offsetHeight;
      moviesGrid.style.minHeight = prevHeight ? `${prevHeight}px` : "300px";
      moviesGrid.innerHTML = `<div class="loader">Loading...</div>`;
  
      try {
        const data = await fetchTopRated(page);
  
        if (!data || !Array.isArray(data.results)) {
          moviesGrid.innerHTML = `<p class="error">No data returned from API.</p>`;
          totalPages = 1;
          renderPagination();
          return;
        }
  
        totalPages = data.total_pages ? Math.min(data.total_pages, 500) : 1;
        moviesGrid.innerHTML = "";
  
        const currentYear = new Date().getFullYear();
  
        // Group movies by year
        const moviesByYear = data.results.reduce((acc, movie) => {
          const year = movie.release_date
            ? parseInt(movie.release_date.split("-")[0])
            : (movie.first_air_date ? parseInt(movie.first_air_date.split("-")[0]) : 0);
          if (!acc[year]) acc[year] = [];
          acc[year].push(movie);
          return acc;
        }, {});
  
        // Sort years: newest -> oldest
        const sortedYears = Object.keys(moviesByYear)
          .map(y => parseInt(y))
          .sort((a, b) => b - a);
  
        // Flatten into one list, prioritizing by year first, rating second
        const sortedResults = [];
        sortedYears.forEach(year => {
          const yearMovies = moviesByYear[year].sort((a, b) => b.vote_average - a.vote_average);
          sortedResults.push(...yearMovies);
        });
  
        // Render cards
        sortedResults.forEach(movie => {
          const posterUrl = movie.poster_path ? TMDB_IMG_URL + movie.poster_path : "images/logo.png";
          const title = escapeHtml(movie.title || movie.name || "Untitled");
          const year = movie.release_date ? movie.release_date.split("-")[0] :
                       (movie.first_air_date ? movie.first_air_date.split("-")[0] : "N/A");
  
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
              <span class="type">${movie.media_type ? movie.media_type : (movie.title ? "Movie" : "TV")}</span>
            </div>
          `;
  
          card.addEventListener("click", () => {
            window.location.href = `movie-detail.html?id=${movie.id}`;
          });
  
          moviesGrid.appendChild(card);
  
          // Fetch runtime async
          (async () => {
            try {
              const details = await fetchMovieDetails(movie.id);
              const durBadge = card.querySelector(".duration");
              const durText = card.querySelector(".duration-text");
              if (details && typeof details.runtime === "number") {
                const formatted = formatRuntime(details.runtime);
                if (formatted) {
                  durBadge.textContent = formatted; durBadge.classList.remove("na");
                  durText.textContent = formatted; durText.classList.remove("na");
                }
              }
            } catch {
              const durBadge = card.querySelector(".duration");
              const durText = card.querySelector(".duration-text");
              durBadge.textContent = durText.textContent = "N/A";
              durBadge.classList.add("na"); durText.classList.add("na");
            }
          })();
        });
  
        renderPagination();
  
      } catch (err) {
        console.error(err);
        moviesGrid.innerHTML = `<p class="error">Failed to load Top Rated movies.</p>`;
        totalPages = 1;
        renderPagination();
      } finally {
        requestAnimationFrame(() => {
          moviesGrid.style.minHeight = "";
        });
      }
    }
  
    function renderPagination() {
      pagination.innerHTML = "";
  
      const prevBtn = document.createElement("button");
      prevBtn.innerHTML = "&lt;";
      prevBtn.disabled = currentPage === 1;
      prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
          moviesGrid.style.minHeight = `${moviesGrid.offsetHeight}px`;
          currentPage--;
          loadMovies(currentPage);
        }
        prevBtn.blur();
      });
      pagination.appendChild(prevBtn);
  
      const startPage = Math.floor((currentPage - 1) / maxVisiblePages) * maxVisiblePages + 1;
      const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);
      for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        if (i === currentPage) btn.classList.add("active");
        btn.addEventListener("click", () => {
          if (currentPage !== i) {
            moviesGrid.style.minHeight = `${moviesGrid.offsetHeight}px`;
            currentPage = i;
            loadMovies(currentPage);
          }
          btn.blur();
        });
        pagination.appendChild(btn);
      }
  
      const nextBtn = document.createElement("button");
      nextBtn.innerHTML = "&gt;";
      nextBtn.disabled = currentPage === totalPages || totalPages === 0;
      nextBtn.addEventListener("click", () => {
        if (currentPage < totalPages) {
          moviesGrid.style.minHeight = `${moviesGrid.offsetHeight}px`;
          currentPage++;
          loadMovies(currentPage);
        }
        nextBtn.blur();
      });
      pagination.appendChild(nextBtn);
    }
  
    loadMovies(currentPage);
  });
  