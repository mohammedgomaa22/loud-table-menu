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
      // Clean, compact, MMC Central card
      card.className = "group relative bg-white border-2 border-primary overflow-hidden flex flex-col h-full hover:shadow-[8px_8px_0_0_#CC6B48] transition-all duration-300 transform hover:-translate-y-1 block";
      card.setAttribute('data-aos', 'fade-up');
      card.setAttribute('data-aos-delay', delay.toString());

      // Check availability
      const isAvailable = product.available !== false;
      const soldOutBadge = !isAvailable ? 
        `<div class="absolute top-3 right-3 bg-primary text-secondary font-black text-[10px] uppercase px-3 py-1.5 tracking-[0.15em] border-2 border-secondary shadow-[3px_3px_0_0_#CC6B48] z-20">SOLD OUT</div>` : '';

      // Format Price
      const priceText = product.price != null ? `BD ${Number(product.price).toFixed(3)}` : 'Price on ask';

      // Themed images (using shared fallback engine)
      const img1 = getProductImage(product, category.slug);
      const img2 = getProductHoverImage(product, category.slug);

      card.innerHTML = `
        ${soldOutBadge}

        <!-- Image Section -->
        <div class="w-full aspect-square bg-primary/5 relative overflow-hidden border-b-2 border-primary/10">
          <img src="${img1}" alt="${product.name}"
               class="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105${img2 ? ' group-hover:opacity-0' : ''}" loading="lazy">
          ${img2 ? `<img src="${img2}" alt="${product.name} — hover"
               class="absolute inset-0 w-full h-full object-cover opacity-0 transition-all duration-700 ease-out group-hover:opacity-100 group-hover:scale-105" loading="lazy">` : ''}
        </div>

        <!-- Content Section -->
        <div class="p-5 flex flex-col flex-grow gap-2">

          <!-- Name -->
          <h3 class="text-base font-black uppercase tracking-tight text-primary leading-snug line-clamp-2 group-hover:text-accent transition-colors duration-300">${product.name}</h3>

          <!-- Weight badge -->
          ${product.weight ? `<span class="self-start bg-primary/8 text-primary/70 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 border-l-2 border-accent">${product.weight}</span>` : ''}

          <!-- Description snippet -->
          ${product.description ? `<p class="text-xs text-primary/50 leading-relaxed line-clamp-2">${product.description}</p>` : ''}

          <!-- Price + CTA -->
          <div class="mt-auto pt-3 border-t border-primary/8 flex items-center justify-between">
            <span class="text-xl font-black text-primary">${priceText}</span>
            <span class="text-[10px] font-bold uppercase tracking-widest text-primary/50 group-hover:text-accent transition-colors flex items-center gap-1.5">
              View <i class="fas fa-arrow-right transform group-hover:translate-x-1 transition-transform duration-300"></i>
            </span>
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


