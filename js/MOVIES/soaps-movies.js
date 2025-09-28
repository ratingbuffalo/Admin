// js/soaps-movies.js
document.addEventListener("DOMContentLoaded", () => {
    const moviesGrid = document.querySelector(".soaps-grid");
    const pagination = document.querySelector(".soaps-pagination");
    let currentPage = 1;
    let totalPages = 1;
    const maxVisiblePages = 10;
    const moviesPerPage = 20; // keep pages full
  
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
  
    async function fetchDrama(page = 1) {
      const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=18&page=${page}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch Drama movies");
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
        let collected = [];
        let apiPage = 1;
        totalPages = 500; // TMDB max
  
        // keep fetching until we gather enough valid movies
        while (collected.length < moviesPerPage * page && apiPage <= totalPages) {
          const data = await fetchDrama(apiPage);
          if (!data || !Array.isArray(data.results)) break;
  
          // filter invalid dates
          const valid = data.results.filter(m => {
            const date = new Date(m.release_date || "1900-01-01");
            return !isNaN(date);
          });
  
          // fetch runtimes in parallel
          const withRuntime = await Promise.all(
            valid.map(async m => {
              const runtime = await fetchRuntime(m.id);
              return runtime && runtime >= 40 ? { ...m, runtime } : null;
            })
          );
  
          collected.push(...withRuntime.filter(Boolean));
          apiPage++;
        }
  
        // sort newest -> oldest
        const sortedResults = collected.sort((a, b) => {
          const dateA = new Date(a.release_date || "1900-01-01");
          const dateB = new Date(b.release_date || "1900-01-01");
          return dateB - dateA;
        });
  
        // paginate
        const startIdx = (page - 1) * moviesPerPage;
        const pagedMovies = sortedResults.slice(startIdx, startIdx + moviesPerPage);
  
        moviesGrid.innerHTML = "";
  
        if (pagedMovies.length === 0) {
          moviesGrid.innerHTML = `<p class="error">No drama movies found.</p>`;
          return;
        }
  
        pagedMovies.forEach(movie => {
          const posterUrl = movie.poster_path ? TMDB_IMG_URL + movie.poster_path : "images/logo.png";
          const title = escapeHtml(movie.title || "Untitled");
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
              <span class="type">Drama</span>
            </div>
          `;
  
          card.addEventListener("click", () => {
            window.location.href = `movie-detail.html?id=${movie.id}`;
          });
  
          moviesGrid.appendChild(card);
        });
  
        renderPagination();
      } catch (err) {
        console.error(err);
        moviesGrid.innerHTML = `<p class="error">Failed to load Drama movies.</p>`;
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
      const endPage = startPage + maxVisiblePages - 1;
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
      nextBtn.addEventListener("click", () => {
        moviesGrid.style.minHeight = `${moviesGrid.offsetHeight}px`;
        currentPage++;
        loadMovies(currentPage);
        nextBtn.blur();
      });
      pagination.appendChild(nextBtn);
    }
  
    loadMovies(currentPage);
  });
  