document.addEventListener('DOMContentLoaded', () => {
    const adminSignupForm = document.getElementById('adminSignupForm');
    const signupButton = document.querySelector('.login__button');
    const adminSignupErrorMessage = document.getElementById('adminSignupErrorMessage');

    adminSignupForm.addEventListener('submit', (e) => {
        e.preventDefault();
    });

    signupButton.addEventListener('click', () => handleAdminSignup());

    async function handleAdminSignup() {
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const adminCode = document.getElementById('adminCode').value;

        try {
            const response = await fetch('/admin-signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password, adminCode }),
            });

            const data = await response.json();

            if (response.ok) {
                adminSignupErrorMessage.textContent = 'Admin account created successfully';
                adminSignupErrorMessage.style.display = 'block';
                setTimeout(() => {
                    window.location.href = '/admin-login';
                }, 2000);
            } else {
                adminSignupErrorMessage.textContent = data.message || 'Admin signup failed';
                adminSignupErrorMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Admin signup error:', error);
            adminSignupErrorMessage.textContent = 'An error occurred during admin signup';
            adminSignupErrorMessage.style.display = 'block';
        }
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
