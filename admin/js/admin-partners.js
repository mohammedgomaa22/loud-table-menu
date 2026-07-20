let editingPartnerId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const auth = await initAdminShell();
  if (!auth) return;

  const form           = document.getElementById('partnerForm');
  const tableBody      = document.getElementById('partnersTableBody');
  const toggleBtn      = document.getElementById('togglePartnerFormBtn');
  const cancelBtn      = document.getElementById('cancelPartnerFormBtn');
  const formPanel      = document.getElementById('addPartnerForm');
  const saveBtn        = document.getElementById('savePartnerBtn');
  const logoUrlInput   = document.getElementById('partnerLogoUrl');
  const logoFileInput  = document.getElementById('partnerLogoFile');
  const logoPreview    = document.getElementById('partnerLogoPreview');
  const logoPlaceholder = document.getElementById('partnerLogoPlaceholder');
  const logoClearBtn   = document.getElementById('partnerLogoClearBtn');

  await loadPartners();

  if (logoUrlInput) {
    logoUrlInput.addEventListener('input', () => setLogoPreview(logoUrlInput.value.trim()));
  }

  if (logoFileInput) {
    logoFileInput.addEventListener('change', async () => {
      const file = logoFileInput.files[0];
      if (!file) return;
      await uploadPartnerLogo(file);
    });
  }

  if (logoClearBtn) {
    logoClearBtn.addEventListener('click', () => {
      logoUrlInput.value = '';
      setLogoPreview('');
    });
  }

  if (toggleBtn && formPanel) {
    toggleBtn.addEventListener('click', () => {
      resetPartnerForm();
      formPanel.classList.toggle('hidden');
    });
  }

  if (cancelBtn && formPanel) {
    cancelBtn.addEventListener('click', () => {
      resetPartnerForm();
      formPanel.classList.add('hidden');
    });
  }

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      await savePartner();
    });
  }

  if (tableBody) {
    tableBody.addEventListener('click', async (event) => {
      const editBtn = event.target.closest('[data-edit-partner]');
      const deleteBtn = event.target.closest('[data-delete-partner]');
      if (editBtn) await startEditPartner(Number(editBtn.dataset.editPartner));
      if (deleteBtn) await deletePartner(Number(deleteBtn.dataset.deletePartner));
    });
  }

  function setLogoPreview(url) {
    if (url) {
      logoPreview.src = url;
      logoPreview.classList.remove('hidden');
      logoPlaceholder.classList.add('hidden');
      logoClearBtn.classList.remove('hidden');
    } else {
      logoPreview.src = '';
      logoPreview.classList.add('hidden');
      logoPlaceholder.classList.remove('hidden');
      logoClearBtn.classList.add('hidden');
    }
  }

  async function uploadPartnerLogo(file) {
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    }

    const ext = file.name.split('.').pop();
    const path = `partners/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

    const { error } = await window.mmcSupabase.storage
      .from('site-assets')
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-check"></i> Save Partner';
    }

    if (error) {
      showToast(`Upload failed: ${error.message}`, true);
      return;
    }

    const { data: { publicUrl } } = window.mmcSupabase.storage
      .from('site-assets')
      .getPublicUrl(path);

    logoUrlInput.value = publicUrl;
    setLogoPreview(publicUrl);
    showToast('Logo uploaded.');
  }

  async function loadPartners() {
    const { data, error } = await window.mmcSupabase
      .from('partners')
      .select('id, name, logo_url, sort_order, is_active')
      .order('sort_order', { ascending: true });

    if (error) {
      showToast(error.message, true);
      return;
    }

    if (!data.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" class="p-10 text-center text-sm text-primary/50">
            <i class="fas fa-handshake text-3xl mb-3 block text-primary/20"></i>
            No partners yet. Add your first one.
          </td>
        </tr>`;
      return;
    }

    tableBody.innerHTML = data.map((partner) => `
      <tr class="hover:bg-adminbg transition-colors ${partner.is_active ? '' : 'opacity-50'}">
        <td class="p-4">
          ${partner.logo_url
            ? `<img src="${escapeHtml(partner.logo_url)}" alt="${escapeHtml(partner.name)}" class="h-12 w-auto max-w-[6rem] object-contain">`
            : `<div class="w-14 h-12 bg-secondary border border-primary/10 flex items-center justify-center text-primary/30">
                 <i class="fas fa-image"></i>
               </div>`
          }
        </td>
        <td class="p-4 font-bold text-primary text-sm uppercase tracking-wider">${escapeHtml(partner.name)}</td>
        <td class="p-4 text-center text-sm text-primary/60">${partner.sort_order}</td>
        <td class="p-4 text-right">
          <div class="flex justify-end gap-2">
            <button type="button" data-edit-partner="${partner.id}"
              class="w-8 h-8 flex items-center justify-center bg-secondary text-primary hover:bg-primary hover:text-secondary transition-colors border border-primary/10" title="Edit">
              <i class="fas fa-pen text-xs pointer-events-none"></i>
            </button>
            <button type="button" data-delete-partner="${partner.id}"
              class="w-8 h-8 flex items-center justify-center bg-secondary text-red-400 hover:bg-red-500 hover:text-white transition-colors border border-primary/10" title="Delete">
              <i class="fas fa-trash text-xs pointer-events-none"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  async function savePartner() {
    const name = document.getElementById('partnerName')?.value.trim();
    const logo_url = logoUrlInput?.value.trim();
    const sort_order = Number(document.getElementById('partnerSortOrder')?.value) || 0;

    if (!name) {
      showToast('Partner name is required.', true);
      return;
    }
    if (!logo_url) {
      showToast('Partner logo is required.', true);
      return;
    }

    const payload = { name, logo_url, sort_order, is_active: true };

    let error;
    if (editingPartnerId) {
      ({ error } = await window.mmcSupabase
        .from('partners')
        .update(payload)
        .eq('id', editingPartnerId));
    } else {
      ({ error } = await window.mmcSupabase
        .from('partners')
        .insert(payload));
    }

    if (error) {
      showToast(error.message, true);
      return;
    }

    showToast(editingPartnerId ? 'Partner updated.' : 'Partner created.');
    resetPartnerForm();
    formPanel.classList.add('hidden');
    await loadPartners();
  }

  async function startEditPartner(partnerId) {
    const { data, error } = await window.mmcSupabase
      .from('partners')
      .select('id, name, logo_url, sort_order')
      .eq('id', partnerId)
      .single();

    if (error || !data) {
      showToast('Could not load partner.', true);
      return;
    }

    editingPartnerId = data.id;
    document.getElementById('partnerName').value = data.name;
    document.getElementById('partnerSortOrder').value = data.sort_order ?? 0;
    logoUrlInput.value = data.logo_url || '';
    setLogoPreview(data.logo_url || '');

    document.getElementById('partnerFormTitle').textContent = 'Edit Partner';
    formPanel.classList.remove('hidden');
    formPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function deletePartner(partnerId) {
    if (!confirm('Delete this partner?')) return;

    const { error } = await window.mmcSupabase
      .from('partners')
      .delete()
      .eq('id', partnerId);

    if (error) {
      showToast(error.message, true);
      return;
    }

    showToast('Partner deleted.');
    await loadPartners();
  }

  function resetPartnerForm() {
    editingPartnerId = null;
    form?.reset();
    document.getElementById('partnerSortOrder').value = '0';
    if (logoFileInput) logoFileInput.value = '';
    setLogoPreview('');
    document.getElementById('partnerFormTitle').textContent = 'Add Partner';
    if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-check"></i> Save Partner';
  }
});
