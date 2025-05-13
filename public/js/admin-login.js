document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.getElementById('adminLoginForm');
    const loginButton = document.querySelector('.login__button');
    const errorMessageElement = document.getElementById('adminLoginErrorMessage');

    adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
    });

    loginButton.addEventListener('click', () => handleAdminLogin());

    async function handleAdminLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/admin-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('adminToken', data.token);
                window.location.href = '/admin';
            } else {
                showErrorMessage(data.message || 'Admin login failed');
            }
        } catch (error) {
            console.error('Admin login error:', error);
            showErrorMessage('An error occurred during admin login');
        }
    }

    function showErrorMessage(message) {
        errorMessageElement.textContent = message;
        errorMessageElement.style.display = 'block';
        setTimeout(() => {
            errorMessageElement.style.display = 'none';
        }, 5000);
    }

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

    showHiddenPassword('password', 'input-icon');
});
