// sections.js
const TMDB_IMG_URL = "https://image.tmdb.org/t/p/w500";

function formatRuntime(minutes) {
  if (!minutes && minutes !== 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

async function fetchDetails(id, type = "movie") {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/${type}/${id}?api_key=2051710e2b77f17652a595dbc3a52425&language=en-US`
    );
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.error("fetchDetails error:", err);
    return null;
  }
}

async function initSection(sectionId, baseUrl) {
  const grid = document.querySelector(`#${sectionId}-grid`);
  const pagination = document.querySelector(`#${sectionId}-pagination`);

  let currentPage = 1;
  let totalPages = 1;

  async function loadPage(page = 1) {
    try {
      const url = baseUrl.includes("page=")
        ? baseUrl + page
        : `${baseUrl}${page}`;
      const res = await fetch(url);
      const data = await res.json();
      totalPages = data.total_pages || 1;
      grid.innerHTML = "";

      data.results.forEach((item) => {
        const isMovie = !!item.title;
        const title = isMovie ? item.title : item.name;
        const year = isMovie
          ? (item.release_date ? item.release_date.split("-")[0] : "N/A")
          : (item.first_air_date ? item.first_air_date.split("-")[0] : "N/A");
        const posterUrl = item.poster_path
          ? TMDB_IMG_URL + item.poster_path
          : "images/logo.png";

        const card = document.createElement("div");
        card.classList.add("movie-card");
        card.dataset.id = item.id;

        card.innerHTML = `
          <div class="poster">
            <img src="${posterUrl}" alt="${title}">
            <span class="badge">HD</span>
            <span class="duration na">—</span>
          </div>
          <h3>${title}</h3>
          <div class="meta">
            <span class="year">${year}</span>
            <span class="duration-text na">—</span>
            <span class="type">${isMovie ? "Movie" : "TV"}</span>
          </div>
        `;

        // go to detail page
        card.addEventListener("click", () => {
          window.location.href = `movie-detail.html?id=${item.id}`;
        });

        grid.appendChild(card);

        // fetch runtime asynchronously
        (async () => {
          const details = await fetchDetails(item.id, isMovie ? "movie" : "tv");
          if (details && typeof details.runtime === "number") {
            const formatted = formatRuntime(details.runtime);
            card.querySelector(".duration").textContent = formatted || "N/A";
            card.querySelector(".duration").classList.remove("na");
            card.querySelector(".duration-text").textContent =
              formatted || "N/A";
            card.querySelector(".duration-text").classList.remove("na");
          } else if (details && details.episode_run_time?.length) {
            const formatted = formatRuntime(details.episode_run_time[0]);
            card.querySelector(".duration").textContent = formatted || "N/A";
            card.querySelector(".duration").classList.remove("na");
            card.querySelector(".duration-text").textContent =
              formatted || "N/A";
            card.querySelector(".duration-text").classList.remove("na");
          } else {
            card.querySelector(".duration").textContent = "N/A";
            card.querySelector(".duration-text").textContent = "N/A";
          }
        })();
      });

      renderPagination();
    } catch (err) {
      console.error("Error loading section:", sectionId, err);
    }
  }

  function renderPagination() {
    pagination.innerHTML = "";

    const maxVisible = 10;
    let start = Math.floor((currentPage - 1) / maxVisible) * maxVisible + 1;
    let end = Math.min(start + maxVisible - 1, totalPages);

    // prev arrow
    if (currentPage > 1) {
      const prev = document.createElement("button");
      prev.textContent = "<";
      prev.addEventListener("click", () => {
        currentPage = Math.max(1, currentPage - 1);
        loadPage(currentPage);
      });
      pagination.appendChild(prev);
    }

    // numbered buttons
    for (let i = start; i <= end; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.className = i === currentPage ? "active" : "";
      btn.addEventListener("click", () => {
        currentPage = i;
        loadPage(currentPage);
      });
      pagination.appendChild(btn);
    }

    // next arrow
    if (currentPage < totalPages) {
      const next = document.createElement("button");
      next.textContent = ">";
      next.addEventListener("click", () => {
        currentPage = Math.min(totalPages, currentPage + 1);
        loadPage(currentPage);
      });
      pagination.appendChild(next);
    }
  }

  loadPage(currentPage);
}
