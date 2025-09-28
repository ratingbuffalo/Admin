// js/search-bar.js

document.addEventListener("DOMContentLoaded", () => {
    // Header search elements
    const headerInput = document.getElementById("search-input");
    const headerBtn = document.getElementById("search-btn");
  
    // Landing search elements
    const landingInput = document.querySelector(".landing-search input");
    const landingBtn = document.querySelector(".landing-search button");
  
    // Function to handle searches
    function handleSearch(query) {
      if (query && query.trim() !== "") {
        // Encode query for safe URL
        const encoded = encodeURIComponent(query.trim());
        window.location.href = `search.html?q=${encoded}`;
      }
    }
  
    // Header search (button click + Enter key)
    if (headerBtn && headerInput) {
      headerBtn.addEventListener("click", () => {
        handleSearch(headerInput.value);
      });
  
      headerInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleSearch(headerInput.value);
      });
    }
  
    // Landing search (button click + Enter key)
    if (landingBtn && landingInput) {
      landingBtn.addEventListener("click", () => {
        handleSearch(landingInput.value);
      });
  
      landingInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleSearch(landingInput.value);
      });
    }
  });
  