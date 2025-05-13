document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginButton = document.querySelector('.login__button');
    const errorMessageElement = document.getElementById('loginErrorMessage');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
    });

    loginButton.addEventListener('click', () => handleLogin('/login'));

    async function handleLogin(endpoint) {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                window.location.href = '/chat';
            } else {
                showErrorMessage(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            showErrorMessage('An error occurred during login');
        }
    }

    function showErrorMessage(message) {
        errorMessageElement.textContent = message;
        errorMessageElement.style.display = 'block';
        setTimeout(() => {
            errorMessageElement.style.display = 'none';
        }, 5000);
    }

    showHiddenPassword('password', 'input-icon');
    startTypingAnimation();
});

function showHiddenPassword(inputPassword, inputIcon) {
    const input = document.getElementById(inputPassword),
          iconEye = document.getElementById(inputIcon)
    
    if (iconEye) {
        iconEye.addEventListener('click', () => {
            if (input.type === 'password') {
                input.type = 'text'
                iconEye.classList.add('ri-eye-line')
                iconEye.classList.remove('ri-eye-off-line')
            } else {
                input.type = 'password'
                iconEye.classList.remove('ri-eye-line')
                iconEye.classList.add('ri-eye-off-line')
            }
        })
    }
}

function typeText(element, text, index, interval) {
    if (index < text.length) {
        element.textContent = text.substring(0, index + 1);
        setTimeout(() => typeText(element, text, index + 1, interval), interval);
    } else {
        setTimeout(() => eraseText(element, text, text.length, interval), 2000);
    }
}

function eraseText(element, text, index, interval) {
    if (index > 0) {
        element.textContent = text.substring(0, index - 1);
        setTimeout(() => eraseText(element, text, index - 1, interval), interval / 2);
    } else {
        setTimeout(() => typeText(element, text, 0, interval), 500);
    }
}

function startTypingAnimation() {
    const robotText = document.querySelector('.login__robot-text');
    if (robotText) {
        const text = robotText.textContent;
        robotText.textContent = '';
        typeText(robotText, text, 0, 100);
    }
}
