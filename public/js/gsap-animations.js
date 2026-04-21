let storytellingInitialized = false;

function initStorytelling() {
    if (storytellingInitialized || !window.gsap || !window.ScrollTrigger) return;
    storytellingInitialized = true;
    gsap.registerPlugin(ScrollTrigger);

    const container = document.querySelector('.story-scroll-container');
    const sections = gsap.utils.toArray('.story-section');
    
    if (!container || sections.length === 0) return;

    // Pin the container
    ScrollTrigger.create({
        trigger: container,
        start: 'top top',
        end: `+=${sections.length * 100}%`,
        pin: true,
        scrub: 1
    });

    sections.forEach((section, i) => {
        const content = section.querySelector('.story-content');
        
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: container,
                start: `top+=${i * window.innerHeight} top`,
                end: `+=${window.innerHeight}`,
                scrub: 1
            }
        });

        // First section begins shown
        if (i === 0) {
            tl.to(content, { opacity: 0, y: -50, scale: 0.9, duration: 1 });
        } else {
            // Entrance
            tl.fromTo(content, 
                { opacity: 0, y: 50, scale: 0.8 }, 
                { opacity: 1, y: 0, scale: 1, duration: 1 }
            );
            
            // Exit if not last
            if (i < sections.length - 1) {
                tl.to(content, { opacity: 0, y: -50, scale: 1.1, duration: 1 }, "+=0.5");
            }
        }
    });
}
