document.addEventListener("DOMContentLoaded", async () => {
  const mobileSidebarToggle = document.getElementById("mobileSidebarToggle");
  const mobileSidebarClose = document.getElementById("mobileSidebarClose");
  const mobileSidebarOverlay = document.getElementById("mobileSidebarOverlay");
  const dashboardSidebar = document.getElementById("dashboardSidebar");

  const searchInput = document.querySelector('input[type="text"]');

  const pendingCountValue = document.getElementById("pendingWithdrawalsCount");
  const approvedNotPaidValue = document.getElementById("approvedNotPaidCount");
  const paidTodayValue = document.getElementById("paidTodayCount");
  const totalWithdrawalVolumeValue = document.getElementById("totalWithdrawalVolume");

  const withdrawalSection =
    document.querySelectorAll(".premium-panel.premium-border")[2];
  const withdrawalListContainer =
    withdrawalSection?.querySelector(".space-y-4");

  let allWithdrawals = [];
  let searchTerm = "";

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

  function guardAdmin() {
    const token =
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("admin_token");

    if (!token) {
      clearAdminSession();
      window.location.href = getPageUrl("admin-login.html");
      return false;
    }

    return true;
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

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatMoney(value) {
    return `$${Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function maskWalletAddress(address = "") {
    if (!address) return "—";
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  }

  function getStatusBadge(status) {
    const normalized = String(status || "").toLowerCase();

    if (normalized === "pending") {
      return `
        <span class="inline-flex mt-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-wider">
          Processing
        </span>
      `;
    }

    if (normalized === "approved") {
      return `
        <span class="inline-flex mt-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
          Approved
        </span>
      `;
    }

    if (normalized === "paid") {
      return `
        <span class="inline-flex mt-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
          Paid
        </span>
      `;
    }

    if (normalized === "rejected") {
      return `
        <span class="inline-flex mt-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider">
          Rejected
        </span>
      `;
    }

    return `
      <span class="inline-flex mt-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider">
        ${escapeHtml(status || "Unknown")}
      </span>
    `;
  }

  function getUserName(withdrawal) {
    return withdrawal?.user?.fullName || "Unknown User";
  }

  function getUserCode(withdrawal) {
    const rawId =
      withdrawal?.user?._id ||
      withdrawal?.user?.id ||
      withdrawal?._id ||
      "";
    return rawId ? `ID-${String(rawId).slice(-6).toUpperCase()}` : "—";
  }

  function getNetwork(withdrawal) {
    return (
      withdrawal?.network ||
      withdrawal?.coinType ||
      withdrawal?.walletType ||
      "—"
    );
  }

  function getWithdrawalTypeLabel(withdrawal) {
    return withdrawal?.withdrawalCategory === "referral"
      ? "Referral Withdrawal"
      : "User Withdrawal";
  }

  function getSearchableText(withdrawal) {
    return [
      withdrawal?._id,
      getUserName(withdrawal),
      withdrawal?.user?.email,
      withdrawal?.walletAddress,
      withdrawal?.network,
      withdrawal?.coinType,
      withdrawal?.walletType,
      withdrawal?.status,
      withdrawal?.withdrawalCategory,
      getUserCode(withdrawal),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function getActionButtons(withdrawal) {
    const status = String(withdrawal?.status || "").toLowerCase();
    const id = withdrawal?._id;
    const category = withdrawal?.withdrawalCategory || "regular";

    if (!id) return "";

    // Referral withdrawals: pending -> paid or rejected
    if (category === "referral") {
      if (status === "pending") {
        return `
          <button
            type="button"
            data-reject-id="${id}"
            data-category="${category}"
            class="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold"
          >
            Reject
          </button>
          <button
            type="button"
            data-paid-id="${id}"
            data-category="${category}"
            class="px-4 py-3 rounded-2xl gold-gradient text-black text-sm font-bold"
          >
            Mark As Paid
          </button>
        `;
      }

      return `
        <button
          type="button"
          class="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-semibold cursor-default"
          disabled
        >
          ${status === "paid" ? "Paid" : status === "rejected" ? "Rejected" : "Completed"}
        </button>
      `;
    }

    // Regular withdrawals: pending -> approved -> paid
    if (status === "pending") {
      return `
        <button
          type="button"
          data-reject-id="${id}"
          data-category="${category}"
          class="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold"
        >
          Reject
        </button>
        <button
          type="button"
          data-approve-id="${id}"
          data-category="${category}"
          class="px-4 py-3 rounded-2xl gold-gradient text-black text-sm font-bold"
        >
          Approve Withdrawal
        </button>
      `;
    }

    if (status === "approved") {
      return `
        <button
          type="button"
          data-paid-id="${id}"
          data-category="${category}"
          class="px-4 py-3 rounded-2xl gold-gradient text-black text-sm font-bold"
        >
          Mark As Paid
        </button>
      `;
    }

    return `
      <button
        type="button"
        class="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-semibold cursor-default"
        disabled
      >
        ${status === "paid" ? "Paid" : status === "rejected" ? "Rejected" : "Completed"}
      </button>
    `;
  }

  function getWithdrawalCard(withdrawal) {
    const categoryLabel = getWithdrawalTypeLabel(withdrawal);

    return `
      <div class="rounded-3xl bg-white/5 border border-white/10 p-4 sm:p-5">
        <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div class="grid sm:grid-cols-2 xl:grid-cols-6 gap-4 flex-1">
            <div>
              <p class="text-slate-400 text-xs uppercase tracking-wider">Type</p>
              <p class="text-white font-bold mt-2">${escapeHtml(categoryLabel)}</p>
              <p class="text-slate-400 text-sm mt-1">${escapeHtml(getUserCode(withdrawal))}</p>
            </div>

            <div>
              <p class="text-slate-400 text-xs uppercase tracking-wider">User</p>
              <p class="text-white font-bold mt-2">${escapeHtml(getUserName(withdrawal))}</p>
              <p class="text-slate-400 text-sm mt-1">${escapeHtml(withdrawal?.user?.email || "—")}</p>
            </div>

            <div>
              <p class="text-slate-400 text-xs uppercase tracking-wider">Amount</p>
              <p class="text-white font-bold mt-2">${formatMoney(withdrawal.amount)}</p>
              <p class="text-slate-400 text-sm mt-1">${escapeHtml(formatDate(withdrawal.createdAt))}</p>
            </div>

            <div>
              <p class="text-slate-400 text-xs uppercase tracking-wider">Wallet</p>
              <p class="text-slate-300 font-medium mt-2 break-all">${escapeHtml(maskWalletAddress(withdrawal.walletAddress || ""))}</p>
              <p class="text-slate-400 text-sm mt-1 break-all">${escapeHtml(withdrawal.walletAddress || "—")}</p>
            </div>

            <div>
              <p class="text-slate-400 text-xs uppercase tracking-wider">Network</p>
              <p class="text-slate-300 font-medium mt-2">${escapeHtml(getNetwork(withdrawal))}</p>
              <p class="text-slate-400 text-sm mt-1">${escapeHtml(
                withdrawal.coinType || withdrawal.walletType || "—"
              )}</p>
            </div>

            <div>
              <p class="text-slate-400 text-xs uppercase tracking-wider">Status</p>
              ${getStatusBadge(withdrawal.status)}
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            ${getActionButtons(withdrawal)}
          </div>
        </div>

        ${
          withdrawal?.rejectionReason
            ? `
          <div class="mt-4 pt-4 border-t border-white/10">
            <p class="text-red-400 text-sm font-semibold">Rejection Reason</p>
            <p class="text-slate-300 text-sm mt-2 leading-7">${escapeHtml(withdrawal.rejectionReason)}</p>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  async function fetchRegularWithdrawals() {
    return window.API.get("/withdrawal/admin/all");
  }

  async function fetchReferralWithdrawals() {
    return window.API.get("/referral/withdrawals");
  }

  async function approveRegularWithdrawal(id) {
    return window.API.post(`/withdrawal/admin/${id}/approve`, {});
  }

  async function rejectRegularWithdrawal(id, reason) {
    return window.API.post(`/withdrawal/admin/${id}/reject`, { reason });
  }

  async function markRegularWithdrawalPaid(id) {
    return window.API.post(`/withdrawal/admin/${id}/paid`, {});
  }

  async function rejectReferralWithdrawal(id, reason) {
    return window.API.post(`/referral/withdrawals/${id}/reject`, { reason });
  }

  async function markReferralWithdrawalPaid(id) {
    return window.API.post(`/referral/withdrawals/${id}/pay`, {});
  }

  function fillStats(withdrawals = []) {
    const pendingCount = withdrawals.filter(
      (w) => String(w.status || "").toLowerCase() === "pending"
    ).length;

    const approvedNotPaidCount = withdrawals.filter(
      (w) => String(w.status || "").toLowerCase() === "approved"
    ).length;

    const today = new Date();

    const paidTodayCount = withdrawals.filter((w) => {
      if (String(w.status || "").toLowerCase() !== "paid") return false;

      const date = new Date(
        w.paidAt || w.updatedAt || w.reviewedAt || w.createdAt
      );
      if (Number.isNaN(date.getTime())) return false;

      return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
      );
    }).length;

    const totalVolume = withdrawals.reduce(
      (sum, withdrawal) => sum + Number(withdrawal.amount || 0),
      0
    );

    if (pendingCountValue) pendingCountValue.textContent = String(pendingCount);
    if (approvedNotPaidValue) {
      approvedNotPaidValue.textContent = String(approvedNotPaidCount);
    }
    if (paidTodayValue) paidTodayValue.textContent = String(paidTodayCount);
    if (totalWithdrawalVolumeValue) {
      totalWithdrawalVolumeValue.textContent = formatMoney(totalVolume);
    }
  }

  function renderWithdrawals() {
    if (!withdrawalListContainer) return;

    const filtered = allWithdrawals.filter((withdrawal) =>
      getSearchableText(withdrawal).includes(searchTerm)
    );

    if (!filtered.length) {
      withdrawalListContainer.innerHTML = `
        <div class="rounded-3xl bg-white/5 border border-white/10 p-6 text-center">
          <p class="text-white font-bold text-lg">No withdrawal requests found</p>
          <p class="text-slate-400 text-sm mt-2">Try another search or wait for new requests.</p>
        </div>
      `;
      return;
    }

    withdrawalListContainer.innerHTML = filtered
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
      )
      .map(getWithdrawalCard)
      .join("");
  }

  async function loadWithdrawals() {
    try {
      const [regularResponse, referralResponse] = await Promise.all([
        fetchRegularWithdrawals(),
        fetchReferralWithdrawals().catch(() => ({ data: [] })),
      ]);

      const regularWithdrawals = Array.isArray(regularResponse?.data)
        ? regularResponse.data.map((item) => ({
            ...item,
            withdrawalCategory: "regular",
          }))
        : [];

      const referralWithdrawals = Array.isArray(referralResponse?.data)
        ? referralResponse.data.map((item) => ({
            ...item,
            withdrawalCategory: "referral",
            coinType: item.walletType || item.coinType || "",
            network: item.walletType || item.network || "",
          }))
        : [];

      allWithdrawals = [...regularWithdrawals, ...referralWithdrawals];

      fillStats(allWithdrawals);
      renderWithdrawals();
    } catch (error) {
      console.error("Failed to load withdrawals:", error);

      if (withdrawalListContainer) {
        withdrawalListContainer.innerHTML = `
          <div class="rounded-3xl bg-white/5 border border-white/10 p-6 text-center">
            <p class="text-red-400 font-bold text-lg">Failed to load withdrawals</p>
            <p class="text-slate-400 text-sm mt-2">Please refresh and try again.</p>
          </div>
        `;
      }

      if (typeof showToast === "function") {
        showToast(error.message || "Failed to load withdrawals.", "error");
      }
    }
  }

  async function handleWithdrawalActionClick(event) {
    const approveBtn = event.target.closest("[data-approve-id]");
    const rejectBtn = event.target.closest("[data-reject-id]");
    const paidBtn = event.target.closest("[data-paid-id]");

    if (approveBtn) {
      const id = approveBtn.getAttribute("data-approve-id");
      const category = approveBtn.getAttribute("data-category") || "regular";
      if (!id) return;

      if (category === "referral") return;

      const originalText = approveBtn.textContent;
      approveBtn.disabled = true;
      approveBtn.textContent = "Approving...";

      try {
        const response = await approveRegularWithdrawal(id);

        if (typeof showToast === "function") {
          showToast(
            response?.message || "Withdrawal approved successfully.",
            "success"
          );
        }

        await loadWithdrawals();
      } catch (error) {
        console.error("Approve withdrawal failed:", error);
        approveBtn.disabled = false;
        approveBtn.textContent = originalText;

        if (typeof showToast === "function") {
          showToast(error.message || "Failed to approve withdrawal.", "error");
        }
      }

      return;
    }

    if (rejectBtn) {
      const id = rejectBtn.getAttribute("data-reject-id");
      const category = rejectBtn.getAttribute("data-category") || "regular";
      if (!id) return;

      const reason = window.prompt("Enter rejection reason:");
      if (!reason || !reason.trim()) return;

      const originalText = rejectBtn.textContent;
      rejectBtn.disabled = true;
      rejectBtn.textContent = "Rejecting...";

      try {
        let response;

        if (category === "referral") {
          response = await rejectReferralWithdrawal(id, reason.trim());
        } else {
          response = await rejectRegularWithdrawal(id, reason.trim());
        }

        if (typeof showToast === "function") {
          showToast(response?.message || "Withdrawal rejected.", "success");
        }

        await loadWithdrawals();
      } catch (error) {
        console.error("Reject withdrawal failed:", error);
        rejectBtn.disabled = false;
        rejectBtn.textContent = originalText;

        if (typeof showToast === "function") {
          showToast(error.message || "Failed to reject withdrawal.", "error");
        }
      }

      return;
    }

    if (paidBtn) {
      const id = paidBtn.getAttribute("data-paid-id");
      const category = paidBtn.getAttribute("data-category") || "regular";
      if (!id) return;

      const originalText = paidBtn.textContent;
      paidBtn.disabled = true;
      paidBtn.textContent = "Updating...";

      try {
        let response;

        if (category === "referral") {
          response = await markReferralWithdrawalPaid(id);
        } else {
          response = await markRegularWithdrawalPaid(id);
        }

        if (typeof showToast === "function") {
          showToast(response?.message || "Withdrawal marked as paid.", "success");
        }

        await loadWithdrawals();
      } catch (error) {
        console.error("Mark paid failed:", error);
        paidBtn.disabled = false;
        paidBtn.textContent = originalText;

        if (typeof showToast === "function") {
          showToast(
            error.message || "Failed to mark withdrawal as paid.",
            "error"
          );
        }
      }
    }
  }

  function bindSearch() {
    if (!searchInput) return;

    searchInput.addEventListener("input", (event) => {
      searchTerm = String(event.target.value || "").trim().toLowerCase();
      renderWithdrawals();
    });
  }

  if (!guardAdmin()) return;

  mobileSidebarToggle?.addEventListener("click", openSidebar);
  mobileSidebarClose?.addEventListener("click", closeSidebar);
  mobileSidebarOverlay?.addEventListener("click", closeSidebar);

  withdrawalListContainer?.addEventListener("click", handleWithdrawalActionClick);

  bindSearch();
  await loadWithdrawals();

  if (window.lucide) {
    window.lucide.createIcons();
  }
});