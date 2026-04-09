document.addEventListener("DOMContentLoaded", async () => {
  const mobileSidebarToggle = document.getElementById("mobileSidebarToggle");
  const mobileSidebarClose = document.getElementById("mobileSidebarClose");
  const mobileSidebarOverlay = document.getElementById("mobileSidebarOverlay");
  const dashboardSidebar = document.getElementById("dashboardSidebar");

  const sidebarUserAvatar = document.getElementById("sidebarUserAvatar");
  const sidebarUserName = document.getElementById("sidebarUserName");

  const depositForm = document.getElementById("depositForm");
  const coinSelect = document.getElementById("coinSelect");
  const amountInput = document.getElementById("depositAmount");
  const walletAddressInput = document.getElementById("walletAddress");
  const copyWalletBtn = document.getElementById("copyWalletBtn");
  const transactionIdInput = document.getElementById("transactionId");
  const proofInput = document.getElementById("paymentProofInput");
  const paymentProofText = document.getElementById("paymentProofText");
  const submitDepositBtn = document.getElementById("submitDepositBtn");
  const depositHistoryContainer = document.getElementById("depositHistoryContainer");
  const pageLoader = document.getElementById("pageLoader");

  const MIN_DEPOSIT = 5000;

  const walletMap = {
    BTC: "bc1pd85hycjm20v20jwqxg8s9sdla7vyjxz4948hz2eskdd9szehxz4s6atadq",
    USDT_TRC20: "TVkUELxT7AYi6L56ajk6Ff6ijcPH9KWAQv",
    BNB: "0x7f75bfb8f27dc34bd958ee5957a133e244bea056",
  };

  const coinLabelMap = {
    BTC: "Bitcoin (BTC)",
    ETH: "Ethereum (ETH)",
    USDT_TRC20: "USDT (TRC20)",
    USDT_ERC20: "USDT (ERC20)",
    BNB: "BNB",
  };

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

  function clearStoredAuth() {
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userInfo");
    sessionStorage.removeItem("pendingVerificationEmail");
    sessionStorage.removeItem("pendingVerificationToken");
    sessionStorage.removeItem("pendingVerificationPhone");
    sessionStorage.removeItem("pendingCountryCode");
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

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  }

  function formatDate(dateValue) {
    if (!dateValue) return "—";

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getStatusBadge(status) {
    const normalized = String(status || "").toLowerCase();

    if (normalized === "approved") {
      return `
        <span class="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
          Approved
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
      <span class="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
        Pending
      </span>
    `;
  }

  function truncateFileName(name, maxLength = 42) {
    if (!name) return "";
    if (name.length <= maxLength) return name;

    const dotIndex = name.lastIndexOf(".");
    const extension = dotIndex > -1 ? name.slice(dotIndex) : "";
    const baseName = dotIndex > -1 ? name.slice(0, dotIndex) : name;

    const allowedBaseLength = Math.max(10, maxLength - extension.length - 3);
    return `${baseName.slice(0, allowedBaseLength)}...${extension}`;
  }

  function updateWalletAddress() {
    if (!coinSelect || !walletAddressInput) return;

    const selectedCoin = coinSelect.value || "BTC";
    walletAddressInput.value = walletMap[selectedCoin] || walletMap.BTC;
  }

  function setSidebarUser(user) {
    if (!user) return;

    if (sidebarUserName) {
      sidebarUserName.textContent = user.fullName || "Client Account";
    }

    if (sidebarUserAvatar) {
      sidebarUserAvatar.src = user.profileImage || "images/logo.png";
      sidebarUserAvatar.alt = user.fullName || "Client Avatar";
      sidebarUserAvatar.onerror = function () {
        this.onerror = null;
        this.src = "images/logo.png";
      };
    }
  }

  function routeUser(user) {
    if (!user) {
      clearStoredAuth();
      window.location.href = getPageUrl("login.html");
      return false;
    }

    if (!user.isVerified) {
      window.location.href = getPageUrl("otp.html");
      return false;
    }

    if (user.kycStatus === "verified") {
      return true;
    }

    if (user.kycStatus === "submitted") {
      window.location.href = getPageUrl("dashboard-pending.html");
      return false;
    }

    if (user.kycStatus === "pending" || user.kycStatus === "rejected") {
      window.location.href = getPageUrl("registration-fee.html");
      return false;
    }

    clearStoredAuth();
    window.location.href = getPageUrl("login.html");
    return false;
  }

  async function guardDepositPage() {
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
      const response = await window.API.get("/user/profile");
      const liveUser = response?.data || storedUser;

      localStorage.setItem("userInfo", JSON.stringify(liveUser));
      routeUser(liveUser);
      setSidebarUser(liveUser);

      return liveUser;
    } catch (error) {
      console.warn("Unable to verify live session, using stored user.");

      const canStay = routeUser(storedUser);
      if (!canStay) return null;

      setSidebarUser(storedUser);
      return storedUser;
    }
  }

  function renderEmptyHistory(message) {
    if (!depositHistoryContainer) return;

    depositHistoryContainer.innerHTML = `
      <div class="rounded-2xl border border-white/10 bg-white/5 px-4 sm:px-5 py-5 text-center">
        <p class="text-white font-semibold">No deposit history yet</p>
        <p class="text-slate-400 text-sm mt-2">${escapeHtml(message)}</p>
      </div>
    `;
  }

  function renderDepositHistory(deposits) {
    if (!depositHistoryContainer) return;

    if (!Array.isArray(deposits) || deposits.length === 0) {
      renderEmptyHistory("Your submitted deposits will appear here.");
      return;
    }

    depositHistoryContainer.innerHTML = deposits
      .map((deposit) => {
        const amount = formatCurrency(deposit.amount);
        const status = getStatusBadge(deposit.status);
        const coin = coinLabelMap[deposit.coinType] || deposit.coinType || "Deposit";
        const date = formatDate(deposit.createdAt);
        const reasonBlock =
          deposit.status === "rejected" && deposit.rejectionReason
            ? `
              <div class="mt-2 text-xs text-red-400">
                Reason: ${escapeHtml(deposit.rejectionReason)}
              </div>
            `
            : "";

        return `
          <div class="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div class="w-full flex items-center justify-between gap-4 px-4 sm:px-5 py-4 text-left">
              <div class="min-w-0">
                <p class="text-white font-bold text-sm sm:text-base">Deposit</p>
                <p class="text-slate-400 text-xs sm:text-sm mt-1">
                  ${escapeHtml(date)} • ${escapeHtml(coin)}
                </p>
                ${reasonBlock}
              </div>

              <div class="flex items-center gap-3 shrink-0">
                ${status}
                <p class="text-emerald-400 font-bold text-sm sm:text-base">
                  +${escapeHtml(amount)}
                </p>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  async function loadDepositHistory() {
    try {
      const response = await window.API.get("/deposit/me");
      const deposits = response?.data || [];
      renderDepositHistory(deposits);
    } catch (error) {
      console.error("Failed to load deposit history:", error);
      renderEmptyHistory("Unable to load deposit history right now.");
    }
  }

  async function copyWalletAddress() {
    if (!walletAddressInput?.value) return;

    try {
      await navigator.clipboard.writeText(walletAddressInput.value);
      showToast("Wallet address copied successfully.", "success");
    } catch (error) {
      showToast("Unable to copy wallet address.", "error");
    }
  }

  async function submitDeposit(event) {
    event.preventDefault();

    const selectedCoin = coinSelect?.value || "";
    const amount = Number(amountInput?.value || 0);
    const walletAddress = walletAddressInput?.value?.trim() || "";
    const transactionId = transactionIdInput?.value?.trim() || "";
    const proofFile = proofInput?.files?.[0];

    if (!selectedCoin) {
      showToast("Please select a coin.", "error");
      return;
    }

    if (!amount || Number.isNaN(amount)) {
      showToast("Please enter a valid deposit amount.", "error");
      return;
    }

    if (amount < MIN_DEPOSIT) {
      showToast(`Minimum deposit amount is $${MIN_DEPOSIT}.`, "error");
      return;
    }

    if (!walletAddress) {
      showToast("Wallet address is missing.", "error");
      return;
    }

    if (!transactionId) {
      showToast("Please enter your transaction hash or ID.", "error");
      return;
    }

    if (!proofFile) {
      showToast("Please upload your payment proof.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("amount", String(amount));
    formData.append("coinType", selectedCoin);
    formData.append("transactionId", transactionId);
    formData.append("receipt", proofFile);

    const originalText = submitDepositBtn?.textContent || "Submit Deposit";

    if (submitDepositBtn) {
      submitDepositBtn.disabled = true;
      submitDepositBtn.textContent = "Submitting...";
    }

    try {
      const response = await window.API.postForm("/deposit", formData);

      showToast(
        response?.message ||
          "Deposit receipt submitted successfully. Awaiting admin approval.",
        "success"
      );

      if (depositForm) depositForm.reset();
      updateWalletAddress();

      if (paymentProofText) {
        paymentProofText.textContent = "Upload a clear payment screenshot for review.";
      }

      await loadDepositHistory();
    } catch (error) {
      showToast(
        error.message || "Unable to submit deposit right now.",
        "error"
      );
    } finally {
      if (submitDepositBtn) {
        submitDepositBtn.disabled = false;
        submitDepositBtn.textContent = originalText;
      }
    }
  }

  showPageLoader();

  const user = await guardDepositPage();
  if (!user) {
    hidePageLoader();
    return;
  }

  mobileSidebarToggle?.addEventListener("click", openSidebar);
  mobileSidebarClose?.addEventListener("click", closeSidebar);
  mobileSidebarOverlay?.addEventListener("click", closeSidebar);

  coinSelect?.addEventListener("change", updateWalletAddress);
  copyWalletBtn?.addEventListener("click", copyWalletAddress);
  depositForm?.addEventListener("submit", submitDeposit);

  proofInput?.addEventListener("change", () => {
    const file = proofInput.files?.[0];
    if (!paymentProofText) return;

    paymentProofText.textContent = file
      ? truncateFileName(file.name, 45)
      : "Upload a clear payment screenshot for review.";
  });

  updateWalletAddress();

  try {
    await loadDepositHistory();
  } finally {
    hidePageLoader();
  }
});