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
    const response = await fetch('./src/data/menu.json');
    if (!response.ok) throw new Error('Failed to load menu data');
    
    const data = await response.json();
    
    // Find the category
    const category = data.find(c => c.slug === categoryId);

    if (!category) {
      titleEl.textContent = 'NOT FOUND';
      descEl.textContent = 'The category you are looking for does not exist.';
      loadingEl.classList.add('hidden');
      emptyEl.classList.remove('hidden');
      return;
    }

    // Update Hero
    titleEl.textContent = category.name;
    descEl.textContent = category.description || 'Discover our flavors';

    // Hide loading
    loadingEl.classList.add('hidden');

    // Check if products exist
    if (!category.products || category.products.length === 0) {
      emptyEl.classList.remove('hidden');
      return;
    }

    // Show Grid
    gridEl.classList.remove('hidden');

    // Render Products
    category.products.forEach((product, index) => {
      const delay = (index % 10) * 100;
      
      const card = document.createElement('a');
      card.href = `product.html?category=${category.slug}&id=${product.id}`;
      // Clean, compact, MMC Central card
      card.className = "group relative bg-white border-2 border-primary overflow-hidden flex flex-col h-full hover:shadow-[8px_8px_0_0_#CC6B48] transition-all duration-300 transform hover:-translate-y-1 block";
      card.setAttribute('data-aos', 'fade-up');
      card.setAttribute('data-aos-delay', delay.toString());

      // Check availability
      const isAvailable = product.available !== false;
      const soldOutBadge = !isAvailable ? 
        `<div class="absolute top-3 right-3 bg-primary text-secondary font-bold text-[10px] uppercase px-3 py-1 tracking-widest z-20">SOLD OUT</div>` : '';

      // Format Price
      const priceText = product.price ? `BD ${Number(product.price).toFixed(2)}` : 'Price on ask';

      // Demo images
      let img1 = product.image;
      let img2 = product.hoverImage;
      
      if (!img1 && index === 0) {
         img1 = 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=600&auto=format&fit=crop';
         img2 = 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=600&auto=format&fit=crop';
      } else if (!img1 && index === 1) {
         img1 = 'https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?q=80&w=600&auto=format&fit=crop';
         img2 = 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=600&auto=format&fit=crop';
      }

      card.innerHTML = `
        ${soldOutBadge}
        
        <!-- Image Section -->
        <div class="w-full aspect-[4/3] bg-primary/5 relative overflow-hidden border-b-2 border-primary/10">
          ${img1 ? 
            `<img src="${img1}" alt="${product.name}" class="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${img2 ? 'group-hover:opacity-0' : 'group-hover:scale-105'}">
             ${img2 ? `<img src="${img2}" alt="${product.name} Hover" class="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100">` : ''}` 
            : 
            `<div class="w-full h-full flex flex-col items-center justify-center text-primary/20">
               <i class="fas fa-camera text-3xl mb-2"></i>
             </div>`
          }
        </div>

        <!-- Content Section -->
        <div class="p-5 md:p-6 flex flex-col flex-grow">
          <div class="flex items-start justify-between gap-4 mb-2">
            <h3 class="text-xl font-bold uppercase tracking-tight text-primary leading-tight line-clamp-2">${product.name}</h3>
            ${product.weight ? `<span class="bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest px-2 py-1 whitespace-nowrap">${product.weight}</span>` : ''}
          </div>
          
          <div class="mt-auto pt-4 flex items-center justify-between">
            <span class="text-2xl font-black text-primary">${priceText}</span>
            <span class="text-sm font-bold uppercase tracking-widest text-primary group-hover:text-accent transition-colors flex items-center gap-2">
               View <i class="fas fa-arrow-right transform group-hover:translate-x-1 transition-transform"></i>
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


