let editingProductDbId = null;
let categoriesCache = [];

document.addEventListener('DOMContentLoaded', async () => {
  const auth = await initAdminShell();
  if (!auth) return;

  const form           = document.getElementById('productForm');
  const tableBody      = document.getElementById('productsTableBody');
  const toggleFormBtn  = document.getElementById('toggleProductFormBtn');
  const cancelFormBtn  = document.getElementById('cancelProductFormBtn');
  const formPanel      = document.getElementById('addProductForm');
  const categoryFilter = document.getElementById('productCategoryFilter');
  const searchInput    = document.getElementById('productSearchInput');
  const saveBtn        = document.getElementById('saveProductBtn');

  // Main image elements
  const imageUrlInput    = document.getElementById('productImageUrl');
  const imageFileInput   = document.getElementById('productImageFile');
  const imagePreview     = document.getElementById('productImagePreview');
  const imagePlaceholder = document.getElementById('productImagePlaceholder');
  const imageClearBtn    = document.getElementById('productImageClearBtn');

  // Hover image elements
  const hoverImageUrlInput    = document.getElementById('productHoverImageUrl');
  const hoverImageFileInput   = document.getElementById('productHoverImageFile');
  const hoverImagePreview     = document.getElementById('productHoverImagePreview');
  const hoverImagePlaceholder = document.getElementById('productHoverImagePlaceholder');
  const hoverImageClearBtn    = document.getElementById('productHoverImageClearBtn');

  await loadCategoriesIntoSelects();
  await loadProducts();

  // ── Main image URL → live preview ──
  if (imageUrlInput) {
    imageUrlInput.addEventListener('input', () => setImagePreview(imageUrlInput.value.trim()));
  }

  // ── Main image file upload ──
  if (imageFileInput) {
    imageFileInput.addEventListener('change', async () => {
      const file = imageFileInput.files[0];
      if (!file) return;
      await uploadProductImage(file, 'main');
    });
  }

  // ── Clear main image ──
  if (imageClearBtn) {
    imageClearBtn.addEventListener('click', () => {
      imageUrlInput.value = '';
      setImagePreview('');
    });
  }

  // ── Hover image URL → live preview ──
  if (hoverImageUrlInput) {
    hoverImageUrlInput.addEventListener('input', () => setHoverImagePreview(hoverImageUrlInput.value.trim()));
  }

  // ── Hover image file upload ──
  if (hoverImageFileInput) {
    hoverImageFileInput.addEventListener('change', async () => {
      const file = hoverImageFileInput.files[0];
      if (!file) return;
      await uploadProductImage(file, 'hover');
    });
  }

  // ── Clear hover image ──
  if (hoverImageClearBtn) {
    hoverImageClearBtn.addEventListener('click', () => {
      hoverImageUrlInput.value = '';
      setHoverImagePreview('');
    });
  }

  // ── Toggle form ──
  if (toggleFormBtn && formPanel) {
    toggleFormBtn.addEventListener('click', () => {
      resetProductForm();
      formPanel.classList.toggle('hidden');
    });
  }

  if (cancelFormBtn && formPanel) {
    cancelFormBtn.addEventListener('click', () => {
      resetProductForm();
      formPanel.classList.add('hidden');
    });
  }

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      await saveProduct();
    });
  }

  if (categoryFilter) categoryFilter.addEventListener('change', loadProducts);
  if (searchInput)    searchInput.addEventListener('input', loadProducts);

  if (tableBody) {
    tableBody.addEventListener('click', async (event) => {
      const editBtn   = event.target.closest('[data-edit-product]');
      const deleteBtn = event.target.closest('[data-delete-product]');
      if (editBtn)   await startEditProduct(Number(editBtn.dataset.editProduct));
      if (deleteBtn) await deleteProduct(Number(deleteBtn.dataset.deleteProduct));
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

  function setHoverImagePreview(url) {
    if (url) {
      hoverImagePreview.src = url;
      hoverImagePreview.classList.remove('hidden');
      hoverImagePlaceholder.classList.add('hidden');
      hoverImageClearBtn.classList.remove('hidden');
    } else {
      hoverImagePreview.src = '';
      hoverImagePreview.classList.add('hidden');
      hoverImagePlaceholder.classList.remove('hidden');
      hoverImageClearBtn.classList.add('hidden');
    }
  }

  async function uploadProductImage(file, type = 'main') {
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    }

    const ext  = file.name.split('.').pop();
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

    const { error } = await window.mmcSupabase.storage
      .from('site-assets')
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = 'Save Product';
    }

    if (error) {
      showToast(`Upload failed: ${error.message}`, true);
      return;
    }

    const { data: { publicUrl } } = window.mmcSupabase.storage
      .from('site-assets')
      .getPublicUrl(path);

    if (type === 'hover') {
      hoverImageUrlInput.value = publicUrl;
      setHoverImagePreview(publicUrl);
    } else {
      imageUrlInput.value = publicUrl;
      setImagePreview(publicUrl);
    }
    showToast('Image uploaded.');
  }

  async function loadCategoriesIntoSelects() {
    const { data, error } = await window.mmcSupabase
      .from('categories')
      .select('id, name')
      .order('sort_order', { ascending: true });

    if (error) { showToast(error.message, true); return; }

    categoriesCache = data || [];
    const options = categoriesCache.map((c) =>
      `<option value="${c.id}">${escapeHtml(c.name)}</option>`
    ).join('');

    const productCategory = document.getElementById('productCategory');
    if (productCategory) productCategory.innerHTML = `<option value="">Select Category</option>${options}`;
    if (categoryFilter)  categoryFilter.innerHTML  = `<option value="">All Categories</option>${options}`;
  }

  async function loadProducts() {
    let query = window.mmcSupabase
      .from('products')
      .select('*, categories(name)')
      .order('sort_order', { ascending: true });

    const filterValue = categoryFilter?.value;
    if (filterValue) query = query.eq('category_id', filterValue);

    const { data, error } = await query;
    if (error) { showToast(error.message, true); return; }

    const searchTerm = searchInput?.value.trim().toLowerCase() || '';
    const filtered   = (data || []).filter((p) =>
      !searchTerm || p.name.toLowerCase().includes(searchTerm)
    );

    if (!filtered.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="p-10 text-center text-sm text-primary/50">
            <i class="fas fa-box-open text-3xl mb-3 block text-primary/20"></i>
            No products found.
          </td>
        </tr>`;
      return;
    }

    tableBody.innerHTML = filtered.map((product) => {
      const status = product.available
        ? '<span class="inline-block px-2 py-1 bg-accent/20 text-green-700 text-[10px] font-bold uppercase tracking-widest">Active</span>'
        : '<span class="inline-block px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-widest">Sold Out</span>';

      const imgCell = product.image
        ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" class="w-12 h-12 object-cover border border-primary/10">`
        : `<div class="w-12 h-12 bg-secondary border border-primary/10 flex items-center justify-center text-primary/30"><i class="fas fa-box-open text-xs"></i></div>`;

      return `
        <tr class="hover:bg-adminbg transition-colors ${product.available ? '' : 'opacity-60'}">
          <td class="p-4">${imgCell}</td>
          <td class="p-4 font-bold text-primary text-sm">${escapeHtml(product.name)}</td>
          <td class="p-4 text-sm text-primary/70">${escapeHtml(product.categories?.name || '')}</td>
          <td class="p-4 text-sm text-primary text-right font-bold">${product.price != null ? `BD ${Number(product.price).toFixed(3)}` : '—'}</td>
          <td class="p-4 text-center">${status}</td>
          <td class="p-4 text-right">
            <div class="flex justify-end gap-2">
              <button type="button" data-edit-product="${product.id}"
                class="w-8 h-8 flex items-center justify-center bg-secondary text-primary hover:bg-primary hover:text-secondary transition-colors" title="Edit">
                <i class="fas fa-pen text-xs pointer-events-none"></i>
              </button>
              <button type="button" data-delete-product="${product.id}"
                class="w-8 h-8 flex items-center justify-center bg-secondary text-red-500 hover:bg-red-500 hover:text-white transition-colors" title="Delete">
                <i class="fas fa-trash text-xs pointer-events-none"></i>
              </button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  function _num(id) {
    const v = document.getElementById(id)?.value;
    return v !== '' && v != null ? Number(v) : null;
  }

  async function saveProduct() {
    const name       = document.getElementById('productName')?.value.trim();
    const categoryId = Number(document.getElementById('productCategory')?.value);
    const status     = document.getElementById('productStatus')?.value;

    if (!name || !categoryId) {
      showToast('Product name and category are required.', true);
      return;
    }

    let legacyId = Number(document.getElementById('productLegacyId')?.value);
    if (!legacyId) {
      const { data: existing } = await window.mmcSupabase
        .from('products')
        .select('legacy_id')
        .eq('category_id', categoryId)
        .order('legacy_id', { ascending: false })
        .limit(1);
      legacyId = existing?.length ? existing[0].legacy_id + 1 : 1;
    }

    const payload = {
      category_id:             categoryId,
      legacy_id:               legacyId,
      name,
      price:                   _num('productPrice'),
      weight:                  document.getElementById('productWeight')?.value.trim() || null,
      description:             document.getElementById('productDescription')?.value.trim() || null,
      available:               status !== 'sold_out',
      image:                   imageUrlInput?.value.trim() || null,
      hover_image:             hoverImageUrlInput?.value.trim() || null,
      food_cost:               _num('productFoodCost'),
      packaging_cost:          _num('productPackagingCost'),
      price_without_packaging: _num('productPriceWithoutPacking'),
      cogs_percent:            _num('productCogsPercent'),
      margin_percent:          _num('productMarginPercent'),
      comments:                document.getElementById('productComments')?.value.trim() || null
    };

    let error;
    if (editingProductDbId) {
      ({ error } = await window.mmcSupabase.from('products').update(payload).eq('id', editingProductDbId));
    } else {
      ({ error } = await window.mmcSupabase.from('products').insert(payload));
    }

    if (error) { showToast(error.message, true); return; }

    showToast(editingProductDbId ? 'Product updated.' : 'Product created.');
    resetProductForm();
    formPanel.classList.add('hidden');
    await loadProducts();
  }

  async function startEditProduct(productId) {
    const { data, error } = await window.mmcSupabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error || !data) { showToast('Could not load product.', true); return; }

    editingProductDbId = data.id;

    document.getElementById('productName').value        = data.name;
    document.getElementById('productCategory').value    = String(data.category_id);
    document.getElementById('productPrice').value       = data.price ?? '';
    document.getElementById('productWeight').value      = data.weight || '';
    document.getElementById('productDescription').value = data.description || '';
    document.getElementById('productLegacyId').value    = data.legacy_id;
    document.getElementById('productStatus').value      = data.available ? 'active' : 'sold_out';

    // Images
    const imgUrl = data.image || '';
    if (imageUrlInput) imageUrlInput.value = imgUrl;
    setImagePreview(imgUrl);

    const hoverUrl = data.hover_image || '';
    if (hoverImageUrlInput) hoverImageUrlInput.value = hoverUrl;
    setHoverImagePreview(hoverUrl);

    // Cost fields
    document.getElementById('productFoodCost').value            = data.food_cost ?? '';
    document.getElementById('productPackagingCost').value       = data.packaging_cost ?? '';
    document.getElementById('productPriceWithoutPacking').value = data.price_without_packaging ?? '';
    document.getElementById('productCogsPercent').value         = data.cogs_percent ?? '';
    document.getElementById('productMarginPercent').value       = data.margin_percent ?? '';
    document.getElementById('productComments').value            = data.comments || '';

    document.getElementById('productFormTitle').textContent = 'Edit Product';
    formPanel.classList.remove('hidden');
    formPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function deleteProduct(productId) {
    if (!confirm('Delete this product?')) return;

    const { error } = await window.mmcSupabase.from('products').delete().eq('id', productId);
    if (error) { showToast(error.message, true); return; }

    showToast('Product deleted.');
    await loadProducts();
  }

  function resetProductForm() {
    editingProductDbId = null;
    form?.reset();
    document.getElementById('productLegacyId').value = '';
    document.getElementById('productFormTitle').textContent = 'Add Product';
    if (imageFileInput) imageFileInput.value = '';
    setImagePreview('');
    if (hoverImageFileInput) hoverImageFileInput.value = '';
    setHoverImagePreview('');
  }
});
