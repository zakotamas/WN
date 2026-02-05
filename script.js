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

    // --- 8. Scrolled hatás a navigációra és logóra ---
    function handleScrollHeader() {
        if (window.scrollY > 10) {
            mainHeader.classList.add('scrolled');
        } else {
            mainHeader.classList.remove('scrolled');
        }
    }
    handleScrollHeader();
    window.addEventListener('scroll', handleScrollHeader);


    // --- 2. Banner Karusszel & SWIPE (Fix: "sodrás") ---
    const slides = document.querySelectorAll('.banner-slide');
    const dots = document.querySelectorAll('.dot');
    const bannerContainer = document.querySelector('.banner-carousel');
    const prevBtn = document.querySelector('.prev-slide');
    const nextBtn = document.querySelector('.next-slide');
    
    let currentSlide = 0;
    let slideInterval;

    function showSlide(index) {
        // Körkörös léptetés
        if (index >= slides.length) currentSlide = 0;
        else if (index < 0) currentSlide = slides.length - 1;
        else currentSlide = index;

        slides.forEach(slide => {
            slide.classList.remove('active');
            // reset any transform applied by drag
            const bg = slide.querySelector('.slide-bg');
            if (bg) {
                bg.style.transition = '';
                bg.style.transform = '';
            }
        });
        dots.forEach(dot => dot.classList.remove('active'));
        
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }

    function nextSlide() {
        showSlide(currentSlide + 1);
    }
    
    function prevSlideFunc() {
        showSlide(currentSlide - 1);
    }

    // Automatikus léptetés
    function startAutoSlide() {
        slideInterval = setInterval(nextSlide, 6000);
    }
    
    function resetAutoSlide() {
        clearInterval(slideInterval);
        startAutoSlide();
    }

    // Pöttyök eseménykezelése
    dots.forEach(dot => {
        dot.addEventListener('click', function() {
            const slideIndex = parseInt(this.getAttribute('data-slide')) - 1;
            showSlide(slideIndex);
            resetAutoSlide();
        });
    });

    // Nyilak eseménykezelése
    if(nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); resetAutoSlide(); });
    if(prevBtn) prevBtn.addEventListener('click', () => { prevSlideFunc(); resetAutoSlide(); });

    // Indítás
    startAutoSlide();

    // --- 6. Drag / Swipe logika (egérrel fogható és vizuálisan is "sodorható") ---
    let isDragging = false;
    let dragStartX = 0;
    let dragCurrentX = 0;
    let dragDelta = 0;
    const dragThreshold = 60; // px, meg kell haladni a váltáshoz

    // Cursor alapállapot
    bannerContainer.style.cursor = 'grab';

    function unifyEventX(e) {
        if (e.type.startsWith('mouse')) return e.clientX;
        if (e.changedTouches && e.changedTouches[0]) return e.changedTouches[0].clientX;
        if (e.touches && e.touches[0]) return e.touches[0].clientX;
        return 0;
    }

    function onDragStart(e) {
        // csak fő slide-ot engedjük
        isDragging = true;
        dragStartX = unifyEventX(e);
        dragCurrentX = dragStartX;
        dragDelta = 0;
        // megszakítjuk az automatikus váltást
        resetAutoSlide();
        bannerContainer.style.cursor = 'grabbing';

        // levesszük átmenetet az aktív slide bg-jéről, hogy simán követhesse a kurzort
        const activeBg = slides[currentSlide].querySelector('.slide-bg');
        if (activeBg) {
            activeBg.style.transition = 'none';
        }

        // megakadályozzuk hogy a browser drag-olja az image-t
        e.preventDefault();
    }

    function onDragMove(e) {
        if (!isDragging) return;
        dragCurrentX = unifyEventX(e);
        dragDelta = dragCurrentX - dragStartX;

        // vizuális elmozdítás: a slide háttérje követi az egeret (kis arányban),
        // hogy "sodorás" érzést adjon anélkül, hogy a teljes DOM-ot mozgatnánk.
        const activeBg = slides[currentSlide].querySelector('.slide-bg');
        if (activeBg) {
            // kisebb eltolás + enyhe skálázás a dinamikához
            const translateX = dragDelta * 0.35; // csökkentjük az eltolás mértékét
            const scale = 1.02;
            activeBg.style.transform = `translateX(${translateX}px) scale(${scale})`;
        }
    }

    function onDragEnd(e) {
        if (!isDragging) return;
        isDragging = false;
        bannerContainer.style.cursor = 'grab';

        // visszaállítás vizuálisan
        const activeBg = slides[currentSlide].querySelector('.slide-bg');
        if (activeBg) {
            // visszaálló animáció
            activeBg.style.transition = 'transform 400ms cubic-bezier(0.22, 1, 0.36, 1)';
            activeBg.style.transform = '';
        }

        // ha az elmozdulás meghaladja a threshold-ot, váltunk
        if (dragDelta < -dragThreshold) {
            // user balra húzott: következő slide
            nextSlide();
        } else if (dragDelta > dragThreshold) {
            // user jobbra húzott: előző slide
            prevSlideFunc();
        } else {
            // kevés mozgás: maradunk a jelenlegi slide-on
            showSlide(currentSlide);
        }

        // újraindítjuk az automatikát (kis késéssel, hogy ne zavaró legyen)
        setTimeout(resetAutoSlide, 250);
    }

    // Touch események (Mobil)
    bannerContainer.addEventListener('touchstart', onDragStart, {passive: false});
    bannerContainer.addEventListener('touchmove', onDragMove, {passive: false});
    bannerContainer.addEventListener('touchend', onDragEnd);

    // Egér események (Desktop)
    bannerContainer.addEventListener('mousedown', onDragStart);
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);

    // --- 3. Scroll Reveal Animáció ---
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

    // --- 4. Folyó csík kitöltése görgetésre ---
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