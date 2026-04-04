document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("forgotPasswordForm");
  const emailInput = document.getElementById("forgotEmail");
  const submitBtn = document.getElementById("forgotPasswordSubmitBtn");

  function getPageUrl(page) {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    return isLocal ? `/frontend/${page}` : `/${page}`;
  }

  function storeResetState(email, resetToken) {
    sessionStorage.setItem("resetPasswordEmail", email);
    sessionStorage.setItem("resetPasswordToken", resetToken);
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput?.value.trim().toLowerCase() || "";
    if (!email) {
      showToast("Please enter your email address.", "error");
      return;
    }

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    try {
      const response = await window.API.post("/user/forgot-password", { email });

      storeResetState(
        response?.email || email,
        response?.resetToken
      );

      showToast(
        response?.message || "Password reset code sent to your email.",
        "success"
      );

      setTimeout(() => {
        window.location.href = getPageUrl("forgot-password-otp.html");
      }, 1000);
    } catch (error) {
      showToast(error.message || "Failed to send reset code.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});