document.addEventListener('DOMContentLoaded', async () => {
  const auth = await initAdminShell();
  if (!auth) return;

  const form = document.getElementById('settingsForm');
  const saveBtn = document.getElementById('saveSettingsBtn');

  let currentHeroImages = [];

  await loadSettings();
  setupBrandingListeners();
  setupHeroSliderListeners();

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      await saveSettings();
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      await saveSettings();
    });
  }

  async function loadSettings() {
    const { data, error } = await window.mmcSupabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      showToast(error.message, true);
      return;
    }

    document.getElementById('websiteTitle').value    = data.website_title    || '';
    document.getElementById('metaDescription').value = data.meta_description  || '';
    document.getElementById('contactEmail').value    = data.contact_email     || '';
    document.getElementById('contactPhone').value    = data.contact_phone     || '';
    document.getElementById('aboutText').value       = data.about_text        || '';
    document.getElementById('addressText').value     = data.address           || '';
    
    // Branding
    const logoVal = data.logo_url || '';
    const faviconVal = data.favicon_url || '';
    const heroVal = data.hero_image_url || '';

    document.getElementById('logoUrl').value = logoVal;
    document.getElementById('faviconUrl').value = faviconVal;
    if (document.getElementById('heroImageUrl')) {
      document.getElementById('heroImageUrl').value = heroVal;
    }

    if (logoVal && document.getElementById('logoPreview')) document.getElementById('logoPreview').src = logoVal;
    if (faviconVal && document.getElementById('faviconPreview')) document.getElementById('faviconPreview').src = faviconVal;
    if (heroVal && document.getElementById('heroPreview')) document.getElementById('heroPreview').src = heroVal;

    // Hero Slider Images
    let heroImgs = [];
    if (data.hero_images) {
      if (Array.isArray(data.hero_images)) {
        heroImgs = data.hero_images;
      } else if (typeof data.hero_images === 'string') {
        try {
          heroImgs = JSON.parse(data.hero_images);
        } catch (_) {}
      }
    }
    if (!heroImgs || heroImgs.length === 0) {
      try {
        const local = JSON.parse(localStorage.getItem('mmc_hero_images') || '[]');
        if (Array.isArray(local) && local.length > 0) heroImgs = local;
      } catch (_) {}
    }
    if ((!heroImgs || heroImgs.length === 0) && heroVal) {
      heroImgs = [heroVal];
    }
    currentHeroImages = heroImgs.filter(url => typeof url === 'string' && url.trim() !== '');

    let heroInterval = Number(data.hero_slider_interval);
    if (!heroInterval || isNaN(heroInterval)) {
      try {
        heroInterval = Number(localStorage.getItem('mmc_hero_slider_interval')) || 5;
      } catch (_) {
        heroInterval = 5;
      }
    }
    const intervalSelect = document.getElementById('heroSliderInterval');
    if (intervalSelect) intervalSelect.value = String(heroInterval);

    renderHeroImagesList();

    // Hero Text Content
    document.getElementById('heroEyebrow').value       = data.hero_eyebrow       || '';
    document.getElementById('heroTitleLine1').value    = data.hero_title_line1   || '';
    document.getElementById('heroTitleLine2').value    = data.hero_title_line2   || '';
    document.getElementById('heroTitleAccent').value   = data.hero_title_accent  || '';
    document.getElementById('heroSubtitle').value      = data.hero_subtitle      || '';
    document.getElementById('heroCtaPrimary').value    = data.hero_cta_primary   || '';
    document.getElementById('heroCtaSecondary').value  = data.hero_cta_secondary || '';

    // Catering & Orders (with localStorage fallback if not in DB yet)
    let localCatering = {};
    try {
      localCatering = JSON.parse(localStorage.getItem('mmc_catering_settings') || '{}');
    } catch (_) {}

    document.getElementById('cateringEyebrow').value       = data.catering_eyebrow       ?? (localCatering.catering_eyebrow       ?? '');
    document.getElementById('cateringTitle').value         = data.catering_title         ?? (localCatering.catering_title         ?? '');
    document.getElementById('cateringTitleAccent').value    = data.catering_title_accent  ?? (localCatering.catering_title_accent  ?? '');
    document.getElementById('cateringDescription').value   = data.catering_description   ?? (localCatering.catering_description   ?? '');
    document.getElementById('cateringCtaPrimary').value    = data.catering_cta_primary   ?? (localCatering.catering_cta_primary   ?? '');
    document.getElementById('cateringCtaSecondary').value  = data.catering_cta_secondary ?? (localCatering.catering_cta_secondary ?? '');

    document.getElementById('instagramUrl').value    = data.instagram_url     || '';
    document.getElementById('facebookUrl').value     = data.facebook_url      || '';
    document.getElementById('twitterUrl').value      = data.twitter_url       || '';
    document.getElementById('tiktokUrl').value       = data.tiktok_url        || '';
    document.getElementById('whatsappNumber').value  = data.whatsapp_number   || '';
    document.getElementById('whatsappMessage').value = data.whatsapp_message  || '';
  }

  function renderHeroImagesList() {
    const listEl = document.getElementById('heroImagesList');
    const emptyEl = document.getElementById('heroImagesEmpty');
    const countEl = document.getElementById('heroImagesCount');
    const hiddenInput = document.getElementById('heroImageUrl');
    const previewImg = document.getElementById('heroPreview');

    if (countEl) countEl.textContent = currentHeroImages.length;

    if (hiddenInput) {
      hiddenInput.value = currentHeroImages.length > 0 ? currentHeroImages[0] : '';
    }
    if (previewImg && currentHeroImages.length > 0) {
      previewImg.src = currentHeroImages[0];
    }

    if (!listEl) return;
    listEl.innerHTML = '';

    if (currentHeroImages.length === 0) {
      if (emptyEl) emptyEl.classList.remove('hidden');
      return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');

    currentHeroImages.forEach((imgUrl, index) => {
      const card = document.createElement('div');
      card.className = 'relative bg-secondary border border-primary/20 p-2 shadow-sm group hover:border-black transition-all';

      const isFirst = index === 0;
      const isLast = index === currentHeroImages.length - 1;

      card.innerHTML = `
        <div class="relative w-full h-32 bg-neutral-100 overflow-hidden mb-2 border border-primary/10">
          <img src="${imgUrl}" alt="Hero slide ${index + 1}" class="w-full h-full object-cover">
          <div class="absolute top-1 left-1 bg-black/80 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 backdrop-blur-sm">
            ${isFirst ? '★ Cover' : `#${index + 1}`}
          </div>
        </div>
        <div class="flex items-center justify-between gap-1">
          <div class="flex items-center gap-1">
            <button type="button" data-action="move-left" ${isFirst ? 'disabled' : ''}
              class="w-7 h-7 flex items-center justify-center border border-primary/20 text-xs text-primary hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-primary transition-colors cursor-pointer"
              title="Move Earlier">
              <i class="fas fa-arrow-left"></i>
            </button>
            <button type="button" data-action="move-right" ${isLast ? 'disabled' : ''}
              class="w-7 h-7 flex items-center justify-center border border-primary/20 text-xs text-primary hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-primary transition-colors cursor-pointer"
              title="Move Later">
              <i class="fas fa-arrow-right"></i>
            </button>
          </div>
          <button type="button" data-action="delete"
            class="w-7 h-7 flex items-center justify-center border border-red-200 text-xs text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
            title="Delete Slide">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      `;

      card.querySelector('[data-action="move-left"]')?.addEventListener('click', () => {
        if (index > 0) {
          const temp = currentHeroImages[index];
          currentHeroImages[index] = currentHeroImages[index - 1];
          currentHeroImages[index - 1] = temp;
          renderHeroImagesList();
        }
      });

      card.querySelector('[data-action="move-right"]')?.addEventListener('click', () => {
        if (index < currentHeroImages.length - 1) {
          const temp = currentHeroImages[index];
          currentHeroImages[index] = currentHeroImages[index + 1];
          currentHeroImages[index + 1] = temp;
          renderHeroImagesList();
        }
      });

      card.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
        currentHeroImages.splice(index, 1);
        renderHeroImagesList();
        showToast('Slide removed.');
      });

      listEl.appendChild(card);
    });
  }

  function setupHeroSliderListeners() {
    const multiFileInput = document.getElementById('heroSliderFilesInput');
    if (multiFileInput) {
      multiFileInput.addEventListener('change', async () => {
        const files = Array.from(multiFileInput.files || []);
        if (files.length === 0) return;

        showToast(`Uploading ${files.length} image(s)...`);

        let uploadSuccessCount = 0;
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
          const filePath = `${fileName}`;

          const { data, error } = await window.mmcSupabase.storage
            .from('site-assets')
            .upload(filePath, file, { cacheControl: '3600', upsert: false });

          if (error) {
            console.error('Upload failed for file', file.name, error);
            showToast(`Upload failed for ${file.name}: ${error.message}`, true);
          } else {
            const { data: { publicUrl } } = window.mmcSupabase.storage
              .from('site-assets')
              .getPublicUrl(filePath);
            currentHeroImages.push(publicUrl);
            uploadSuccessCount++;
          }
        }

        multiFileInput.value = '';
        renderHeroImagesList();
        if (uploadSuccessCount > 0) {
          showToast(`${uploadSuccessCount} slide image(s) added! Click Save to apply.`);
        }
      });
    }

    const addUrlBtn = document.getElementById('heroAddUrlBtn');
    const addUrlInput = document.getElementById('heroAddUrlInput');
    if (addUrlBtn && addUrlInput) {
      const handleAddUrl = () => {
        const url = addUrlInput.value.trim();
        if (!url) return;
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('./') && !url.startsWith('/')) {
          showToast('Please enter a valid image URL (http:// or https://)', true);
          return;
        }
        currentHeroImages.push(url);
        addUrlInput.value = '';
        renderHeroImagesList();
        showToast('Image URL added to slider! Click Save to apply.');
      };

      addUrlBtn.addEventListener('click', handleAddUrl);
      addUrlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddUrl();
        }
      });
    }
  }

  async function saveSettings() {
    const cateringData = {
      catering_eyebrow:       document.getElementById('cateringEyebrow').value.trim() || null,
      catering_title:         document.getElementById('cateringTitle').value.trim() || null,
      catering_title_accent:  document.getElementById('cateringTitleAccent').value.trim() || null,
      catering_description:   document.getElementById('cateringDescription').value.trim() || null,
      catering_cta_primary:   document.getElementById('cateringCtaPrimary').value.trim() || null,
      catering_cta_secondary: document.getElementById('cateringCtaSecondary').value.trim() || null
    };

    const heroIntervalVal = parseInt(document.getElementById('heroSliderInterval')?.value, 10) || 5;

    // Save locally immediately
    try {
      localStorage.setItem('mmc_catering_settings', JSON.stringify(cateringData));
      localStorage.setItem('mmc_hero_images', JSON.stringify(currentHeroImages));
      localStorage.setItem('mmc_hero_slider_interval', String(heroIntervalVal));
    } catch (_) {}

    const payload = {
      website_title:    document.getElementById('websiteTitle').value.trim(),
      meta_description: document.getElementById('metaDescription').value.trim() || null,
      contact_email:    document.getElementById('contactEmail').value.trim(),
      contact_phone:    document.getElementById('contactPhone').value.trim(),
      about_text:       document.getElementById('aboutText').value.trim(),
      address:          document.getElementById('addressText').value.trim() || null,
      logo_url:         document.getElementById('logoUrl').value.trim() || null,
      favicon_url:      document.getElementById('faviconUrl').value.trim() || null,
      hero_image_url:   currentHeroImages.length > 0 ? currentHeroImages[0] : null,
      hero_images:      currentHeroImages,
      hero_slider_interval: heroIntervalVal,
      hero_eyebrow:     document.getElementById('heroEyebrow').value.trim() || null,
      hero_title_line1: document.getElementById('heroTitleLine1').value.trim() || null,
      hero_title_line2: document.getElementById('heroTitleLine2').value.trim() || null,
      hero_title_accent: document.getElementById('heroTitleAccent').value.trim() || null,
      hero_subtitle:    document.getElementById('heroSubtitle').value.trim() || null,
      hero_cta_primary: document.getElementById('heroCtaPrimary').value.trim() || null,
      hero_cta_secondary: document.getElementById('heroCtaSecondary').value.trim() || null,
      ...cateringData,
      instagram_url:    document.getElementById('instagramUrl').value.trim() || null,
      facebook_url:     document.getElementById('facebookUrl').value.trim() || null,
      twitter_url:      document.getElementById('twitterUrl').value.trim() || null,
      tiktok_url:       document.getElementById('tiktokUrl').value.trim() || null,
      whatsapp_number:  document.getElementById('whatsappNumber').value.trim(),
      whatsapp_message: document.getElementById('whatsappMessage').value.trim()
    };

    let { error } = await window.mmcSupabase
      .from('site_settings')
      .update(payload)
      .eq('id', 1);

    // If database table doesn't have catering or hero slider columns yet, save without them so other fields save successfully
    if (error && error.message && (error.message.includes('catering_') || error.message.includes('hero_images') || error.message.includes('hero_slider_interval'))) {
      const fallbackPayload = { ...payload };
      if (error.message.includes('catering_')) {
        delete fallbackPayload.catering_eyebrow;
        delete fallbackPayload.catering_title;
        delete fallbackPayload.catering_title_accent;
        delete fallbackPayload.catering_description;
        delete fallbackPayload.catering_cta_primary;
        delete fallbackPayload.catering_cta_secondary;
      }
      if (error.message.includes('hero_images') || error.message.includes('hero_slider_interval')) {
        delete fallbackPayload.hero_images;
        delete fallbackPayload.hero_slider_interval;
      }

      const retryRes = await window.mmcSupabase
        .from('site_settings')
        .update(fallbackPayload)
        .eq('id', 1);

      if (!retryRes.error) {
        showToast('Settings saved. (Hero slider saved locally - run 13_hero_slider.sql in Supabase to sync to database)');
        return;
      }
      error = retryRes.error;
    }

    if (error) {
      showToast(error.message, true);
      return;
    }

    showToast('Settings saved successfully.');
  }

  function setupBrandingListeners() {
    // Manual URL inputs change previews
    const logoInput = document.getElementById('logoUrl');
    const logoPreview = document.getElementById('logoPreview');
    if (logoInput && logoPreview) {
      logoInput.addEventListener('input', () => {
        logoPreview.src = logoInput.value.trim() || '../assets/images/logo.webp';
      });
    }

    const faviconInput = document.getElementById('faviconUrl');
    const faviconPreview = document.getElementById('faviconPreview');
    if (faviconInput && faviconPreview) {
      faviconInput.addEventListener('input', () => {
        faviconPreview.src = faviconInput.value.trim() || '../assets/images/favicon.webp';
      });
    }

    // File inputs upload to Supabase Storage
    const logoFileInput = document.getElementById('logoFileInput');
    if (logoFileInput) {
      logoFileInput.addEventListener('change', () => handleFileUpload(logoFileInput, 'logoUrl', 'logoPreview'));
    }

    const faviconFileInput = document.getElementById('faviconFileInput');
    if (faviconFileInput) {
      faviconFileInput.addEventListener('change', () => handleFileUpload(faviconFileInput, 'faviconUrl', 'faviconPreview'));
    }
  }

  async function handleFileUpload(fileInput, urlInputId, previewImgId) {
    const file = fileInput.files[0];
    if (!file) return;

    showToast('Uploading file...');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${fileName}`; // Upload directly into the bucket root

    const { data, error } = await window.mmcSupabase.storage
      .from('site-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      showToast(`Upload failed: ${error.message}`, true);
      return;
    }

    const { data: { publicUrl } } = window.mmcSupabase.storage
      .from('site-assets')
      .getPublicUrl(filePath);

    document.getElementById(urlInputId).value = publicUrl;
    if (document.getElementById(previewImgId)) {
      document.getElementById(previewImgId).src = publicUrl;
    }
    showToast('File uploaded successfully!');
  }
});
