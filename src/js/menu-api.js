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
  if (url) {
    el.href = url;
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

function _setText(id, text) {
  const el = document.getElementById(id);
  if (el && text) el.textContent = text;
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
    const settings = await fetchSiteSettings();
    if (!settings) return;

    // ── WhatsApp config (used by main.js button builder) ──
    if (settings.whatsapp_number) {
      MMC_CONFIG.whatsappNumber = String(settings.whatsapp_number).replace(/\D/g, '');
    }
    if (settings.whatsapp_message) {
      MMC_CONFIG.whatsappMessage = settings.whatsapp_message;
    }

    // ── Page title & meta description ──
    if (settings.website_title) {
      document.title = settings.website_title;
      _setText('siteTitle', settings.website_title);
      _setText('footerSiteName', settings.website_title);
    }
    if (settings.meta_description) {
      const meta = document.getElementById('siteMetaDescription');
      if (meta) meta.setAttribute('content', settings.meta_description);
    }

    // ── Website Logo (only if a real URL was uploaded) ──
    if (_isRemoteUrl(settings.logo_url)) {
      _setImgSrc('headerLogo', settings.logo_url);
      _setImgSrc('mobileMenuLogo', settings.logo_url);
      _setImgSrc('footerLogo', settings.logo_url);
    }

    // ── Website Favicon (only if a real URL was uploaded) ──
    if (_isRemoteUrl(settings.favicon_url)) {
      document.querySelectorAll('link[rel*="icon"]').forEach(link => {
        link.href = settings.favicon_url;
      });
    }

    // ── Hero Background Image (only if a real URL was uploaded) ──
    if (_isRemoteUrl(settings.hero_image_url)) {
      _setImgSrc('heroBgImage', settings.hero_image_url);
    }

    // ── About section (index.html) ──
    _setText('aboutTextPrimary', settings.about_text);
    _setText('aboutTextAddress', settings.address);

    // ── Footer about paragraph ──
    _setText('footerAboutText', settings.about_text);

    // ── Footer contact info ──
    const emailEl = document.getElementById('footerContactEmail');
    const emailItem = document.getElementById('footerEmailItem');
    if (emailEl && emailItem && settings.contact_email) {
      emailEl.href = `mailto:${settings.contact_email}`;
      emailEl.querySelector('span').textContent = settings.contact_email;
      emailItem.classList.remove('hidden');
    }

    const phoneEl = document.getElementById('footerContactPhone');
    const phoneItem = document.getElementById('footerPhoneItem');
    if (phoneEl && phoneItem && settings.contact_phone) {
      phoneEl.href = `tel:${settings.contact_phone.replace(/\s/g, '')}`;
      phoneEl.querySelector('span').textContent = settings.contact_phone;
      phoneItem.classList.remove('hidden');
    }

    const addressEl = document.getElementById('footerAddress');
    const addressItem = document.getElementById('footerAddressItem');
    if (addressEl && addressItem && settings.address) {
      addressEl.querySelector('span').textContent = settings.address;
      addressItem.classList.remove('hidden');
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

    // ── WhatsApp button in header (already has id="headerWhatsappBtn") ──
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
