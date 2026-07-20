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
    document.getElementById('heroImageUrl').value = heroVal;

    if (logoVal) document.getElementById('logoPreview').src = logoVal;
    if (faviconVal) document.getElementById('faviconPreview').src = faviconVal;
    if (heroVal) document.getElementById('heroPreview').src = heroVal;

    document.getElementById('instagramUrl').value    = data.instagram_url     || '';
    document.getElementById('facebookUrl').value     = data.facebook_url      || '';
    document.getElementById('twitterUrl').value      = data.twitter_url       || '';
    document.getElementById('tiktokUrl').value       = data.tiktok_url        || '';
    document.getElementById('whatsappNumber').value  = data.whatsapp_number   || '';
    document.getElementById('whatsappMessage').value = data.whatsapp_message  || '';
  }

  async function saveSettings() {
    const payload = {
      website_title:    document.getElementById('websiteTitle').value.trim(),
      meta_description: document.getElementById('metaDescription').value.trim() || null,
      contact_email:    document.getElementById('contactEmail').value.trim(),
      contact_phone:    document.getElementById('contactPhone').value.trim(),
      about_text:       document.getElementById('aboutText').value.trim(),
      address:          document.getElementById('addressText').value.trim() || null,
      logo_url:         document.getElementById('logoUrl').value.trim() || null,
      favicon_url:      document.getElementById('faviconUrl').value.trim() || null,
      hero_image_url:   document.getElementById('heroImageUrl').value.trim() || null,
      instagram_url:    document.getElementById('instagramUrl').value.trim() || null,
      facebook_url:     document.getElementById('facebookUrl').value.trim() || null,
      twitter_url:      document.getElementById('twitterUrl').value.trim() || null,
      tiktok_url:       document.getElementById('tiktokUrl').value.trim() || null,
      whatsapp_number:  document.getElementById('whatsappNumber').value.trim(),
      whatsapp_message: document.getElementById('whatsappMessage').value.trim()
    };

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

    const heroInput = document.getElementById('heroImageUrl');
    const heroPreview = document.getElementById('heroPreview');
    if (heroInput && heroPreview) {
      heroInput.addEventListener('input', () => {
        heroPreview.src = heroInput.value.trim() || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=200&auto=format&fit=crop';
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

    const heroFileInput = document.getElementById('heroFileInput');
    if (heroFileInput) {
      heroFileInput.addEventListener('change', () => handleFileUpload(heroFileInput, 'heroImageUrl', 'heroPreview'));
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
    document.getElementById(previewImgId).src = publicUrl;
    showToast('File uploaded successfully!');
  }
});
