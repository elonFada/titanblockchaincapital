document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const userInfoRaw = localStorage.getItem("userInfo");
  const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;

  if (!token || !userInfo) {
    window.location.href = "/login.html";
    return;
  }

  if (!userInfo.isVerified) {
    window.location.href = "/otp.html";
    return;
  }

  if (userInfo.kycStatus !== "submitted" && userInfo.kycStatus !== "verified") {
    window.location.href = "/registration-fee.html";
    return;
  }
});