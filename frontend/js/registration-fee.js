document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registrationFeeForm");
  const submitBtn = document.getElementById("registrationFeeSubmitBtn");
  const coinSelect = document.getElementById("coinSelect");
  const walletAddressInput = document.getElementById("walletAddress");
  const copyWalletBtn = document.getElementById("copyWalletBtn");
  const transactionIdInput = document.getElementById("transactionId");
  const proofInput = document.getElementById("paymentProofInput");
  const proofText = document.getElementById("paymentProofText");

  const token = localStorage.getItem("token");
  const userInfoRaw = localStorage.getItem("userInfo");
  const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;

  function getPageUrl(page) {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    return isLocal ? `/frontend/${page}` : `/${page}`;
  }

  if (!token || !userInfo) {
    showToast("Please log in to continue.", "error");
    setTimeout(() => {
      window.location.href = getPageUrl("login.html");
    }, 1200);
    return;
  }

  if (!userInfo.isVerified) {
    showToast("Please complete email verification first.", "error");
    setTimeout(() => {
      window.location.href = getPageUrl("otp.html");
    }, 1200);
    return;
  }

  const walletMap = {
    BTC: "TBC-REG-BTC-WALLET-ADDRESS-HERE-1234567890",
    ETH: "TBC-REG-ETH-WALLET-ADDRESS-HERE-1234567890",
    USDT_TRC20: "TBC-REG-USDT-TRC20-WALLET-ADDRESS-HERE-1234567890",
    USDT_ERC20: "TBC-REG-USDT-ERC20-WALLET-ADDRESS-HERE-1234567890",
    BNB: "TBC-REG-BNB-WALLET-ADDRESS-HERE-1234567890",
  };

  function updateWalletAddress() {
    const selectedCoin = coinSelect?.value || "BTC";
    if (walletAddressInput) {
      walletAddressInput.value = walletMap[selectedCoin] || walletMap.BTC;
    }
  }

  updateWalletAddress();

  coinSelect?.addEventListener("change", updateWalletAddress);

  copyWalletBtn?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(walletAddressInput.value);
      showToast("Wallet address copied successfully.", "success");
    } catch (error) {
      showToast("Unable to copy wallet address.", "error");
    }
  });

  proofInput?.addEventListener("change", () => {
    const file = proofInput.files?.[0];
    proofText.textContent = file
      ? file.name
      : "Upload a clear payment screenshot or transaction proof for verification.";
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const selectedCoin = coinSelect?.value || "";
    const walletAddress = walletAddressInput?.value.trim() || "";
    const transactionId = transactionIdInput?.value.trim() || "";
    const proofFile = proofInput?.files?.[0];

    if (!selectedCoin) {
      showToast("Please select a coin.", "error");
      return;
    }

    if (!walletAddress) {
      showToast("Wallet address is missing.", "error");
      return;
    }

    if (!transactionId) {
      showToast("Please enter your transaction ID or payment hash.", "error");
      return;
    }

    if (!proofFile) {
      showToast("Please upload your payment proof.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("amount", "500");
    formData.append("coin", selectedCoin);
    formData.append("walletAddress", walletAddress);
    formData.append("transactionId", transactionId);
    formData.append("receipt", proofFile);

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    try {
      const response = await window.API.postForm("/payment/registration", formData);

      if (response?.data?.user?.kycStatus) {
        userInfo.kycStatus = response.data.user.kycStatus;
      } else {
        userInfo.kycStatus = "submitted";
      }

      localStorage.setItem("userInfo", JSON.stringify(userInfo));

      showToast(
        response.message ||
          "Payment receipt submitted successfully. Awaiting admin approval.",
        "success"
      );

      setTimeout(() => {
        window.location.href = getPageUrl("dashboard-pending.html");
      }, 1200);
    } catch (error) {
      showToast(
        error.message || "Unable to submit payment details right now.",
        "error"
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});