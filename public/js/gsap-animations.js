gsap.registerPlugin(ScrollTrigger);

function initAppleHome() {
    const blocks = gsap.utils.toArray('.feature-block');
    
    // Hero scaling on scroll
    gsap.to('.hero-apple', {
        scrollTrigger: {
            trigger: '.hero-apple',
            start: 'top top',
            end: 'bottom top',
            scrub: true
        },
        scale: 0.9,
        opacity: 0,
        filter: 'blur(10px)'
    });

    // Feature block reveals
    blocks.forEach(block => {
        const info = block.querySelector('.feature-info');
        const img = block.querySelector('.feature-image-wrap');
        
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: block,
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play reverse play reverse'
            }
        });

        tl.from(info, { opacity: 0, y: 50, duration: 1, ease: "power3.out" })
          .from(img, { opacity: 0, scale: 0.8, y: 100, duration: 1.5, ease: "power4.out" }, "-=0.7");
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
