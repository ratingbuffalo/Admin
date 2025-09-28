document.addEventListener("DOMContentLoaded", () => {
    fetch("banners.json")
      .then(res => res.json())
      .then(config => {
        renderAllBanners(config);
        window.addEventListener("resize", () => renderAllBanners(config));
      });
  });
  
  /* Detect best banner size for current screen */
  function getBannerSize() {
    const w = window.innerWidth;
  
    if (w <= 400) return "234x60";   // half banner
    if (w <= 600) return "320x50";   // mobile leaderboard
    if (w <= 768) return "320x100";  // large mobile
    if (w <= 991) return "468x60";   // banner
    if (w <= 1024) return "728x90";  // leaderboard
    if (w <= 1199) return "970x90";  // large leaderboard
    return "970x150";                // biggest unit now 970x150
  }
  
  function renderAllBanners(config) {
    document.querySelectorAll(".banner-slot").forEach(slot => {
      const id = slot.dataset.bannerId;
      const banner = config[id];
      if (banner) renderBanner(slot, banner);
    });
  }
  
  function renderBanner(slot, banner) {
    const size = getBannerSize();
    slot.innerHTML = "";
  
    if (banner.type === "image") {
      const img = document.createElement("img");
      img.src = banner.images[size] || banner.images["728x90"];
      slot.appendChild(img);
  
      if (banner.link) {
        slot.style.cursor = "pointer";
        slot.onclick = () => window.open(banner.link, "_blank");
      }
    }
  }
  