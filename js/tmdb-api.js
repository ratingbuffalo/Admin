
// tmdb-api.js
const TMDB_API_KEY = "2051710e2b77f17652a595dbc3a52425";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMG_URL = "https://image.tmdb.org/t/p/w500";

async function fetchMovies(page = 1) {
  const url = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error fetching movies:", err);
    return { results: [], total_pages: 1 };
  }
}

// NEW: fetch movie details (contains runtime)
async function fetchMovieDetails(movieId) {
  const url = `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Movie details fetch failed");
    const data = await res.json();
    return data; // includes runtime (minutes)
  } catch (err) {
    console.error("Error fetching movie details:", err);
    return null;
  }
}
