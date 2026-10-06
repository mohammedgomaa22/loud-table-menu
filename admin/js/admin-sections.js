document.addEventListener('DOMContentLoaded', async () => {
  const auth = await initAdminShell();
  if (!auth) return;

  const form = document.getElementById('sectionsForm');
  const saveBtn = document.getElementById('saveSectionsBtn');
  const topSaveBtn = document.getElementById('topSaveBtn');

  let currentHeroImages = [];

  // Initialize UI features
  setupTabs();
  setupVisibilityToggles();
  setupLinkChips();

  // Load existing section data
  await loadSections();

  // Setup hero slider upload and URL handlers
  setupHeroSliderListeners();

  // Setup custom sections background image upload and preview handlers
  setupCustomSectionImageListeners();

  // Setup custom sections limited color controls and presets
  setupCustomSectionColorListeners();

  // Save event listeners
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveSections();
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await saveSections();
    });
  }

  if (topSaveBtn) {
    topSaveBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await saveSections();
    });
  }

  function setupTabs() {
    const tabButtons = document.querySelectorAll('.section-tab-btn');
    const tabContents = document.querySelectorAll('.section-tab-content');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab-target');

        // Update button states
        tabButtons.forEach(b => {
          b.classList.remove('active', 'bg-primary', 'text-secondary', 'shadow-[3px_3px_0_0_#2E2B29]');
          b.classList.add('bg-white', 'text-primary');
        });
        btn.classList.add('active', 'bg-primary', 'text-secondary', 'shadow-[3px_3px_0_0_#2E2B29]');
        btn.classList.remove('bg-white', 'text-primary');

        // Show target content
        if (targetId === 'tab-all') {
          tabContents.forEach(content => content.classList.remove('hidden'));
        } else {
          tabContents.forEach(content => {
            if (content.id === targetId) {
              content.classList.remove('hidden');
            } else {
              content.classList.add('hidden');
            }
          });
        }
      });
    });
  }

  function setupVisibilityToggles() {
    const toggles = [
      { id: 'heroVisible', badgeId: 'heroVisibleBadge' },
      { id: 'cateringVisible', badgeId: 'cateringVisibleBadge' },
      { id: 'menuVisible',     badgeId: 'menuVisibleBadge' },
      { id: 'contactVisible',  badgeId: 'contactVisibleBadge' },
      { id: 'section1Visible', badgeId: 'section1VisibleBadge' },
      { id: 'section2Visible', badgeId: 'section2VisibleBadge' },
    ];

    toggles.forEach(({ id, badgeId }) => {
      const checkbox = document.getElementById(id);
      const badge = document.getElementById(badgeId);
      if (!checkbox || !badge) return;

      const updateBadge = () => {
        if (checkbox.checked) {
          badge.className = 'text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border bg-emerald-100 text-emerald-800 border-emerald-300 flex items-center gap-1.5';
          badge.innerHTML = '<i class="fas fa-eye"></i> Visible';
        } else {
          badge.className = 'text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border bg-neutral-100 text-neutral-600 border-neutral-300 flex items-center gap-1.5';
          badge.innerHTML = '<i class="fas fa-eye-slash"></i> Hidden';
        }
      };

      checkbox.addEventListener('change', updateBadge);
      updateBadge();
    });
  }

  function setupLinkChips() {
    document.querySelectorAll('.link-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const targetInputId = chip.getAttribute('data-target');
        const targetValue = chip.getAttribute('data-value');
        const input = document.getElementById(targetInputId);
        if (input && targetValue) {
          input.value = targetValue;
          input.focus();
          showToast(`Link set to: ${targetValue}`);
        }
      });
    });
  }

  async function loadSections() {
    try {
      const { data, error } = await window.mmcSupabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) {
        showToast(error.message, true);
        return;
      }

      // Local storage fallbacks
      let localVisibility = {};
      try {
        localVisibility = JSON.parse(localStorage.getItem('mmc_section_visibility') || '{}');
      } catch (_) {}

      let localLinks = {};
      try {
        localLinks = JSON.parse(localStorage.getItem('mmc_section_links') || '{}');
      } catch (_) {}

      // Helpers
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
      };

      const setCheck = (id, val, fallback) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (val !== undefined && val !== null) {
          el.checked = Boolean(val);
        } else if (fallback !== undefined && fallback !== null) {
          el.checked = Boolean(fallback);
        } else {
          el.checked = true;
        }
        el.dispatchEvent(new Event('change'));
      };

      // ── Visibility Toggles ──
      setCheck('heroVisible',     data.hero_visible,     localVisibility.hero_visible);
      setCheck('cateringVisible', data.catering_visible, localVisibility.catering_visible);
      setCheck('menuVisible',     data.menu_visible,     localVisibility.menu_visible);
      setCheck('contactVisible',  data.contact_visible,  localVisibility.contact_visible);
      setCheck('aboutVisible',    data.about_visible,    localVisibility.about_visible);

      // ── Hero Texts & Links ──
      setVal('heroEyebrow', data.hero_eyebrow);
      setVal('heroTitleLine1', data.hero_title_line1);
      setVal('heroTitleLine2', data.hero_title_line2);
      setVal('heroTitleAccent', data.hero_title_accent);
      setVal('heroSubtitle', data.hero_subtitle);
      setVal('heroCtaPrimary', data.hero_cta_primary);
      setVal('heroCtaSecondary', data.hero_cta_secondary);

      setVal('heroCtaPrimaryUrl',   data.hero_cta_primary_url   || localLinks.hero_cta_primary_url   || '#menu');
      setVal('heroCtaSecondaryUrl', data.hero_cta_secondary_url || localLinks.hero_cta_secondary_url || '#contact');

      // ── Hero Slider Images ──
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

      if ((!heroImgs || heroImgs.length === 0) && data.hero_image_url) {
        heroImgs = [data.hero_image_url];
      }

      currentHeroImages = (heroImgs || []).filter(url => typeof url === 'string' && url.trim() !== '');

      renderHeroImagesList();

      // ── Catering & Orders ──
      let localCatering = {};
      try {
        localCatering = JSON.parse(localStorage.getItem('mmc_catering_settings') || '{}');
      } catch (_) {}

      setVal('cateringEyebrow', data.catering_eyebrow ?? (localCatering.catering_eyebrow ?? ''));
      setVal('cateringTitle', data.catering_title ?? (localCatering.catering_title ?? ''));
      setVal('cateringTitleAccent', data.catering_title_accent ?? (localCatering.catering_title_accent ?? ''));
      setVal('cateringDescription', data.catering_description ?? (localCatering.catering_description ?? ''));
      setVal('cateringCtaPrimary', data.catering_cta_primary ?? (localCatering.catering_cta_primary ?? ''));
      setVal('cateringCtaSecondary', data.catering_cta_secondary ?? (localCatering.catering_cta_secondary ?? ''));

      setVal('cateringCtaPrimaryUrl',   data.catering_cta_primary_url   || localLinks.catering_cta_primary_url   || '#contact');
      setVal('cateringCtaSecondaryUrl', data.catering_cta_secondary_url || localLinks.catering_cta_secondary_url || '#menu');

      // ── About & Address (kept for footer use) ──
      setVal('aboutText', data.about_text);
      setVal('addressText', data.address);

      // ── Custom Section 1 & 2 LocalStorage fallbacks ──
      let localCustom = {};
      try {
        localCustom = JSON.parse(localStorage.getItem('mmc_custom_sections') || '{}');
      } catch (_) {}
      const s1Local = localCustom.section1 || {};
      const s2Local = localCustom.section2 || {};

      // ── Custom Section 1 ──
      setCheck('section1Visible', data.section1_visible, localVisibility.section1_visible ?? s1Local.visible);
      setVal('section1BgUrl',    data.section1_bg_image    ?? (s1Local.bg_image || ''));
      setVal('section1BgColor',   data.section1_bg_color   ?? (s1Local.bg_color || '#000000'));
      setVal('section1TextColor', data.section1_text_color ?? (s1Local.text_color || '#ffffff'));
      setVal('section1Title',    data.section1_title       ?? (s1Local.title || ''));
      setVal('section1Subtitle', data.section1_subtitle    ?? (s1Local.subtitle || ''));
      setVal('section1Text',     data.section1_text        ?? (s1Local.text || ''));
      setVal('section1Btn1Text', data.section1_btn1_text   ?? (s1Local.btn1_text || ''));
      setVal('section1Btn1Url',  data.section1_btn1_url    || s1Local.btn1_url || '#contact');
      setVal('section1Btn2Text', data.section1_btn2_text   ?? (s1Local.btn2_text || ''));
      setVal('section1Btn2Url',  data.section1_btn2_url    || s1Local.btn2_url || '#menu');
      _showBgPreview('section1BgUrl', 'section1BgPreview', 'section1BgPreviewWrap');
      _updateColorPreview('section1BgColor', 'section1TextColor', 'section1ColorPreviewBox');

      // ── Custom Section 2 ──
      setCheck('section2Visible', data.section2_visible, localVisibility.section2_visible ?? s2Local.visible);
      setVal('section2BgUrl',    data.section2_bg_image    ?? (s2Local.bg_image || ''));
      setVal('section2BgColor',   data.section2_bg_color   ?? (s2Local.bg_color || '#000000'));
      setVal('section2TextColor', data.section2_text_color ?? (s2Local.text_color || '#ffffff'));
      setVal('section2Title',    data.section2_title       ?? (s2Local.title || ''));
      setVal('section2Subtitle', data.section2_subtitle    ?? (s2Local.subtitle || ''));
      setVal('section2Text',     data.section2_text        ?? (s2Local.text || ''));
      setVal('section2Btn1Text', data.section2_btn1_text   ?? (s2Local.btn1_text || ''));
      setVal('section2Btn1Url',  data.section2_btn1_url    || s2Local.btn1_url || '#contact');
      setVal('section2Btn2Text', data.section2_btn2_text   ?? (s2Local.btn2_text || ''));
      setVal('section2Btn2Url',  data.section2_btn2_url    || s2Local.btn2_url || '#menu');
      _showBgPreview('section2BgUrl', 'section2BgPreview', 'section2BgPreviewWrap');
      _updateColorPreview('section2BgColor', 'section2TextColor', 'section2ColorPreviewBox');

    } catch (err) {
      console.error('Failed to load sections data:', err);
      showToast('Error loading section details.', true);
    }
  }

  function _showBgPreview(urlInputId, previewImgId, previewWrapId) {
    const urlEl = document.getElementById(urlInputId);
    const previewImg = document.getElementById(previewImgId);
    const previewWrap = document.getElementById(previewWrapId);
    if (!urlEl || !previewImg || !previewWrap) return;
    const url = urlEl.value.trim();
    if (url) {
      previewImg.src = url;
      previewWrap.classList.remove('hidden');
    } else {
      previewWrap.classList.add('hidden');
    }
  }

  function _updateColorPreview(bgSelectId, textSelectId, previewBoxId) {
    const bgEl = document.getElementById(bgSelectId);
    const textEl = document.getElementById(textSelectId);
    const box = document.getElementById(previewBoxId);
    if (box && bgEl && textEl) {
      box.style.backgroundColor = bgEl.value;
      box.style.color = textEl.value;
    }
  }

  function renderHeroImagesList() {
    const listEl = document.getElementById('heroImagesList');
    const emptyEl = document.getElementById('heroImagesEmpty');
    const countEl = document.getElementById('heroImagesCount');
    const badgeEl = document.getElementById('tabHeroBadge');
    const hiddenInput = document.getElementById('heroImageUrl');
    const previewImg = document.getElementById('heroPreview');

    if (countEl) countEl.textContent = currentHeroImages.length;
    if (badgeEl) badgeEl.textContent = `${currentHeroImages.length} slide${currentHeroImages.length === 1 ? '' : 's'}`;

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
      card.className = 'relative bg-secondary border border-primary/20 p-2.5 shadow-sm group hover:border-black transition-all';

      const isFirst = index === 0;
      const isLast = index === currentHeroImages.length - 1;

      card.innerHTML = `
        <div class="relative w-full h-32 bg-neutral-900 overflow-hidden mb-2 border border-primary/10">
          <img src="${imgUrl}" alt="Hero slide ${index + 1}" class="w-full h-full object-cover">
          <div class="absolute top-1 left-1 bg-black/85 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 backdrop-blur-sm border border-white/20">
            ${isFirst ? '★ Primary Cover' : `#${index + 1}`}
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

  function setupCustomSectionImageListeners() {
    const bindUploader = (inputId, urlInputId, previewImgId, previewWrapId, clearBtnId) => {
      const fileInput = document.getElementById(inputId);
      const urlInput = document.getElementById(urlInputId);
      const clearBtn = document.getElementById(clearBtnId);

      if (urlInput) {
        urlInput.addEventListener('input', () => {
          _showBgPreview(urlInputId, previewImgId, previewWrapId);
        });
      }

      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          if (urlInput) urlInput.value = '';
          _showBgPreview(urlInputId, previewImgId, previewWrapId);
        });
      }

      if (fileInput) {
        fileInput.addEventListener('change', async () => {
          const file = fileInput.files && fileInput.files[0];
          if (!file) return;

          showToast('Uploading background image...');
          const fileExt = file.name.split('.').pop();
          const fileName = `custom-sec-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
          const filePath = `${fileName}`;

          const { data, error } = await window.mmcSupabase.storage
            .from('site-assets')
            .upload(filePath, file, { cacheControl: '3600', upsert: false });

          if (error) {
            console.error('Upload failed:', error);
            showToast(`Upload failed: ${error.message}`, true);
          } else {
            const { data: { publicUrl } } = window.mmcSupabase.storage
              .from('site-assets')
              .getPublicUrl(filePath);

            if (urlInput) urlInput.value = publicUrl;
            _showBgPreview(urlInputId, previewImgId, previewWrapId);
            showToast('Background image uploaded! Click Save to apply.');
          }
          fileInput.value = '';
        });
      }
    };

    bindUploader('section1BgInput', 'section1BgUrl', 'section1BgPreview', 'section1BgPreviewWrap', 'section1BgClear');
    bindUploader('section2BgInput', 'section2BgUrl', 'section2BgPreview', 'section2BgPreviewWrap', 'section2BgClear');
  }

  function setupCustomSectionColorListeners() {
    const updatePreview = (bgSelectId, textSelectId, previewBoxId) => {
      const bgEl = document.getElementById(bgSelectId);
      const textEl = document.getElementById(textSelectId);
      const box = document.getElementById(previewBoxId);
      if (box && bgEl && textEl) {
        box.style.backgroundColor = bgEl.value;
        box.style.color = textEl.value;
      }
    };

    ['section1', 'section2'].forEach(sec => {
      const bgSelect = document.getElementById(`${sec}BgColor`);
      const textSelect = document.getElementById(`${sec}TextColor`);
      const previewBox = `${sec}ColorPreviewBox`;

      if (bgSelect) {
        bgSelect.addEventListener('change', () => updatePreview(`${sec}BgColor`, `${sec}TextColor`, previewBox));
      }
      if (textSelect) {
        textSelect.addEventListener('change', () => updatePreview(`${sec}BgColor`, `${sec}TextColor`, previewBox));
      }
    });

    // Handle color-chip clicks
    document.querySelectorAll('.color-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const targetId = chip.getAttribute('data-target');
        const val = chip.getAttribute('data-value');
        const targetSelect = document.getElementById(targetId);
        if (targetSelect && val) {
          targetSelect.value = val;
          targetSelect.dispatchEvent(new Event('change'));
        }
      });
    });
  }

  async function saveSections() {
    const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };

    const getCheck = (id) => {
      const el = document.getElementById(id);
      return el ? Boolean(el.checked) : true;
    };

    const visibilityData = {
      hero_visible:     getCheck('heroVisible'),
      catering_visible: getCheck('cateringVisible'),
      menu_visible:     getCheck('menuVisible'),
      contact_visible:  getCheck('contactVisible'),
      section1_visible: getCheck('section1Visible'),
      section2_visible: getCheck('section2Visible'),
    };

    const linksData = {
      hero_cta_primary_url:       getVal('heroCtaPrimaryUrl')       || '#menu',
      hero_cta_secondary_url:     getVal('heroCtaSecondaryUrl')     || '#contact',
      catering_cta_primary_url:   getVal('cateringCtaPrimaryUrl')   || '#contact',
      catering_cta_secondary_url: getVal('cateringCtaSecondaryUrl') || '#menu'
    };

    const cateringData = {
      catering_eyebrow:       getVal('cateringEyebrow') || null,
      catering_title:         getVal('cateringTitle') || null,
      catering_title_accent:  getVal('cateringTitleAccent') || null,
      catering_description:   getVal('cateringDescription') || null,
      catering_cta_primary:   getVal('cateringCtaPrimary') || null,
      catering_cta_secondary: getVal('cateringCtaSecondary') || null
    };

    const customSectionsData = {
      section1: {
        visible: getCheck('section1Visible'),
        bg_image: getVal('section1BgUrl') || null,
        bg_color: getVal('section1BgColor') || '#000000',
        text_color: getVal('section1TextColor') || '#ffffff',
        title: getVal('section1Title') || null,
        subtitle: getVal('section1Subtitle') || null,
        text: getVal('section1Text') || null,
        btn1_text: getVal('section1Btn1Text') || null,
        btn1_url: getVal('section1Btn1Url') || '#contact',
        btn2_text: getVal('section1Btn2Text') || null,
        btn2_url: getVal('section1Btn2Url') || '#menu'
      },
      section2: {
        visible: getCheck('section2Visible'),
        bg_image: getVal('section2BgUrl') || null,
        bg_color: getVal('section2BgColor') || '#000000',
        text_color: getVal('section2TextColor') || '#ffffff',
        title: getVal('section2Title') || null,
        subtitle: getVal('section2Subtitle') || null,
        text: getVal('section2Text') || null,
        btn1_text: getVal('section2Btn1Text') || null,
        btn1_url: getVal('section2Btn1Url') || '#contact',
        btn2_text: getVal('section2Btn2Text') || null,
        btn2_url: getVal('section2Btn2Url') || '#menu'
      }
    };

    // Cache locally immediately so frontend perceives updates instantly
    try {
      localStorage.setItem('mmc_section_visibility', JSON.stringify(visibilityData));
      localStorage.setItem('mmc_section_links', JSON.stringify(linksData));
      localStorage.setItem('mmc_catering_settings', JSON.stringify(cateringData));
      localStorage.setItem('mmc_custom_sections', JSON.stringify(customSectionsData));
      localStorage.setItem('mmc_hero_images', JSON.stringify(currentHeroImages));
      localStorage.setItem('mmc_hero_slider_interval', '4');
    } catch (_) {}

    const payload = {
      ...visibilityData,
      ...linksData,
      hero_image_url:       currentHeroImages.length > 0 ? currentHeroImages[0] : null,
      hero_images:          currentHeroImages,
      hero_slider_interval: 4,
      hero_eyebrow:         getVal('heroEyebrow') || null,
      hero_title_line1:     getVal('heroTitleLine1') || null,
      hero_title_line2:     getVal('heroTitleLine2') || null,
      hero_title_accent:    getVal('heroTitleAccent') || null,
      hero_subtitle:        getVal('heroSubtitle') || null,
      hero_cta_primary:     getVal('heroCtaPrimary') || null,
      hero_cta_secondary:   getVal('heroCtaSecondary') || null,
      ...cateringData,
      about_text:           getVal('aboutText') || null,
      address:              getVal('addressText') || null,
      // Custom Section 1
      section1_bg_image:    getVal('section1BgUrl') || null,
      section1_bg_color:    getVal('section1BgColor') || '#000000',
      section1_text_color:  getVal('section1TextColor') || '#ffffff',
      section1_title:       getVal('section1Title') || null,
      section1_subtitle:    getVal('section1Subtitle') || null,
      section1_text:        getVal('section1Text') || null,
      section1_btn1_text:   getVal('section1Btn1Text') || null,
      section1_btn1_url:    getVal('section1Btn1Url') || '#contact',
      section1_btn2_text:   getVal('section1Btn2Text') || null,
      section1_btn2_url:    getVal('section1Btn2Url') || '#menu',
      // Custom Section 2
      section2_bg_image:    getVal('section2BgUrl') || null,
      section2_bg_color:    getVal('section2BgColor') || '#000000',
      section2_text_color:  getVal('section2TextColor') || '#ffffff',
      section2_title:       getVal('section2Title') || null,
      section2_subtitle:    getVal('section2Subtitle') || null,
      section2_text:        getVal('section2Text') || null,
      section2_btn1_text:   getVal('section2Btn1Text') || null,
      section2_btn1_url:    getVal('section2Btn1Url') || '#contact',
      section2_btn2_text:   getVal('section2Btn2Text') || null,
      section2_btn2_url:    getVal('section2Btn2Url') || '#menu',
    };

    showToast('Saving section changes...');

    let { error } = await window.mmcSupabase
      .from('site_settings')
      .update(payload)
      .eq('id', 1);

    // Fallback if some schema column is missing in Supabase before running SQL migration
    if (error && error.message) {
      const fallbackPayload = { ...payload };
      const missingKeywords = [
        'hero_visible', 'catering_visible', 'menu_visible', 'contact_visible', 'about_visible',
        'hero_cta_primary_url', 'hero_cta_secondary_url', 'catering_cta_primary_url', 'catering_cta_secondary_url',
        'catering_eyebrow', 'catering_title', 'catering_title_accent', 'catering_description', 'catering_cta_primary', 'catering_cta_secondary',
        'hero_images', 'hero_slider_interval',
        'section1_visible', 'section1_bg_image', 'section1_bg_color', 'section1_text_color', 'section1_title', 'section1_subtitle', 'section1_text', 'section1_btn1_text', 'section1_btn1_url', 'section1_btn2_text', 'section1_btn2_url',
        'section2_visible', 'section2_bg_image', 'section2_bg_color', 'section2_text_color', 'section2_title', 'section2_subtitle', 'section2_text', 'section2_btn1_text', 'section2_btn1_url', 'section2_btn2_text', 'section2_btn2_url'
      ];

      let strippedAny = false;
      missingKeywords.forEach(col => {
        if (error.message.includes(col)) {
          delete fallbackPayload[col];
          strippedAny = true;
        }
      });

      if (strippedAny) {
        const retryRes = await window.mmcSupabase
          .from('site_settings')
          .update(fallbackPayload)
          .eq('id', 1);

        if (!retryRes.error) {
          showToast('Changes saved! (Please run 15_section_links_and_visibility.sql & 16_custom_sections.sql in Supabase)');
          return;
        }
        error = retryRes.error;
      }
    }

    if (error) {
      showToast(error.message, true);
      return;
    }

    showToast('All sections updated and published successfully!');
  }
});
