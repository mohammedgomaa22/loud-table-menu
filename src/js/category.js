document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get('id');

  const titleEl = document.getElementById('categoryTitle');
  const descEl = document.getElementById('categoryDesc');
  const gridEl = document.getElementById('productsGrid');
  const loadingEl = document.getElementById('loadingState');
  const emptyEl = document.getElementById('emptyState');

  if (!categoryId) {
    titleEl.textContent = 'ERROR';
    descEl.textContent = 'No category specified in URL.';
    loadingEl.classList.add('hidden');
    return;
  }

  try {
    const data = await fetchMenuData();
    
    // Find the category
    const category = data.find(c => c.slug === categoryId);

    if (!category) {
      titleEl.textContent = 'NOT FOUND';
      descEl.textContent = 'The category you are looking for does not exist.';
      loadingEl.classList.add('hidden');
      if (emptyEl) {
        emptyEl.innerHTML = `
          <i class="fas fa-magnifying-glass text-4xl text-primary/20 mb-4 block"></i>
          <p class="font-bold uppercase tracking-widest text-sm text-primary/60">This category doesn't exist.</p>
          <a href="index.html#menu" class="mt-6 inline-block text-xs font-bold uppercase tracking-widest text-accent hover:underline">Back to menu</a>
        `;
        emptyEl.classList.remove('hidden');
      }
      return;
    }

    // Update Hero
    titleEl.textContent = category.name;
    descEl.textContent = category.description || 'Discover our flavors';

    // Update Hero Background — use category image from DB, fall back to generic
    const heroBgEl = document.getElementById('categoryHeroBg');
    if (heroBgEl) {
      const fallbackHeroBg = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1600&auto=format&fit=crop';
      heroBgEl.src = (category.image && category.image.startsWith('http'))
        ? category.image
        : fallbackHeroBg;
      heroBgEl.alt = category.name;
    }

    // Update page title
    document.title = `${category.name} — MMC Central`;

    // Hide loading
    loadingEl.classList.add('hidden');

    // Check if products exist
    if (!category.products || category.products.length === 0) {
      if (emptyEl) {
        emptyEl.innerHTML = `
          <i class="fas fa-box-open text-5xl text-primary/20 mb-4 block mx-auto"></i>
          <p class="font-bold uppercase tracking-widest text-sm text-primary/60">No products in this category yet.</p>
          <p class="text-xs text-primary/40 mt-2 tracking-wider">Check back soon for new items.</p>
          <a href="index.html#menu" class="mt-6 inline-block text-xs font-bold uppercase tracking-widest text-accent hover:underline">Back to menu</a>
        `;
        emptyEl.classList.remove('hidden');
      }
      return;
    }

    // Show Grid
    gridEl.classList.remove('hidden');

    // Render Products
    category.products.forEach((product, index) => {
      const delay = (index % 10) * 100;
      
      const card = document.createElement('a');
      card.href = `product?category=${category.slug}&id=${product.id}`;
      // Clean, modern card with NO black border and NO orange border
      card.className = "group relative bg-white rounded-lg overflow-hidden flex flex-col h-full border border-black/10 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 block";
      card.setAttribute('data-aos', 'fade-up');
      card.setAttribute('data-aos-delay', delay.toString());

      // Check availability
      const isAvailable = product.available !== false;
      const soldOutBadge = !isAvailable ? 
        `<div class="absolute top-3 right-3 bg-black text-white font-black text-[10px] uppercase px-3 py-1.5 tracking-[0.15em] rounded shadow-md z-20">SOLD OUT</div>` : '';

      const priceText = publicPriceText(product.price);

      // Primary product image
      const img1 = getProductImage(product, category.slug);

      // Safe escaped strings for JS handler
      const safeName = (product.name || '').replace(/'/g, "\\'");
      const safeWeight = (product.weight || '').replace(/'/g, "\\'");

      card.innerHTML = `
        ${soldOutBadge}

        <!-- Image Section -->
        <div class="w-full aspect-square bg-neutral-100 relative overflow-hidden">
          <img src="${img1}" alt="${product.name}"
               class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" loading="lazy">
        </div>

        <!-- Content Section -->
        <div class="p-3 sm:p-4 md:p-5 flex flex-col flex-grow gap-1.5 sm:gap-2 bg-white">

          <!-- Name -->
          <h3 class="text-xs sm:text-sm md:text-base font-black uppercase tracking-tight text-black leading-snug line-clamp-2">${product.name}</h3>

          <!-- Weight badge -->
          ${product.weight ? `<span class="self-start bg-neutral-100 text-black/70 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 sm:px-2.5 sm:py-1 rounded border-l-2 border-black">${product.weight}</span>` : ''}

          <!-- Description snippet -->
          ${product.description ? `<p class="hidden sm:block text-xs text-neutral-500 leading-relaxed line-clamp-2">${product.description}</p>` : ''}

          <!-- Price + CTA & Add to Cart -->
          <div class="mt-auto pt-3 border-t border-black/10 flex items-center justify-between gap-2">
            <div>
              ${priceText ? `<span class="text-sm sm:text-base md:text-lg font-black text-black">${priceText}</span>` : '<span class="text-xs font-bold text-neutral-400">View</span>'}
            </div>
            
            <div class="flex items-center gap-1.5">
              ${isAvailable ? `
                <button type="button"
                  onclick="event.preventDefault(); event.stopPropagation(); MMCCart.addItem({ id: '${product.id}', name: '${safeName}', price: ${product.price != null ? product.price : 'null'}, weight: '${safeWeight}', image: '${img1}', categorySlug: '${category.slug}' });"
                  aria-label="Add to cart"
                  class="h-8 px-2.5 rounded bg-black text-white hover:bg-neutral-800 flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wider transition-colors shadow-sm"
                  title="Add to order">
                  <i class="fas fa-plus text-[10px]"></i>
                  <span class="hidden sm:inline">Add</span>
                </button>
              ` : ''}
              
              <span class="text-[10px] font-bold uppercase tracking-widest text-neutral-400 group-hover:text-black transition-colors flex items-center gap-1 shrink-0 p-1">
                <i class="fas fa-arrow-right transform group-hover:translate-x-1 transition-transform duration-300"></i>
              </span>
            </div>
          </div>

        </div>
      `;

      gridEl.appendChild(card);
    });

  } catch (error) {
    console.error('Error loading category:', error);
    titleEl.textContent = 'ERROR';
    descEl.textContent = 'Failed to load menu data. Please try again later.';
    loadingEl.classList.add('hidden');
  }
});


