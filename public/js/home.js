document.addEventListener('DOMContentLoaded', function() {
    const starfield = document.getElementById('starfield');
    const stars = 800;
    function createStar() {
        const star = document.createElement('div');
        star.classList.add('star');
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDuration = `${Math.random() * 3 + 2}s`;
        star.style.animationDelay = `${Math.random() * 3}s`; 
        const size = Math.random() * 2 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;       
        return star;
    }
    function initStarfield() {
        for (let i = 0; i < stars; i++) {
            starfield.appendChild(createStar());
        }
    }
    function createShootingStar() {
        const shootingStar = document.createElement('div');
        shootingStar.classList.add('shooting-star');
        shootingStar.style.left = `${Math.random() * 100}%`;
        shootingStar.style.top = `${Math.random() * 100}%`;
        starfield.appendChild(shootingStar);
        setTimeout(() => {
            shootingStar.remove();
        }, 1000);
    }
    initStarfield();
    setInterval(createShootingStar, 3000);

    console.log('Starfield initialized');
});