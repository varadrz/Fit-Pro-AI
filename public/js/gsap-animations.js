gsap.registerPlugin(ScrollTrigger);

function initAppleHome() {
    const blocks = gsap.utils.toArray('.feature-block');
    
    // Hero reveal sequence
    const heroTl = gsap.timeline();
    heroTl.from('.hero-apple h1', { 
        y: 100, 
        opacity: 0, 
        duration: 2, 
        ease: "expo.out" 
    })
    .from('.hero-apple p', { 
        y: 20, 
        opacity: 0, 
        duration: 1.5, 
        ease: "power2.out" 
    }, "-=1.2")
    .from('.hero-apple .btn', { 
        y: 20, 
        opacity: 0, 
        duration: 1, 
        stagger: 0.2, 
        ease: "power3.out" 
    }, "-=1");

    // Parallax scaling for hero background
    gsap.to('.pinned-bg', {
        scrollTrigger: {
            trigger: '#hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true
        },
        scale: 1.3,
        y: 200,
        opacity: 0.3
    });

    // Advanced Feature Block reveals with Parallax
    blocks.forEach(block => {
        const info = block.querySelector('.feature-info');
        const img = block.querySelector('.feature-image-wrap');
        
        gsap.from(info, {
            scrollTrigger: {
                trigger: block,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            opacity: 0,
            x: -100,
            duration: 1.5,
            ease: "expo.out"
        });

        gsap.from(img, {
            scrollTrigger: {
                trigger: block,
                start: 'top 80%',
                scrub: 1
            },
            scale: 0.8,
            rotationY: 15,
            y: 50,
            ease: "none"
        });
    });
}

function animatePageTransition(target) {
    gsap.fromTo(target, 
        { opacity: 0 }, 
        { opacity: 1, duration: 1, ease: "power2.inOut" }
    );
    
    // More subtle entrance for internal cards
    const cards = target.querySelectorAll('.card');
    if(cards.length > 0) {
        gsap.fromTo(cards, 
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "power3.out", delay: 0.2 }
        );
    }
}

function initScrollReveals() {
    const revealItems = document.querySelectorAll('.card, .section-title');
    revealItems.forEach(item => {
        gsap.from(item, {
            scrollTrigger: {
                trigger: item,
                start: "top 90%",
            },
            opacity: 0,
            y: 30,
            duration: 1.2,
            ease: "power2.out"
        });
    });
}

window.initAppleHome = initAppleHome;
window.animatePageTransition = animatePageTransition;
window.initScrollReveals = initScrollReveals;
