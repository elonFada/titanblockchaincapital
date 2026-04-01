document.addEventListener("DOMContentLoaded", async () => {
  const mobileSidebarToggle = document.getElementById("mobileSidebarToggle");
  const mobileSidebarClose = document.getElementById("mobileSidebarClose");
  const mobileSidebarOverlay = document.getElementById("mobileSidebarOverlay");
  const dashboardSidebar = document.getElementById("dashboardSidebar");

  const searchInput = document.getElementById("depositSearchInput");

  const pendingDepositsValue = document.getElementById("pendingDepositsValue");
  const pendingDepositsSubtext = document.getElementById("pendingDepositsSubtext");

  const approvedTodayValue = document.getElementById("approvedTodayValue");
  const approvedTodaySubtext = document.getElementById("approvedTodaySubtext");

  const totalDepositVolumeValue = document.getElementById("totalDepositVolumeValue");
  const totalDepositVolumeSubtext = document.getElementById("totalDepositVolumeSubtext");

  const flaggedProofsValue = document.getElementById("flaggedProofsValue");
  const flaggedProofsSubtext = document.getElementById("flaggedProofsSubtext");

  const filterPendingBtn = document.getElementById("filterPendingBtn");
  const filterApprovedBtn = document.getElementById("filterApprovedBtn");
  const filterAllBtn = document.getElementById("filterAllBtn");

  const pendingListContainer = document.getElementById("pendingDepositRequestsContainer");
  const recentApprovedContainer = document.getElementById("recentApprovedDepositsContainer");

  let allDeposits = [];
  let currentFilter = "pending";
  let currentSearch = "";

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

  function guardAdminPage() {
    const token =
      localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token");
    const adminInfoRaw =
      localStorage.getItem("adminInfo") || sessionStorage.getItem("adminInfo");

    if (!token || !adminInfoRaw) {
      clearAdminSession();
      window.location.href = getPageUrl("admin-login.html");
      return false;
    }

    return true;
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("en-US").format(Number(value || 0));
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
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

  function coinLabel(coinType) {
    const map = {
      BTC: "BTC",
      ETH: "ETH",
      USDT_TRC20: "USDT (TRC20)",
      USDT_ERC20: "USDT (ERC20)",
      BNB: "BNB",
    };

    return map[coinType] || coinType || "—";
  }

  function getDepositStatusBadge(status) {
    if (status === "approved") {
      return `
        <span class="inline-flex mt-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
          Approved
        </span>
      `;
    }

    if (status === "rejected") {
      return `
        <span class="inline-flex mt-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider">
          Rejected
        </span>
      `;
    }

    return `
      <span class="inline-flex mt-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-wider">
        Pending
      </span>
    `;
  }

  function updateFilterButtonStates() {
    const baseClass =
      "px-4 py-2 rounded-xl text-sm transition-all";
    const activeClass =
      "bg-primary/10 border border-primary/20 text-primary font-bold";
    const inactiveClass =
      "bg-white/5 border border-white/10 text-white font-semibold";

    if (filterPendingBtn) {
      filterPendingBtn.className =
        `${baseClass} ${currentFilter === "pending" ? activeClass : inactiveClass}`;
    }

    if (filterApprovedBtn) {
      filterApprovedBtn.className =
        `${baseClass} ${currentFilter === "approved" ? activeClass : inactiveClass}`;
    }

    if (filterAllBtn) {
      filterAllBtn.className =
        `${baseClass} ${currentFilter === "all" ? activeClass : inactiveClass}`;
    }
  }

  function getFilteredDeposits() {
    let filtered = [...allDeposits];

    if (currentFilter !== "all") {
      filtered = filtered.filter((deposit) => deposit.status === currentFilter);
    }

    if (currentSearch) {
      const query = currentSearch.toLowerCase();

      filtered = filtered.filter((deposit) => {
        const userName = deposit.user?.fullName || "";
        const email = deposit.user?.email || "";
        const phone = deposit.user?.phoneNumber || "";
        const coin = coinLabel(deposit.coinType);
        const tx = deposit.transactionId || "";
        const status = deposit.status || "";

        return (
          userName.toLowerCase().includes(query) ||
          email.toLowerCase().includes(query) ||
          phone.toLowerCase().includes(query) ||
          coin.toLowerCase().includes(query) ||
          tx.toLowerCase().includes(query) ||
          status.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }

  function renderPendingDepositRequests() {
    if (!pendingListContainer) return;

    const filtered = getFilteredDeposits();

    if (!filtered.length) {
      pendingListContainer.innerHTML = `
        <div class="rounded-3xl bg-white/5 border border-white/10 p-6 sm:p-8 text-center">
          <p class="text-white font-bold text-lg">No deposit requests found</p>
          <p class="text-slate-400 text-sm mt-2">
            There are no deposit records matching the current filter or search.
          </p>
        </div>
      `;
      return;
    }

    pendingListContainer.innerHTML = filtered
      .map((deposit) => {
        const userName = escapeHtml(deposit.user?.fullName || "Unknown User");
        const userEmail = escapeHtml(deposit.user?.email || "No email");
        const transactionId = escapeHtml(deposit.transactionId || "—");
        const amount = formatCurrency(deposit.amount);
        const statusBadge = getDepositStatusBadge(deposit.status);
        const proofUrl = deposit.receipt || "#";
        const approvedAt = deposit.approvedAt ? formatDate(deposit.approvedAt) : null;
        const rejectionReason = deposit.rejectionReason
          ? escapeHtml(deposit.rejectionReason)
          : "";

        return `
          <div class="rounded-3xl bg-white/5 border border-white/10 p-4 sm:p-5">
            <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
              <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 flex-1">
                <div>
                  <p class="text-slate-400 text-xs uppercase tracking-wider">User</p>
                  <p class="text-white font-bold mt-2">${userName}</p>
                  <p class="text-slate-400 text-sm mt-1 break-all">${userEmail}</p>
                </div>

                <div>
                  <p class="text-slate-400 text-xs uppercase tracking-wider">Deposit</p>
                  <p class="text-white font-bold mt-2">${amount}</p>
                  <p class="text-slate-400 text-sm mt-1">${escapeHtml(coinLabel(deposit.coinType))}</p>
                </div>

                <div>
                  <p class="text-slate-400 text-xs uppercase tracking-wider">Transaction Hash</p>
                  <p class="text-slate-300 font-medium mt-2 break-all">${transactionId}</p>
                </div>

                <div>
                  <p class="text-slate-400 text-xs uppercase tracking-wider">Status</p>
                  ${statusBadge}
                  ${
                    approvedAt
                      ? `<p class="text-slate-400 text-xs mt-2">Reviewed: ${approvedAt}</p>`
                      : `<p class="text-slate-400 text-xs mt-2">Submitted: ${formatDate(deposit.createdAt)}</p>`
                  }
                </div>
              </div>

              <div class="flex flex-wrap gap-3">
                <a
                  href="${proofUrl}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition-all"
                >
                  View Proof
                </a>

                ${
                  deposit.status === "pending"
                    ? `
                      <button
                        type="button"
                        data-action="reject"
                        data-id="${deposit._id}"
                        class="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/20 transition-all"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        data-action="approve"
                        data-id="${deposit._id}"
                        class="px-4 py-3 rounded-2xl gold-gradient text-black text-sm font-bold hover:scale-[1.01] transition-all"
                      >
                        Approve Deposit
                      </button>
                    `
                    : ""
                }
              </div>
            </div>

            ${
              deposit.status === "rejected" && rejectionReason
                ? `
                  <div class="mt-4 rounded-2xl border border-red-500/15 bg-red-500/5 p-4">
                    <p class="text-red-400 text-xs uppercase tracking-wider font-bold">Rejection Reason</p>
                    <p class="text-slate-300 text-sm mt-2 leading-6">${rejectionReason}</p>
                  </div>
                `
                : ""
            }
          </div>
        `;
      })
      .join("");
  }

  function renderRecentlyApprovedDeposits() {
    if (!recentApprovedContainer) return;

    const approved = [...allDeposits]
      .filter((deposit) => deposit.status === "approved")
      .sort((a, b) => new Date(b.approvedAt || b.updatedAt || b.createdAt) - new Date(a.approvedAt || a.updatedAt || a.createdAt))
      .slice(0, 8);

    if (!approved.length) {
      recentApprovedContainer.innerHTML = `
        <div class="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <p class="text-white font-bold">No approved deposits yet</p>
          <p class="text-slate-400 text-sm mt-2">Approved deposits will appear here.</p>
        </div>
      `;
      return;
    }

    recentApprovedContainer.innerHTML = approved
      .map((deposit) => {
        const userName = escapeHtml(deposit.user?.fullName || "Unknown User");
        const coin = escapeHtml(coinLabel(deposit.coinType));
        const approvedDate = formatDate(deposit.approvedAt || deposit.updatedAt || deposit.createdAt);

        return `
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p class="text-white font-bold">${userName}</p>
              <p class="text-slate-400 text-sm mt-1">${coin} • ${approvedDate}</p>
            </div>
            <div class="flex items-center gap-3">
              <span class="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                Approved
              </span>
              <p class="text-emerald-400 font-bold">${formatCurrency(deposit.amount)}</p>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function updateStats() {
    const pendingCount = allDeposits.filter((d) => d.status === "pending").length;
    const rejectedCount = allDeposits.filter((d) => d.status === "rejected").length;

    const approved = allDeposits.filter((d) => d.status === "approved");
    const approvedVolume = approved.reduce((sum, d) => sum + Number(d.amount || 0), 0);

    const today = new Date();
    const approvedTodayCount = approved.filter((deposit) => {
      const date = new Date(deposit.approvedAt || deposit.updatedAt || deposit.createdAt);

      return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
      );
    }).length;

    if (pendingDepositsValue) {
      pendingDepositsValue.textContent = formatNumber(pendingCount);
    }
    if (pendingDepositsSubtext) {
      pendingDepositsSubtext.textContent =
        pendingCount > 0 ? "Awaiting approval" : "No pending deposits";
    }

    if (approvedTodayValue) {
      approvedTodayValue.textContent = formatNumber(approvedTodayCount);
    }
    if (approvedTodaySubtext) {
      approvedTodaySubtext.textContent =
        approvedTodayCount > 0
          ? "Processed successfully"
          : "No approvals recorded today";
    }

    if (totalDepositVolumeValue) {
      totalDepositVolumeValue.textContent = formatCurrency(approvedVolume);
    }
    if (totalDepositVolumeSubtext) {
      totalDepositVolumeSubtext.textContent = "Across approved deposits";
    }

    if (flaggedProofsValue) {
      flaggedProofsValue.textContent = formatNumber(rejectedCount);
    }
    if (flaggedProofsSubtext) {
      flaggedProofsSubtext.textContent =
        rejectedCount > 0 ? "Rejected deposit proofs" : "No flagged proofs";
    }
  }

  async function fetchDeposits() {
    const response = await window.API.get("/deposit/admin/all");
    return Array.isArray(response?.data) ? response.data : [];
  }

  async function reloadPageData() {
    try {
      allDeposits = await fetchDeposits();
      updateStats();
      renderPendingDepositRequests();
      renderRecentlyApprovedDeposits();
    } catch (error) {
      console.error("Failed to load deposits:", error);
      showToast(error.message || "Unable to load deposit data.", "error");

      if (pendingListContainer) {
        pendingListContainer.innerHTML = `
          <div class="rounded-3xl bg-white/5 border border-white/10 p-6 sm:p-8 text-center">
            <p class="text-white font-bold text-lg">Unable to load deposits</p>
            <p class="text-slate-400 text-sm mt-2">
              Please refresh the page or try again later.
            </p>
          </div>
        `;
      }

      if (recentApprovedContainer) {
        recentApprovedContainer.innerHTML = `
          <div class="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            <p class="text-white font-bold">Unable to load approved deposits</p>
          </div>
        `;
      }

      if (pendingDepositsValue) pendingDepositsValue.textContent = "--";
      if (approvedTodayValue) approvedTodayValue.textContent = "--";
      if (totalDepositVolumeValue) totalDepositVolumeValue.textContent = "--";
      if (flaggedProofsValue) flaggedProofsValue.textContent = "--";
    }
  }

  async function approveDeposit(depositId) {
    try {
      await window.API.post(`/deposit/admin/${depositId}/approve`, {});
      showToast("Deposit approved successfully.", "success");
      await reloadPageData();
    } catch (error) {
      showToast(error.message || "Failed to approve deposit.", "error");
    }
  }

  async function rejectDeposit(depositId) {
    const reason = window.prompt("Enter rejection reason:");
    if (!reason || !reason.trim()) return;

    try {
      await window.API.post(`/deposit/admin/${depositId}/reject`, {
        reason: reason.trim(),
      });
      showToast("Deposit rejected successfully.", "success");
      await reloadPageData();
    } catch (error) {
      showToast(error.message || "Failed to reject deposit.", "error");
    }
  }

  function bindActionEvents() {
    pendingListContainer?.addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;

      const { action, id } = button.dataset;
      if (!id) return;

      if (action === "approve") {
        await approveDeposit(id);
      }

      if (action === "reject") {
        await rejectDeposit(id);
      }
    });
  }

  function bindSearchAndFilters() {
    searchInput?.addEventListener("input", (event) => {
      currentSearch = event.target.value.trim().toLowerCase();
      renderPendingDepositRequests();
    });

    filterPendingBtn?.addEventListener("click", () => {
      currentFilter = "pending";
      updateFilterButtonStates();
      renderPendingDepositRequests();
    });

    filterApprovedBtn?.addEventListener("click", () => {
      currentFilter = "approved";
      updateFilterButtonStates();
      renderPendingDepositRequests();
    });

    filterAllBtn?.addEventListener("click", () => {
      currentFilter = "all";
      updateFilterButtonStates();
      renderPendingDepositRequests();
    });
  }

  if (!guardAdminPage()) return;

  mobileSidebarToggle?.addEventListener("click", openSidebar);
  mobileSidebarClose?.addEventListener("click", closeSidebar);
  mobileSidebarOverlay?.addEventListener("click", closeSidebar);

  bindSearchAndFilters();
  bindActionEvents();
  updateFilterButtonStates();

  await reloadPageData();
});