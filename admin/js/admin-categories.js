let editingCategoryId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const auth = await initAdminShell();
  if (!auth) return;

  const form        = document.getElementById('categoryForm');
  const tableBody   = document.getElementById('categoriesTableBody');
  const toggleBtn   = document.getElementById('toggleCategoryFormBtn');
  const cancelBtn   = document.getElementById('cancelCategoryFormBtn');
  const formPanel   = document.getElementById('addCategoryForm');
  const nameInput   = document.getElementById('categoryName');
  const slugInput   = document.getElementById('categorySlug');
  const imageUrlInput  = document.getElementById('categoryImageUrl');
  const imageFileInput = document.getElementById('categoryImageFile');
  const imagePreview   = document.getElementById('categoryImagePreview');
  const imagePlaceholder = document.getElementById('categoryImagePlaceholder');
  const imageClearBtn  = document.getElementById('categoryImageClearBtn');
  const saveBtn        = document.getElementById('saveCategoryBtn');

  await loadCategories();

  // ── Auto-fill slug from name ──
  if (nameInput && slugInput) {
    nameInput.addEventListener('input', () => {
      if (!slugInput.dataset.manuallyEdited) {
        slugInput.value = slugify(nameInput.value);
      }
    });
    slugInput.addEventListener('input', () => {
      slugInput.dataset.manuallyEdited = slugInput.value ? 'true' : '';
    });
  }

  // ── Image URL input → live preview ──
  if (imageUrlInput) {
    imageUrlInput.addEventListener('input', () => {
      setImagePreview(imageUrlInput.value.trim());
    });
  }

  // ── File upload → Supabase Storage ──
  if (imageFileInput) {
    imageFileInput.addEventListener('change', async () => {
      const file = imageFileInput.files[0];
      if (!file) return;
      await uploadCategoryImage(file);
    });
  }

  // ── Clear image ──
  if (imageClearBtn) {
    imageClearBtn.addEventListener('click', () => {
      imageUrlInput.value = '';
      setImagePreview('');
    });
  }

  // ── Toggle form ──
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      resetCategoryForm();
      formPanel.classList.toggle('hidden');
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      resetCategoryForm();
      formPanel.classList.add('hidden');
    });
  }

  // ── Submit ──
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      await saveCategory();
    });
  }

  // ── Table actions (edit / delete) ──
  if (tableBody) {
    tableBody.addEventListener('click', async (event) => {
      const editBtn   = event.target.closest('[data-edit-category]');
      const deleteBtn = event.target.closest('[data-delete-category]');
      if (editBtn)   await startEditCategory(Number(editBtn.dataset.editCategory));
      if (deleteBtn) await deleteCategory(Number(deleteBtn.dataset.deleteCategory));
    });
  }

  // ── Helpers ──

  function setImagePreview(url) {
    if (url) {
      imagePreview.src = url;
      imagePreview.classList.remove('hidden');
      imagePlaceholder.classList.add('hidden');
      imageClearBtn.classList.remove('hidden');
    } else {
      imagePreview.src = '';
      imagePreview.classList.add('hidden');
      imagePlaceholder.classList.remove('hidden');
      imageClearBtn.classList.add('hidden');
    }
  }

  async function uploadCategoryImage(file) {
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    }

    const ext = file.name.split('.').pop();
    const path = `categories/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

    const { error } = await window.mmcSupabase.storage
      .from('site-assets')
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-check"></i> Save Category';
    }

    if (error) {
      showToast(`Upload failed: ${error.message}`, true);
      return;
    }

    const { data: { publicUrl } } = window.mmcSupabase.storage
      .from('site-assets')
      .getPublicUrl(path);

    imageUrlInput.value = publicUrl;
    setImagePreview(publicUrl);
    showToast('Image uploaded.');
  }

  async function loadCategories() {
    const { data, error } = await window.mmcSupabase
      .from('categories')
      .select('id, name, slug, description, image_url, sort_order')
      .order('sort_order', { ascending: true });

    if (error) {
      showToast(error.message, true);
      return;
    }

    if (!data.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="p-10 text-center text-sm text-primary/50">
            <i class="fas fa-layer-group text-3xl mb-3 block text-primary/20"></i>
            No categories yet. Add your first one.
          </td>
        </tr>`;
      return;
    }

    tableBody.innerHTML = data.map((cat) => `
      <tr class="hover:bg-adminbg transition-colors">
        <td class="p-4">
          ${cat.image_url
            ? `<img src="${escapeHtml(cat.image_url)}" alt="${escapeHtml(cat.name)}" class="w-14 h-14 object-cover border border-primary/10">`
            : `<div class="w-14 h-14 bg-secondary border border-primary/10 flex items-center justify-center text-primary/30">
                 <i class="fas fa-image text-xl"></i>
               </div>`
          }
        </td>
        <td class="p-4 font-bold text-primary text-sm uppercase tracking-wider">${escapeHtml(cat.name)}</td>
        <td class="p-4 text-xs text-primary/50 font-mono hidden md:table-cell">${escapeHtml(cat.slug)}</td>
        <td class="p-4 text-sm text-primary/60 hidden lg:table-cell max-w-xs truncate">${escapeHtml(cat.description || '—')}</td>
        <td class="p-4 text-right">
          <div class="flex justify-end gap-2">
            <button type="button" data-edit-category="${cat.id}"
              class="w-8 h-8 flex items-center justify-center bg-secondary text-primary hover:bg-primary hover:text-secondary transition-colors border border-primary/10" title="Edit">
              <i class="fas fa-pen text-xs pointer-events-none"></i>
            </button>
            <button type="button" data-delete-category="${cat.id}"
              class="w-8 h-8 flex items-center justify-center bg-secondary text-red-400 hover:bg-red-500 hover:text-white transition-colors border border-primary/10" title="Delete">
              <i class="fas fa-trash text-xs pointer-events-none"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  async function saveCategory() {
    const name        = nameInput?.value.trim();
    const slug        = slugInput?.value.trim() || slugify(name);
    const description = document.getElementById('categoryDescription')?.value.trim();
    const image_url   = imageUrlInput?.value.trim() || null;

    if (!name) {
      showToast('Category name is required.', true);
      return;
    }
    if (!slug) {
      showToast('Slug is required.', true);
      return;
    }

    const payload = { name, slug, description: description || null, image_url };

    let error;
    if (editingCategoryId) {
      ({ error } = await window.mmcSupabase
        .from('categories')
        .update(payload)
        .eq('id', editingCategoryId));
    } else {
      ({ error } = await window.mmcSupabase
        .from('categories')
        .insert(payload));
    }

    if (error) {
      showToast(error.message, true);
      return;
    }

    showToast(editingCategoryId ? 'Category updated.' : 'Category created.');
    resetCategoryForm();
    formPanel.classList.add('hidden');
    await loadCategories();
  }

  async function startEditCategory(categoryId) {
    const { data, error } = await window.mmcSupabase
      .from('categories')
      .select('id, name, slug, description, image_url')
      .eq('id', categoryId)
      .single();

    if (error || !data) {
      showToast('Could not load category.', true);
      return;
    }

    editingCategoryId = data.id;
    nameInput.value   = data.name;
    slugInput.value   = data.slug;
    slugInput.dataset.manuallyEdited = 'true';
    document.getElementById('categoryDescription').value = data.description || '';
    imageUrlInput.value = data.image_url || '';
    setImagePreview(data.image_url || '');

    document.getElementById('categoryFormTitle').textContent = 'Edit Category';
    formPanel.classList.remove('hidden');
    formPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function deleteCategory(categoryId) {
    if (!confirm('Delete this category and all its products? This cannot be undone.')) return;

    const { error } = await window.mmcSupabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      showToast(error.message, true);
      return;
    }

    showToast('Category deleted.');
    await loadCategories();
  }

  function resetCategoryForm() {
    editingCategoryId = null;
    form?.reset();
    delete slugInput.dataset.manuallyEdited;
    setImagePreview('');
    imageUrlInput.value = '';
    document.getElementById('categoryFormTitle').textContent = 'Add Category';
    if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-check"></i> Save Category';
  }
});
