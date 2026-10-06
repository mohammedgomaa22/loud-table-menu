document.addEventListener('DOMContentLoaded', async () => {
  const auth = await initAdminShell();
  if (!auth) return;

  const form = document.getElementById('settingsForm');
  const saveBtn = document.getElementById('saveSettingsBtn');

  await loadSettings();
  setupBrandingListeners();

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      await saveSettings();
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async (event) => {
      event.preventDefault();
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

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    setVal('websiteTitle',    data.website_title);
    setVal('metaDescription', data.meta_description);
    setVal('contactEmail',    data.contact_email);
    setVal('contactPhone',    data.contact_phone);

    // Branding
    const logoVal = data.logo_url || '';
    const faviconVal = data.favicon_url || '';

    setVal('logoUrl', logoVal);
    setVal('faviconUrl', faviconVal);

    if (logoVal && document.getElementById('logoPreview')) document.getElementById('logoPreview').src = logoVal;
    if (faviconVal && document.getElementById('faviconPreview')) document.getElementById('faviconPreview').src = faviconVal;

    // Social Links & WhatsApp
    setVal('instagramUrl',    data.instagram_url);
    setVal('facebookUrl',     data.facebook_url);
    setVal('twitterUrl',      data.twitter_url);
    setVal('tiktokUrl',       data.tiktok_url);
    setVal('whatsappNumber',  data.whatsapp_number);
    setVal('whatsappMessage', data.whatsapp_message);
  }

  async function saveSettings() {
    const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };

    const payload = {
      website_title:    getVal('websiteTitle'),
      meta_description: getVal('metaDescription') || null,
      contact_email:    getVal('contactEmail'),
      contact_phone:    getVal('contactPhone'),
      logo_url:         getVal('logoUrl') || null,
      favicon_url:      getVal('faviconUrl') || null,
      instagram_url:    getVal('instagramUrl') || null,
      facebook_url:     getVal('facebookUrl') || null,
      twitter_url:      getVal('twitterUrl') || null,
      tiktok_url:       getVal('tiktokUrl') || null,
      whatsapp_number:  getVal('whatsappNumber'),
      whatsapp_message: getVal('whatsappMessage')
    };

    showToast('Saving settings...');

    const { error } = await window.mmcSupabase
      .from('site_settings')
      .update(payload)
      .eq('id', 1);

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
    const filePath = `${fileName}`;

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
