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
    .select('id, name, slug, icon, description, image_url, banner_url, sort_order')
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
    banner: category.banner_url || null,
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
        } catch (_) { }
      }
    }

    // Fallback to local storage if saved in dashboard
    if (!heroImages || heroImages.length === 0) {
      try {
        const localHero = JSON.parse(localStorage.getItem('mmc_hero_images') || '[]');
        if (Array.isArray(localHero) && localHero.length > 0) heroImages = localHero;
      } catch (_) { }
    }

    // Fallback to single hero_image_url if present
    if ((!heroImages || heroImages.length === 0) && _isRemoteUrl(settings.hero_image_url)) {
      heroImages = [settings.hero_image_url];
    }

    // Slide interval permanently fixed at 4 seconds
    initHeroSlider(heroImages, 4);

    // ── LocalStorage fallbacks for visibility & links ──
    let localVisibility = {};
    try {
      localVisibility = JSON.parse(localStorage.getItem('mmc_section_visibility') || '{}');
    } catch (_) { }

    let localLinks = {};
    try {
      localLinks = JSON.parse(localStorage.getItem('mmc_section_links') || '{}');
    } catch (_) { }

    // ── Hero Section Visibility & Content ──
    const heroVisible = (settings.hero_visible != null)
      ? Boolean(settings.hero_visible)
      : (localVisibility.hero_visible != null ? Boolean(localVisibility.hero_visible) : true);

    const heroSection = document.getElementById('heroSection');
    if (heroSection) {
      if (!heroVisible) {
        heroSection.classList.add('hidden');
      } else {
        heroSection.classList.remove('hidden');
      }
    }

    _setTextOrHide('heroEyebrow', 'heroEyebrowWrapper', settings.hero_eyebrow);
    _setTextOrHide('heroSubtitle', 'heroSubtitle', settings.hero_subtitle);
    _setTextOrHide('heroCtaPrimary', 'heroCtaPrimaryBtn', settings.hero_cta_primary);
    _setTextOrHide('heroCtaSecondary', 'heroCtaSecondaryBtn', settings.hero_cta_secondary);

    // Hero CTA button links
    const heroCta1Url = settings.hero_cta_primary_url || localLinks.hero_cta_primary_url || '#menu';
    const heroCta2Url = settings.hero_cta_secondary_url || localLinks.hero_cta_secondary_url || '#contact';
    const heroCta1Btn = document.getElementById('heroCtaPrimaryBtn');
    if (heroCta1Btn) heroCta1Btn.href = heroCta1Url;
    const heroCta2Btn = document.getElementById('heroCtaSecondaryBtn');
    if (heroCta2Btn) heroCta2Btn.href = heroCta2Url;

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

    // ── Catering & Orders Section Visibility & Content ──
    let localCatering = {};
    try {
      localCatering = JSON.parse(localStorage.getItem('mmc_catering_settings') || '{}');
    } catch (_) { }

    const cateringVisible = (settings.catering_visible != null)
      ? Boolean(settings.catering_visible)
      : (localVisibility.catering_visible != null ? Boolean(localVisibility.catering_visible) : true);

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
      if (!cateringVisible || !hasAnyCatering) {
        cateringSection.classList.add('hidden');
      } else {
        cateringSection.classList.remove('hidden');
        _setTextOrHide('cateringEyebrow', 'cateringEyebrowWrapper', cateringEyebrow);
        _setTextOrHide('cateringTitle', null, cateringTitle);
        _setTextOrHide('cateringTitleAccent', null, cateringTitleAccent);
        _setTextOrHide('cateringDescription', 'cateringDescription', cateringDesc);
        _setTextOrHide('cateringCtaPrimary', 'cateringCtaPrimaryBtn', cateringCta1);
        _setTextOrHide('cateringCtaSecondary', 'cateringCtaSecondaryBtn', cateringCta2);

        // Catering CTA button links
        const cateringCta1Url = settings.catering_cta_primary_url || localLinks.catering_cta_primary_url || '#contact';
        const cateringCta2Url = settings.catering_cta_secondary_url || localLinks.catering_cta_secondary_url || '#menu';
        const cateringCta1Btn = document.getElementById('cateringCtaPrimaryBtn');
        if (cateringCta1Btn) cateringCta1Btn.href = cateringCta1Url;
        const cateringCta2Btn = document.getElementById('cateringCtaSecondaryBtn');
        if (cateringCta2Btn) cateringCta2Btn.href = cateringCta2Url;
      }
    }

    // ── Menu Section Visibility ──
    const menuVisible = (settings.menu_visible != null)
      ? Boolean(settings.menu_visible)
      : (localVisibility.menu_visible != null ? Boolean(localVisibility.menu_visible) : true);
    const menuSection = document.getElementById('menu');
    if (menuSection) {
      if (!menuVisible) {
        menuSection.classList.add('hidden');
      } else {
        menuSection.classList.remove('hidden');
      }
    }

    // ── Contact Section Visibility ──
    const contactVisible = (settings.contact_visible != null)
      ? Boolean(settings.contact_visible)
      : (localVisibility.contact_visible != null ? Boolean(localVisibility.contact_visible) : true);
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      if (!contactVisible) {
        contactSection.classList.add('hidden');
      } else {
        contactSection.classList.remove('hidden');
      }
    }

    // ── LocalStorage fallbacks for custom sections ──
    let localCustomSections = {};
    try {
      localCustomSections = JSON.parse(localStorage.getItem('mmc_custom_sections') || '{}');
    } catch (_) { }

    const s1Local = localCustomSections.section1 || {};
    const s2Local = localCustomSections.section2 || {};

    // ── Custom Section 1 ──
    const s1Visible = (settings.section1_visible != null)
      ? Boolean(settings.section1_visible)
      : (localVisibility.section1_visible != null ? Boolean(localVisibility.section1_visible) : (s1Local.visible != null ? Boolean(s1Local.visible) : true));

    const s1Bg = settings.section1_bg_image || s1Local.bg_image;
    const s1BgColor = settings.section1_bg_color || s1Local.bg_color || '#000000';
    const s1TextColor = settings.section1_text_color || s1Local.text_color || '#ffffff';
    const s1Title = settings.section1_title || s1Local.title;
    const s1Subtitle = settings.section1_subtitle || s1Local.subtitle;
    const s1Text = settings.section1_text || s1Local.text;
    const s1Btn1Text = settings.section1_btn1_text || s1Local.btn1_text;
    const s1Btn1Url = settings.section1_btn1_url || s1Local.btn1_url || '#contact';
    const s1Btn2Text = settings.section1_btn2_text || s1Local.btn2_text;
    const s1Btn2Url = settings.section1_btn2_url || s1Local.btn2_url || '#menu';

    const hasS1Content = [s1Bg, s1Title, s1Subtitle, s1Text, s1Btn1Text, s1Btn2Text]
      .some(val => val != null && String(val).trim() !== '');

    const sec1El = document.getElementById('customSection1');
    if (sec1El) {
      if (!s1Visible || !hasS1Content) {
        sec1El.classList.add('hidden');
      } else {
        sec1El.classList.remove('hidden');

        // Apply custom colors
        sec1El.style.backgroundColor = s1BgColor;
        sec1El.style.color = s1TextColor;

        // Background image & pattern (clean image without dark overlay)
        const s1BgImg = document.getElementById('customSection1Bg');
        const s1BgWrap = document.getElementById('customSection1BgWrapper');
        const s1Pattern = document.getElementById('customSection1Pattern');
        if (s1Bg && s1Bg.trim()) {
          if (s1BgImg) s1BgImg.src = s1Bg.trim();
          if (s1BgWrap) s1BgWrap.classList.remove('hidden');
          if (s1Pattern) s1Pattern.classList.add('hidden');
        } else {
          if (s1BgWrap) s1BgWrap.classList.add('hidden');
          if (s1Pattern) s1Pattern.classList.remove('hidden');
        }

        // Subtitle / Eyebrow
        _setTextOrHide('customSection1Subtitle', 'customSection1SubtitleWrapper', s1Subtitle);
        const s1Sub = document.getElementById('customSection1Subtitle');
        if (s1Sub) s1Sub.style.color = s1TextColor;
        const s1SubLine = document.getElementById('customSection1SubtitleLine');
        if (s1SubLine) s1SubLine.style.backgroundColor = s1TextColor;

        // Title
        _setTextOrHide('customSection1Title', 'customSection1Title', s1Title);
        const s1TitleEl = document.getElementById('customSection1Title');
        if (s1TitleEl) s1TitleEl.style.color = s1TextColor;

        // Body Text
        _setTextOrHide('customSection1Text', 'customSection1Text', s1Text);
        const s1TextEl = document.getElementById('customSection1Text');
        if (s1TextEl) s1TextEl.style.color = s1TextColor;

        // Adapt button contrast based on text color
        const s1DarkText = _isDarkColor(s1TextColor);

        // Button 1
        const b1 = document.getElementById('customSection1Btn1');
        const b1Text = document.getElementById('customSection1Btn1Text');
        if (b1 && b1Text) {
          if (s1Btn1Text && s1Btn1Text.trim()) {
            b1Text.textContent = s1Btn1Text.trim();
            b1.href = s1Btn1Url;
            b1.className = s1DarkText
              ? "inline-flex items-center gap-3 bg-black text-white font-bold uppercase tracking-widest px-8 md:px-10 py-4 md:py-5 rounded hover:bg-neutral-800 transition-colors duration-300 group shadow-xl"
              : "inline-flex items-center gap-3 bg-white text-black font-bold uppercase tracking-widest px-8 md:px-10 py-4 md:py-5 rounded hover:bg-neutral-200 transition-colors duration-300 group shadow-xl";
            b1.classList.remove('hidden');
          } else {
            b1.classList.add('hidden');
          }
        }

        // Button 2
        const b2 = document.getElementById('customSection1Btn2');
        const b2Text = document.getElementById('customSection1Btn2Text');
        if (b2 && b2Text) {
          if (s1Btn2Text && s1Btn2Text.trim()) {
            b2Text.textContent = s1Btn2Text.trim();
            b2.href = s1Btn2Url;
            b2.className = s1DarkText
              ? "inline-flex items-center gap-3 border border-black/30 text-black font-bold uppercase tracking-widest px-8 md:px-10 py-4 md:py-5 rounded hover:border-black hover:bg-black hover:text-white transition-all duration-300"
              : "inline-flex items-center gap-3 border border-white/40 text-white font-bold uppercase tracking-widest px-8 md:px-10 py-4 md:py-5 rounded hover:border-white hover:bg-white hover:text-black transition-all duration-300";
            b2.classList.remove('hidden');
          } else {
            b2.classList.add('hidden');
          }
        }
      }
    }

    // ── Custom Section 2 ──
    const s2Visible = (settings.section2_visible != null)
      ? Boolean(settings.section2_visible)
      : (localVisibility.section2_visible != null ? Boolean(localVisibility.section2_visible) : (s2Local.visible != null ? Boolean(s2Local.visible) : true));

    const s2Bg = settings.section2_bg_image || s2Local.bg_image;
    const s2BgColor = settings.section2_bg_color || s2Local.bg_color || '#000000';
    const s2TextColor = settings.section2_text_color || s2Local.text_color || '#ffffff';
    const s2Title = settings.section2_title || s2Local.title;
    const s2Subtitle = settings.section2_subtitle || s2Local.subtitle;
    const s2Text = settings.section2_text || s2Local.text;
    const s2Btn1Text = settings.section2_btn1_text || s2Local.btn1_text;
    const s2Btn1Url = settings.section2_btn1_url || s2Local.btn1_url || '#contact';
    const s2Btn2Text = settings.section2_btn2_text || s2Local.btn2_text;
    const s2Btn2Url = settings.section2_btn2_url || s2Local.btn2_url || '#menu';

    const hasS2Content = [s2Bg, s2Title, s2Subtitle, s2Text, s2Btn1Text, s2Btn2Text]
      .some(val => val != null && String(val).trim() !== '');

    const sec2El = document.getElementById('customSection2');
    if (sec2El) {
      if (!s2Visible || !hasS2Content) {
        sec2El.classList.add('hidden');
      } else {
        sec2El.classList.remove('hidden');

        // Apply custom colors
        sec2El.style.backgroundColor = s2BgColor;
        sec2El.style.color = s2TextColor;

        // Background image & pattern (clean image without dark overlay)
        const s2BgImg = document.getElementById('customSection2Bg');
        const s2BgWrap = document.getElementById('customSection2BgWrapper');
        const s2Pattern = document.getElementById('customSection2Pattern');
        if (s2Bg && s2Bg.trim()) {
          if (s2BgImg) s2BgImg.src = s2Bg.trim();
          if (s2BgWrap) s2BgWrap.classList.remove('hidden');
          if (s2Pattern) s2Pattern.classList.add('hidden');
        } else {
          if (s2BgWrap) s2BgWrap.classList.add('hidden');
          if (s2Pattern) s2Pattern.classList.remove('hidden');
        }

        // Subtitle / Eyebrow
        _setTextOrHide('customSection2Subtitle', 'customSection2SubtitleWrapper', s2Subtitle);
        const s2Sub = document.getElementById('customSection2Subtitle');
        if (s2Sub) s2Sub.style.color = s2TextColor;
        const s2SubLine1 = document.getElementById('customSection2SubtitleLine1');
        if (s2SubLine1) s2SubLine1.style.backgroundColor = s2TextColor;
        const s2SubLine2 = document.getElementById('customSection2SubtitleLine2');
        if (s2SubLine2) s2SubLine2.style.backgroundColor = s2TextColor;

        // Title
        _setTextOrHide('customSection2Title', 'customSection2Title', s2Title);
        const s2TitleEl = document.getElementById('customSection2Title');
        if (s2TitleEl) s2TitleEl.style.color = s2TextColor;

        // Body Text
        _setTextOrHide('customSection2Text', 'customSection2Text', s2Text);
        const s2TextEl = document.getElementById('customSection2Text');
        if (s2TextEl) s2TextEl.style.color = s2TextColor;

        // Adapt button contrast based on text color
        const s2DarkText = _isDarkColor(s2TextColor);

        // Button 1
        const s2b1 = document.getElementById('customSection2Btn1');
        const s2b1Text = document.getElementById('customSection2Btn1Text');
        if (s2b1 && s2b1Text) {
          if (s2Btn1Text && s2Btn1Text.trim()) {
            s2b1Text.textContent = s2Btn1Text.trim();
            s2b1.href = s2Btn1Url;
            s2b1.className = s2DarkText
              ? "inline-flex items-center gap-3 bg-black text-white font-bold uppercase tracking-widest px-8 md:px-10 py-4 md:py-5 rounded hover:bg-neutral-800 transition-colors duration-300 group shadow-xl"
              : "inline-flex items-center gap-3 bg-white text-black font-bold uppercase tracking-widest px-8 md:px-10 py-4 md:py-5 rounded hover:bg-neutral-200 transition-colors duration-300 group shadow-xl";
            s2b1.classList.remove('hidden');
          } else {
            s2b1.classList.add('hidden');
          }
        }

        // Button 2
        const s2b2 = document.getElementById('customSection2Btn2');
        const s2b2Text = document.getElementById('customSection2Btn2Text');
        if (s2b2 && s2b2Text) {
          if (s2Btn2Text && s2Btn2Text.trim()) {
            s2b2Text.textContent = s2Btn2Text.trim();
            s2b2.href = s2Btn2Url;
            s2b2.className = s2DarkText
              ? "inline-flex items-center gap-3 border border-black/30 text-black font-bold uppercase tracking-widest px-8 md:px-10 py-4 md:py-5 rounded hover:border-black hover:bg-black hover:text-white transition-all duration-300"
              : "inline-flex items-center gap-3 border border-white/40 text-white font-bold uppercase tracking-widest px-8 md:px-10 py-4 md:py-5 rounded hover:border-white hover:bg-white hover:text-black transition-all duration-300";
            s2b2.classList.remove('hidden');
          } else {
            s2b2.classList.add('hidden');
          }
        }
      }
    }

    // ── Footer about paragraph & Visibility ──
    const aboutVisible = (settings.about_visible != null)
      ? Boolean(settings.about_visible)
      : (localVisibility.about_visible != null ? Boolean(localVisibility.about_visible) : true);
    if (!aboutVisible) {
      const footerAbout = document.getElementById('footerAboutText');
      if (footerAbout) footerAbout.classList.add('hidden');
    } else {
      _setTextOrHide('footerAboutText', 'footerAboutText', settings.about_text);
    }

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
    _setLink('footerFacebookLink', settings.facebook_url);
    _setLink('footerTwitterLink', settings.twitter_url);
    _setLink('footerTiktokLink', settings.tiktok_url);

    // ── WhatsApp links (footer + mobile header) ──
    const waUrl = settings.whatsapp_number
      ? `https://wa.me/${String(settings.whatsapp_number).replace(/\D/g, '')}?text=${encodeURIComponent(settings.whatsapp_message || '')}`
      : null;
    _setLink('footerWhatsappLink', waUrl);
    _setLink('mobileNavWhatsappLink', waUrl);

    // ── Social links (mobile header nav) ──
    _setLink('mobileNavInstagramLink', settings.instagram_url);
    _setLink('mobileNavFacebookLink', settings.facebook_url);
    _setLink('mobileNavTwitterLink', settings.twitter_url);
    _setLink('mobileNavTiktokLink', settings.tiktok_url);

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
// Color Helper
// ────────────────────────────────────────────────────────────
function _isDarkColor(colorHex) {
  if (!colorHex) return false;
  let hex = String(colorHex).replace('#', '').trim();
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
}

// ────────────────────────────────────────────────────────────
// Hero Background Slider (Fixed 4s Smooth Transition)
// ────────────────────────────────────────────────────────────
let heroSliderTimer = null;
let heroCurrentSlideIndex = 0;
const HERO_FIXED_INTERVAL_MS = 4000;

function initHeroSlider(imagesList) {
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
    if (heroSliderTimer) {
      clearInterval(heroSliderTimer);
      heroSliderTimer = null;
    }
    if (validImages.length > 1) {
      heroSliderTimer = setInterval(nextSlide, HERO_FIXED_INTERVAL_MS);
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

  // Tab visibility: pause while hidden to avoid queuing timers, restart smoothly when visible
  if (!window._heroSliderVisibilityBound) {
    window._heroSliderVisibilityBound = true;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (heroSliderTimer) {
          clearInterval(heroSliderTimer);
          heroSliderTimer = null;
        }
      } else {
        restartTimer();
      }
    });
  }

  // Touch swipe support (without hover pause so mouse over hero does not freeze rotation)
  const heroSection = container.closest('section');
  if (heroSection && !heroSection._hasSliderEvents && validImages.length > 1) {
    heroSection._hasSliderEvents = true;

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
      } catch (_) { }
      initHeroSlider(cachedImages);
    }
  });
}

