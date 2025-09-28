// js/nigerian-movies.js
document.addEventListener("DOMContentLoaded", () => {
    const moviesGrid = document.querySelector(".nigerian-grid");
    const pagination = document.querySelector(".nigerian-pagination");
    let currentPage = 1;
    let totalPages = 1;
    const maxVisiblePages = 10;
    const moviesPerPage = 20;
  
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
  
    async function fetchNigerian(page = 1) {
      const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_origin_country=NG&page=${page}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch Nigerian movies");
      return await res.json();
    }
  
    async function fetchRuntime(movieId) {
      try {
        const details = await fetchMovieDetails(movieId);
        if (details && typeof details.runtime === "number") {
          return details.runtime;
        }
      } catch {}
      return null;
    }
  
    async function loadMovies(page = 1) {
      if (!moviesGrid || !pagination) return;
  
      const prevHeight = moviesGrid.offsetHeight;
      moviesGrid.style.minHeight = prevHeight ? `${prevHeight}px` : "300px";
      moviesGrid.innerHTML = `<div class="loader">Loading...</div>`;
  
      try {
        const data = await fetchNigerian(page);
  
        if (!data || !Array.isArray(data.results)) {
          moviesGrid.innerHTML = `<p class="error">No Nigerian movies found.</p>`;
          totalPages = 1;
          renderPagination();
          return;
        }
  
        totalPages = data.total_pages ? Math.min(data.total_pages, 500) : 1;
        moviesGrid.innerHTML = "";
  
        // ✅ Sort newest → oldest
        const sortedResults = [...data.results].sort((a, b) => {
          const dateA = new Date(a.release_date || "1900-01-01");
          const dateB = new Date(b.release_date || "1900-01-01");
          return dateB - dateA;
        });
  
        sortedResults.forEach(movie => {
          const posterUrl = movie.poster_path ? TMDB_IMG_URL + movie.poster_path : "images/logo.png";
          const title = escapeHtml(movie.title || "Untitled");
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
              <span class="type">Nigerian</span>
            </div>
          `;
  
          card.addEventListener("click", () => {
            window.location.href = `movie-detail.html?id=${movie.id}`;
          });
  
          moviesGrid.appendChild(card);
  
          // fetch runtime async
          (async () => {
            try {
              const runtime = await fetchRuntime(movie.id);
              const durBadge = card.querySelector(".duration");
              const durText = card.querySelector(".duration-text");
              if (runtime && runtime >= 1) {
                const formatted = formatRuntime(runtime);
                durBadge.textContent = formatted; durBadge.classList.remove("na");
                durText.textContent = formatted; durText.classList.remove("na");
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
      } catch (err) {
        console.error(err);
        moviesGrid.innerHTML = `<p class="error">Failed to load Nigerian movies.</p>`;
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
  