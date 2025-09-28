
  document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.querySelector(".landing-search input");

    if (searchInput) {
      searchInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
          const query = searchInput.value.trim();
          if (query) {
            // Redirect to search.html with query string
            window.location.href = `search.html?q=${encodeURIComponent(query)}`;
          }
        }
      });
    }
  });

