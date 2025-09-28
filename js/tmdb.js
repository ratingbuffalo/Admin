/* js/tmdb.js
   Simple TMDB helper that exposes a global `tmdbAPI` object.
   Replace YOUR_TMDB_API_KEY below.
*/
(function(global){
    const API_KEY = "2051710e2b77f17652a595dbc3a52425"; // <-- REPLACE
    const BASE = "https://api.themoviedb.org/3";
    const IMG = "https://image.tmdb.org/t/p";
  
    async function request(path, params = {}) {
      // params is object of query params (we'll set api_key & language by default)
      const url = new URL(`${BASE}${path}`);
      url.searchParams.set("api_key", API_KEY);
      if (!params.language) url.searchParams.set("language", "en-US");
      Object.keys(params || {}).forEach(k => {
        if (k === "language") return; // already set
        url.searchParams.set(k, params[k]);
      });
      try {
        const res = await fetch(url.toString());
        if (!res.ok) {
          console.error("TMDB request failed", res.status, res.statusText, url.toString());
          return null;
        }
        return await res.json();
      } catch (e) {
        console.error("TMDB fetch error", e);
        return null;
      }
    }
  
    function getImage(path, size = "w500") {
      if (!path) return `${location.origin}/images/no-poster-500x750.png`;
      return `${IMG}/${size}${path}`;
    }
  
    // Expose
    global.tmdbAPI = {
      request,
      getImage,
      getMovieDetails: (id, append = "credits,videos,recommendations") => request(`/movie/${id}`, { append_to_response: append }),
      getTvDetails: (id, append = "credits,videos,recommendations") => request(`/tv/${id}`, { append_to_response: append }),
      getSeason: (tvId, seasonNumber) => request(`/tv/${tvId}/season/${seasonNumber}`)
    };
  })(window);
  