const routes = {
    '/': '#hero',
    '/nutrition': '#dashboard',
    '/restaurant-lab': '#restaurants',
    '/fitness-lab': '#fitness'
};

function navigateTo(path, pushState = true) {
    const sectionId = routes[path] || '#hero';
    const targets = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    // Hide all
    targets.forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
        s.style.opacity = '0';
    });
    
    // Update Nav Active State
    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === path);
    });
    
    // Show target
    const targetSection = document.querySelector(sectionId);
    if(targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        
        // Trigger Page Animation
        if (window.animatePageTransition) {
            window.animatePageTransition(targetSection);
        } else {
            targetSection.style.opacity = '1';
        }
        
        window.scrollTo(0, 0);
        
        // Init logic for specific sections
        if (sectionId === '#hero' && typeof initAppleHome === 'function') {
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
