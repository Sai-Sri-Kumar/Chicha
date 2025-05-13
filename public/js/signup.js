document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');
    const errorMessageElement = document.getElementById('signupErrorMessage');

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('http://localhost:3000/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, email, password }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Something went wrong');
                }
                
                const data = await response.json();

                if (response.ok) {
                    const loginResponse = await fetch('http://localhost:3000/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email, password }),
                    });

                    const loginData = await loginResponse.json();

                    if (loginResponse.ok) {
                        localStorage.setItem('token', loginData.token);
                        window.location.href = 'http://localhost:3000/chat';
                    } else {
                        throw new Error(loginData.message || 'Login failed after signup');
                    }
                } else {
                    throw new Error(data.message || 'Signup failed. Please try again.');
                }
            } catch (error) {
                console.error('Error:', error);
                showErrorMessage(error.message || 'An error occurred. Please try again.');
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            console.log(email, password)
            try {
                const response = await fetch('http://localhost:3000/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });
                console.log(response)
                console.log(response.status)
                console.log(response.statusText)
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || 'Something went wrong');
                }
                
                const data = await response.json();
                

                if (response.ok) {
                    alert('Login successful');
                    window.location.href = 'http://localhost:3000/chat';
                } else {
                    throw new Error(data.message || 'Login failed. Please try again.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert(error.message || 'An error occurred. Please try again.');
            }
        });
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
