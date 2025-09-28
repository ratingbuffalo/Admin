// js/recommended-movies.js
document.addEventListener("DOMContentLoaded", () => {
    const moviesGrid = document.getElementById("recommended-grid");
    const pagination = document.getElementById("recommended-pagination");
    let currentPage = 1;
    let totalPages = 1;
    const maxVisiblePages = 10;
  
    // Helper: Format runtime into "1h 45m"
    function formatRuntime(minutes) {
      if (!minutes && minutes !== 0) return null;
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
  
    // Fetch Recommended Movies (Top Rated as source)
    async function fetchRecommendedMovies(page = 1) {
      const url = `${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&page=${page}`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch recommended movies");
        return res.json();
      } catch (err) {
        console.error("fetchRecommendedMovies error:", err);
        return null;
      }
    }
  
    async function loadMovies(page = 1) {
      if (!moviesGrid || !pagination) return;
      moviesGrid.innerHTML = `<div class="loader">Loading...</div>`;
      try {
        const data = await fetchRecommendedMovies(page);
        if (!data || !Array.isArray(data.results)) {
          moviesGrid.innerHTML = `<p class="error">No data returned from API.</p>`;
          totalPages = 1;
          renderPagination();
          return;
        }
        totalPages = data.total_pages ? Math.min(data.total_pages, 500) : 1;
        moviesGrid.innerHTML = "";
  
        // ✅ Sort results by year (newest → oldest)
        data.results.sort((a, b) => {
          const yearA = parseInt((a.release_date || a.first_air_date || "0").split("-")[0]) || 0;
          const yearB = parseInt((b.release_date || b.first_air_date || "0").split("-")[0]) || 0;
          return yearB - yearA; // descending order
        });
  
        data.results.forEach(movie => {
          const posterUrl = movie.poster_path ? TMDB_IMG_URL + movie.poster_path : 'images/logo.png';
          const card = document.createElement("div");
          card.classList.add("movie-card");
          card.dataset.id = movie.id;
          card.innerHTML = `
            <div class="poster">
                <img src="${posterUrl}" alt="${movie.title || movie.name}">
                <span class="badge">HD</span>
                <span class="duration na">—</span>
            </div>
            <h3>${movie.title || movie.name}</h3>
            <div class="meta">
                <span class="year">${movie.release_date ? movie.release_date.split("-")[0] : (movie.first_air_date ? movie.first_air_date.split("-")[0] : "N/A")}</span>
                <span class="duration-text na">—</span>
                <span class="type">${movie.media_type ? movie.media_type : (movie.title ? "Movie" : "TV")}</span>
            </div>
          `;
          card.addEventListener("click", () => {
            const type = movie.media_type ? movie.media_type : (movie.title ? "movie" : "tv");
            window.location.href = `movie-detail.html?id=${movie.id}`;
          });
          moviesGrid.appendChild(card);
  
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
                } else {
                  durBadge.textContent = durText.textContent = "N/A";
                  durBadge.classList.add("na"); durText.classList.add("na");
                }
              } else {
                durBadge.textContent = durText.textContent = "N/A";
                durBadge.classList.add("na"); durText.classList.add("na");
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
  
        // ✅ Scroll only to Recommended section, not page top
        const header = document.querySelector(".recommended-header");
        if (header) {
          header.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } catch {
        moviesGrid.innerHTML = `<p class="error">Failed to load movies. Try again later.</p>`;
        totalPages = 1;
        renderPagination();
      }
    }
  
    function renderPagination() {
      pagination.innerHTML = "";
  
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
  
      const startPage =
        Math.floor((currentPage - 1) / maxVisiblePages) * maxVisiblePages + 1;
      const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);
      for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        if (i === currentPage) btn.classList.add("active");
        btn.addEventListener("click", () => {
          if (currentPage !== i) {
            currentPage = i;
            loadMovies(currentPage);
          }
        });
        pagination.appendChild(btn);
      }
  
      const nextBtn = document.createElement("button");
      nextBtn.innerHTML = "&gt;";
      nextBtn.disabled = currentPage === totalPages || totalPages === 0;
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
  