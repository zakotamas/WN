document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. Hamburger Menü Logika ---
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-links li');

    hamburger.addEventListener('click', () => {
        // Toggle Nav
        navLinks.classList.toggle('nav-active');
        hamburger.classList.toggle('active'); // Ez animálja X-re az ikont

        // Linkek animált megjelenése késleltetéssel
        navItems.forEach((link, index) => {
            if (link.style.animation) {
                link.style.animation = '';
            } else {
                // Finom becsúszás a menüpontoknak
                link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
            }
        });
    });

    // Menü bezárása, ha rákattintunk egy linkre
    navLinks.addEventListener('click', () => {
        navLinks.classList.remove('nav-active');
        hamburger.classList.remove('active');
        navItems.forEach(link => link.style.animation = '');
    });


    // --- 2. Banner Karusszel ---
    const slides = document.querySelectorAll('.banner-slide');
    const dots = document.querySelectorAll('.dot');
    let currentSlide = 0;

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        slides[index].classList.add('active');
        dots[index].classList.add('active');
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    dots.forEach(dot => {
        dot.addEventListener('click', function() {
            const slideIndex = parseInt(this.getAttribute('data-slide')) - 1;
            currentSlide = slideIndex;
            showSlide(currentSlide);
        });
    });

    let slideInterval = setInterval(nextSlide, 6000); // 6 másodperc


    // --- 3. Scroll Reveal Animáció (Hátterből előtűnés) ---
    const revealCards = document.querySelectorAll('.reveal-effect');
    const river = document.querySelector('.product-river');

    const revealOptions = {
        threshold: 0.15, // Akkor aktiválódjon, ha 15%-a látszik
        rootMargin: "0px 0px -50px 0px" // Kicsit hamarabb triggereljen alulról
    };

    const revealOnScroll = new IntersectionObserver(function(entries, revealOnScroll) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('is-visible');
                // Ha egyszer megjelent, ne figyelje tovább (teljesítmény optimalizálás)
                revealOnScroll.unobserve(entry.target);
            }
        });
    }, revealOptions);

    revealCards.forEach(card => {
        revealOnScroll.observe(card);
    });

    // --- 4. Folyó csík kitöltése görgetésre ---
    window.addEventListener('scroll', () => {
        if (!river) return; // Ha mobilon nincs folyó, ne fusson hibára
        
        const riverRect = river.getBoundingClientRect();
        const startPoint = riverRect.top + window.scrollY;
        const totalHeight = river.offsetHeight;
        const windowHeight = window.innerHeight;
        
        // Kiszámoljuk, hol tartunk a folyóhoz képest
        let scrollY = window.scrollY + (windowHeight / 2); // Képernyő közepéhez igazítva
        let percentage = ((scrollY - startPoint) / totalHeight) * 100;

        // Határok kezelése
        if (percentage < 0) percentage = 0;
        if (percentage > 100) percentage = 100;

        // CSS változó vagy pseudo-elem stílus frissítése (itt most egyszerűen stíluslapba írjuk a magasságot)
        // De mivel pseudo-elemet nem lehet közvetlenül JS-ből állítani inline style-ként, 
        // a legjobb megoldás egy style tag injektálása vagy a main river backgroundjának módosítása.
        // Itt most egy elegáns trükköt használunk: background-size módosítás a pseudo elem helyett a riveren
        
        // Mivel a CSS-ben pseudo elemet használtam (style.css 182), a JS-t ehhez igazítom:
        // Egyszerűbb, ha magát a river div-et színezzük, nem a before-t, vagy CSS változót állítunk.
        
        // JAVÍTÁS: Módosítsuk a style.css-t, hogy CSS változót használjon, vagy
        // adjunk a rivernek egy belső div-et a "töltéshez". 
        // A legegyszerűbb megoldás a meglévő kódban:
        // A 'product-river::after' magasságát nem tudjuk közvetlenül JS-el állítani.
        // Ehelyett hozzunk létre egy dinamikus stílus szabályt:
        
        river.style.background = `linear-gradient(to bottom, var(--accent-color) ${percentage}%, #e0e0e0 ${percentage}%)`;
    });
});

// Szükséges CSS kiegészítés a JS-es keyframes-hez (a script végére illesztve)
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes navLinkFade {
    from {
        opacity: 0;
        transform: translateX(50px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}
`;
document.head.appendChild(styleSheet);