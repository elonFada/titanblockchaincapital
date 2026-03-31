document.addEventListener("DOMContentLoaded", async () => {
  const mobileSidebarToggle = document.getElementById("mobileSidebarToggle");
  const mobileSidebarClose = document.getElementById("mobileSidebarClose");
  const mobileSidebarOverlay = document.getElementById("mobileSidebarOverlay");
  const dashboardSidebar = document.getElementById("dashboardSidebar");

  const logoutBtn = document.getElementById("logoutBtn");
  const logoutModal = document.getElementById("logoutModal");
  const cancelLogoutBtn = document.getElementById("cancelLogoutBtn");
  const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");

  const totalUsersValue = document.getElementById("totalUsersValue");
  const pendingDepositsValue = document.getElementById("pendingDepositsValue");
  const pendingWithdrawalsValue = document.getElementById("pendingWithdrawalsValue");
  const pendingBotPaymentsValue = document.getElementById("pendingBotPaymentsValue");

  const totalUsersSubtext = document.getElementById("totalUsersSubtext");
  const pendingDepositsSubtext = document.getElementById("pendingDepositsSubtext");
  const pendingWithdrawalsSubtext = document.getElementById("pendingWithdrawalsSubtext");
  const pendingBotPaymentsSubtext = document.getElementById("pendingBotPaymentsSubtext");

  function getPageUrl(page) {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    return isLocal ? `/frontend/${page}` : `/${page}`;
  }

  function clearAdminSession() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("adminInfo");
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("adminInfo");
  }

  function formatNumber(value) {
    return new Intl.NumberFormat().format(Number(value || 0));
  }

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

  function openLogoutModal() {
    if (!logoutModal) return;
    logoutModal.classList.add("active");
    document.body.classList.add("modal-open");
  }

  function closeLogoutModal() {
    if (!logoutModal) return;
    logoutModal.classList.remove("active");
    document.body.classList.remove("modal-open");
  }

  async function logoutAdmin() {
    try {
      await window.API.post("/admin/logout", {});
    } catch (error) {
      console.warn("Admin logout request failed, clearing local session anyway.");
    }

    clearAdminSession();
    window.location.href = getPageUrl("admin-login.html");
  }

  function guardAdminDashboard() {
    const token = localStorage.getItem("admin_token");
    const adminInfoRaw = localStorage.getItem("adminInfo");
    const adminInfo = adminInfoRaw ? JSON.parse(adminInfoRaw) : null;

    if (!token || !adminInfo) {
      clearAdminSession();
      window.location.href = getPageUrl("admin-login.html");
      return false;
    }

    return true;
  }

  async function loadDashboardStats() {
    try {
      const [usersResponse, depositsResponse] = await Promise.all([
        window.API.get("/user/admin/users"),
        window.API.get("/deposit/admin/stats"),
      ]);

      const totalUsers = usersResponse?.count ?? usersResponse?.data?.length ?? 0;
      const pendingDeposits = depositsResponse?.stats?.pending?.count ?? 0;

      if (totalUsersValue) totalUsersValue.textContent = formatNumber(totalUsers);
      if (pendingDepositsValue) {
        pendingDepositsValue.textContent = formatNumber(pendingDeposits);
      }

      if (totalUsersSubtext) {
        totalUsersSubtext.textContent = "Registered platform users";
      }

      if (pendingDepositsSubtext) {
        pendingDepositsSubtext.textContent =
          pendingDeposits > 0 ? "Awaiting approval" : "No pending deposits";
      }

      if (pendingWithdrawalsValue) pendingWithdrawalsValue.textContent = "--";
      if (pendingBotPaymentsValue) pendingBotPaymentsValue.textContent = "--";

      if (pendingWithdrawalsSubtext) {
        pendingWithdrawalsSubtext.textContent = "Withdrawal backend not added yet";
      }

      if (pendingBotPaymentsSubtext) {
        pendingBotPaymentsSubtext.textContent = "Bot payment backend not added yet";
      }
    } catch (error) {
      console.error("Failed to load admin dashboard stats:", error);

      showToast(
        error.message || "Unable to load admin dashboard statistics.",
        "error"
      );

      if (totalUsersValue) totalUsersValue.textContent = "--";
      if (pendingDepositsValue) pendingDepositsValue.textContent = "--";
      if (pendingWithdrawalsValue) pendingWithdrawalsValue.textContent = "--";
      if (pendingBotPaymentsValue) pendingBotPaymentsValue.textContent = "--";

      if (totalUsersSubtext) totalUsersSubtext.textContent = "Unable to load";
      if (pendingDepositsSubtext) pendingDepositsSubtext.textContent = "Unable to load";
      if (pendingWithdrawalsSubtext) pendingWithdrawalsSubtext.textContent = "Not available";
      if (pendingBotPaymentsSubtext) pendingBotPaymentsSubtext.textContent = "Not available";
    }
  }

  const canStay = guardAdminDashboard();
  if (!canStay) return;

  mobileSidebarToggle?.addEventListener("click", openSidebar);
  mobileSidebarClose?.addEventListener("click", closeSidebar);
  mobileSidebarOverlay?.addEventListener("click", closeSidebar);

  logoutBtn?.addEventListener("click", openLogoutModal);
  cancelLogoutBtn?.addEventListener("click", closeLogoutModal);
  confirmLogoutBtn?.addEventListener("click", logoutAdmin);

  logoutModal?.addEventListener("click", (e) => {
    if (e.target === logoutModal) {
      closeLogoutModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeLogoutModal();
    }
  });

  await loadDashboardStats();
});