document.addEventListener("DOMContentLoaded", async () => {
  const mobileSidebarToggle = document.getElementById("mobileSidebarToggle");
  const mobileSidebarClose = document.getElementById("mobileSidebarClose");
  const mobileSidebarOverlay = document.getElementById("mobileSidebarOverlay");
  const dashboardSidebar = document.getElementById("dashboardSidebar");

  const sidebarUserAvatar = document.getElementById("sidebarUserAvatar");
  const sidebarUserName = document.getElementById("sidebarUserName");
  const sidebarUserStatus = document.getElementById("sidebarUserStatus");

  const profileMainImage = document.getElementById("profileMainImage");
  const profileMainName = document.getElementById("profileMainName");
  const profileMainStatus = document.getElementById("profileMainStatus");
  const profileFullName = document.getElementById("profileFullName");
  const profileEmail = document.getElementById("profileEmail");

  const togglePasswordEdit = document.getElementById("togglePasswordEdit");
  const passwordPanel = document.getElementById("edit-password");
  const passwordForm = document.getElementById("passwordForm");
  const currentPasswordInput = document.getElementById("currentPassword");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmNewPasswordInput = document.getElementById("confirmNewPassword");
  const updatePasswordBtn = document.getElementById("updatePasswordBtn");

  const walletNoticeCard = document.getElementById("walletNoticeCard");
  const walletAddressDisplay = document.getElementById("walletAddressDisplay");
  const walletTypeDisplay = document.getElementById("walletTypeDisplay");
  const walletActionCard = document.getElementById("walletActionCard");
  const walletLockedCard = document.getElementById("walletLockedCard");

  const openWalletModalBtn = document.getElementById("openWalletModal");
  const closeWalletModalBtn = document.getElementById("closeWalletModal");
  const walletModal = document.getElementById("walletModal");
  const walletModalCard = document.getElementById("walletModalCard");
  const walletForm = document.getElementById("walletForm");
  const walletTypeInput = document.getElementById("walletType");
  const walletAddressInput = document.getElementById("walletAddress");
  const walletConfirmCheckbox = document.getElementById("walletConfirmCheckbox");
  const saveWalletBtn = document.getElementById("saveWalletBtn");

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

  function openWalletModal() {
    if (!walletModal || !walletModalCard) return;
    walletModal.classList.remove("modal-hidden");
    walletModal.classList.add("modal-visible");
    walletModalCard.classList.remove("modal-card-hidden");
    walletModalCard.classList.add("modal-card-visible");
    document.body.classList.add("modal-open");
  }

  function closeWalletModal() {
    if (!walletModal || !walletModalCard) return;
    walletModal.classList.remove("modal-visible");
    walletModal.classList.add("modal-hidden");
    walletModalCard.classList.remove("modal-card-visible");
    walletModalCard.classList.add("modal-card-hidden");
    document.body.classList.remove("modal-open");
  }

  async function guardProfile() {
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
      console.error("Failed to load profile:", error);
      if (storedUser) return storedUser;

      clearStoredAuth();
      window.location.href = getPageUrl("login.html");
      return null;
    }
  }

  function hydrateProfile(user) {
    const profileImage = user?.profileImage || "images/logo.png";
    const fullName = user?.fullName || "Client Account";
    const email = user?.email || "No email";
    const verifiedText =
      user?.kycStatus === "verified" ? "Verified User" : "Client User";

    if (sidebarUserAvatar) {
      sidebarUserAvatar.src = profileImage;
      sidebarUserAvatar.alt = fullName;
    }

    if (sidebarUserName) sidebarUserName.textContent = fullName;
    if (sidebarUserStatus) sidebarUserStatus.textContent = verifiedText;

    if (profileMainImage) {
      profileMainImage.src = profileImage;
      profileMainImage.alt = fullName;
    }

    if (profileMainName) profileMainName.textContent = fullName;
    if (profileMainStatus) profileMainStatus.textContent = verifiedText;
    if (profileFullName) profileFullName.textContent = fullName;
    if (profileEmail) profileEmail.textContent = email;

    const hasWallet =
      Boolean(user?.withdrawalWalletAddress) && Boolean(user?.withdrawalWalletType);

    if (hasWallet) {
      if (walletAddressDisplay) {
        walletAddressDisplay.textContent = user.withdrawalWalletAddress;
      }

      if (walletTypeDisplay) {
        walletTypeDisplay.textContent = user.withdrawalWalletType;
      }

      walletNoticeCard?.classList.add("hidden");
      walletActionCard?.classList.add("hidden");
      walletLockedCard?.classList.remove("hidden");
    } else {
      if (walletAddressDisplay) {
        walletAddressDisplay.textContent = "Not Added Yet";
      }

      if (walletTypeDisplay) {
        walletTypeDisplay.textContent = "No wallet added";
      }

      walletNoticeCard?.classList.remove("hidden");
      walletActionCard?.classList.remove("hidden");
      walletLockedCard?.classList.add("hidden");
    }
  }

  async function handlePasswordChange(event) {
    event.preventDefault();

    const currentPassword = currentPasswordInput?.value.trim() || "";
    const newPassword = newPasswordInput?.value.trim() || "";
    const confirmNewPassword = confirmNewPasswordInput?.value.trim() || "";

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      showToast("Please fill all password fields.", "error");
      return;
    }

    const originalText = updatePasswordBtn.textContent;
    updatePasswordBtn.disabled = true;
    updatePasswordBtn.textContent = "Updating...";

    try {
      const response = await window.API.post("/user/change-password", {
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      showToast(response?.message || "Password changed successfully.", "success");
      passwordForm.reset();
      passwordPanel?.classList.add("hidden");
    } catch (error) {
      console.error("Password change failed:", error);
      showToast(error.message || "Failed to change password.", "error");
    } finally {
      updatePasswordBtn.disabled = false;
      updatePasswordBtn.textContent = originalText;
    }
  }

  async function handleWalletSave(event) {
    event.preventDefault();

    const walletType = walletTypeInput?.value.trim() || "";
    const walletAddress = walletAddressInput?.value.trim() || "";
    const confirmed = walletConfirmCheckbox?.checked;

    if (!walletType || !walletAddress) {
      showToast("Please enter wallet type and wallet address.", "error");
      return;
    }

    if (!confirmed) {
      showToast("Please confirm the wallet warning checkbox.", "error");
      return;
    }

    const originalText = saveWalletBtn.textContent;
    saveWalletBtn.disabled = true;
    saveWalletBtn.textContent = "Saving...";

    try {
      const response = await window.API.put("/user/profile", {
        withdrawalWalletType: walletType,
        withdrawalWalletAddress: walletAddress,
      });

      const updatedUser = {
        ...(JSON.parse(localStorage.getItem("userInfo") || "{}")),
        ...(response?.data || {}),
      };

      localStorage.setItem("userInfo", JSON.stringify(updatedUser));

      showToast(response?.message || "Wallet saved successfully.", "success");
      hydrateProfile(updatedUser);
      walletForm.reset();
      closeWalletModal();
    } catch (error) {
      console.error("Wallet save failed:", error);
      showToast(error.message || "Failed to save wallet address.", "error");
    } finally {
      saveWalletBtn.disabled = false;
      saveWalletBtn.textContent = originalText;
    }
  }

  const currentUser = await guardProfile();
  if (!currentUser) return;

  hydrateProfile(currentUser);

  mobileSidebarToggle?.addEventListener("click", openSidebar);
  mobileSidebarClose?.addEventListener("click", closeSidebar);
  mobileSidebarOverlay?.addEventListener("click", closeSidebar);

  togglePasswordEdit?.addEventListener("click", () => {
    passwordPanel?.classList.toggle("hidden");
  });

  passwordForm?.addEventListener("submit", handlePasswordChange);

  openWalletModalBtn?.addEventListener("click", openWalletModal);
  closeWalletModalBtn?.addEventListener("click", closeWalletModal);

  walletModal?.addEventListener("click", (e) => {
    if (e.target === walletModal) {
      closeWalletModal();
    }
  });

  walletForm?.addEventListener("submit", handleWalletSave);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeWalletModal();
      closeSidebar();
    }
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
});