document.addEventListener("DOMContentLoaded", () => {
    const chatForm = document.getElementById("chat-form");
    const userInput = document.getElementById("user-input");
    const chatBox = document.getElementById("chat-box");
    
    // Auth Elements
    const authContainer = document.getElementById("auth-container");
    const chatContainer = document.getElementById("chat-container");
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");
    const showSignup = document.getElementById("show-signup");
    const showLogin = document.getElementById("show-login");
    const logoutBtn = document.getElementById("logout-btn");

    // History Elements
    const historyBtn = document.getElementById("view-history-btn");
    const historyModal = document.getElementById("history-modal");
    const closeModal = document.querySelector(".close-modal");
    const historyList = document.getElementById("history-list");

    // ------------------------------------------------------
    // Mobile Responsiveness Logic (Injected via JS)
    // ------------------------------------------------------
    
    // 1. Ensure Viewport Meta Tag exists for mobile scaling
    if (!document.querySelector('meta[name="viewport"]')) {
        const meta = document.createElement('meta');
        meta.name = "viewport";
        meta.content = "width=device-width, initial-scale=1.0";
        document.head.appendChild(meta);
    }

    // 2. Inject Responsive CSS
    const mobileStyle = document.createElement('style');
    mobileStyle.innerHTML = `
        @media screen and (max-width: 768px) {
            #chat-container, #auth-container {
                width: 95% !important;
                margin: 10px auto !important;
                padding: 15px !important;
            }
            #chat-box {
                height: 55vh !important;
            }
            input, button {
                width: 100%;
                box-sizing: border-box;
                font-size: 16px !important; /* Prevent iOS zoom on focus */
                padding: 12px !important;
                margin-bottom: 10px;
            }
            #chat-form {
                display: flex;
                flex-direction: column;
            }
            .modal-content {
                width: 90% !important;
            }
        }
    `;
    document.head.appendChild(mobileStyle);

    // Check Auth Status on Load
    checkAuth();

    async function checkAuth() {
        const res = await fetch("/check_auth");
        const data = await res.json();
        if (data.authenticated) {
            showChat();
        } else {
            showAuth();
        }
    }

    function showChat() {
        authContainer.classList.add("hidden");
        chatContainer.classList.remove("hidden");
    }

    function showAuth() {
        authContainer.classList.remove("hidden");
        chatContainer.classList.add("hidden");
    }

    // Auth Event Listeners
    showSignup.addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("login-form-container").style.display = "none";
        document.getElementById("signup-form-container").style.display = "block";
    });

    showLogin.addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("signup-form-container").style.display = "none";
        document.getElementById("login-form-container").style.display = "block";
    });

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        await handleAuth("/login", "login-username", "login-password");
    });

    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        await handleAuth("/register", "signup-username", "signup-password");
    });

    logoutBtn.addEventListener("click", async () => {
        await fetch("/logout", { method: "POST" });
        showAuth();
        chatBox.innerHTML = ''; // Clear current chat session
    });

    async function handleAuth(endpoint, userField, passField) {
        const username = document.getElementById(userField).value;
        const password = document.getElementById(passField).value;

        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (data.success) {
            showChat();
        } else {
            alert(data.message || "Authentication failed");
        }
    }

    // History Logic
    historyBtn.addEventListener("click", async () => {
        const res = await fetch("/history");
        const data = await res.json();
        historyList.innerHTML = data.map(item => 
            `<div class="history-item"><strong>${item.topic}:</strong> ${item.message} <br><small>${new Date(item.time).toLocaleString()}</small></div>`
        ).join("");
        historyModal.classList.remove("hidden");
    });

    closeModal.addEventListener("click", () => {
        historyModal.classList.add("hidden");
    });

    chatForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const messageText = userInput.value.trim();
        if (!messageText) {
            return;
        }

        // Display user message
        appendMessage(messageText, "user");
        userInput.value = "";

        try {
            // Send message to backend
            const response = await fetch("/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: messageText }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const botReply = data.reply;

            // Display bot reply
            appendMessage(botReply, "bot");

        } catch (error) {
            console.error("Error communicating with chatbot:", error);
            appendMessage("Sorry, something went wrong. Please try again.", "bot");
        }
    });

    function appendMessage(text, sender) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", `${sender}-message`);
        messageDiv.innerHTML = `<p>${text}</p>`;
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to bottom
    }

    // --- Google-like search integration ---
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const openChatBtn = document.getElementById('open-chat');
    const feelingCurious = document.getElementById('feeling-curious');

    if (openChatBtn) {
        openChatBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Show chat UI (if authenticated it will show chat; otherwise auth will appear)
            checkAuth();
        });
    }

    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const q = searchInput.value.trim();
            if (!q) return;

            // Small search animation
            const card = document.querySelector('.g-search-card');
            if (card) { card.classList.add('search-active'); setTimeout(() => card.classList.remove('search-active'), 500); }

            // Ensure chat area is visible
            checkAuth();

            // Post to /chat and append both messages
            try {
                appendMessage(q, 'user');
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: q })
                });
                const data = await response.json();
                appendMessage(data.reply || 'No reply', 'bot');

                // After posting, smoothly show chat container
                const chat = document.getElementById('chat-container');
                if (chat) { chat.style.opacity = 0; chat.classList.remove('hidden'); setTimeout(() => { chat.style.transition = 'opacity 0.3s'; chat.style.opacity = 1; }, 20); }

            } catch (err) {
                console.error(err);
                appendMessage('Error: could not reach server', 'bot');
            }
        });
    }

    // keyboard shortcut: '/' to focus search input
    document.addEventListener('keydown', (e) => {
        if (e.key === '/') {
            if (searchInput) { searchInput.focus(); e.preventDefault(); }
        }
    });

    if (feelingCurious) {
        feelingCurious.addEventListener('click', async () => {
            // Use a random physics prompt
            const prompts = [
                'Calculate the range of a projectile launched at 60 m/s at 30 degrees',
                'What is the kinetic energy of a 10kg mass moving at 5m/s?',
                'Explain conservation of energy in simple terms',
                'How does drag affect projectile motion?'
            ];
            const pick = prompts[Math.floor(Math.random() * prompts.length)];
            if (searchInput) searchInput.value = pick;
            searchForm.dispatchEvent(new Event('submit'));
        });
    }

});