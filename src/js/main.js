/* Main JS - vanilla (no modules)
    Responsibilities:
    - Initialize AOS safely
    - Small helpers: set year, simple form handling (no network)
*/
document.addEventListener('DOMContentLoaded', function () {
  // Initialize AOS if available
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 700,
      once: true,
      mirror: false
    });
  }
});

/* ========== PAGE PRELOADER ========== */
window.addEventListener("load", function () {
  const pre = document.getElementById("preloader");
  if (pre) {
    setTimeout(() => {
      pre.classList.add("hide");
    }, 3000);
  }
});


/* ========== SCROLL-AWARE HEADER ========== */
const siteHeader = document.getElementById('siteHeader');
if (siteHeader) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      siteHeader.classList.add('shadow-md');
      siteHeader.classList.remove('bg-secondary/95');
      siteHeader.classList.add('bg-secondary');
    } else {
      siteHeader.classList.remove('shadow-md');
      siteHeader.classList.remove('bg-secondary');
      siteHeader.classList.add('bg-secondary/95');
    }
  }, { passive: true });
}

/* ========== SCROLL TO TOP BUTTON ========== */
const scrollBtn = document.getElementById("scrollTopBtn");
if (scrollBtn) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      scrollBtn.classList.add("show");
    } else {
      scrollBtn.classList.remove("show");
    }
  }, { passive: true });
  scrollBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

/* ========== MOBILE MENU ========== */
function initMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const closeMenuBtn = document.getElementById('closeMenuBtn');
  const mobileNav = document.getElementById('mobileNav');

  function openMenu() {
    if (mobileNav) {
      mobileNav.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-8');
      mobileNav.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
    }
  }

  function closeMenu() {
    if (mobileNav) {
      mobileNav.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
      mobileNav.classList.add('opacity-0', 'pointer-events-none', '-translate-y-8');
    }
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', openMenu);
  }

  if (closeMenuBtn) {
    closeMenuBtn.addEventListener('click', closeMenu);
  }

  // Close menu on link click
  if (mobileNav) {
    const mobileLinks = mobileNav.querySelectorAll('.mobile-link');
    mobileLinks.forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }
}

/* ========== HTML INCLUDES ========== */
async function includeHTML() {
  const elements = document.querySelectorAll('[data-include]');
  for (let el of elements) {
    const file = el.getAttribute('data-include');
    if (file) {
      try {
        const response = await fetch(file);
        if (response.ok) {
          el.innerHTML = await response.text();
          // Remove the attribute so it's not processed again
          el.removeAttribute('data-include');
        } else {
          el.innerHTML = "Page not found.";
        }
      } catch (error) {
        console.error("Error including file:", error);
      }
    }
  }
  // Initialize header scripts after includes are done
  initMobileMenu();
}

/* ========== LOAD MENU DATA ========== */
async function loadMenuData() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;

  try {
    const response = await fetch('./src/data/menu.json');
    if (!response.ok) throw new Error('Failed to load menu data');

    const data = await response.json();
    grid.innerHTML = ''; // Clear loading state

    data.forEach((category, index) => {
      const card = document.createElement('a');
      card.href = `category.html?id=${category.slug}`;
      // Use swiper-slide class and remove AOS for slider items to prevent conflicts
      card.className = "swiper-slide block group";

      const num = String(index + 1).padStart(2, '0');

      const cardImages = [
        'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=800&auto=format&fit=crop'
      ];

      const bgImage = cardImages[index % cardImages.length];
      const loadingAttr = index < 2 ? 'eager' : 'lazy';

      card.innerHTML = `
        <div class="h-[400px] md:h-[450px] w-full bg-primary flex flex-col justify-between p-8 border-2 border-secondary hover:border-accent transition-colors relative overflow-hidden">
          
          <!-- Background Image & Overlay -->
          <img src="${bgImage}" alt="${category.name}" loading="${loadingAttr}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-100">
          <div class="absolute inset-0 bg-gradient-to-t from-primary via-primary/70 to-transparent"></div>
          
          <div class="relative z-20 mt-auto">
            <h3 class="text-secondary text-3xl md:text-4xl font-bold uppercase tracking-widest mb-4 group-hover:text-accent transition-colors leading-tight">${category.name}</h3>
            <div class="w-12 h-1 bg-secondary/30 mb-6 transition-all duration-500 group-hover:w-24 group-hover:bg-accent"></div>
            <p class="text-secondary/90 text-sm md:text-base max-w-[90%] mb-8 line-clamp-2">${category.description}</p>
            
            <span class="font-bold text-secondary uppercase tracking-widest flex items-center gap-3">
              Explore 
              <span class="w-8 h-8 rounded-full bg-accent text-secondary flex items-center justify-center transform group-hover:translate-x-4 transition-transform duration-300">
                <i class="fas fa-arrow-right text-sm"></i>
              </span>
            </span>
          </div>
        </div>
      `;

      grid.appendChild(card);
    });

    // Initialize Swiper after slides are added
    new Swiper('.categoriesSwiper', {
      slidesPerView: 1.5,
      spaceBetween: 16,
      loop: true,
      speed: 1200, // 1.2 seconds transition duration for a very smooth slide
      autoplay: {
        delay: 4000, // Waits 4 seconds before moving
        disableOnInteraction: false,
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      breakpoints: {
        640: {
          slidesPerView: 3,
        },
        1024: {
          slidesPerView: 4,
        },
        1280: {
          slidesPerView: 5,
        }
      }
    });

  } catch (error) {
    console.error('Error loading menu:', error);
    grid.innerHTML = `
      <div class="col-span-full text-center py-10">
        <i class="fas fa-exclamation-triangle text-4xl text-red-500"></i>
        <p class="mt-4 font-bold uppercase tracking-widest">Failed to load menu. Please try again later.</p>
      </div>
    `;
  }
}

// Call on load
document.addEventListener('DOMContentLoaded', () => {
  includeHTML();
  loadMenuData();
});

