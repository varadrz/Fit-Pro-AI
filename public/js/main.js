const routes = {
    '/': '#hero',
    '/nutrition-lab': '#dashboard',
    '/restaurant-lab': '#restaurants',
    '/fitness-lab': '#fitness'
};

function navigateTo(path, pushState = true) {
    const sectionId = routes[path] || '#hero';
    const targets = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    // Define Home sections that should be visible together
    const homeSections = ['#hero', '#stats', '#features-highlights'];
    const isHome = path === '/';

    // Hide all
    targets.forEach(s => {
        const id = '#' + s.id;
        if (isHome && homeSections.includes(id)) {
            s.style.display = 'block';
            s.classList.add('active');
            s.style.opacity = '1';
        } else if (!isHome && id === sectionId) {
            s.style.display = 'block';
            s.classList.add('active');
        } else {
            s.classList.remove('active');
            s.style.display = 'none';
            s.style.opacity = '0';
        }
    });
    
    // Update Nav Active State
    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === path);
    });
    
    // Show target for animations
    const targetSection = document.querySelector(isHome ? '#hero' : sectionId);
    if(targetSection) {
        // Trigger Page Animation for entry
        if (window.animatePageTransition && !isHome) {
            window.animatePageTransition(targetSection);
        }
        
        window.scrollTo(0, 0);
        
        // Init logic
        if (isHome && typeof initAppleHome === 'function') {
            initAppleHome();
        }
        if (sectionId === '#restaurants' && typeof initRestaurantExplorer === 'function') {
            initRestaurantExplorer();
        }
        
        // Stop camera if leaving fitness lab
        if (sectionId !== '#fitness' && window.stopCamera) {
            window.stopCamera();
        }

        if (pushState) {
            window.history.pushState({ path }, "", path);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Intercept clicks
    document.querySelectorAll('a').forEach(link => {
        if (link.getAttribute('href').startsWith('/')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo(link.getAttribute('href'));
            });
        }
    });

    const currentPath = window.location.pathname;
    navigateTo(currentPath, true);
    
    if(window.initScrollReveals) {
        window.initScrollReveals();
    }
});

window.addEventListener('popstate', (e) => {
    const path = e.state ? e.state.path : window.location.pathname;
    navigateTo(path, false);
});
