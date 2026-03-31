(function () {
  if (window.showToast) return;

  function ensureContainer() {
    let container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      container.style.position = "fixed";
      container.style.top = "20px";
      container.style.right = "20px";
      container.style.zIndex = "99999";
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.gap = "12px";
      container.style.width = "min(360px, calc(100vw - 32px))";
      document.body.appendChild(container);
    }
    return container;
  }

  window.showToast = function (message, type = "info") {
    const container = ensureContainer();
    const toast = document.createElement("div");

    const themes = {
      success: {
        border: "1px solid rgba(34,197,94,0.30)",
        bg: "linear-gradient(180deg, rgba(34,197,94,0.18), rgba(6,9,19,0.96))",
        title: "Success",
      },
      error: {
        border: "1px solid rgba(239,68,68,0.30)",
        bg: "linear-gradient(180deg, rgba(239,68,68,0.18), rgba(6,9,19,0.96))",
        title: "Error",
      },
      info: {
        border: "1px solid rgba(228,184,79,0.30)",
        bg: "linear-gradient(180deg, rgba(228,184,79,0.18), rgba(6,9,19,0.96))",
        title: "Notice",
      },
    };

    const theme = themes[type] || themes.info;

    toast.style.background = theme.bg;
    toast.style.border = theme.border;
    toast.style.borderRadius = "18px";
    toast.style.padding = "14px 16px";
    toast.style.boxShadow = "0 20px 60px rgba(0,0,0,0.35)";
    toast.style.backdropFilter = "blur(14px)";
    toast.style.webkitBackdropFilter = "blur(14px)";
    toast.style.color = "#fff";
    toast.style.fontFamily = "Manrope, sans-serif";
    toast.style.transform = "translateY(-8px)";
    toast.style.opacity = "0";
    toast.style.transition = "all 0.25s ease";

    toast.innerHTML = `
      <div style="font-weight:800;font-size:13px;letter-spacing:.04em;text-transform:uppercase;margin-bottom:4px;color:#fff;">
        ${theme.title}
      </div>
      <div style="font-size:14px;line-height:1.6;color:rgba(255,255,255,0.88);">
        ${message}
      </div>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = "translateY(0)";
      toast.style.opacity = "1";
    });

    setTimeout(() => {
      toast.style.transform = "translateY(-8px)";
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 250);
    }, 4200);
  };
})();