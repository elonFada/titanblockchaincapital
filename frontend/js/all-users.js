document.addEventListener("DOMContentLoaded", async () => {
  const mobileSidebarToggle = document.getElementById("mobileSidebarToggle");
  const mobileSidebarClose = document.getElementById("mobileSidebarClose");
  const mobileSidebarOverlay = document.getElementById("mobileSidebarOverlay");
  const dashboardSidebar = document.getElementById("dashboardSidebar");

  const searchInput = document.getElementById("userSearchInput");

  const verifiedUsersCount = document.getElementById("verifiedUsersCount");
  const pendingUsersCount = document.getElementById("pendingUsersCount");

  const paymentRequestsTableBody = document.getElementById("paymentRequestsTableBody");
  const allUsersTableBody = document.getElementById("allUsersTableBody");

  let allPayments = [];
  let allUsers = [];

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
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getUserStatusBadge(status) {
    if (status === "verified") {
      return `<span class="inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Verified</span>`;
    }

    if (status === "submitted") {
      return `<span class="inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">Pending</span>`;
    }

    if (status === "rejected") {
      return `<span class="inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/20 text-red-400">Rejected</span>`;
    }

    return `<span class="inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 border border-white/10 text-slate-300">Pending</span>`;
  }

  function formatDate(dateValue) {
    if (!dateValue) return "—";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function buildPaymentRow(payment) {
    const user = payment.user || {};
    const proofUrl = payment.receipt || "#";
    const paymentId = payment._id;

    return `
      <tr>
        <td class="py-4 pr-4">
          <p class="text-white font-bold">${escapeHtml(user.fullName || "Unknown User")}</p>
        </td>

        <td class="py-4 pr-4 text-slate-300">
          ${escapeHtml(user.email || "—")}
        </td>

        <td class="py-4 pr-4">
          <a
            href="${escapeHtml(proofUrl)}"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-400 underline text-sm font-semibold"
          >
            View Proof
          </a>
        </td>

        <td class="py-4">
          <div class="flex flex-wrap gap-2">
            <button
              data-approve-id="${escapeHtml(paymentId)}"
              class="approve-payment-btn px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold hover:bg-emerald-500/20 transition-all duration-200"
            >
              Approve
            </button>

            <button
              data-reject-id="${escapeHtml(paymentId)}"
              class="reject-payment-btn px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/20 transition-all duration-200"
            >
              Reject
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  function buildUserRow(user) {
    return `
      <tr>
        <td class="py-4 pr-4">
          <p class="text-white font-bold">${escapeHtml(user.fullName || "—")}</p>
        </td>
        <td class="py-4 pr-4 text-slate-300">
          ${escapeHtml(user.email || "—")}
        </td>
        <td class="py-4 pr-4 text-slate-300">
          ${escapeHtml(user.phoneNumber || "—")}
        </td>
        <td class="py-4 pr-4">
          ${getUserStatusBadge(user.kycStatus)}
        </td>
        <td class="py-4 text-slate-400 text-sm">
          ${formatDate(user.createdAt)}
        </td>
      </tr>
    `;
  }

  function renderCounts(users) {
    const verified = users.filter((user) => user.kycStatus === "verified").length;
    const pending = users.filter((user) => user.kycStatus === "submitted").length;

    if (verifiedUsersCount) verifiedUsersCount.textContent = verified;
    if (pendingUsersCount) pendingUsersCount.textContent = pending;
  }

  function renderTables(filterText = "") {
    const query = filterText.trim().toLowerCase();

    const filteredPayments = allPayments.filter((payment) => {
      const user = payment.user || {};
      const haystack = [
        user.fullName,
        user.email,
        payment._id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });

    const filteredUsers = allUsers.filter((user) => {
      const haystack = [
        user.fullName,
        user.email,
        user.phoneNumber,
        user._id,
        user.kycStatus,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });

    if (paymentRequestsTableBody) {
      if (!filteredPayments.length) {
        paymentRequestsTableBody.innerHTML = `
          <tr>
            <td colspan="4" class="py-8 text-center text-slate-400">
              No payment requests found.
            </td>
          </tr>
        `;
      } else {
        paymentRequestsTableBody.innerHTML = filteredPayments
          .map(buildPaymentRow)
          .join("");
      }
    }

    if (allUsersTableBody) {
      if (!filteredUsers.length) {
        allUsersTableBody.innerHTML = `
          <tr>
            <td colspan="5" class="py-8 text-center text-slate-400">
              No users found.
            </td>
          </tr>
        `;
      } else {
        allUsersTableBody.innerHTML = filteredUsers.map(buildUserRow).join("");
      }
    }

    bindActionButtons();
  }

  function bindActionButtons() {
    document.querySelectorAll(".approve-payment-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const paymentId = button.getAttribute("data-approve-id");
        if (!paymentId) return;

        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = "Approving...";

        try {
          const response = await window.API.post(
            `/payment/registration/${paymentId}/approve`,
            {}
          );

          showToast(response.message || "Payment approved successfully.", "success");
          await loadData();
        } catch (error) {
          showToast(error.message || "Unable to approve payment.", "error");
        } finally {
          button.disabled = false;
          button.textContent = originalText;
        }
      });
    });

    document.querySelectorAll(".reject-payment-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const paymentId = button.getAttribute("data-reject-id");
        if (!paymentId) return;

        const reason = window.prompt("Enter rejection reason:");
        if (!reason || !reason.trim()) return;

        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = "Rejecting...";

        try {
          const response = await window.API.post(
            `/payment/registration/${paymentId}/reject`,
            { reason: reason.trim() }
          );

          showToast(response.message || "Payment rejected.", "success");
          await loadData();
        } catch (error) {
          showToast(error.message || "Unable to reject payment.", "error");
        } finally {
          button.disabled = false;
          button.textContent = originalText;
        }
      });
    });
  }

  async function loadData() {
    try {
      const [usersResponse, paymentsResponse] = await Promise.all([
        window.API.get("/user/admin/users"),
        window.API.get("/payment/registration"),
      ]);

      allUsers = usersResponse?.data || [];
      allPayments = (paymentsResponse?.data || []).filter(
        (payment) => payment.status === "pending"
      );

      renderCounts(allUsers);
      renderTables(searchInput?.value || "");
    } catch (error) {
      console.error("Failed to load users page data:", error);
      showToast(error.message || "Unable to load users data.", "error");
    }
  }

  const canStay = guardAdminPage();
  if (!canStay) return;

  mobileSidebarToggle?.addEventListener("click", openSidebar);
  mobileSidebarClose?.addEventListener("click", closeSidebar);
  mobileSidebarOverlay?.addEventListener("click", closeSidebar);

  searchInput?.addEventListener("input", (e) => {
    renderTables(e.target.value || "");
  });

  await loadData();
});