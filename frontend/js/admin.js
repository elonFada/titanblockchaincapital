lucide.createIcons();

const mobileSidebarToggle = document.getElementById("mobileSidebarToggle");
const mobileSidebarClose = document.getElementById("mobileSidebarClose");
const mobileSidebarOverlay = document.getElementById("mobileSidebarOverlay");
const dashboardSidebar = document.getElementById("dashboardSidebar");

function openSidebar() {
  if (!dashboardSidebar || !mobileSidebarOverlay) return;

  dashboardSidebar.classList.remove("-translate-x-full");
  mobileSidebarOverlay.classList.remove("opacity-0", "invisible");
  mobileSidebarOverlay.classList.add("opacity-100", "visible");
  document.body.classList.add("sidebar-open");
}

function closeSidebar() {
  if (!dashboardSidebar || !mobileSidebarOverlay) return;

  dashboardSidebar.classList.add("-translate-x-full");
  mobileSidebarOverlay.classList.remove("opacity-100", "visible");
  mobileSidebarOverlay.classList.add("opacity-0", "invisible");
  document.body.classList.remove("sidebar-open");
}

if (mobileSidebarToggle) {
  mobileSidebarToggle.addEventListener("click", openSidebar);
}

if (mobileSidebarClose) {
  mobileSidebarClose.addEventListener("click", closeSidebar);
}

if (mobileSidebarOverlay) {
  mobileSidebarOverlay.addEventListener("click", closeSidebar);
}

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeSidebar();
  }
});