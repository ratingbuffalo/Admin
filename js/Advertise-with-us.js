async function loadBanners(device = "desktop") {
    try {
      const res = await fetch("/assets/banners.json"); // path to your JSON
      if (!res.ok) throw new Error("Failed to load banners.json");
      const data = await res.json();
  
      const now = new Date();
      const container = document.querySelector("#ad-container"); // <div id="ad-container"></div>
  
      container.innerHTML = ""; // clear old banners
  
      const banners = data.banners
        .filter(b => b.enabled)
        .filter(b => {
          const s = b.schedule?.start ? new Date(b.schedule.start) : null;
          const e = b.schedule?.end ? new Date(b.schedule.end) : null;
          if (s && now < s) return false;
          if (e && now > e) return false;
          return true;
        })
        .sort((a, b) => b.priority - a.priority);
  
      banners.forEach(b => {
        const placement = b.placements.find(p => p.device === device) ||
                          b.placements.find(p => p.device === "all");
        if (!placement) return;
  
        const img = document.createElement("img");
        img.src = placement.image_url;
        img.alt = placement.alt || b.name;
        img.width = placement.size.w;
        img.height = placement.size.h;
        img.style.maxWidth = "100%";
  
        const a = document.createElement("a");
        a.href = placement.target_url || data.defaultTarget;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.appendChild(img);
  
        container.appendChild(a);
      });
    } catch (err) {
      console.error("Banner load failed:", err);
    }
  }
  
  // Run on load
  document.addEventListener("DOMContentLoaded", () => {
    const device = window.innerWidth <= 768 ? "mobile" : "desktop";
    loadBanners(device);
  });
  