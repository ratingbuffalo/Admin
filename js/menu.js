document.addEventListener("DOMContentLoaded", () => {
  const hamburgers = document.querySelectorAll(".hamburger"); // select both buttons
  const navLinks = document.querySelector(".nav-links");
  const overlay = document.querySelector(".overlay"); // overlay div

  // Toggle menu when clicking ANY hamburger
  hamburgers.forEach((hamburger) => {
    hamburger.addEventListener("click", (e) => {
      e.stopPropagation(); // prevent closing immediately
      navLinks.classList.toggle("active");
      overlay.classList.toggle("show"); // toggle overlay
    });
  });

  // Close menu when clicking outside navLinks or hamburgers
  document.addEventListener("click", (e) => {
    if (
      navLinks.classList.contains("active") &&
      !navLinks.contains(e.target) &&
      ![...hamburgers].some(h => h.contains(e.target)) // check against all hamburgers
    ) {
      navLinks.classList.remove("active");
      overlay.classList.remove("show"); // hide overlay
    }
  });

  // Close menu when clicking overlay directly
  overlay.addEventListener("click", () => {
    navLinks.classList.remove("active");
    overlay.classList.remove("show");
  });
});
