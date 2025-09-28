const API_KEY = "2051710e2b77f17652a595dbc3a52425";
const BASE_URL = "https://api.themoviedb.org/3";

const MIN_YEAR = 2000;
const CURRENT_YEAR = new Date().getFullYear();

let allShows = [];
let currentPage = 1;
const showsPerPage = 12;

async function fetchThrillerMysteryTv(page = 1) {
  const url = `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&page=${page}&with_genres=53,9648&vote_count.gte=50`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

async function prepareShows() {
  let rawShows = [];
  for (let p = 1; p <= 5; p++) {
    const results = await fetchThrillerMysteryTv(p);
    rawShows = rawShows.concat(results);
  }

  allShows = rawShows.map(s => {
    const yearStr = (s.first_air_date || s.release_date || "").split("-")[0];
    const year = parseInt(yearStr, 10);
    return {
      ...s,
      safeYear: !isNaN(year) ? year : "Unknown"
    };
  }).filter(s => {
    // Keep all shows with known years in range, plus unknown
    if (s.safeYear === "Unknown") return true;
    return s.safeYear >= MIN_YEAR && s.safeYear <= CURRENT_YEAR;
  });

  // Sort: 2025 → 2000 → Unknown
  allShows.sort((a, b) => {
    const yearA = (typeof a.safeYear === "number") ? a.safeYear : 0;
    const yearB = (typeof b.safeYear === "number") ? b.safeYear : 0;
    return yearB - yearA;
  });
}

function renderShows() {
  const grid = document.querySelector(".thrillers-mystery-grid");
  const pagination = document.querySelector(".thrillers-mystery-pagination");
  grid.innerHTML = "";
  pagination.innerHTML = "";

  if (!allShows.length) {
    grid.innerHTML = `<p>No Thriller & Mystery TV shows found between ${MIN_YEAR}–${CURRENT_YEAR}.</p>`;
    return;
  }

  const start = (currentPage - 1) * showsPerPage;
  const end = start + showsPerPage;
  const pageShows = allShows.slice(start, end);

  pageShows.forEach(show => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `
      <img src="https://image.tmdb.org/t/p/w500${show.poster_path}" alt="${show.name}">
      <div class="meta">
        <span>${show.safeYear}</span>
        <span>EP ${show.episode_count || "?"}</span>
        <span>TV Show</span>
        <span>Season ${show.number_of_seasons || "?"}</span>
      </div>
      <h3>${show.name}</h3>
    `;
    grid.appendChild(card);
  });

  // Pagination buttons
  const totalPages = Math.ceil(allShows.length / showsPerPage);
  for (let i = 1; i <= totalPages && i <= 10; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.classList.add("active");
    btn.addEventListener("click", () => {
      currentPage = i;
      renderShows();
    });
    pagination.appendChild(btn);
  }
}

// Initialize
(async () => {
  await prepareShows();
  renderShows();
})();
