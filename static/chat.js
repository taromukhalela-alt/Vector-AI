const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const animationPrompt = document.getElementById("animation-prompt");
const animationLink = document.getElementById("animation-link");
const logoutBtn = document.getElementById("logout-btn");
const newSessionBtn = document.getElementById("new-session");

const appendMessage = (text, sender) => {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}-message`;
  messageDiv.innerHTML = `<p>${text}</p>`;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
};

const showAnimationPrompt = (question) => {
  if (!animationPrompt || !animationLink) return;
  animationLink.href = `/animations?q=${encodeURIComponent(question)}`;
  animationPrompt.classList.remove("hidden");
};

if (chatForm) {
  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = userInput.value.trim();
    if (!question) return;

    appendMessage(question, "user");
    userInput.value = "";
    if (animationPrompt) animationPrompt.classList.add("hidden");

    try {
      const response = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      });
      const data = await response.json();
      appendMessage(data.reply || "I need a moment to respond.", "bot");
      showAnimationPrompt(question);
    } catch (error) {
      appendMessage("Sorry, something went wrong. Try again.", "bot");
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await fetch("/logout", { method: "POST" });
    window.location.href = "/";
  });
}

if (newSessionBtn) {
  newSessionBtn.addEventListener("click", async () => {
    await fetch("/api/new_session", { method: "POST" });
    window.location.reload();
  });
}
