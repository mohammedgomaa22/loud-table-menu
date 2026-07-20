document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const categorySlug = urlParams.get('category');
  const productId = parseInt(urlParams.get('id'), 10);

  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const productContainer = document.getElementById('productContainer');

  // If missing parameters
  if (!categorySlug || isNaN(productId)) {
    showError();
    return;
  }

  try {
    const data = await fetchMenuData();
    
    // Find the category
    const category = data.find(c => c.slug === categorySlug);
    if (!category) {
      showError();
      return;
    }

    // Find the product
    const product = category.products.find(p => p.id === productId);
    if (!product) {
      showError();
      return;
    }

    // Populate Data
    populateProductDetails(product, category);
    
    // Show Main Content
    loadingState.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => loadingState.classList.add('hidden'), 500);
    productContainer.classList.remove('hidden');
    productContainer.classList.add('flex', 'flex-col', 'lg:flex-row');

    // Populate Related Products
    populateRelatedProducts(category, product.id);

  } catch (error) {
    console.error('Error loading product:', error);
    showError();
  }

  function showError() {
    loadingState.classList.add('hidden');
    errorState.classList.remove('hidden');
    errorState.classList.add('flex', 'flex-col');
  }

  function populateProductDetails(product, category) {
    // Breadcrumbs & Navigation
    const backBtn = document.getElementById('backBtn');
    const breadcrumbCategory = document.getElementById('breadcrumbCategory');
    const categoryUrl = `category?id=${category.slug}`;
    
    backBtn.href = categoryUrl;
    breadcrumbCategory.href = categoryUrl;
    breadcrumbCategory.textContent = category.name;

    // Basic Info
    document.title = `MMC Central - ${product.name}`;
    document.getElementById('productName').textContent = product.name;

    const priceText = product.price != null ? `BD ${Number(product.price).toFixed(3)}` : 'Price on ask';
    document.getElementById('productPrice').textContent = priceText;

    // Weight
    const weightWrapper = document.getElementById('productWeightWrapper');
    if (product.weight) {
      document.getElementById('productWeight').textContent = product.weight;
      weightWrapper.classList.remove('hidden');
    } else {
      weightWrapper.classList.add('hidden');
    }

    // Description
    const descWrapper = document.getElementById('productDescWrapper');
    if (product.description) {
      document.getElementById('productDesc').textContent = product.description;
      descWrapper.classList.remove('hidden');
    } else {
      descWrapper.classList.add('hidden');
    }

    // Availability Badge
    const soldOutBadge = document.getElementById('soldOutBadge');
    if (product.available === false) {
      soldOutBadge.classList.remove('hidden');
    } else {
      soldOutBadge.classList.add('hidden');
    }

    // Image Setup
    const imageEl      = document.getElementById('productImage');
    const hoverImageEl = document.getElementById('productHoverImage');
    const imgSrc       = getProductImage(product, category.slug);
    const hoverSrc     = getProductHoverImage(product, category.slug);

    if (imgSrc) {
      imageEl.src = imgSrc;
      imageEl.alt = product.name;
    }

    // Hover image: show second image layer + thumbnail bar
    const thumbBar      = document.getElementById('imageThumbnailBar');
    const thumbMainImg  = document.getElementById('thumbMainImg');
    const thumbHoverImg = document.getElementById('thumbHoverImg');
    const thumbMain     = document.getElementById('thumbMain');
    const thumbHoverBtn = document.getElementById('thumbHover');

    if (hoverSrc && hoverImageEl) {
      hoverImageEl.src = hoverSrc;
      hoverImageEl.alt = product.name;
      hoverImageEl.classList.remove('hidden');

      // Thumbnail bar
      if (thumbBar && thumbMainImg && thumbHoverImg) {
        thumbMainImg.src  = imgSrc;
        thumbHoverImg.src = hoverSrc;
        thumbBar.classList.remove('hidden');
        thumbBar.classList.add('flex');

        // Click to pin a specific image
        thumbMain?.addEventListener('click', () => {
          imageEl.style.opacity      = '1';
          hoverImageEl.style.opacity = '0';
          thumbMain.classList.replace('border-secondary/50', 'border-secondary');
          thumbMain.classList.replace('opacity-60', 'opacity-100');
          thumbHoverBtn.classList.replace('border-secondary', 'border-secondary/50');
          thumbHoverBtn.classList.replace('opacity-100', 'opacity-60');
        });
        thumbHoverBtn?.addEventListener('click', () => {
          imageEl.style.opacity      = '0';
          hoverImageEl.style.opacity = '1';
          thumbHoverBtn.classList.replace('border-secondary/50', 'border-secondary');
          thumbHoverBtn.classList.replace('opacity-60', 'opacity-100');
          thumbMain.classList.replace('border-secondary', 'border-secondary/50');
          thumbMain.classList.replace('opacity-100', 'opacity-60');
        });
      }
    }

    // Cost & Product Details section
    _populateDetail('detailPriceWithoutPackRow', 'detailPriceWithoutPack',
      product.priceWithoutPackaging != null ? `BD ${Number(product.priceWithoutPackaging).toFixed(3)}` : null);
    _populateDetail('detailFoodCostRow', 'detailFoodCost',
      product.foodCost != null ? `BD ${Number(product.foodCost).toFixed(3)}` : null);
    _populateDetail('detailPackagingCostRow', 'detailPackagingCost',
      product.packagingCost != null ? `BD ${Number(product.packagingCost).toFixed(3)}` : null);
    _populateDetail('detailCogsRow', 'detailCogs',
      product.cogsPercent != null ? `${Number(product.cogsPercent).toFixed(1)}%` : null);
    _populateDetail('detailMarginRow', 'detailMargin',
      product.marginPercent != null ? `${Number(product.marginPercent).toFixed(1)}%` : null);

    const anyDetail = [product.priceWithoutPackaging, product.foodCost, product.packagingCost,
                       product.cogsPercent, product.marginPercent].some(v => v != null);
    const detailsWrapper = document.getElementById('productDetailsWrapper');
    if (detailsWrapper && anyDetail) detailsWrapper.classList.remove('hidden');

    // Comments / Notes
    const commentsWrapper = document.getElementById('productCommentsWrapper');
    if (commentsWrapper && product.comments) {
      document.getElementById('productComments').textContent = product.comments;
      commentsWrapper.classList.remove('hidden');
    }

    // Set up WhatsApp Order button link
    const whatsappCtaBtn = document.getElementById('whatsappCtaBtn');
    if (whatsappCtaBtn) {
      const orderMessage = `Hello MMC Central, I would like to order the product: "${product.name}"${product.weight ? ` (${product.weight})` : ''} - Price: ${priceText}`;
      whatsappCtaBtn.href = `https://wa.me/${MMC_CONFIG.whatsappNumber}?text=${encodeURIComponent(orderMessage)}`;
    }
  }

  function _populateDetail(rowId, valueId, text) {
    const row = document.getElementById(rowId);
    const val = document.getElementById(valueId);
    if (!row || !val) return;
    if (text != null) {
      val.textContent = text;
      row.classList.remove('hidden');
      row.classList.add('flex');
    } else {
      row.classList.remove('flex');
      row.classList.add('hidden');
    }
  }

  function populateRelatedProducts(category, currentProductId) {
    const relatedSection = document.getElementById('relatedSection');
    const relatedGrid = document.getElementById('relatedGrid');
    
    // Filter out current product and get up to 4 items
    const relatedItems = category.products.filter(p => p.id !== currentProductId).slice(0, 4);

    if (relatedItems.length === 0) return;

    // Show section and update texts
    relatedSection.classList.remove('hidden');
    document.getElementById('relatedCategoryName').textContent = category.name;
    
    const categoryUrl = `category?id=${category.slug}`;
    document.getElementById('viewAllBtn').href = categoryUrl;
    document.getElementById('viewAllBtnMobile').href = categoryUrl;

    // Render cards
    relatedItems.forEach((product, index) => {
      const delay = (index % 4) * 100;
      const card = document.createElement('a');
      card.href = `product?category=${category.slug}&id=${product.id}`;
      card.className = "group relative bg-white border-2 border-primary overflow-hidden flex flex-col h-full hover:shadow-[6px_6px_0_0_#CC6B48] transition-all duration-300 transform hover:-translate-y-1 block";
      card.setAttribute('data-aos', 'fade-up');
      card.setAttribute('data-aos-delay', delay.toString());

      const isAvailable = product.available !== false;
      const soldOutBadge = !isAvailable ? 
        `<div class="absolute top-2 right-2 bg-primary text-secondary font-black text-[10px] uppercase px-2.5 py-1 tracking-[0.1em] border border-secondary shadow-[2px_2px_0_0_#CC6B48] z-20">SOLD OUT</div>` : '';

      const priceText = product.price != null ? `BD ${Number(product.price).toFixed(3)}` : 'Price on ask';

      // Themed image (using shared fallback engine)
      const img1 = getProductImage(product, category.slug);

      card.innerHTML = `
        ${soldOutBadge}
        <div class="w-full aspect-square bg-primary/5 relative overflow-hidden border-b-2 border-primary/10">
          <img src="${img1}" alt="${product.name}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" loading="lazy">
        </div>
        <div class="p-4 flex flex-col flex-grow bg-white">
          <h3 class="text-lg font-bold uppercase tracking-tight text-primary leading-tight line-clamp-2 mb-2 group-hover:text-accent transition-colors duration-300">${product.name}</h3>
          <div class="mt-auto pt-2 flex items-center justify-between">
            <span class="text-xl font-black text-primary">${priceText}</span>
            <i class="fas fa-arrow-right text-primary/40 transform group-hover:text-accent group-hover:translate-x-1.5 transition-all duration-300"></i>
          </div>
        </div>
      `;
      relatedGrid.appendChild(card);
    });
    
    // Refresh AOS for newly added elements
    if (typeof AOS !== 'undefined') {
      setTimeout(() => AOS.refresh(), 100);
    }
  }
});


