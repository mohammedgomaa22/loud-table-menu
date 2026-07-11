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
    const response = await fetch('./src/data/menu.json');
    if (!response.ok) throw new Error('Failed to load menu data');
    
    const data = await response.json();
    
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

    // Populate Related Products
    populateRelatedProducts(category, product.id);

  } catch (error) {
    console.error('Error loading product:', error);
    showError();
  }

  function showError() {
    loadingState.classList.add('hidden');
    errorState.classList.remove('hidden');
  }

  function populateProductDetails(product, category) {
    // Breadcrumbs & Navigation
    const backBtn = document.getElementById('backBtn');
    const breadcrumbCategory = document.getElementById('breadcrumbCategory');
    const categoryUrl = `category.html?id=${category.slug}`;
    
    backBtn.href = categoryUrl;
    breadcrumbCategory.href = categoryUrl;
    breadcrumbCategory.textContent = category.name;

    // Basic Info
    document.title = `MMC Central - ${product.name}`;
    document.getElementById('productName').textContent = product.name;
    
    const priceText = product.price ? `BD ${Number(product.price).toFixed(2)}` : 'Price on ask';
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
    const imageEl = document.getElementById('productImage');
    const imageWrapper = document.getElementById('productImageWrapper');
    
    let imgSrc = product.image;
    // Fallback demo images for testing if empty
    if (!imgSrc) {
      const demoImages = [
        'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1200&auto=format&fit=crop'
      ];
      imgSrc = demoImages[product.id % demoImages.length];
    }
    
    if (imgSrc) {
      imageEl.src = imgSrc;
      imageEl.alt = product.name;
    } else {
      // If still no image, show a placeholder box
      imageWrapper.innerHTML = `
        <div class="w-full h-full flex flex-col items-center justify-center bg-primary/10 text-primary/30">
          <i class="fas fa-camera text-6xl mb-4"></i>
          <span class="font-bold uppercase tracking-widest">No Image</span>
        </div>
      `;
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
    
    const categoryUrl = `category.html?id=${category.slug}`;
    document.getElementById('viewAllBtn').href = categoryUrl;
    document.getElementById('viewAllBtnMobile').href = categoryUrl;

    // Render cards
    relatedItems.forEach((product, index) => {
      const delay = (index % 4) * 100;
      const card = document.createElement('a');
      card.href = `product.html?category=${category.slug}&id=${product.id}`;
      card.className = "group relative bg-secondary border-2 border-primary overflow-hidden flex flex-col h-full hover:shadow-[6px_6px_0_0_#CC6B48] transition-all duration-300 transform hover:-translate-y-1 block";
      card.setAttribute('data-aos', 'fade-up');
      card.setAttribute('data-aos-delay', delay.toString());

      const isAvailable = product.available !== false;
      const soldOutBadge = !isAvailable ? 
        `<div class="absolute top-2 right-2 bg-primary text-secondary font-bold text-[10px] uppercase px-2 py-1 tracking-widest z-20">SOLD OUT</div>` : '';

      const priceText = product.price ? `BD ${Number(product.price).toFixed(2)}` : 'Price on ask';

      let img1 = product.image;
      if (!img1) {
        const demoImages = [
          'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?q=80&w=600&auto=format&fit=crop'
        ];
        img1 = demoImages[product.id % 2];
      }

      card.innerHTML = `
        ${soldOutBadge}
        <div class="w-full aspect-square bg-primary/5 relative overflow-hidden border-b-2 border-primary/10">
          ${img1 ? 
            `<img src="${img1}" alt="${product.name}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105">` : 
            `<div class="w-full h-full flex items-center justify-center text-primary/20"><i class="fas fa-camera text-3xl"></i></div>`
          }
        </div>
        <div class="p-4 flex flex-col flex-grow">
          <h3 class="text-lg font-black uppercase tracking-tight text-primary leading-tight line-clamp-2 mb-2">${product.name}</h3>
          <div class="mt-auto flex items-center justify-between">
            <span class="text-xl font-bold text-primary">${priceText}</span>
            <i class="fas fa-arrow-right text-primary/30 transform group-hover:text-accent group-hover:translate-x-1 transition-all"></i>
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


