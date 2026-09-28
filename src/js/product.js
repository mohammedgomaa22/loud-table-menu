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

    const priceText = publicPriceText(product.price);
    const priceSection = document.getElementById('productPriceSection');
    if (priceText) {
      document.getElementById('productPrice').textContent = priceText;
      priceSection?.classList.remove('hidden');
    } else {
      priceSection?.classList.add('hidden');
    }

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

    // Image Setup — primary image only, zoom on hover
    const imageEl = document.getElementById('productImage');
    const imgSrc = getProductImage(product, category.slug);

    if (imgSrc) {
      imageEl.src = imgSrc;
      imageEl.alt = product.name;
    }

    // Cost & Product Details — public site only when prices are enabled
    const detailsWrapper = document.getElementById('productDetailsWrapper');
    if (MMC_CONFIG.showPrices) {
      _populateDetail('detailPriceWithoutPackRow', 'detailPriceWithoutPack',
        formatMoney(product.priceWithoutPackaging));
      _populateDetail('detailFoodCostRow', 'detailFoodCost',
        formatMoney(product.foodCost));
      _populateDetail('detailPackagingCostRow', 'detailPackagingCost',
        formatMoney(product.packagingCost));
      _populateDetail('detailCogsRow', 'detailCogs',
        product.cogsPercent != null ? `${Number(product.cogsPercent).toFixed(1)}%` : null);
      _populateDetail('detailMarginRow', 'detailMargin',
        product.marginPercent != null ? `${Number(product.marginPercent).toFixed(1)}%` : null);

      const anyDetail = [product.priceWithoutPackaging, product.foodCost, product.packagingCost,
                         product.cogsPercent, product.marginPercent].some(v => v != null);
      if (detailsWrapper && anyDetail) detailsWrapper.classList.remove('hidden');
    } else if (detailsWrapper) {
      detailsWrapper.classList.add('hidden');
    }

    // Comments / Notes
    const commentsWrapper = document.getElementById('productCommentsWrapper');
    if (commentsWrapper && product.comments) {
      document.getElementById('productComments').textContent = product.comments;
      commentsWrapper.classList.remove('hidden');
    }

    // Set up Add to Cart button (always adds 1 unit — quantity can be adjusted in cart drawer)
    const addToCartBtn = document.getElementById('addToCartBtn');
    if (addToCartBtn) {
      if (product.available === false) {
        addToCartBtn.disabled = true;
        addToCartBtn.classList.add('opacity-50', 'cursor-not-allowed');
        addToCartBtn.textContent = 'Sold Out';
      } else {
        addToCartBtn.disabled = false;
        addToCartBtn.onclick = () => {
          if (typeof MMCCart !== 'undefined') {
            MMCCart.addItem({
              id: product.id,
              name: product.name,
              price: product.price,
              weight: product.weight,
              image: imgSrc,
              categorySlug: category.slug
            }, 1);
          }
        };
      }
    }

    // Set up WhatsApp Order button link
    const whatsappCtaBtn = document.getElementById('whatsappCtaBtn');
    if (whatsappCtaBtn) {
      const orderMessage = `Hello MMC Central, I would like to order the product: "${product.name}"${product.weight ? ` (${product.weight})` : ''}${priceText ? ` - Price: ${priceText}` : ''}`;
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

    // Render cards (Clean monochrome, NO black border, NO orange border)
    relatedGrid.innerHTML = '';
    relatedItems.forEach((product, index) => {
      const delay = (index % 4) * 100;
      const card = document.createElement('a');
      card.href = `product?category=${category.slug}&id=${product.id}`;
      card.className = "group relative bg-white rounded-lg overflow-hidden flex flex-col h-full border border-black/10 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 block";
      card.setAttribute('data-aos', 'fade-up');
      card.setAttribute('data-aos-delay', delay.toString());

      const isAvailable = product.available !== false;
      const soldOutBadge = !isAvailable ? 
        `<div class="absolute top-2 right-2 bg-black text-white font-black text-[10px] uppercase px-2.5 py-1 tracking-[0.1em] rounded shadow-md z-20">SOLD OUT</div>` : '';

      const priceText = publicPriceText(product.price);

      // Themed image
      const img1 = getProductImage(product, category.slug);
      const safeName = (product.name || '').replace(/'/g, "\\'");
      const safeWeight = (product.weight || '').replace(/'/g, "\\'");

      card.innerHTML = `
        ${soldOutBadge}
        <div class="w-full aspect-square bg-neutral-100 relative overflow-hidden">
          <img src="${img1}" alt="${product.name}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" loading="lazy">
        </div>
        <div class="p-4 flex flex-col flex-grow bg-white">
          <h3 class="text-sm md:text-base font-bold uppercase tracking-tight text-black leading-tight line-clamp-2 mb-2">${product.name}</h3>
          <div class="mt-auto pt-2 flex items-center justify-between border-t border-black/10">
            ${priceText ? `<span class="text-sm md:text-base font-black text-black">${priceText}</span>` : '<span class="text-xs text-neutral-400">View</span>'}
            
            <div class="flex items-center gap-1.5">
              ${isAvailable ? `
                <button type="button"
                  onclick="event.preventDefault(); event.stopPropagation(); MMCCart.addItem({ id: '${product.id}', name: '${safeName}', price: ${product.price != null ? product.price : 'null'}, weight: '${safeWeight}', image: '${img1}', categorySlug: '${category.slug}' });"
                  aria-label="Add to cart"
                  class="h-7 px-2 rounded bg-black text-white hover:bg-neutral-800 flex items-center justify-center gap-1 text-[10px] font-bold uppercase transition-colors"
                  title="Add to cart">
                  <i class="fas fa-plus text-[9px]"></i> Add
                </button>
              ` : ''}
              <i class="fas fa-arrow-right text-black/40 transform group-hover:text-black group-hover:translate-x-1 transition-all duration-300 ml-1"></i>
            </div>
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


