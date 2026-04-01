document.addEventListener("DOMContentLoaded", () => {
  const chatUsersList = document.getElementById("chatUsersList");
  const chatSearchInput = document.getElementById("chatSearchInput");
  const activeChatUserName = document.getElementById("activeChatUserName");
  const activeChatUserMeta = document.getElementById("activeChatUserMeta");
  const adminChatMessages = document.getElementById("adminChatMessages");
  const adminReplyForm = document.getElementById("adminReplyForm");
  const adminReplyInput = document.getElementById("adminReplyInput");
  const adminAttachmentLabel = document.getElementById("adminAttachmentLabel");

  let chats = [];
  let activeChatId = null;
  let pollInterval = null;
  let selectedAttachment = null;

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

  function guardAdmin() {
    const token = localStorage.getItem("admin_token");
    const adminInfo = localStorage.getItem("adminInfo");

    if (!token || !adminInfo) {
      clearAdminSession();
      window.location.href = getPageUrl("admin-login.html");
      return false;
    }

    return true;
  }

  function formatTime(dateString) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString([], {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function renderChats(list) {
    if (!chatUsersList) return;

    chatUsersList.innerHTML = "";

    if (!list.length) {
      chatUsersList.innerHTML = `
        <div class="glass-card rounded-2xl p-4 text-slate-400 text-sm">
          No chats found.
        </div>
      `;
      return;
    }

    list.forEach((chat) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = `w-full text-left glass-card rounded-2xl p-4 border ${
        activeChatId === chat.id ? "border-primary" : "border-white/10"
      }`;

      item.innerHTML = `
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-white font-bold truncate">${chat.user?.fullName || "Unknown User"}</p>
            <p class="text-slate-400 text-sm truncate mt-1">${chat.user?.email || ""}</p>
            <p class="text-slate-500 text-xs truncate mt-2">${chat.lastMessageText || "No messages yet"}</p>
          </div>
          ${
            chat.unreadCount > 0
              ? `<span class="px-2 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold">${chat.unreadCount}</span>`
              : ""
          }
        </div>
      `;

      item.addEventListener("click", () => openChat(chat.id));
      chatUsersList.appendChild(item);
    });
  }

  function renderMessages(messages) {
    if (!adminChatMessages) return;

    adminChatMessages.innerHTML = "";

    messages.forEach((msg) => {
      const isAdmin = msg.senderType === "admin";

      const row = document.createElement("div");
      row.className = isAdmin
        ? "flex items-start justify-end gap-3"
        : "flex items-start gap-3";

      if (isAdmin) {
        row.innerHTML = `
          <div class="max-w-[80%]">
            <div class="rounded-2xl rounded-tr-md bg-primary text-black px-4 py-3">
              ${msg.text ? `<p class="text-sm font-medium leading-6">${msg.text}</p>` : ""}
              ${
                msg.attachmentUrl
                  ? `<a href="${msg.attachmentUrl}" target="_blank" class="inline-block mt-2 underline text-sm break-all">${msg.attachmentName || "View attachment"}</a>`
                  : ""
              }
            </div>
            <p class="text-slate-500 text-[11px] mt-1 text-right mr-1">
              Admin • ${formatTime(msg.createdAt)}
            </p>
          </div>
        `;
      } else {
        row.innerHTML = `
          <div class="max-w-[80%]">
            <div class="rounded-2xl rounded-tl-md bg-white/8 border border-white/10 px-4 py-3">
              ${msg.text ? `<p class="text-white text-sm leading-6">${msg.text}</p>` : ""}
              ${
                msg.attachmentUrl
                  ? `<a href="${msg.attachmentUrl}" target="_blank" class="inline-block mt-2 text-primary underline text-sm break-all">${msg.attachmentName || "View attachment"}</a>`
                  : ""
              }
            </div>
            <p class="text-slate-500 text-[11px] mt-1 ml-1">
              ${msg.senderType === "system" ? "Support" : "User"} • ${formatTime(msg.createdAt)}
            </p>
          </div>
        `;
      }

      adminChatMessages.appendChild(row);
    });

    adminChatMessages.scrollTop = adminChatMessages.scrollHeight;
  }

  async function loadChats() {
    try {
      const response = await window.API.get("/support-chat/admin/all");
      chats = response?.data || [];

      const q = chatSearchInput?.value.trim().toLowerCase() || "";
      const filtered = q
        ? chats.filter((chat) => {
            const name = chat.user?.fullName?.toLowerCase() || "";
            const email = chat.user?.email?.toLowerCase() || "";
            return name.includes(q) || email.includes(q);
          })
        : chats;

      renderChats(filtered);
    } catch (error) {
      showToast(error.message || "Unable to load chats.", "error");
    }
  }

  async function openChat(chatId) {
    activeChatId = chatId;
    await loadChats();

    try {
      const response = await window.API.get(`/support-chat/admin/${chatId}`);
      const chat = response?.data;

      activeChatUserName.textContent = chat.user?.fullName || "Unknown User";
      activeChatUserMeta.textContent = chat.user?.email || "";
      renderMessages(chat.messages || []);
    } catch (error) {
      showToast(error.message || "Unable to load conversation.", "error");
    }
  }

  async function sendReply() {
    if (!activeChatId) {
      showToast("Select a user conversation first.", "error");
      return;
    }

    const text = adminReplyInput?.value.trim() || "";

    if (!text && !selectedAttachment) {
      showToast("Type a reply or attach a file.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("text", text);

    if (selectedAttachment) {
      formData.append("attachment", selectedAttachment);
    }

    try {
      await window.API.postForm(`/support-chat/admin/${activeChatId}/reply`, formData);

      adminReplyInput.value = "";
      selectedAttachment = null;

      const attachmentInput = document.getElementById("adminAttachmentInput");
      if (attachmentInput) attachmentInput.value = "";

      adminAttachmentLabel.innerHTML = `
        <i data-lucide="paperclip" class="w-4 h-4"></i>
        Attach file
      `;
      lucide.createIcons();

      await openChat(activeChatId);
      await loadChats();
    } catch (error) {
      showToast(error.message || "Unable to send reply.", "error");
    }
  }

  function setupAttachment() {
    const input = document.createElement("input");
    input.type = "file";
    input.id = "adminAttachmentInput";
    input.className = "hidden";
    input.accept = ".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx";
    document.body.appendChild(input);

    adminAttachmentLabel.addEventListener("click", () => input.click());

    input.addEventListener("change", () => {
      const file = input.files?.[0] || null;
      selectedAttachment = file;

      adminAttachmentLabel.innerHTML = file
        ? `<i data-lucide="paperclip" class="w-4 h-4"></i>${file.name}`
        : `<i data-lucide="paperclip" class="w-4 h-4"></i>Attach file`;

      lucide.createIcons();
    });
  }

  function startPolling() {
    stopPolling();
    pollInterval = setInterval(async () => {
      await loadChats();
      if (activeChatId) {
        await openChat(activeChatId);
      }
    }, 5000);
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  if (!guardAdmin()) return;

  setupAttachment();

  chatSearchInput?.addEventListener("input", loadChats);

  adminReplyForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    await sendReply();
  });

  loadChats();
  startPolling();
});