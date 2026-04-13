document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const submitBtn = document.getElementById("registerSubmitBtn");
  const fileInput = document.getElementById("profileInput");
  const fileText = document.getElementById("registerPhotoText");
  const referralCodeInput = document.getElementById("referralCode");

  if (!form) return;

  // Auto-fill referral code from URL: register.html?ref=ABC12345
  const params = new URLSearchParams(window.location.search);
  const referralFromUrl = params.get("ref");

  if (referralCodeInput && referralFromUrl) {
    referralCodeInput.value = referralFromUrl.trim().toUpperCase();
  }

  if (fileInput && fileText) {
    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      fileText.textContent = file
        ? file.name
        : "Upload a clear photo for human verification during registration review.";
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("fullName")?.value.trim();
    const phoneNumber = document.getElementById("phoneNumber")?.value.trim();
    const email = document.getElementById("email")?.value.trim().toLowerCase();
    const password =
      document.getElementById("registerPasswordInput")?.value || "";
    const confirmPassword =
      document.getElementById("registerConfirmPasswordInput")?.value || "";
    const countryCode = document.getElementById("countryCode")?.value || "+1";
    const referralCode =
      document.getElementById("referralCode")?.value.trim().toUpperCase() || "";
    const profile = fileInput?.files?.[0] || null;

    if (!fullName || !phoneNumber || !email || !password || !confirmPassword) {
      showToast("Please complete all required fields.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("phoneNumber", phoneNumber);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("confirmPassword", confirmPassword);
    formData.append("countryCode", countryCode);

    if (referralCode) {
      formData.append("referralCode", referralCode);
    }

    if (profile) {
      formData.append("profile", profile);
    }

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating account...";

    try {
      const res = await window.API.postForm("/user/register", formData);

      sessionStorage.setItem("pendingVerificationEmail", res.email || email);
      sessionStorage.setItem(
        "pendingVerificationToken",
        res.verificationToken || ""
      );
      sessionStorage.setItem(
        "pendingVerificationPhone",
        res.phoneNumber || phoneNumber
      );
      sessionStorage.setItem("pendingCountryCode", countryCode);

      if (res.referralCode) {
        sessionStorage.setItem("myReferralCode", res.referralCode);
      }

      if (res.referredBy) {
        sessionStorage.setItem("usedReferralCode", res.referredBy);
      }

      showToast(
        res.message || "Verification code sent to your email.",
        "success"
      );

      setTimeout(() => {
        window.location.href = "otp.html";
      }, 1000);
    } catch (error) {
      showToast(error.message || "Registration failed.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});