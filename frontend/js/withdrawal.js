// public/js/withdrawal.js
document.addEventListener("DOMContentLoaded", async () => {
  const mobileSidebarToggle = document.getElementById("mobileSidebarToggle");
  const mobileSidebarClose = document.getElementById("mobileSidebarClose");
  const mobileSidebarOverlay = document.getElementById("mobileSidebarOverlay");
  const dashboardSidebar = document.getElementById("dashboardSidebar");

  const sidebarUserAvatar = document.getElementById("sidebarUserAvatar");
  const sidebarUserName = document.getElementById("sidebarUserName");
  const sidebarUserStatus = document.getElementById("sidebarUserStatus");

  const accountBalanceValue = document.getElementById("accountBalanceValue");
  const availableProfitValue = document.getElementById("availableProfitValue");
  const walletSelect = document.getElementById("walletSelect");
  const walletHelpText = document.getElementById("walletHelpText");
  const withdrawalAmountInput = document.getElementById("withdrawalAmount");
  const withdrawalForm = document.getElementById("withdrawalForm");
  const submitWithdrawalBtn = document.getElementById("submitWithdrawalBtn");
  const withdrawalHistoryContainer = document.getElementById(
    "withdrawalHistoryContainer"
  );

  let currentUser = null;
  let currentAvailableProfit = 0;
  let currentWalletType = "";
  let currentWalletAddress = "";

  function getPageUrl(page) {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    return isLocal ? `/frontend/${page}` : `/${page}`;
  }

  function clearStoredAuth() {
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userInfo");
  }

  function escapeHtml(text = "") {
    return String(text)
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

  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function maskWalletAddress(address = "") {
    if (!address || address.length <= 10) return address || "—";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
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

  async function guardWithdrawalPage() {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    const userInfoRaw =
      localStorage.getItem("userInfo") || sessionStorage.getItem("userInfo");
    const storedUser = userInfoRaw ? JSON.parse(userInfoRaw) : null;

    if (!token || !storedUser) {
      clearStoredAuth();
      window.location.href = getPageUrl("login.html");
      return null;
    }

    try {
      const profileResponse = await window.API.get("/user/profile");
      const liveUser = profileResponse?.data || storedUser;

      localStorage.setItem("userInfo", JSON.stringify(liveUser));
      return liveUser;
    } catch (error) {
      console.error("Failed to load user profile:", error);
      if (storedUser) return storedUser;

      clearStoredAuth();
      window.location.href = getPageUrl("login.html");
      return null;
    }
  }

  function hydrateSidebar(user) {
    const profileImage = user?.profileImage || "images/logo.png";
    const fullName = user?.fullName || "Client Account";
    const statusText =
      user?.kycStatus === "verified" ? "Verified User" : "Client User";

    if (sidebarUserAvatar) {
      sidebarUserAvatar.src = profileImage;
      sidebarUserAvatar.alt = fullName;
    }

    if (sidebarUserName) {
      sidebarUserName.textContent = fullName;
    }

    if (sidebarUserStatus) {
      sidebarUserStatus.textContent = statusText;
    }
  }

  function hydrateWallet(user) {
    currentWalletType = user?.withdrawalWalletType || "";
    currentWalletAddress = user?.withdrawalWalletAddress || "";

    const hasWallet = Boolean(currentWalletType && currentWalletAddress);

    if (!walletSelect) return;

    if (!hasWallet) {
      walletSelect.innerHTML = `
        <option value="">
          No saved wallet address found
        </option>
      `;
      walletSelect.disabled = true;

      if (walletHelpText) {
        walletHelpText.textContent =
          "Please go to your profile and add your trusted withdrawal wallet address before submitting a withdrawal request.";
        walletHelpText.className =
          "text-warning text-xs sm:text-sm mt-3 leading-6";
      }

      return;
    }

    walletSelect.innerHTML = `
      <option value="${escapeHtml(currentWalletAddress)}">
        ${escapeHtml(currentWalletType)} • ${escapeHtml(
      maskWalletAddress(currentWalletAddress)
    )}
      </option>
    `;
    walletSelect.disabled = false;

    if (walletHelpText) {
      walletHelpText.textContent =
        "Your withdrawal will be processed to the wallet saved in your profile.";
      walletHelpText.className =
        "text-slate-400 text-xs sm:text-sm mt-3 leading-6";
    }
  }

  function getStatusBadge(status) {
    const normalized = String(status || "").toLowerCase();

    if (normalized === "pending") {
      return `
        <span class="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
          Pending
        </span>
      `;
    }

    if (normalized === "approved") {
      return `
        <span class="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
          Approved
        </span>
      `;
    }

    if (normalized === "paid") {
      return `
        <span class="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
          Paid
        </span>
      `;
    }

    if (normalized === "rejected") {
      return `
        <span class="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
          Rejected
        </span>
      `;
    }

    return `
      <span class="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-slate-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
        ${escapeHtml(status || "Unknown")}
      </span>
    `;
  }

  function getHistoryCard(withdrawal) {
    const subtitle = `${formatDate(
      withdrawal.updatedAt || withdrawal.createdAt
    )} • ${escapeHtml(withdrawal.coinType || withdrawal.network || "Wallet")} • ${escapeHtml(
      maskWalletAddress(withdrawal.walletAddress || "")
    )}`;

    return `
      <div class="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <button
          type="button"
          class="w-full flex items-center justify-between gap-4 px-4 sm:px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
        >
          <div class="min-w-0">
            <p class="text-white font-bold text-sm sm:text-base">
              Withdrawal
            </p>
            <p class="text-slate-400 text-xs sm:text-sm mt-1">
              ${subtitle}
            </p>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            ${getStatusBadge(withdrawal.status)}
            <p class="text-red-400 font-bold text-sm sm:text-base">
              -${formatMoney(withdrawal.amount || 0)}
            </p>
          </div>
        </button>
      </div>
    `;
  }

  function renderWithdrawalHistory(withdrawals = []) {
    if (!withdrawalHistoryContainer) return;

    if (!withdrawals.length) {
      withdrawalHistoryContainer.innerHTML = `
        <div class="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <button
            type="button"
            class="w-full flex items-center justify-between gap-4 px-4 sm:px-5 py-4 text-left"
          >
            <div class="min-w-0">
              <p class="text-white font-bold text-sm sm:text-base">
                No withdrawal history yet
              </p>
              <p class="text-slate-400 text-xs sm:text-sm mt-1">
                Your withdrawal requests will appear here once submitted.
              </p>
            </div>
          </button>
        </div>
      `;
      return;
    }

    withdrawalHistoryContainer.innerHTML = withdrawals
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
      )
      .map(getHistoryCard)
      .join("");
  }

  async function loadWithdrawalData() {
    try {
      const [profileResponse, withdrawalsResponse] = await Promise.all([
        window.API.get("/user/profile"),
        window.API.get("/withdrawal/me"),
      ]);

      const liveUser = profileResponse?.data || currentUser;
      const withdrawals = Array.isArray(withdrawalsResponse?.data)
        ? withdrawalsResponse.data
        : [];

      currentUser = liveUser;
      currentAvailableProfit = Number(withdrawalsResponse?.availableProfit || 0);

      localStorage.setItem("userInfo", JSON.stringify(liveUser));

      hydrateSidebar(liveUser);
      hydrateWallet(liveUser);
      renderWithdrawalHistory(withdrawals);

      if (accountBalanceValue) {
        accountBalanceValue.textContent = formatMoney(liveUser?.balance || 0);
      }

      if (availableProfitValue) {
        availableProfitValue.textContent = formatMoney(currentAvailableProfit);
      }
    } catch (error) {
      console.error("Failed to load withdrawal page data:", error);

      if (typeof showToast === "function") {
        showToast(error.message || "Unable to load withdrawal details.");
      }

      if (accountBalanceValue) {
        accountBalanceValue.textContent = formatMoney(0);
      }

      if (availableProfitValue) {
        availableProfitValue.textContent = formatMoney(0);
      }

      renderWithdrawalHistory([]);
    }
  }

  async function handleSubmitWithdrawal(event) {
    event.preventDefault();

    const amountValue = withdrawalAmountInput?.value?.trim() || "";
    const hasWallet = Boolean(currentWalletType && currentWalletAddress);

    if (!amountValue) {
      showToast("Please enter a withdrawal amount.",);
      return;
    }

    const amount = Number(amountValue);

    if (Number.isNaN(amount) || amount <= 0) {
      showToast("Please enter a valid withdrawal amount.");
      return;
    }

    if (!hasWallet) {
      showToast(
        "Please go to your profile and add your trusted withdrawal wallet address before submitting a withdrawal request.",
      );
      return;
    }

    if (amount > Number(currentUser?.balance || 0)) {
      showToast("Insufficient account balance for this withdrawal request.");
      return;
    }

    if (amount > currentAvailableProfit) {
      showToast(
        "This withdrawal amount exceeds your available profit. Only realized profit is eligible for withdrawal at this time, while your principal capital remains engaged in active trading.",
      );
      return;
    }

    const originalText = submitWithdrawalBtn.textContent;
    submitWithdrawalBtn.disabled = true;
    submitWithdrawalBtn.textContent = "Submitting...";

    try {
      const response = await window.API.post("/withdrawal", {
        amount,
        coinType: currentWalletType,
        walletAddress: currentWalletAddress,
        network: currentWalletType,
      });

      if (typeof showToast === "function") {
        showToast(
          response?.message || "Withdrawal request submitted successfully.",
          "success"
        );
      }

      withdrawalForm.reset();
      await loadWithdrawalData();
    } catch (error) {
      console.error("Withdrawal submission failed:", error);

      if (typeof showToast === "function") {
        showToast(
          error.message || "Failed to submit withdrawal request.",
        );
      }
    } finally {
      submitWithdrawalBtn.disabled = false;
      submitWithdrawalBtn.textContent = originalText;
    }
  }

  currentUser = await guardWithdrawalPage();
  if (!currentUser) return;

  hydrateSidebar(currentUser);

  mobileSidebarToggle?.addEventListener("click", openSidebar);
  mobileSidebarClose?.addEventListener("click", closeSidebar);
  mobileSidebarOverlay?.addEventListener("click", closeSidebar);

  withdrawalForm?.addEventListener("submit", handleSubmitWithdrawal);

  await loadWithdrawalData();

  if (window.lucide) {
    window.lucide.createIcons();
  }
});