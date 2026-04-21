const routes = {
    '/': '#hero',
    '/nutrition': '#dashboard',
    '/restaurant-lab': '#restaurants',
    '/fitness-lab': '#fitness'
};

function navigateTo(path, pushState = true) {
    const sectionId = routes[path] || '#hero';
    const targets = document.querySelectorAll('section');
    
    // Hide all
    targets.forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
        s.style.opacity = '0';
    });
    
    // Show target
    const targetSection = document.querySelector(sectionId);
    if(targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        
        // Simple GSAP fade-in if loaded
        if (window.gsap) {
            gsap.to(targetSection, { opacity: 1, duration: 0.5 });
        } else {
            targetSection.style.opacity = '1';
        }
        
        window.scrollTo(0, 0);
        
        // Init logic for specific sections
        if (sectionId === '#hero' && typeof initStorytelling === 'function') {
            initStorytelling();
        }
        if (sectionId === '#restaurants' && typeof initRestaurantExplorer === 'function') {
            initRestaurantExplorer();
        }
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
});

window.addEventListener('popstate', (e) => {
    const path = e.state ? e.state.path : window.location.pathname;
    navigateTo(path, false);
});
