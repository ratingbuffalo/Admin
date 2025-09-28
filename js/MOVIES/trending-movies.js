// js/trending-movies.js
document.addEventListener("DOMContentLoaded", () => {
    const moviesGrid = document.getElementById("trending-grid");
    const pagination = document.getElementById("trending-pagination");
    let currentPage = 1;
    let totalPages = 1;
    const maxVisiblePages = 10;
  
    function formatRuntime(minutes) {
      if (!minutes && minutes !== 0) return null;
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
  
    // Escape text safely
    function escapeHtml(str) {
      return String(str || "").replace(/[&<>"']/g, m => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
      }[m]));
    }
  
    // Fetch trending movies (daily)
    async function fetchTrendingMovies(page = 1) {
      const url = `${TMDB_BASE_URL}/trending/movie/day?api_key=${TMDB_API_KEY}&page=${page}`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch trending movies");
        return res.json();
      } catch (err) {
        console.error("fetchTrendingMovies error:", err);
        return null;
      }
    }
  
    async function loadMovies(page = 1) {
      if (!moviesGrid || !pagination) return;
  
      const prevHeight = moviesGrid.offsetHeight;
      moviesGrid.style.minHeight = prevHeight ? `${prevHeight}px` : "300px";
      moviesGrid.innerHTML = `<div class="loader">Loading...</div>`;
  
      try {
        const data = await fetchTrendingMovies(page);
  
        if (!data || !Array.isArray(data.results)) {
          moviesGrid.innerHTML = `<p class="error">No data returned from API.</p>`;
          totalPages = 1;
          renderPagination();
          return;
        }
  
        totalPages = data.total_pages ? Math.min(data.total_pages, 500) : 1;
        moviesGrid.innerHTML = "";
  
        // Sort by release date (newest first)
        const sortedResults = [...data.results].sort((a, b) => {
          const dateA = new Date(a.release_date || a.first_air_date || "1900-01-01");
          const dateB = new Date(b.release_date || b.first_air_date || "1900-01-01");
          return dateB - dateA;
        });
  
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
            const type = movie.media_type ? movie.media_type : (movie.title ? "movie" : "tv");
            window.location.href = `movie-detail.html?id=${movie.id}`;
          });
  
          moviesGrid.appendChild(card);
  
          // Fetch runtime asynchronously
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
        document.querySelector(".trending-header").scrollIntoView({ behavior: "smooth" });
  
      } catch (err) {
        console.error(err);
        moviesGrid.innerHTML = `<p class="error">Failed to load trending movies. Try again later.</p>`;
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
  
    // Initial load
    loadMovies(currentPage);
  });
  