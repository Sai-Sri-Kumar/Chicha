document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.querySelector('.contact__form');

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const firstName = document.getElementById('firstname').value;
        const lastName = document.getElementById('lastname').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;

        try {
            const response = await fetch('http://localhost:3000/send-contact-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ firstName, lastName, email, message }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();
            console.log('Server response:', data);

            alert('Your message has been sent successfully!');
            contactForm.reset();
        } catch (error) {
            console.error('Detailed error:', error);
            alert(`Failed to send message. Error: ${error.message}`);
        }
    });
});
