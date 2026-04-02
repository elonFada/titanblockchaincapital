document.addEventListener("DOMContentLoaded", async () => {
  const mobileSidebarToggle = document.getElementById("mobileSidebarToggle");
  const mobileSidebarClose = document.getElementById("mobileSidebarClose");
  const mobileSidebarOverlay = document.getElementById("mobileSidebarOverlay");
  const dashboardSidebar = document.getElementById("dashboardSidebar");

  const sidebarUserAvatar = document.getElementById("sidebarUserAvatar");
  const sidebarUserName = document.getElementById("sidebarUserName");
  const sidebarUserStatus = document.getElementById("sidebarUserStatus");

  const availableProfitValue = document.getElementById("availableProfitValue");
  const availableProfitMeta = document.getElementById("availableProfitMeta");

  const withdrawalForm = document.getElementById("withdrawalForm");
  const withdrawalAmountInput = document.getElementById("withdrawalAmount");
  const walletSelect = document.getElementById("walletSelect");
  const walletHelpText = document.getElementById("walletHelpText");
  const submitWithdrawalBtn = document.getElementById("submitWithdrawalBtn");

  const withdrawalHistoryContainer = document.getElementById(
    "withdrawalHistoryContainer"
  );

  let currentUser = null;
  let availableProfit = 0;

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
    return new Date(dateString).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
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

  async function guardPage() {
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

      if (storedUser) {
        return storedUser;
      }

      clearStoredAuth();
      window.location.href = getPageUrl("login.html");
      return null;
    }
  }

  function hydrateSidebar(user) {
    if (!user) return;

    const profileImage = user.profileImage || "images/logo.png";
    const fullName = user.fullName || "Client Account";
    const verifiedText =
      user.kycStatus === "verified" ? "Verified User" : "Client User";

    if (sidebarUserAvatar) {
      sidebarUserAvatar.src = profileImage;
      sidebarUserAvatar.alt = fullName;
    }

    if (sidebarUserName) {
      sidebarUserName.textContent = fullName;
    }

    if (sidebarUserStatus) {
      sidebarUserStatus.textContent = verifiedText;
    }
  }

  function parseWalletType(walletType = "") {
    const cleaned = String(walletType || "").trim();

    if (!cleaned) {
      return {
        coinType: "",
        network: "",
      };
    }

    const match = cleaned.match(/^(.+?)\s*\((.+)\)$/);

    if (match) {
      return {
        coinType: match[1].trim(),
        network: match[2].trim(),
      };
    }

    return {
      coinType: cleaned,
      network: cleaned,
    };
  }

  function setWalletState(user) {
    if (!walletSelect || !walletHelpText || !submitWithdrawalBtn) return;

    const walletType = user?.withdrawalWalletType || "";
    const walletAddress = user?.withdrawalWalletAddress || "";
    const walletLocked = Boolean(user?.withdrawalWalletLocked);

    walletSelect.innerHTML = "";

    if (!walletType || !walletAddress || !walletLocked) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No saved wallet address";
      walletSelect.appendChild(option);
      walletSelect.disabled = true;

      walletHelpText.textContent =
        "Please go to your profile and add your one trusted withdrawal wallet address before submitting a withdrawal request.";

      submitWithdrawalBtn.disabled = true;
      submitWithdrawalBtn.classList.add("opacity-60", "cursor-not-allowed");
      return;
    }

    const option = document.createElement("option");
    option.value = JSON.stringify({
      walletType,
      walletAddress,
    });
    option.textContent = `${walletType} • ${walletAddress}`;
    walletSelect.appendChild(option);

    walletSelect.disabled = false;
    walletHelpText.textContent =
      "Your saved and locked withdrawal wallet is selected for this request.";

    submitWithdrawalBtn.disabled = false;
    submitWithdrawalBtn.classList.remove("opacity-60", "cursor-not-allowed");
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
    const walletShort = withdrawal.walletAddress
      ? withdrawal.walletAddress.length > 14
        ? `${withdrawal.walletAddress.slice(0, 6)}...${withdrawal.walletAddress.slice(-4)}`
        : withdrawal.walletAddress
      : "No wallet";

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
              ${escapeHtml(formatDate(withdrawal.updatedAt || withdrawal.createdAt))} • ${escapeHtml(withdrawal.coinType || withdrawal.network || "Wallet")} • ${escapeHtml(walletShort)}
            </p>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            ${getStatusBadge(withdrawal.status)}
            <p class="text-red-400 font-bold text-sm sm:text-base">
              -${formatMoney(Number(withdrawal.amount || 0))}
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
                No withdrawals yet
              </p>
              <p class="text-slate-400 text-xs sm:text-sm mt-1">
                Your withdrawal requests and status updates will appear here.
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
      const response = await window.API.get("/withdrawal/me");
      const withdrawals = Array.isArray(response?.data) ? response.data : [];
      availableProfit = Number(response?.availableProfit || 0);

      if (availableProfitValue) {
        availableProfitValue.textContent = formatMoney(availableProfit);
      }

      if (availableProfitMeta) {
        availableProfitMeta.textContent =
          availableProfit > 0
            ? "Only realized trading profit can be withdrawn."
            : "You do not have withdrawable profit yet.";
        availableProfitMeta.className =
          availableProfit > 0
            ? "text-primary text-sm mt-2 font-semibold"
            : "text-slate-400 text-sm mt-2 font-semibold";
      }

      renderWithdrawalHistory(withdrawals);
    } catch (error) {
      console.error("Failed to load withdrawals:", error);

      if (availableProfitValue) {
        availableProfitValue.textContent = formatMoney(0);
      }

      if (availableProfitMeta) {
        availableProfitMeta.textContent = "Unable to load withdrawal data.";
        availableProfitMeta.className = "text-red-400 text-sm mt-2 font-semibold";
      }

      renderWithdrawalHistory([]);

      if (typeof showToast === "function") {
        showToast(error.message || "Failed to load withdrawal data.", "error");
      }
    }
  }

  async function handleWithdrawalSubmit(event) {
    event.preventDefault();

    if (!currentUser) return;

    const amount = Number(withdrawalAmountInput?.value || 0);

    if (!amount || Number.isNaN(amount) || amount <= 0) {
      showToast("Please enter a valid withdrawal amount.", "error");
      return;
    }

    if (amount > availableProfit) {
      showToast(
        "This withdrawal amount exceeds your available profit. Only realized profit is eligible for withdrawal at this time, while your principal capital remains engaged in active trading.",
        "error"
      );
      return;
    }

    if (!walletSelect?.value) {
      showToast(
        "Please go to your profile and add your withdrawal wallet address first.",
        "error"
      );
      return;
    }

    let walletPayload;
    try {
      walletPayload = JSON.parse(walletSelect.value);
    } catch (error) {
      showToast("Invalid wallet selection.", "error");
      return;
    }

    const walletType = walletPayload.walletType || "";
    const walletAddress = walletPayload.walletAddress || "";

    if (!walletType || !walletAddress) {
      showToast("Invalid wallet details.", "error");
      return;
    }

    const parsedWallet = parseWalletType(walletType);

    const payload = {
      amount,
      coinType: parsedWallet.coinType,
      network: parsedWallet.network,
      walletAddress,
    };

    const originalText = submitWithdrawalBtn.textContent;
    submitWithdrawalBtn.disabled = true;
    submitWithdrawalBtn.textContent = "Submitting...";

    try {
      const response = await window.API.post("/withdrawal", payload);

      if (typeof showToast === "function") {
        showToast(
          response?.message || "Withdrawal request submitted successfully.",
          "success"
        );
      }

      withdrawalForm.reset();
      setWalletState(currentUser);
      await loadWithdrawalData();
    } catch (error) {
      console.error("Withdrawal submission failed:", error);

      if (typeof showToast === "function") {
        showToast(
          error.message || "Failed to submit withdrawal request.",
          "error"
        );
      }
    } finally {
      submitWithdrawalBtn.disabled = false;
      submitWithdrawalBtn.textContent = originalText;

      if (!currentUser?.withdrawalWalletAddress || !currentUser?.withdrawalWalletType) {
        submitWithdrawalBtn.classList.add("opacity-60", "cursor-not-allowed");
      }
    }
  }

  currentUser = await guardPage();
  if (!currentUser) return;

  hydrateSidebar(currentUser);
  setWalletState(currentUser);
  await loadWithdrawalData();

  mobileSidebarToggle?.addEventListener("click", openSidebar);
  mobileSidebarClose?.addEventListener("click", closeSidebar);
  mobileSidebarOverlay?.addEventListener("click", closeSidebar);

  withdrawalForm?.addEventListener("submit", handleWithdrawalSubmit);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeSidebar();
    }
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
});