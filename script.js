document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. Hamburger Menü Logika (Fix: Fade Effect) ---
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-links li');
    const body = document.body;
    const mainHeader = document.getElementById('mainHeader');

    hamburger.addEventListener('click', () => {
        // Toggle Nav
        navLinks.classList.toggle('nav-active');
        hamburger.classList.toggle('active');
        
        // Görgetés tiltása ha a menü nyitva van
        if(navLinks.classList.contains('nav-active')){
            body.style.overflow = 'hidden';
        } else {
            body.style.overflow = '';
        }

        // Linkek animált megjelenése
        navItems.forEach((link, index) => {
            if (link.style.animation) {
                link.style.animation = '';
            } else {
                link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.2}s`;
            }
        });
    });

    // Menü bezárása kattintásra (overlay terület)
    navLinks.addEventListener('click', (e) => {
        // ha a user a menüre (nem egy linkre) kattint, zárjuk be
        if (e.target === navLinks || e.target.classList.contains('nav-cta') || e.target.closest('.mobile-cta')) {
            navLinks.classList.remove('nav-active');
            hamburger.classList.remove('active');
            body.style.overflow = '';
            navItems.forEach(link => link.style.animation = '');
        }
    });

    // --- Scrolled hatás a navigációra (a logót NEM homályosítjuk) ---
    function handleScrollHeader() {
        if (window.scrollY > 10) {
            mainHeader.classList.add('scrolled');
        } else {
            mainHeader.classList.remove('scrolled');
        }
    }
    handleScrollHeader();
    window.addEventListener('scroll', handleScrollHeader);


    // --- Banner Karusszel & SWIPE ---
    const slides = document.querySelectorAll('.banner-slide');
    const dots = document.querySelectorAll('.dot');
    const bannerContainer = document.querySelector('.banner-carousel');
    const prevBtn = document.querySelector('.prev-slide');
    const nextBtn = document.querySelector('.next-slide');
    
    let currentSlide = 0;
    let slideInterval;
    let isAnimating = false;

    function showSlide(index) {
        // Körkörös léptetés (instant class-based)
        if (index >= slides.length) index = 0;
        else if (index < 0) index = slides.length - 1;

        slides.forEach(slide => {
            slide.classList.remove('active');
            // reset inline styles if any
            slide.style.transition = '';
            slide.style.transform = '';
            slide.style.opacity = '';
            slide.style.zIndex = '';
            slide.style.visibility = '';
        });
        dots.forEach(dot => dot.classList.remove('active'));
        
        slides[index].classList.add('active');
        dots[index].classList.add('active');
        currentSlide = index;
    }

    // New: perform smooth directional transition between slides (used for drag + controls)
    function performSlideTransition(targetIndex, direction) {
        if (isAnimating) return;
        if (targetIndex >= slides.length) targetIndex = 0;
        if (targetIndex < 0) targetIndex = slides.length - 1;
        if (targetIndex === currentSlide) return;

        isAnimating = true;
        clearInterval(slideInterval);

        const outgoing = slides[currentSlide];
        const incoming = slides[targetIndex];

        // Prepare incoming: position it offscreen in the direction (direction: 1 => incoming starts at +100% (right))
        incoming.style.transition = 'none';
        incoming.style.transform = `translateX(${direction * 100}%)`;
        incoming.style.opacity = '1';
        incoming.style.visibility = 'visible';
        incoming.style.zIndex = '3';
        incoming.classList.add('active'); // make it visible for the transition

        outgoing.style.zIndex = '2';

        // Force reflow to apply initial position
        void incoming.offsetWidth;

        // Define transition
        const transitionVal = 'transform 480ms cubic-bezier(0.22, 1, 0.36, 1), opacity 480ms cubic-bezier(0.22, 1, 0.36, 1)';
        incoming.style.transition = transitionVal;
        outgoing.style.transition = transitionVal;

        // Animate: incoming to 0, outgoing move opposite direction and fade
        incoming.style.transform = 'translateX(0)';
        outgoing.style.transform = `translateX(${-direction * 100}%)`;
        outgoing.style.opacity = '0';

        // After transition ends, cleanup and set state
        const cleanup = () => {
            // remove active from outgoing
            outgoing.classList.remove('active');

            // clear inline styles
            outgoing.style.transition = '';
            outgoing.style.transform = '';
            outgoing.style.opacity = '';
            outgoing.style.zIndex = '';
            outgoing.style.visibility = '';

            incoming.style.transition = '';
            incoming.style.transform = '';
            incoming.style.opacity = '';
            incoming.style.zIndex = '';
            incoming.style.visibility = '';

            // update dots
            dots.forEach(d => d.classList.remove('active'));
            if (dots[targetIndex]) dots[targetIndex].classList.add('active');

            currentSlide = targetIndex;
            isAnimating = false;
            resetAutoSlide();
        };

        // Use timeout as fallback in case transitionend doesn't fire for some reason
        const cleanupTimeout = setTimeout(() => {
            cleanup();
        }, 520);

        // Also listen for transitionend on incoming
        const onTransitionEnd = (e) => {
            if (e.target === incoming) {
                clearTimeout(cleanupTimeout);
                incoming.removeEventListener('transitionend', onTransitionEnd);
                cleanup();
            }
        };
        incoming.addEventListener('transitionend', onTransitionEnd);
    }

    function nextSlide() {
        performSlideTransition((currentSlide + 1) % slides.length, 1);
    }
    
    function prevSlideFunc() {
        performSlideTransition((currentSlide - 1 + slides.length) % slides.length, -1);
    }

    // Automatikus léptetés
    function startAutoSlide() {
        slideInterval = setInterval(() => {
            if (!isAnimating) nextSlide();
        }, 6000);
    }
    
    function resetAutoSlide() {
        clearInterval(slideInterval);
        startAutoSlide();
    }

    // Pöttyök eseménykezelése (most animált iránnyal)
    dots.forEach(dot => {
        dot.addEventListener('click', function() {
            const slideIndex = parseInt(this.getAttribute('data-slide')) - 1;
            if (slideIndex === currentSlide) return;
            const direction = slideIndex > currentSlide ? 1 : -1;
            performSlideTransition(slideIndex, direction);
        });
    });

    // Nyilak eseménykezelése
    if(nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); resetAutoSlide(); });
    if(prevBtn) prevBtn.addEventListener('click', () => { prevSlideFunc(); resetAutoSlide(); });

    // Indítás
    startAutoSlide();

    // --- Drag / Swipe logika (egérrel fogható és vizuálisan is "sodorható") ---
    let isDragging = false;
    let dragStartX = 0;
    let dragCurrentX = 0;
    let dragDelta = 0;
    const dragThreshold = 60; // px, meg kell haladni a váltáshoz

    // Cursor alapállapot
    if (bannerContainer) bannerContainer.style.cursor = 'grab';

    function unifyEventX(e) {
        if (e.type.startsWith('mouse')) return e.clientX;
        if (e.changedTouches && e.changedTouches[0]) return e.changedTouches[0].clientX;
        if (e.touches && e.touches[0]) return e.touches[0].clientX;
        return 0;
    }

    function onDragStart(e) {
        if (isAnimating) return;
        isDragging = true;
        dragStartX = unifyEventX(e);
        dragCurrentX = dragStartX;
        dragDelta = 0;
        // megszakítjuk az automatikus váltást (leállítjuk)
        clearInterval(slideInterval);
        if (bannerContainer) bannerContainer.style.cursor = 'grabbing';

        // megakadályozzuk hogy a browser drag-olja az image-t
        e.preventDefault();

        // remove transitions on active bg for smooth following
        const activeBg = slides[currentSlide].querySelector('.slide-bg');
        if (activeBg) {
            activeBg.style.transition = 'none';
        }
    }

    function onDragMove(e) {
        if (!isDragging || isAnimating) return;
        dragCurrentX = unifyEventX(e);
        dragDelta = dragCurrentX - dragStartX;

        // vizuális elmozdítás: a slide háttérje követi az egeret (kis arányban)
        const activeBg = slides[currentSlide].querySelector('.slide-bg');
        if (activeBg) {
            const translateX = dragDelta * 0.35; // csökkentjük az eltolás mértékét
            const scale = 1.02;
            activeBg.style.transform = `translateX(${translateX}px) scale(${scale})`;
        }

        // Also subtly move the whole active slide to hint direction (small)
        const activeSlide = slides[currentSlide];
        if (activeSlide) {
            activeSlide.style.transition = 'none';
            activeSlide.style.transform = `translateX(${dragDelta * 0.15}px)`; // small movement
        }
    }

    function onDragEnd(e) {
        if (!isDragging || isAnimating) return;
        isDragging = false;
        if (bannerContainer) bannerContainer.style.cursor = 'grab';

        // reset visual transforms
        const activeBg = slides[currentSlide].querySelector('.slide-bg');
        if (activeBg) {
            activeBg.style.transition = 'transform 400ms cubic-bezier(0.22, 1, 0.36, 1)';
            activeBg.style.transform = '';
        }
        const activeSlide = slides[currentSlide];
        if (activeSlide) {
            activeSlide.style.transition = 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)';
            activeSlide.style.transform = '';
        }

        // Determine action
        if (dragDelta < -dragThreshold) {
            // balra húzás => következő (incoming from right)
            performSlideTransition((currentSlide + 1) % slides.length, 1);
        } else if (dragDelta > dragThreshold) {
            // jobbra húzás => előző (incoming from left)
            performSlideTransition((currentSlide - 1 + slides.length) % slides.length, -1);
        } else {
            // kevés mozgás: maradunk a jelenlegi slide-on
            showSlide(currentSlide);
            resetAutoSlide();
        }

        // reset deltas
        dragDelta = 0;
    }

    // Touch események (Mobil)
    if (bannerContainer) {
        bannerContainer.addEventListener('touchstart', onDragStart, {passive: false});
        bannerContainer.addEventListener('touchmove', onDragMove, {passive: false});
        bannerContainer.addEventListener('touchend', onDragEnd);

        // Egér események (Desktop)
        bannerContainer.addEventListener('mousedown', onDragStart);
        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('mouseup', onDragEnd);
    }

    // --- Scroll Reveal Animáció ---
    const revealCards = document.querySelectorAll('.reveal-effect');
    const river = document.querySelector('.product-river');

    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = new IntersectionObserver(function(entries, revealOnScroll) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('is-visible');
                revealOnScroll.unobserve(entry.target);
            }
        });
    }, revealOptions);

    revealCards.forEach(card => {
        revealOnScroll.observe(card);
    });

    // --- Folyó csík kitöltése görgetésre ---
    window.addEventListener('scroll', () => {
        if (!river) return;
        
        const windowHeight = window.innerHeight;
        const totalHeight = river.offsetHeight;
        const container = document.querySelector('.product-river-container');
        if (!container) return;
        const startOffset = container.offsetTop;
        const scrollPosition = window.scrollY + (windowHeight / 2);
        
        let percentage = ((scrollPosition - startOffset) / totalHeight) * 100;

        if (percentage < 0) percentage = 0;
        if (percentage > 100) percentage = 100;

        river.style.background = `linear-gradient(to bottom, var(--accent-color) ${percentage}%, #e0e0e0 ${percentage}%)`;
    });
});

// CSS Animáció injektálása
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes navLinkFade {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
`;
document.head.appendChild(styleSheet);