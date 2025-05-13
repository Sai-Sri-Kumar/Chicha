document.addEventListener('DOMContentLoaded', function() {
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const emailInput = document.getElementById('email');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const newPasswordEye = document.getElementById('newPasswordEye');
    const confirmPasswordEye = document.getElementById('confirmPasswordEye');

    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = emailInput.value;
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            if (newPassword !== confirmPassword) {
                alert('Passwords do not match. Please try again.');
                return;
            }

            try {
                const response = await fetch('/reset-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, newPassword }),
                });

                if (response.ok) {
                    alert('Password reset successful! You can now log in with your new password.');
                    window.location.href = '/login';
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to reset password');
                }
            } catch (error) {
                console.error('Error resetting password:', error);
                alert(error.message || 'An error occurred while resetting your password. Please try again.');
            }
        });
    }

    function togglePasswordVisibility(inputElement, eyeIcon) {
        if (inputElement.type === 'password') {
            inputElement.type = 'text';
            eyeIcon.classList.remove('ri-eye-off-line');
            eyeIcon.classList.add('ri-eye-line');
        } else {
            inputElement.type = 'password';
            eyeIcon.classList.remove('ri-eye-line');
            eyeIcon.classList.add('ri-eye-off-line');
        }
    }

    if (newPasswordEye) {
        newPasswordEye.addEventListener('click', () => togglePasswordVisibility(newPasswordInput, newPasswordEye));
    }

    if (confirmPasswordEye) {
        confirmPasswordEye.addEventListener('click', () => togglePasswordVisibility(confirmPasswordInput, confirmPasswordEye));
    }
});