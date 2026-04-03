document.addEventListener("DOMContentLoaded", async () => {
  const mobileSidebarToggle = document.getElementById("mobileSidebarToggle");
  const mobileSidebarClose = document.getElementById("mobileSidebarClose");
  const mobileSidebarOverlay = document.getElementById("mobileSidebarOverlay");
  const dashboardSidebar = document.getElementById("dashboardSidebar");

  const pageLoader = document.getElementById("pageLoader");
  const searchInput = document.getElementById("searchBotPaymentsInput");

  const pendingBotPaymentsValue = document.getElementById("pendingBotPaymentsValue");
  const activeBotsValue = document.getElementById("activeBotsValue");
  const botRevenueValue = document.getElementById("botRevenueValue");
  const rejectedBotPaymentsValue = document.getElementById("rejectedBotPaymentsValue");

  const botPaymentsListContainer = document.getElementById("botPaymentsListContainer");
  const recentlyActivatedContainer = document.getElementById("recentlyActivatedContainer");

  let allPayments = [];
  let searchTerm = "";

  function showPageLoader() {
    if (!pageLoader) return;
    pageLoader.classList.remove("hidden", "opacity-0", "pointer-events-none");
    pageLoader.classList.add("opacity-100");
  }

  function hidePageLoader() {
    if (!pageLoader) return;
    pageLoader.classList.remove("opacity-100");
    pageLoader.classList.add("opacity-0", "pointer-events-none");

    setTimeout(() => {
      pageLoader.classList.add("hidden");
    }, 300);
  }

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

  function formatDateTime(value) {
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

  function getUserName(payment) {
    return payment?.user?.fullName || "Unknown User";
  }

  function getUserCode(payment) {
    const rawId = payment?.user?._id || payment?._id || "";
    return rawId ? `ID-${String(rawId).slice(-6).toUpperCase()}` : "—";
  }

  function getStatusBadge(status) {
    const normalized = String(status || "").toLowerCase();

    if (normalized === "pending") {
      return `
        <span class="inline-flex mt-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-wider">
          Pending
        </span>
      `;
    }

    if (normalized === "approved") {
      return `
        <span class="inline-flex mt-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
          Approved
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

  function getSearchableText(payment) {
    return [
      payment?._id,
      getUserName(payment),
      payment?.user?.email,
      payment?.receipt,
      payment?.receiptPublicId,
      payment?.status,
      getUserCode(payment),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function getActionButtons(payment) {
    const status = String(payment?.status || "").toLowerCase();
    const id = payment?._id;
    const receipt = payment?.receipt || "";

    if (!id) return "";

    const viewProofBtn = receipt
      ? `
        <a
          href="${receipt}"
          target="_blank"
          rel="noopener noreferrer"
          class="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-semibold"
        >
          View Proof
        </a>
      `
      : "";

    if (status === "pending") {
      return `
        ${viewProofBtn}
        <button
          type="button"
          data-reject-payment-id="${id}"
          class="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold"
        >
          Reject
        </button>
        <button
          type="button"
          data-approve-payment-id="${id}"
          class="px-4 py-3 rounded-2xl gold-gradient text-black text-sm font-bold"
        >
          Approve Payment
        </button>
      `;
    }

    return `
      ${viewProofBtn}
      <button
        type="button"
        disabled
        class="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 text-sm font-semibold cursor-default"
      >
        ${status === "approved" ? "Approved" : "Rejected"}
      </button>
    `;
  }

  function getPaymentCard(payment) {
    return `
      <div class="rounded-3xl bg-white/5 border border-white/10 p-4 sm:p-5">
        <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 flex-1">
            <div>
              <p class="text-slate-400 text-xs uppercase tracking-wider">
                User
              </p>
              <p class="text-white font-bold mt-2">${escapeHtml(getUserName(payment))}</p>
              <p class="text-slate-400 text-sm mt-1">${escapeHtml(getUserCode(payment))}</p>
            </div>

            <div>
              <p class="text-slate-400 text-xs uppercase tracking-wider">
                Amount
              </p>
              <p class="text-white font-bold mt-2">${formatMoney(payment.amount)}</p>
              <p class="text-slate-400 text-sm mt-1">Bot activation fee</p>
            </div>

            <div>
              <p class="text-slate-400 text-xs uppercase tracking-wider">
                Submitted
              </p>
              <p class="text-slate-300 font-medium mt-2">${escapeHtml(formatDateTime(payment.createdAt))}</p>
              <p class="text-slate-400 text-sm mt-1 break-all">${escapeHtml(payment.receiptPublicId || "Receipt uploaded")}</p>
            </div>

            <div>
              <p class="text-slate-400 text-xs uppercase tracking-wider">
                Status
              </p>
              ${getStatusBadge(payment.status)}
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            ${getActionButtons(payment)}
          </div>
        </div>

        ${
          payment?.rejectionReason
            ? `
          <div class="mt-4 pt-4 border-t border-white/10">
            <p class="text-red-400 text-sm font-semibold">Rejection Reason</p>
            <p class="text-slate-300 text-sm mt-2 leading-7">${escapeHtml(payment.rejectionReason)}</p>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  function renderPayments() {
    if (!botPaymentsListContainer) return;

    const filteredPayments = allPayments.filter((payment) =>
      getSearchableText(payment).includes(searchTerm)
    );

    if (!filteredPayments.length) {
      botPaymentsListContainer.innerHTML = `
        <div class="rounded-3xl bg-white/5 border border-white/10 p-6 text-center">
          <p class="text-white font-bold text-lg">No bot payment requests found</p>
          <p class="text-slate-400 text-sm mt-2">Try another search or wait for new submissions.</p>
        </div>
      `;
      return;
    }

    botPaymentsListContainer.innerHTML = filteredPayments
      .map(getPaymentCard)
      .join("");
  }

  function renderRecentlyActivated(payments) {
    if (!recentlyActivatedContainer) return;

    const activated = payments
      .filter((payment) => String(payment.status).toLowerCase() === "approved")
      .sort(
        (a, b) =>
          new Date(b.reviewedAt || b.updatedAt || b.createdAt).getTime() -
          new Date(a.reviewedAt || a.updatedAt || a.createdAt).getTime()
      )
      .slice(0, 8);

    if (!activated.length) {
      recentlyActivatedContainer.innerHTML = `
        <div class="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
          <p class="text-white font-bold">No activated bot users yet</p>
          <p class="text-slate-400 text-sm mt-2">Approved bot activations will appear here.</p>
        </div>
      `;
      return;
    }

    recentlyActivatedContainer.innerHTML = activated
      .map((payment) => {
        return `
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p class="text-white font-bold">${escapeHtml(getUserName(payment))}</p>
              <p class="text-slate-400 text-sm mt-1">
                Activated on ${escapeHtml(formatDateTime(payment.reviewedAt || payment.updatedAt || payment.createdAt))}
              </p>
            </div>
            <div class="flex items-center gap-3">
              <span
                class="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider"
              >
                Active
              </span>
              <p class="text-primary font-bold">${formatMoney(payment.amount)}</p>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function fillStats(payments) {
    const pendingCount = payments.filter(
      (payment) => String(payment.status).toLowerCase() === "pending"
    ).length;

    const activeBotsCount = payments.filter(
      (payment) => String(payment.status).toLowerCase() === "approved"
    ).length;

    const botRevenue = payments
      .filter((payment) => String(payment.status).toLowerCase() === "approved")
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const rejectedCount = payments.filter(
      (payment) => String(payment.status).toLowerCase() === "rejected"
    ).length;

    if (pendingBotPaymentsValue) {
      pendingBotPaymentsValue.textContent = String(pendingCount);
    }

    if (activeBotsValue) {
      activeBotsValue.textContent = String(activeBotsCount);
    }

    if (botRevenueValue) {
      botRevenueValue.textContent = formatMoney(botRevenue);
    }

    if (rejectedBotPaymentsValue) {
      rejectedBotPaymentsValue.textContent = String(rejectedCount);
    }
  }

  async function fetchBotPayments() {
    return window.API.get("/trading-bot/payment/admin/all");
  }

  async function approveBotPayment(id) {
    return window.API.post(`/trading-bot/payment/admin/${id}/approve`, {});
  }

  async function rejectBotPayment(id, reason) {
    return window.API.post(`/trading-bot/payment/admin/${id}/reject`, {
      reason,
    });
  }

  async function loadPageData() {
    try {
      const response = await fetchBotPayments();
      allPayments = Array.isArray(response?.data) ? response.data : [];

      fillStats(allPayments);
      renderPayments();
      renderRecentlyActivated(allPayments);
    } catch (error) {
      console.error("Failed to load trading bot payments:", error);

      if (botPaymentsListContainer) {
        botPaymentsListContainer.innerHTML = `
          <div class="rounded-3xl bg-white/5 border border-white/10 p-6 text-center">
            <p class="text-red-400 font-bold text-lg">Failed to load bot payments</p>
            <p class="text-slate-400 text-sm mt-2">Please refresh and try again.</p>
          </div>
        `;
      }

      if (recentlyActivatedContainer) {
        recentlyActivatedContainer.innerHTML = `
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
            <p class="text-red-400 font-bold">Failed to load activated history</p>
          </div>
        `;
      }

      if (typeof showToast === "function") {
        showToast(error.message || "Failed to load trading bot payments.", "error");
      }
    }
  }

  async function handleActionClick(event) {
    const approveBtn = event.target.closest("[data-approve-payment-id]");
    const rejectBtn = event.target.closest("[data-reject-payment-id]");

    if (approveBtn) {
      const id = approveBtn.getAttribute("data-approve-payment-id");
      if (!id) return;

      const originalText = approveBtn.textContent;
      approveBtn.disabled = true;
      approveBtn.textContent = "Approving...";

      try {
        const response = await approveBotPayment(id);

        if (typeof showToast === "function") {
          showToast(
            response?.message || "Trading bot payment approved successfully.",
            "success"
          );
        }

        await loadPageData();
      } catch (error) {
        console.error("Approve bot payment failed:", error);
        approveBtn.disabled = false;
        approveBtn.textContent = originalText;

        if (typeof showToast === "function") {
          showToast(error.message || "Failed to approve payment.", "error");
        }
      }

      return;
    }

    if (rejectBtn) {
      const id = rejectBtn.getAttribute("data-reject-payment-id");
      if (!id) return;

      const reason = window.prompt("Enter rejection reason:");
      if (!reason || !reason.trim()) return;

      const originalText = rejectBtn.textContent;
      rejectBtn.disabled = true;
      rejectBtn.textContent = "Rejecting...";

      try {
        const response = await rejectBotPayment(id, reason.trim());

        if (typeof showToast === "function") {
          showToast(response?.message || "Trading bot payment rejected.", "success");
        }

        await loadPageData();
      } catch (error) {
        console.error("Reject bot payment failed:", error);
        rejectBtn.disabled = false;
        rejectBtn.textContent = originalText;

        if (typeof showToast === "function") {
          showToast(error.message || "Failed to reject payment.", "error");
        }
      }
    }
  }

  function bindSearch() {
    if (!searchInput) return;

    searchInput.addEventListener("input", (event) => {
      searchTerm = String(event.target.value || "").trim().toLowerCase();
      renderPayments();
    });
  }

  showPageLoader();

  if (!guardAdmin()) {
    hidePageLoader();
    return;
  }

  mobileSidebarToggle?.addEventListener("click", openSidebar);
  mobileSidebarClose?.addEventListener("click", closeSidebar);
  mobileSidebarOverlay?.addEventListener("click", closeSidebar);

  botPaymentsListContainer?.addEventListener("click", handleActionClick);

  bindSearch();
  await loadPageData();

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeSidebar();
    }
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }

  hidePageLoader();
});