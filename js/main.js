// main.js
document.addEventListener("DOMContentLoaded", () => {
    const moviesGrid = document.getElementById("movies-grid");
    const pagination = document.getElementById("pagination");
    let currentPage = 1;
    let totalPages = 1;
    const maxVisiblePages = 10; // show up to 10 page buttons
  
    function formatRuntime(minutes) {
      if (!minutes && minutes !== 0) return null;
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
  
    async function loadMovies(page = 1) {
      // guard
      if (!moviesGrid || !pagination) return;
  
      // show temporary loader
      moviesGrid.innerHTML = `<div class="loader">Loading...</div>`;
      try {
        const data = await fetchMovies(page); // defined in tmdb-api.js
        if (!data || !Array.isArray(data.results)) {
          moviesGrid.innerHTML = `<p class="error">No data returned from API.</p>`;
          totalPages = 1;
          renderPagination();
          return;
        }
  
        // clamp totalPages (TMDB commonly caps at 500)
        totalPages = data.total_pages ? Math.min(data.total_pages, 500) : 1;
  
        moviesGrid.innerHTML = "";
  
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
          // click to detail page (keeps previous pattern)
          card.addEventListener("click", () => {
            const type = movie.media_type ? movie.media_type : (movie.title ? "movie" : "tv");
            window.location.href = `movie-detail.html?id=${movie.id}`;
          });
  
          moviesGrid.appendChild(card);
  
          // asynchronously fetch details and update runtime when available
          (async () => {
            try {
              const details = await fetchMovieDetails(movie.id); // defined in tmdb-api.js
              if (details && typeof details.runtime === "number") {
                const formatted = formatRuntime(details.runtime);
                const durBadge = card.querySelector(".duration");
                const durText = card.querySelector(".duration-text");
                if (formatted) {
                  if (durBadge) { durBadge.textContent = formatted; durBadge.classList.remove("na"); }
                  if (durText)  { durText.textContent = formatted; durText.classList.remove("na"); }
                } else {
                  if (durBadge) { durBadge.textContent = "N/A"; durBadge.classList.add("na"); }
                  if (durText)  { durText.textContent = "N/A"; durText.classList.add("na"); }
                }
              } else {
                // no runtime available
                const durBadge = card.querySelector(".duration");
                const durText = card.querySelector(".duration-text");
                if (durBadge) { durBadge.textContent = "N/A"; durBadge.classList.add("na"); }
                if (durText)  { durText.textContent = "N/A"; durText.classList.add("na"); }
              }
            } catch (err) {
              console.error("Error updating runtime for movie", movie.id, err);
              const durBadge = card.querySelector(".duration");
              const durText = card.querySelector(".duration-text");
              if (durBadge) { durBadge.textContent = "N/A"; durBadge.classList.add("na"); }
              if (durText)  { durText.textContent = "N/A"; durText.classList.add("na"); }
            }
          })();
        });
  
        // update pagination after rendering movies
        renderPagination();
        // scroll to top of grid for a nicer UX when changing pages
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        console.error("Error in loadMovies:", err);
        moviesGrid.innerHTML = `<p class="error">Failed to load movies. Try again later.</p>`;
        totalPages = 1;
        renderPagination();
      }
    }
  
    function renderPagination() {
      pagination.innerHTML = "";
  
      // Prev arrow
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
  
      // Calculate start and end page numbers based on currentPage block
      const startPage = Math.floor((currentPage - 1) / maxVisiblePages) * maxVisiblePages + 1;
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
  
      // Next arrow
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
  
    // initial load
    loadMovies(currentPage);
  });
  