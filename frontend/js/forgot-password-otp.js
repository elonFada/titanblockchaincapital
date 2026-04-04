document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("verifyResetOtpForm");
  const otpInput = document.getElementById("resetOtpInput");
  const submitBtn = document.getElementById("verifyResetOtpSubmitBtn");

  function getPageUrl(page) {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    return isLocal ? `/frontend/${page}` : `/${page}`;
  }

  function getResetState() {
    return {
      email: sessionStorage.getItem("resetPasswordEmail") || "",
      resetToken: sessionStorage.getItem("resetPasswordToken") || "",
    };
  }

  function storeResetVerifiedState(email, resetSessionToken) {
    sessionStorage.setItem("resetPasswordEmail", email);
    sessionStorage.setItem("resetPasswordSessionToken", resetSessionToken);
  }

  const { email, resetToken } = getResetState();
  if (!email || !resetToken) {
    window.location.href = getPageUrl("forgot-password.html");
    return;
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const otp = otpInput?.value.trim() || "";
    if (!otp) {
      showToast("Please enter the reset code.", "error");
      return;
    }

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Verifying...";

    try {
      const response = await window.API.post("/user/forgot-password/verify", {
        email,
        otp,
        resetToken,
      });

      storeResetVerifiedState(
        response?.email || email,
        response?.resetSessionToken
      );

      showToast(
        response?.message || "Email verified successfully.",
        "success"
      );

      setTimeout(() => {
        window.location.href = getPageUrl("reset-password.html");
      }, 1000);
    } catch (error) {
      showToast(error.message || "Failed to verify reset code.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});