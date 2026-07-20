/* ========== GLOBAL CONFIGURATIONS ========== */
const MMC_CONFIG = {
  whatsappNumber: "966500000000", // Replace with client's Riyadh phone number (with country code, e.g., 9665XXXXXXXX)
  whatsappMessage: "Hello MMC Central, I would like to inquire about your catering/menu services."
};

/* ========== THEMED IMAGE FALLBACK POOL ========== */
function getProductImage(product, categorySlug) {
  if (product.image && product.image.trim() !== "") {
    return product.image;
  }
  
  const categoryImages = {
    'pastry': [
      'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=800&auto=format&fit=crop', // Tiramisu/dessert
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=800&auto=format&fit=crop', // Chocolate cake
      'https://images.unsplash.com/photo-1519869325930-281384150729?q=80&w=800&auto=format&fit=crop', // Tart
      'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=800&auto=format&fit=crop', // Cookies
      'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=800&auto=format&fit=crop'  // Cheesecake
    ],
    'bakery': [
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=800&auto=format&fit=crop', // Plain Croissant
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop', // Fresh Breads
      'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=800&auto=format&fit=crop', // Danish Pastry
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop'  // Sourdough
    ],
    'cold-kitchen': [
      'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?q=80&w=800&auto=format&fit=crop', // Gourmet Appetizers
      'https://images.unsplash.com/photo-1577906096429-f73bc2c31243?q=80&w=800&auto=format&fit=crop', // Hummus/Dips
      'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop'  // Gourmet Cold Platters
    ],
    'salads': [
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop', // Fresh green salad
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=800&auto=format&fit=crop', // Healthy Greek Salad
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop'  // Salad bowl
    ],
    'sandwiches': [
      'https://images.unsplash.com/photo-1509722747041-616f39b57569?q=80&w=800&auto=format&fit=crop', // Gourmet sandwich
      'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800&auto=format&fit=crop', // Toast/Club sandwich
      'https://images.unsplash.com/photo-1567137222464-9d3e8ed58f75?q=80&w=800&auto=format&fit=crop'  // Artisan Panini
    ],
    'soups': [
      'https://images.unsplash.com/photo-1547592165-e1d17f97a15a?q=80&w=800&auto=format&fit=crop', // Pumpkin/Tomato Soup
      'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=800&auto=format&fit=crop', // Soup bowl
      'https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?q=80&w=800&auto=format&fit=crop'  // Creamy Soup
    ],
    'juices': [
      'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?q=80&w=800&auto=format&fit=crop', // Orange juice
      'https://images.unsplash.com/photo-1610970881699-44a5587caaec?q=80&w=800&auto=format&fit=crop', // Green smoothie
      'https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=800&auto=format&fit=crop'  // Fresh cold juices
    ]
  };

  const pool = categoryImages[categorySlug] || categoryImages['pastry'];
  const index = Math.abs(product.id) % pool.length;
  return pool[index];
}

function getProductHoverImage(product, categorySlug) {
  if (product.hoverImage && product.hoverImage.trim() !== "") {
    return product.hoverImage;
  }
  
  const categoryImages = {
    'pastry': [
      'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1519869325930-281384150729?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=800&auto=format&fit=crop'
    ],
    'bakery': [
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop'
    ],
    'cold-kitchen': [
      'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1577906096429-f73bc2c31243?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop'
    ],
    'salads': [
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop'
    ],
    'sandwiches': [
      'https://images.unsplash.com/photo-1509722747041-616f39b57569?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1567137222464-9d3e8ed58f75?q=80&w=800&auto=format&fit=crop'
    ],
    'soups': [
      'https://images.unsplash.com/photo-1547592165-e1d17f97a15a?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?q=80&w=800&auto=format&fit=crop'
    ],
    'juices': [
      'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1610970881699-44a5587caaec?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=800&auto=format&fit=crop'
    ]
  };

  const pool = categoryImages[categorySlug] || categoryImages['pastry'];
  const index = Math.abs(product.id + 1) % pool.length; // Use next image in pool for hover
  return pool[index];
}

/* ========== INITIALIZATION ========== */
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
  // Initialize header/navigation behaviors after includes are done
  initMobileMenu();
  adjustDynamicLinks();
  injectWhatsAppFloatingButton();
}

/* ========== ADJUST DYNAMIC LINKS FOR SUBPAGES ========== */
function adjustDynamicLinks() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  // Only treat real homepage paths as homepage — clean URLs like /category must NOT match
  const isHomepage = path === '/' || path === '/index' || path.endsWith('/index.html');
  
  // 1. Rewrite internal anchor links (like #menu) if on a subpage
  if (!isHomepage) {
    const anchors = document.querySelectorAll('a[href^="#"]');
    anchors.forEach(a => {
      const href = a.getAttribute('href');
      if (href && href !== '#' && href.startsWith('#')) {
        // Use clean path (index#menu) so npx serve won't strip the hash on redirect
        a.setAttribute('href', 'index' + href);
      }
    });
  }

  // 2. Set WhatsApp links dynamically based on MMC_CONFIG
  const whatsappLinks = document.querySelectorAll('a[aria-label="WhatsApp"]');
  whatsappLinks.forEach(link => {
    link.setAttribute('href', `https://wa.me/${MMC_CONFIG.whatsappNumber}?text=${encodeURIComponent(MMC_CONFIG.whatsappMessage)}`);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  });
}

/* ========== INJECT FLOATING WHATSAPP BUTTON ========== */
function injectWhatsAppFloatingButton() {
  if (document.getElementById('whatsappFloatingBtn')) return;

  const btn = document.createElement('a');
  btn.id = 'whatsappFloatingBtn';
  btn.href = `https://wa.me/${MMC_CONFIG.whatsappNumber}?text=${encodeURIComponent(MMC_CONFIG.whatsappMessage)}`;
  btn.target = '_blank';
  btn.rel = 'noopener noreferrer';
  btn.className = 'whatsapp-float';
  btn.setAttribute('aria-label', 'Chat on WhatsApp');
  btn.innerHTML = `<i class="fab fa-whatsapp"></i>`;
  document.body.appendChild(btn);
}

/* ========== LOAD MENU DATA ========== */
async function loadMenuData() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;

  try {
    const data = await fetchMenuData();
    grid.innerHTML = '';

    if (!data || data.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full w-full flex items-center justify-center py-24 px-6 text-center mx-auto">
          <div class="flex flex-col items-center justify-center">
            <i class="fas fa-utensils text-5xl text-primary/20 mb-6 block text-center"></i>
            <p class="text-primary/50 font-bold uppercase tracking-widest text-sm text-center">No menu categories available yet.</p>
            <p class="text-primary/30 text-xs mt-2 tracking-wider text-center">Check back soon.</p>
          </div>
        </div>
      `;
      return;
    }

    data.forEach((category, index) => {
      const card = document.createElement('a');
      card.href = `category?id=${category.slug}`;
      // Use swiper-slide class and remove AOS for slider items to prevent conflicts
      card.className = "swiper-slide block group";

      const fallbackImages = [
        'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=800&auto=format&fit=crop'
      ];

      const bgImage = category.image || fallbackImages[index % fallbackImages.length];
      const loadingAttr = index < 2 ? 'eager' : 'lazy';

      card.innerHTML = `
        <div class="h-[400px] md:h-[450px] w-full bg-primary flex flex-col justify-between p-8 border-2 border-secondary hover:border-accent transition-colors relative overflow-hidden">
          
          <!-- Background Image & Overlay -->
          <img src="${bgImage}" alt="${category.name}" loading="${loadingAttr}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-100">
          <div class="absolute inset-0 bg-gradient-to-t from-primary via-primary/70 to-transparent"></div>
          
          <div class="relative z-20 mt-auto">
            <h3 class="text-secondary text-3xl md:text-4xl font-bold uppercase tracking-normal mb-4 group-hover:text-accent transition-colors leading-tight line-clamp-2 break-words">${category.name}</h3>
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
    const isUnavailable = error?.message === 'SUPABASE_UNAVAILABLE';
    grid.innerHTML = `
      <div class="col-span-full w-full flex items-center justify-center py-24 px-6 text-center mx-auto">
        <div class="flex flex-col items-center justify-center max-w-md">
          <i class="fas ${isUnavailable ? 'fa-cloud' : 'fa-exclamation-triangle'} text-5xl text-primary/20 mb-6 block"></i>
          <p class="text-primary/60 font-bold uppercase tracking-widest text-sm">
            ${isUnavailable ? 'Menu temporarily unavailable.' : 'Failed to load menu. Please try again later.'}
          </p>
          <p class="text-primary/40 text-xs mt-3 tracking-wider leading-relaxed">
            ${isUnavailable
              ? 'The database service is currently paused or unreachable. Please check back shortly.'
              : 'Something went wrong while loading categories.'}
          </p>
        </div>
      </div>
    `;
  }
}

// Call on load
document.addEventListener('DOMContentLoaded', async () => {
  await includeHTML();             // load header/footer partials first
  await applySiteSettingsToConfig(); // then apply DB settings to DOM
  loadMenuData();
  loadPartners();
  initContactForm();
});

async function loadPartners() {
  const section = document.getElementById('partnersSection');
  const trackA = document.getElementById('partnersMarqueeA');
  const trackB = document.getElementById('partnersMarqueeB');
  if (!section || !trackA || !trackB) return;

  try {
    const partners = await fetchPartners();
    if (!partners.length) {
      section.classList.add('hidden');
      return;
    }

    const logosHtml = partners.map((partner) => {
      const name = String(partner.name || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      const src = String(partner.logo_url || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<img src="${src}" alt="${name}" class="partner-logo" loading="lazy">`;
    }).join('');

    trackA.innerHTML = logosHtml;
    trackB.innerHTML = logosHtml;
    section.classList.remove('hidden');
  } catch (error) {
    console.warn('Failed to load partners:', error.message);
    section.classList.add('hidden');
  }
}

function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const feedbackId = 'contactFormFeedback';
  let feedback = document.getElementById(feedbackId);
  if (!feedback) {
    feedback = document.createElement('p');
    feedback.id = feedbackId;
    feedback.className = 'mt-4 text-center text-sm font-bold uppercase tracking-widest hidden';
    form.appendChild(feedback);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('name')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const message = document.getElementById('message')?.value.trim();
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!name || !email || !message) {
      return;
    }

    submitBtn.disabled = true;
    feedback.classList.remove('hidden', 'text-green-600', 'text-red-500');
    feedback.textContent = 'Sending...';

    try {
      await submitContactMessage({ name, email, message });
      form.reset();
      feedback.classList.add('text-green-600');
      feedback.textContent = 'Message sent successfully. We will get back to you soon.';
    } catch (error) {
      console.error('Contact form error:', error);
      feedback.classList.add('text-red-500');
      feedback.textContent = 'Could not send your message. Please try again or contact us on WhatsApp.';
    } finally {
      submitBtn.disabled = false;
    }
  });
}

