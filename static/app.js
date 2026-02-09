const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".auth-form");
const message = document.getElementById("auth-message");

const setActiveTab = (target) => {
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === target));
  panels.forEach((panel) => panel.classList.toggle("hidden", panel.dataset.panel !== target));
  if (message) message.textContent = "";
};

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setActiveTab(tab.dataset.tab));
});

const handleAuth = async (endpoint, payload) => {
  if (message) message.textContent = "Working...";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (data.success) {
    window.location.href = "/chat";
    return;
  }
  if (message) message.textContent = data.message || "Authentication failed.";
};

const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    handleAuth("/login", {
      username: document.getElementById("login-username").value.trim(),
      password: document.getElementById("login-password").value,
    });
  });
}

if (signupForm) {
  signupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    handleAuth("/register", {
      username: document.getElementById("signup-username").value.trim(),
      password: document.getElementById("signup-password").value,
    });
  });
}
