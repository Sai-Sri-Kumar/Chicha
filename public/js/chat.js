document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const userDisplay = document.getElementById('userDisplay');
    const loginButton = document.getElementById('loginButton');
    const signupButton = document.getElementById('signupButton');
    const logoutButton = document.getElementById('logoutButton');

    function updateAuthUI(isLoggedIn, username = '') {
        if (isLoggedIn) {
            userDisplay.textContent = `Welcome, ${username}`;
            userDisplay.style.display = 'inline';
            loginButton.style.display = 'none';
            signupButton.style.display = 'none';
            logoutButton.style.display = 'inline-block';
        } else {
            userDisplay.style.display = 'none';
            loginButton.style.display = 'inline-block';
            signupButton.style.display = 'inline-block';
            logoutButton.style.display = 'none';
        }
    }

    if (token) {
        console.log('Fetching user data...');
        fetch('/api/user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.username) {
                updateAuthUI(true, data.username);
            } else {
                localStorage.removeItem('token');
                updateAuthUI(false);
                window.location.href = '/login';
            }
        })
        .catch(error => {
            console.error('Error fetching user data:', error);
            localStorage.removeItem('token');
            updateAuthUI(false);
            window.location.href = '/login';
        });
    } else {
        updateAuthUI(false);
    }

    const ws = new WebSocket('ws://localhost:3000');
    let currentSessionId = null;
    let currentSessionName = 'New Chat';

    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const speechButton = document.getElementById('speechButton');
    const newChatButton = document.getElementById('newChatButton');
    const sessionList = document.getElementById('sessionList');
    const plusButton = document.querySelector('.icon-btn img[alt="New Chat"]').parentElement;

    ws.onopen = () => {
        console.log('WebSocket connection established');
        const token = localStorage.getItem('token');
        if (token) {
            ws.send(JSON.stringify({ type: 'auth', token }));
        } else {
            console.error('No token found in localStorage');
            alert('You are not authenticated. Please log in.');
        }
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'auth') {
            if (data.success) {
                loadSessions();
            } else {
                console.error('Authentication failed:', data.error);
                alert('Authentication failed. Please log in again.');
            }
        } else if (data.type === 'message') {
            displayMessage(data.content, 'bot');
            currentSessionId = data.sessionId;
            if (data.sessionName) {
                currentSessionName = data.sessionName;
                updateSessionName();
            }
        } else if (data.type === 'error') {
            console.error('Error:', data.content);
            displayMessage(`Error: ${data.content}`, 'error');
        } else if (data.type === 'new_session') {
            currentSessionId = data.sessionId;
            currentSessionName = data.sessionName;
            updateSessionName();
            chatMessages.innerHTML = '';
            loadSessions();
        } else if (data.type === 'load_session') {
            currentSessionId = data.session._id;
            currentSessionName = data.session.name || 'Unnamed Chat';
            updateSessionName();
            chatMessages.innerHTML = '';
            data.session.messages.forEach(msg => {
                displayMessage(msg.content, msg.sender);
            });
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        alert('WebSocket error. Please try reconnecting.');
    };

    ws.onclose = () => {
        console.log('WebSocket connection closed');
        alert('Disconnected from the server. Please refresh the page to reconnect.');
    };

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
            scrollToBottom();
        }
    });

    let recognition;
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            userInput.value = transcript;
            sendMessage();
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            alert('Speech recognition error. Please try again.');
        };
    } else {
        speechButton.style.display = 'none';
        console.log('Speech recognition not supported');
    }

    speechButton.addEventListener('click', () => {
        if (recognition) {
            if (speechButton.classList.contains('active')) {
                recognition.stop();
                speechButton.classList.remove('active');
            } else {
                recognition.start();
                speechButton.classList.add('active');
            }
        }
    });

    function sendMessage() {
        const message = userInput.value.trim();
        if (message) {
            sendButton.disabled = true;
            const token = localStorage.getItem('token');
            if (message.toLowerCase().startsWith('open ')) {
                const appName = message.slice(5).trim();
                sendOpenCommand(appName);
            } else {
                ws.send(JSON.stringify({ type: 'message', content: message, token, sessionId: currentSessionId }));
            }
            displayMessage(message, 'user');
            userInput.value = '';
            sendButton.disabled = false;
            scrollToBottom();
        }
    }

    function displayMessage(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        messageElement.textContent = message;
        if (sender === 'error') {
            messageElement.style.color = 'red';
        } else if (sender === 'system') {
            messageElement.style.color = 'green';
        }
        chatMessages.appendChild(messageElement);
        
        if (sender === 'bot') {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    window.sendMessage = sendMessage;

    function logout() {
        localStorage.removeItem('token');
        updateAuthUI(false);
        window.location.href = '/';
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }

    window.logout = logout;

    const sidebar = document.getElementById('sidebar');
    const toggleSidebarButton = document.getElementById('toggleSidebar');
    const mainContent = document.querySelector('.main-content');

    function toggleSidebar() {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
    }

    toggleSidebarButton.addEventListener('click', toggleSidebar);

    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    function sendOpenCommand(appName) {
        const token = localStorage.getItem('token');
        ws.send(JSON.stringify({ type: 'open', content: appName, token }));
        displayMessage(`Attempting to open ${appName}...`, 'system');
        
        setTimeout(() => {
            const lastMessage = chatMessages.lastElementChild;
            if (lastMessage && lastMessage.textContent === `Attempting to open ${appName}...`) {
                displayMessage(`Unable to open ${appName}.`);
            }
        }, 7000);
    }

    function updateSessionName() {
        const sessionNameElement = document.getElementById('sessionName');
        if (sessionNameElement) {
            sessionNameElement.textContent = currentSessionName;
        }
    }

    function loadSessions() {
        fetch('/api/user/sessions', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => response.json())
        .then(sessions => {
            sessionList.innerHTML = '';
            sessions.forEach((session, index) => {
                const button = document.createElement('button');
                button.className = 'session-button';
                button.textContent = `Chat ${index + 1}`;
                button.addEventListener('click', () => loadSession(session._id));
                sessionList.appendChild(button);
            });

            if (sessions.length > 0) {
                // Load the first session if no current session is set
                if (!currentSessionId) {
                    loadSession(sessions[0]._id);
                }
            } else {
                // Only create a new session if there are no existing sessions
                // Ensure that we do not create a new session on refresh
                if (currentSessionId === null) {
                    createNewSession();
                }
            }
        })
        .catch(error => {
            console.error('Error loading sessions:', error);
            displayMessage('Error loading sessions. Please try again.', 'error');
        });
    }

    function loadSession(sessionId) {
        ws.send(JSON.stringify({ type: 'load_session', sessionId: sessionId }));
    }

    function createNewSession() {
        // Only create a new session if currentSessionId is null
        if (currentSessionId === null) {
            ws.send(JSON.stringify({ type: 'new_session' }));
            chatMessages.innerHTML = '';
            userInput.value = '';
            currentSessionName = 'New Chat';
            updateSessionName();
        }
    }

    newChatButton.addEventListener('click', createNewSession);
    plusButton.addEventListener('click', createNewSession);

    if (token) {
        loadSessions();
    }
});
