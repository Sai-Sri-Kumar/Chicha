document.addEventListener('DOMContentLoaded', function() {
    initParticles();
    initTypingEffect();
});

function initParticles() {
    particlesJS('particles-js', {
        particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: "#ffffff" },
            shape: { type: "circle" },
            opacity: { value: 0.5, random: false },
            size: { value: 3, random: true },
            line_linked: { enable: true, distance: 150, color: "#ffffff", opacity: 0.4, width: 1 },
            move: { enable: true, speed: 6, direction: "none", random: false, straight: false, out_mode: "out", bounce: false }
        },
        interactivity: {
            detect_on: "canvas",
            events: { onhover: { enable: true, mode: "repulse" }, onclick: { enable: true, mode: "push" }, resize: true },
            modes: { repulse: { distance: 100, duration: 0.4 }, push: { particles_nb: 4 } }
        },
        retina_detect: true
    });
}

const futuristicText = document.querySelector('.futuristic-text');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.5 });

observer.observe(futuristicText);

function initTypingEffect() {
    const demoElement = document.getElementById('demo');
    if (demoElement) {
        const texts = ["Developer", "Designer"];
        let textIndex = 0;
        let charIndex = 0;

        function typeText() {
            if (charIndex < texts[textIndex].length) {
                demoElement.innerHTML += texts[textIndex].charAt(charIndex);
                charIndex++;
                setTimeout(typeText, 150);
            } else {
                setTimeout(eraseText, 2000);
            }
        }

        function eraseText() {
            if (charIndex > 0) {
                demoElement.innerHTML = texts[textIndex].substring(0, charIndex - 1);
                charIndex--;
                setTimeout(eraseText, 50);
            } else {
                textIndex = (textIndex + 1) % texts.length;
                setTimeout(typeText, 500);
            }
        }

        typeText();
    }
}

document.getElementById('learnMoreButton').addEventListener('click', function(event) {
    event.preventDefault();
    const targetSection = document.getElementById('project-overview');
    targetSection.scrollIntoView({ behavior: 'smooth' });
});