function normalizeMenuRow(row) {
  const products = typeof row.products === 'string'
    ? JSON.parse(row.products)
    : (row.products || []);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon,
    description: row.description,
    products
  };
}

async function fetchMenuFromJson() {
  const response = await fetch('./src/data/menu.json');
  if (!response.ok) {
    throw new Error('Failed to load menu.json');
  }
  return response.json();
}

/** True when the remote project is likely paused or unreachable */
function isSupabaseConnectionError(error) {
  if (!error) return false;
  const msg = String(error.message || error).toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('fetch failed') ||
    msg.includes('load failed') ||
    msg.includes('err_connection') ||
    msg.includes('timeout') ||
    msg.includes('paused') ||
    error.name === 'TypeError'
  );
}

async function fetchMenuData() {
  if (!window.mmcSupabase) {
    try {
      return await fetchMenuFromJson();
    } catch (_) {
      return [];
    }
  }

  const { data: categories, error: catError } = await window.mmcSupabase
    .from('categories')
    .select('id, name, slug, icon, description, image_url, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (catError) {
    console.warn('Supabase categories fetch failed:', catError.message);
    // Surface connection/pause issues to the UI instead of a silent empty menu
    if (isSupabaseConnectionError(catError)) {
      const err = new Error('SUPABASE_UNAVAILABLE');
      err.cause = catError;
      throw err;
    }
    try {
      return await fetchMenuFromJson();
    } catch (_) {
      return [];
    }
  }

  if (!categories || categories.length === 0) {
    return [];
  }

  const categoryIds = categories.map((c) => c.id);

  const { data: products, error: prodError } = await window.mmcSupabase
    .from('products')
    .select('id, category_id, legacy_id, name, price, weight, image, hover_image, description, available, sort_order, food_cost, packaging_cost, cogs_percent, margin_percent, price_without_packaging, comments')
    .in('category_id', categoryIds)
    .order('sort_order', { ascending: true });

  if (prodError) {
    console.warn('Supabase products fetch failed:', prodError.message);
  }

  const productsByCategory = {};
  (products || []).forEach((product) => {
    if (!productsByCategory[product.category_id]) {
      productsByCategory[product.category_id] = [];
    }
    productsByCategory[product.category_id].push({
      id: product.legacy_id,
      name: product.name,
      price: product.price,
      weight: product.weight,
      image: product.image || '',
      hoverImage: product.hover_image || '',
      description: product.description || '',
      available: product.available,
      foodCost: product.food_cost,
      packagingCost: product.packaging_cost,
      cogsPercent: product.cogs_percent,
      marginPercent: product.margin_percent,
      priceWithoutPackaging: product.price_without_packaging,
      comments: product.comments || ''
    });
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    icon: category.icon,
    description: category.description,
    image: category.image_url || null,
    products: productsByCategory[category.id] || []
  }));
}

async function fetchSiteSettings() {
  if (!window.mmcSupabase) {
    return null;
  }

  const { data, error } = await window.mmcSupabase
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function submitContactMessage({ name, email, message }) {
  if (!window.mmcSupabase) {
    throw new Error('Contact form is unavailable.');
  }

  const { error } = await window.mmcSupabase
    .from('messages')
    .insert({ name, email, message });

  if (error) {
    throw error;
  }
}

async function fetchPartners() {
  if (!window.mmcSupabase) {
    return [];
  }

  const { data, error } = await window.mmcSupabase
    .from('partners')
    .select('id, name, logo_url, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.warn('Could not load partners:', error.message);
    return [];
  }

  return data || [];
}

function _setLink(id, url) {
  const el = document.getElementById(id);
  if (!el) return;
  if (url && String(url).trim() !== '') {
    el.href = url;
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

function _setTextOrHide(elementId, wrapperId, text) {
  const el = document.getElementById(elementId);
  const wrap = wrapperId ? document.getElementById(wrapperId) : el;
  const hasValue = text != null && String(text).trim() !== '';
  if (el) {
    el.textContent = hasValue ? text.trim() : '';
  }
  if (wrap) {
    if (hasValue) {
      wrap.classList.remove('hidden');
    } else {
      wrap.classList.add('hidden');
    }
  }
}

function _setImgSrc(id, url) {
  const el = document.getElementById(id);
  if (el && url) el.src = url;
}

// Only apply if it's a real remote URL (not a local relative path)
function _isRemoteUrl(url) {
  return url && (url.startsWith('http://') || url.startsWith('https://'));
}

async function applySiteSettingsToConfig() {
  try {
    const settings = (await fetchSiteSettings()) || {};

    // ── WhatsApp config (used by main.js & cart.js) ──
    if (settings.whatsapp_number) {
      MMC_CONFIG.whatsappNumber = String(settings.whatsapp_number).replace(/\D/g, '');
    }
    if (settings.whatsapp_message) {
      MMC_CONFIG.whatsappMessage = settings.whatsapp_message;
    }

    // ── Page title & meta description ──
    if (settings.website_title && settings.website_title.trim()) {
      document.title = settings.website_title;
      const titleEl = document.getElementById('siteTitle');
      if (titleEl) titleEl.textContent = settings.website_title;
      const footerSiteEl = document.getElementById('footerSiteName');
      if (footerSiteEl) footerSiteEl.textContent = settings.website_title;
    }
    if (settings.meta_description && settings.meta_description.trim()) {
      const meta = document.getElementById('siteMetaDescription');
      if (meta) meta.setAttribute('content', settings.meta_description);
    }

    // ── Website Logo (only if a real URL was uploaded) ──
    if (_isRemoteUrl(settings.logo_url)) {
      _setImgSrc('headerLogo', settings.logo_url);
      _setImgSrc('mobileMenuLogo', settings.logo_url);
      _setImgSrc('footerLogo', settings.logo_url);
      _setImgSrc('heroLogo', settings.logo_url);
    }

    // ── Website Favicon (only if a real URL was uploaded) ──
    if (_isRemoteUrl(settings.favicon_url)) {
      document.querySelectorAll('link[rel*="icon"]').forEach(link => {
        link.href = settings.favicon_url;
      });
    }

    // ── Hero Background Slider Images & Transition ──
    let heroImages = [];
    if (settings.hero_images) {
      if (Array.isArray(settings.hero_images)) {
        heroImages = settings.hero_images;
      } else if (typeof settings.hero_images === 'string') {
        try {
          heroImages = JSON.parse(settings.hero_images);
        } catch (_) {}
      }
    }

    // Fallback to local storage if saved in dashboard
    if (!heroImages || heroImages.length === 0) {
      try {
        const localHero = JSON.parse(localStorage.getItem('mmc_hero_images') || '[]');
        if (Array.isArray(localHero) && localHero.length > 0) heroImages = localHero;
      } catch (_) {}
    }

    // Fallback to single hero_image_url if present
    if ((!heroImages || heroImages.length === 0) && _isRemoteUrl(settings.hero_image_url)) {
      heroImages = [settings.hero_image_url];
    }

    let heroInterval = Number(settings.hero_slider_interval);
    if (!heroInterval || isNaN(heroInterval)) {
      try {
        heroInterval = Number(localStorage.getItem('mmc_hero_slider_interval')) || 5;
      } catch (_) {
        heroInterval = 5;
      }
    }

    initHeroSlider(heroImages, heroInterval);

    // ── Hero Section (Strictly hide if empty in dashboard) ──
    _setTextOrHide('heroEyebrow', 'heroEyebrowWrapper', settings.hero_eyebrow);
    _setTextOrHide('heroSubtitle', 'heroSubtitle', settings.hero_subtitle);
    _setTextOrHide('heroCtaPrimary', 'heroCtaPrimaryBtn', settings.hero_cta_primary);
    _setTextOrHide('heroCtaSecondary', 'heroCtaSecondaryBtn', settings.hero_cta_secondary);

    // Hero title text (optional - default is white logo as requested)
    const titleLine1 = (settings.hero_title_line1 || '').trim();
    const titleLine2 = (settings.hero_title_line2 || '').trim();
    const titleAccent = (settings.hero_title_accent || '').trim();
    const isDefaultMmc = (titleLine1.toUpperCase() === 'MMC' && titleLine2.toUpperCase() === 'CENTRAL');
    const heroTitleWrapper = document.getElementById('heroTitleWrapper');

    if (heroTitleWrapper) {
      if (!isDefaultMmc && (titleLine1 || titleLine2 || titleAccent)) {
        _setTextOrHide('heroTitleLine1', 'heroTitleLine1', titleLine1);
        _setTextOrHide('heroTitleLine2', 'heroTitleLine2', titleLine2);
        _setTextOrHide('heroTitleAccent', 'heroTitleAccent', titleAccent);
        heroTitleWrapper.classList.remove('hidden');
      } else {
        heroTitleWrapper.classList.add('hidden');
      }
    }

    // ── Catering & Orders Section ──
    let localCatering = {};
    try {
      localCatering = JSON.parse(localStorage.getItem('mmc_catering_settings') || '{}');
    } catch (_) {}

    const cateringEyebrow = settings.catering_eyebrow ?? localCatering.catering_eyebrow;
    const cateringTitle = settings.catering_title ?? localCatering.catering_title;
    const cateringTitleAccent = settings.catering_title_accent ?? localCatering.catering_title_accent;
    const cateringDesc = settings.catering_description ?? localCatering.catering_description;
    const cateringCta1 = settings.catering_cta_primary ?? localCatering.catering_cta_primary;
    const cateringCta2 = settings.catering_cta_secondary ?? localCatering.catering_cta_secondary;

    const hasAnyCatering = [cateringEyebrow, cateringTitle, cateringTitleAccent, cateringDesc, cateringCta1, cateringCta2]
      .some(val => val != null && String(val).trim() !== '');

    const cateringSection = document.getElementById('cateringSection');
    if (cateringSection) {
      if (!hasAnyCatering) {
        cateringSection.classList.add('hidden');
      } else {
        cateringSection.classList.remove('hidden');
        _setTextOrHide('cateringEyebrow', 'cateringEyebrowWrapper', cateringEyebrow);
        _setTextOrHide('cateringTitle', null, cateringTitle);
        _setTextOrHide('cateringTitleAccent', null, cateringTitleAccent);
        _setTextOrHide('cateringDescription', 'cateringDescription', cateringDesc);
        _setTextOrHide('cateringCtaPrimary', 'cateringCtaPrimaryBtn', cateringCta1);
        _setTextOrHide('cateringCtaSecondary', 'cateringCtaSecondaryBtn', cateringCta2);
      }
    }

    // ── Footer about paragraph ──
    _setTextOrHide('footerAboutText', 'footerAboutText', settings.about_text);

    // ── Footer contact info (strictly hide if empty) ──
    const emailEl = document.getElementById('footerContactEmail');
    const emailItem = document.getElementById('footerEmailItem');
    if (emailEl && emailItem) {
      if (settings.contact_email && settings.contact_email.trim()) {
        emailEl.href = `mailto:${settings.contact_email.trim()}`;
        emailEl.querySelector('span').textContent = settings.contact_email.trim();
        emailItem.classList.remove('hidden');
      } else {
        emailItem.classList.add('hidden');
      }
    }

    const phoneEl = document.getElementById('footerContactPhone');
    const phoneItem = document.getElementById('footerPhoneItem');
    if (phoneEl && phoneItem) {
      if (settings.contact_phone && settings.contact_phone.trim()) {
        phoneEl.href = `tel:${settings.contact_phone.replace(/\s/g, '')}`;
        phoneEl.querySelector('span').textContent = settings.contact_phone.trim();
        phoneItem.classList.remove('hidden');
      } else {
        phoneItem.classList.add('hidden');
      }
    }

    const addressEl = document.getElementById('footerAddress');
    const addressItem = document.getElementById('footerAddressItem');
    if (addressEl && addressItem) {
      if (settings.address && settings.address.trim()) {
        addressEl.querySelector('span').textContent = settings.address.trim();
        addressItem.classList.remove('hidden');
      } else {
        addressItem.classList.add('hidden');
      }
    }

    // ── Social links (footer) ──
    _setLink('footerInstagramLink', settings.instagram_url);
    _setLink('footerFacebookLink',  settings.facebook_url);
    _setLink('footerTwitterLink',   settings.twitter_url);
    _setLink('footerTiktokLink',    settings.tiktok_url);

    // ── WhatsApp links (footer + mobile header) ──
    const waUrl = settings.whatsapp_number
      ? `https://wa.me/${String(settings.whatsapp_number).replace(/\D/g, '')}?text=${encodeURIComponent(settings.whatsapp_message || '')}`
      : null;
    _setLink('footerWhatsappLink',    waUrl);
    _setLink('mobileNavWhatsappLink', waUrl);

    // ── Social links (mobile header nav) ──
    _setLink('mobileNavInstagramLink', settings.instagram_url);
    _setLink('mobileNavFacebookLink',  settings.facebook_url);
    _setLink('mobileNavTwitterLink',   settings.twitter_url);
    _setLink('mobileNavTiktokLink',    settings.tiktok_url);

    // ── WhatsApp button in header ──
    const headerWaBtn = document.getElementById('headerWhatsappBtn');
    if (headerWaBtn && waUrl) {
      headerWaBtn.href = waUrl;
      headerWaBtn.target = '_blank';
      headerWaBtn.rel = 'noopener noreferrer';
    }

  } catch (error) {
    console.warn('Could not load site settings:', error.message);
  }
}

// ────────────────────────────────────────────────────────────
// Hero Background Slider (Cinematic Crossfade + Ken Burns)
// ────────────────────────────────────────────────────────────
let heroSliderTimer = null;
let heroCurrentSlideIndex = 0;

function initHeroSlider(imagesList, intervalSeconds = 5) {
  const container = document.getElementById('heroSliderTrack');
  const dotsContainer = document.getElementById('heroSliderDots');
  const prevBtn = document.getElementById('heroSliderPrev');
  const nextBtn = document.getElementById('heroSliderNext');

  if (!container) return;
  window._heroSliderInitialized = true;

  if (heroSliderTimer) {
    clearInterval(heroSliderTimer);
    heroSliderTimer = null;
  }

  // Filter valid image strings
  let validImages = (imagesList || []).filter(img => typeof img === 'string' && img.trim() !== '');

  // If no custom images provided, fallback to default high quality bakery images
  if (validImages.length === 0) {
    validImages = [
      './assets/images/hero-sec.webp',
      './assets/images/hero.webp',
      './assets/images/bakery_factory.webp'
    ];
  }

  container.innerHTML = '';
  if (dotsContainer) dotsContainer.innerHTML = '';

  heroCurrentSlideIndex = 0;

  validImages.forEach((imgSrc, idx) => {
    const slide = document.createElement('div');
    slide.className = `hero-slide ${idx === 0 ? 'active' : ''}`;
    slide.setAttribute('data-slide-index', String(idx));

    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = `MMC Central Hero Slide ${idx + 1}`;
    img.className = 'hero-slide-img';
    if (idx === 0) {
      img.id = 'heroBgImage';
      img.loading = 'eager';
    } else {
      img.loading = 'lazy';
    }

    slide.appendChild(img);
    container.appendChild(slide);

    // Build dot if more than 1 image
    if (dotsContainer && validImages.length > 1) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `hero-dot ${idx === 0 ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        goToSlide(idx);
        restartTimer();
      });
      dotsContainer.appendChild(dot);
    }
  });

  function goToSlide(targetIdx) {
    const slides = container.querySelectorAll('.hero-slide');
    const dots = dotsContainer ? dotsContainer.querySelectorAll('.hero-dot') : [];
    if (!slides.length) return;

    if (targetIdx >= slides.length) targetIdx = 0;
    if (targetIdx < 0) targetIdx = slides.length - 1;

    heroCurrentSlideIndex = targetIdx;

    slides.forEach((s, i) => {
      if (i === heroCurrentSlideIndex) {
        s.classList.add('active');
      } else {
        s.classList.remove('active');
      }
    });

    dots.forEach((d, i) => {
      if (i === heroCurrentSlideIndex) {
        d.classList.add('active');
      } else {
        d.classList.remove('active');
      }
    });
  }

  function nextSlide() {
    goToSlide(heroCurrentSlideIndex + 1);
  }

  function prevSlide() {
    goToSlide(heroCurrentSlideIndex - 1);
  }

  function restartTimer() {
    if (heroSliderTimer) clearInterval(heroSliderTimer);
    if (validImages.length > 1) {
      const sec = Math.max(2, Math.min(20, Number(intervalSeconds) || 5));
      heroSliderTimer = setInterval(nextSlide, sec * 1000);
    }
  }

  // Setup Next/Prev buttons
  if (prevBtn) {
    if (validImages.length > 1) {
      prevBtn.classList.remove('hidden');
      prevBtn.onclick = (e) => {
        e.stopPropagation();
        prevSlide();
        restartTimer();
      };
    } else {
      prevBtn.classList.add('hidden');
    }
  }

  if (nextBtn) {
    if (validImages.length > 1) {
      nextBtn.classList.remove('hidden');
      nextBtn.onclick = (e) => {
        e.stopPropagation();
        nextSlide();
        restartTimer();
      };
    } else {
      nextBtn.classList.add('hidden');
    }
  }

  restartTimer();

  // Attach hover pause and touch events
  const heroSection = container.closest('section');
  if (heroSection && !heroSection._hasSliderEvents && validImages.length > 1) {
    heroSection._hasSliderEvents = true;

    heroSection.addEventListener('mouseenter', () => {
      if (heroSliderTimer) clearInterval(heroSliderTimer);
    });

    heroSection.addEventListener('mouseleave', () => {
      restartTimer();
    });

    let touchStartX = 0;
    let touchEndX = 0;
    heroSection.addEventListener('touchstart', (e) => {
      if (e.changedTouches && e.changedTouches.length > 0) {
        touchStartX = e.changedTouches[0].screenX;
      }
    }, { passive: true });

    heroSection.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches.length > 0) {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchEndX - touchStartX;
        if (Math.abs(diff) > 40) {
          if (diff < 0) {
            nextSlide();
          } else {
            prevSlide();
          }
          restartTimer();
        }
      }
    }, { passive: true });
  }
}

// Immediate initial run on DOM load if available
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('heroSliderTrack') && !window._heroSliderInitialized) {
      let cachedImages = [];
      try {
        const local = JSON.parse(localStorage.getItem('mmc_hero_images') || '[]');
        if (Array.isArray(local) && local.length > 0) cachedImages = local;
      } catch (_) {}
      const cachedInterval = Number(localStorage.getItem('mmc_hero_slider_interval')) || 5;
      initHeroSlider(cachedImages, cachedInterval);
    }
  });
}

