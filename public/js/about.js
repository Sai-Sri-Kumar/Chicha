document.addEventListener('DOMContentLoaded', function() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('particles-bg').appendChild(renderer.domElement);

    const particles = new THREE.BufferGeometry();
    const particleCount = 5000;

    const posArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 5;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const material = new THREE.PointsMaterial({
        size: 0.005,
        color: 0x00ffff
    });

    const particlesMesh = new THREE.Points(particles, material);
    scene.add(particlesMesh);

    camera.position.z = 2;

    function animate() {
        requestAnimationFrame(animate);
        particlesMesh.rotation.x += 0.0005;
        particlesMesh.rotation.y += 0.0005;
        renderer.render(scene, camera);
    }
    animate();
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
    const modal = document.getElementById("faq-modal");
    const btn = document.getElementById("faq-link");
    const span = document.getElementsByClassName("close")[0];
    const faqContent = document.getElementById("faq-content");

    btn.onclick = function() {
        modal.style.display = "block";
        loadFAQContent();
    }

    span.onclick = function() {
        modal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    function loadFAQContent() {
        const faqs = [
            {
                question: "What is Chicha?",
                answer: "Chicha is an AI-powered chat application that uses advanced natural language processing and machine learning to provide human-like conversations and assistance."
            },
            {
                question: "How does Chicha work?",
                answer: "Chicha uses a combination of natural language processing, GPT models, and machine learning algorithms to understand user input, generate relevant responses, and continuously improve its performance."
            },
            {
                question: "Is my data safe with Chicha?",
                answer: "Yes, we take data privacy and security very seriously. All user data is encrypted and stored securely. We do not share personal information with third parties."
            },
            {
                question: "Can Chicha learn and improve over time?",
                answer: "Absolutely! Chicha uses machine learning algorithms to continuously learn from interactions and improve its responses and capabilities over time."
            }
        ];

        let faqHTML = "";
        faqs.forEach(faq => {
            faqHTML += `
                <div class="faq-item">
                    <h3>${faq.question}</h3>
                    <p>${faq.answer}</p>
                </div>
            `;
        });

        faqContent.innerHTML = faqHTML;
    }
    const sections = document.querySelectorAll('section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, { threshold: 0.1 });

    sections.forEach(section => {
        observer.observe(section);
    });
    const featureIcons = document.querySelectorAll('.feature-icon');
    featureIcons.forEach(icon => {
        icon.addEventListener('mouseover', () => {
            icon.style.transform = 'scale(1.2) rotate(10deg)';
        });
        icon.addEventListener('mouseout', () => {
            icon.style.transform = 'scale(1) rotate(0deg)';
        });
    });
    const glitchTexts = document.querySelectorAll('.glitch');
    glitchTexts.forEach(text => {
        const content = text.textContent;
        text.innerHTML = `
            <span aria-hidden="true">${content}</span>
            ${content}
            <span aria-hidden="true">${content}</span>
        `;
    });
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 100,
                    behavior: 'smooth'
                });
            }
        });
    });
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            const scrollPosition = window.pageYOffset;
            const sectionSpeed = section.dataset.speed || 0.5;
            section.style.backgroundPositionY = `${scrollPosition * sectionSpeed}px`;
        });
    });
    const glitchText = document.querySelector('.glitch');
    setInterval(() => {
        const glitchDuration = 200 + Math.random() * 100;
        glitchText.style.animation = `glitch ${glitchDuration}ms infinite`;
        setTimeout(() => {
            glitchText.style.animation = '';
        }, glitchDuration);
    }, 3000);
    document.querySelector('.hero-cta').addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
    function animateTechLines() {
        const techCategories = document.querySelectorAll('.tech-category');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const line = entry.target.querySelector('.tech-line');
                    const content = entry.target.querySelector('.tech-content');
                    setTimeout(() => {
                        line.style.height = `${content.offsetHeight - 60}px`;
                    }, 100);
                }
            });
        }, { threshold: 0.2 });

        techCategories.forEach(category => {
            observer.observe(category);
        });
    }
    window.addEventListener('scroll', function () {
        const techLines = document.querySelectorAll('.tech-line');
        const screenHeight = window.innerHeight;
    
        techLines.forEach(line => {
            const lineTop = line.getBoundingClientRect().top;
            
            if (lineTop < screenHeight - 100) {
                line.style.width = '100%';
            } else {
                line.style.width = '0';
            }
        });
    });
    document.addEventListener('DOMContentLoaded', function() {
        animateTechLines();
        window.addEventListener('resize', animateTechLines);
    });

    function animateTechStack() {
        const techItems = document.querySelectorAll('.tech-item');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.2 });

        techItems.forEach(item => {
            observer.observe(item);
        });
    }
    document.addEventListener('DOMContentLoaded', function() {
        animateTechStack();
    });
});
