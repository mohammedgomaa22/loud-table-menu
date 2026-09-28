/**
 * MMC Central — Shopping Cart & WhatsApp Checkout System
 * Fully client-side with localStorage persistence.
 */

const MMC_CART_STORAGE_KEY = 'mmc_cart_items';

const MMCCart = {
  items: [],

  init() {
    this.load();
    this.injectCartDrawer();
    this.injectFloatingCartBtn();
    this.updateBadges();
    this.render();

    // Listen to storage changes across tabs
    window.addEventListener('storage', (e) => {
      if (e.key === MMC_CART_STORAGE_KEY) {
        this.load();
        this.updateBadges();
        this.render();
      }
    });
  },

  load() {
    try {
      const data = localStorage.getItem(MMC_CART_STORAGE_KEY);
      this.items = data ? JSON.parse(data) : [];
      if (!Array.isArray(this.items)) this.items = [];
    } catch (_) {
      this.items = [];
    }
  },

  save() {
    try {
      localStorage.setItem(MMC_CART_STORAGE_KEY, JSON.stringify(this.items));
    } catch (_) {}
    this.updateBadges();
    this.render();
  },

  addItem(product) {
    if (!product || !product.id) return;
    const alreadyExists = this.items.some(i => String(i.id) === String(product.id));

    if (alreadyExists) {
      this.showToast(`"${product.name}" is already in your order`);
      return;
    }

    this.items.push({
      id: product.id,
      name: product.name,
      price: product.price != null && product.price !== '' ? Number(product.price) : null,
      weight: product.weight || '',
      image: product.image || '',
      categorySlug: product.categorySlug || ''
    });

    this.save();
    this.showToast(`Added "${product.name}" to order`);
  },

  removeItem(productId) {
    this.items = this.items.filter(i => String(i.id) !== String(productId));
    this.save();
  },

  clear() {
    this.items = [];
    this.save();
  },

  getCount() {
    return this.items.length;
  },

  getTotal() {
    let hasPrice = false;
    let total = 0;
    this.items.forEach(item => {
      if (item.price != null) {
        hasPrice = true;
        total += item.price;
      }
    });
    return { hasPrice, total };
  },

  openDrawer() {
    const drawer = document.getElementById('mmcCartDrawer');
    const overlay = document.getElementById('mmcCartOverlay');
    if (drawer && overlay) {
      overlay.classList.remove('hidden');
      requestAnimationFrame(() => {
        overlay.classList.remove('opacity-0');
        overlay.classList.add('opacity-100');
        drawer.classList.remove('translate-x-full');
        drawer.classList.add('translate-x-0');
      });
      document.body.style.overflow = 'hidden';
    }
  },

  closeDrawer() {
    const drawer = document.getElementById('mmcCartDrawer');
    const overlay = document.getElementById('mmcCartOverlay');
    if (drawer && overlay) {
      overlay.classList.remove('opacity-100');
      overlay.classList.add('opacity-0');
      drawer.classList.remove('translate-x-0');
      drawer.classList.add('translate-x-full');
      setTimeout(() => {
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
      }, 300);
    }
  },

  updateBadges() {
    const count = this.getCount();
    const badges = document.querySelectorAll('.cart-count-badge');
    badges.forEach(badge => {
      badge.textContent = count;
      if (count > 0) {
        badge.classList.remove('hidden');
        badge.classList.add('flex');
      } else {
        badge.classList.add('hidden');
        badge.classList.remove('flex');
      }
    });
  },

  render() {
    const container = document.getElementById('cartItemsList');
    const emptyState = document.getElementById('cartEmptyState');
    const footer = document.getElementById('cartFooter');
    const totalEl = document.getElementById('cartTotalDisplay');

    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      if (footer) footer.classList.add('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    if (footer) footer.classList.remove('hidden');

    const currency = (typeof MMC_CONFIG !== 'undefined' && MMC_CONFIG.currency) ? MMC_CONFIG.currency : 'KWD';
    const showPrices = typeof MMC_CONFIG !== 'undefined' && MMC_CONFIG.showPrices;

    container.innerHTML = this.items.map(item => {
      const priceText = (showPrices && item.price != null)
        ? `${currency} ${Number(item.price).toFixed(3)}`
        : '';

      return `
        <div class="flex items-center gap-4 py-4 border-b border-black/10 last:border-b-0">
          <div class="w-16 h-16 rounded-md overflow-hidden bg-neutral-100 flex-shrink-0 border border-black/10">
            ${item.image ? `<img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">` : '<div class="w-full h-full flex items-center justify-center text-black/30"><i class="fas fa-utensils"></i></div>'}
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-sm uppercase tracking-tight text-black truncate">${item.name}</h4>
            ${item.weight ? `<p class="text-[11px] font-bold uppercase tracking-wider text-black/50">${item.weight}</p>` : ''}
            ${priceText ? `<p class="text-xs font-black text-black mt-1">${priceText}</p>` : ''}
          </div>
          <button type="button" onclick="MMCCart.removeItem('${item.id}')" aria-label="Remove item" class="text-black/40 hover:text-black p-2 text-sm transition-colors">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      `;
    }).join('');

    if (totalEl) {
      const { hasPrice, total } = this.getTotal();
      if (showPrices && hasPrice) {
        totalEl.innerHTML = `
          <div class="flex justify-between items-center text-sm font-bold uppercase tracking-wider text-black mb-3">
            <span>Estimated Total:</span>
            <span class="text-lg font-black">${currency} ${total.toFixed(3)}</span>
          </div>
        `;
      } else {
        totalEl.innerHTML = `
          <div class="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-black/60 mb-3">
            <span>Items in Order:</span>
            <span class="text-sm font-black text-black">${this.getCount()}</span>
          </div>
        `;
      }
    }
  },

  checkoutViaWhatsApp() {
    if (this.items.length === 0) return;

    const phone = (typeof MMC_CONFIG !== 'undefined' && MMC_CONFIG.whatsappNumber)
      ? MMC_CONFIG.whatsappNumber.replace(/\D/g, '')
      : '96597960992';

    const currency = (typeof MMC_CONFIG !== 'undefined' && MMC_CONFIG.currency) ? MMC_CONFIG.currency : 'KWD';
    const showPrices = typeof MMC_CONFIG !== 'undefined' && MMC_CONFIG.showPrices;

    const customerName = document.getElementById('cartCustomerName')?.value.trim() || '';
    const customerNotes = document.getElementById('cartCustomerNotes')?.value.trim() || '';

    let lines = [];
    lines.push('*New Order from MMC Central*');
    lines.push('─────────────────────');

    this.items.forEach((item, index) => {
      let itemLine = `${index + 1}. *${item.name}*`;
      if (item.weight) itemLine += ` (${item.weight})`;
      if (showPrices && item.price != null) {
        itemLine += ` — ${currency} ${Number(item.price).toFixed(3)}`;
      }
      lines.push(itemLine);
    });

    lines.push('─────────────────────');
    lines.push(`*Total Items:* ${this.getCount()}`);

    const { hasPrice, total } = this.getTotal();
    if (showPrices && hasPrice) {
      lines.push(`*Estimated Total:* ${currency} ${total.toFixed(3)}`);
    }


    if (customerName) {
      lines.push(`*Name:* ${customerName}`);
    }
    if (customerNotes) {
      lines.push(`*Notes / Address:* ${customerNotes}`);
    }

    lines.push('─────────────────────');
    lines.push('Please confirm availability and proceed with my order.');

    const message = lines.join('\n');
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  },

  showToast(message) {
    let toast = document.getElementById('mmcCartToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'mmcCartToast';
      toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] bg-black text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest shadow-2xl transition-all duration-300 pointer-events-none opacity-0 translate-y-4';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.remove('opacity-0', 'translate-y-4');
    toast.classList.add('opacity-100', 'translate-y-0');

    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('opacity-100', 'translate-y-0');
      toast.classList.add('opacity-0', 'translate-y-4');
    }, 2400);
  },

  injectCartDrawer() {
    if (document.getElementById('mmcCartDrawer')) return;

    const drawerHtml = `
      <!-- Cart Drawer Overlay -->
      <div id="mmcCartOverlay" onclick="MMCCart.closeDrawer()" class="fixed inset-0 bg-black/60 z-[9998] transition-opacity duration-300 opacity-0 hidden"></div>

      <!-- Slide-over Drawer -->
      <div id="mmcCartDrawer" class="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[9999] shadow-2xl flex flex-col transform translate-x-full transition-transform duration-300 ease-in-out border-l border-black/10">
        <!-- Drawer Header -->
        <div class="p-6 border-b border-black/10 flex items-center justify-between bg-white flex-shrink-0">
          <div class="flex items-center gap-3">
            <i class="fas fa-shopping-bag text-xl text-black"></i>
            <h3 class="text-lg font-black uppercase tracking-widest text-black">Your Order</h3>
            <span class="cart-count-badge hidden items-center justify-center bg-black text-white text-[10px] font-black w-5 h-5 rounded-full">0</span>
          </div>
          <button type="button" onclick="MMCCart.closeDrawer()" aria-label="Close cart" class="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-black/60 hover:text-black transition-colors">
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>

        <!-- Scrollable Items List -->
        <div class="flex-1 overflow-y-auto p-6" id="cartScrollArea">
          <!-- Empty State -->
          <div id="cartEmptyState" class="py-16 text-center flex flex-col items-center justify-center">
            <div class="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-black/30 text-2xl mb-4">
              <i class="fas fa-shopping-basket"></i>
            </div>
            <p class="font-bold uppercase tracking-widest text-sm text-black">Your cart is empty</p>
            <p class="text-xs text-black/50 mt-1 max-w-xs">Browse our menu and add items to place an order via WhatsApp.</p>
            <a href="index#menu" onclick="MMCCart.closeDrawer()" class="mt-6 inline-flex items-center gap-2 bg-black text-white font-bold uppercase tracking-widest text-xs px-6 py-3 rounded hover:bg-neutral-800 transition-colors">
              Explore Menu
            </a>
          </div>

          <!-- Items Container -->
          <div id="cartItemsList"></div>
        </div>

        <!-- Drawer Footer -->
        <div id="cartFooter" class="p-6 border-t border-black/10 bg-neutral-50 flex-shrink-0 hidden">
          <div id="cartTotalDisplay"></div>

          <!-- Customer info inputs -->
          <div class="space-y-2 mb-4">
            <input type="text" id="cartCustomerName" placeholder="Your Name (Optional)" class="w-full bg-white border border-black/15 text-xs text-black p-2.5 rounded focus:outline-none focus:border-black font-medium">
            <textarea id="cartCustomerNotes" rows="2" placeholder="Delivery Address / Special Notes (Optional)" class="w-full bg-white border border-black/15 text-xs text-black p-2.5 rounded focus:outline-none focus:border-black font-medium resize-none"></textarea>
          </div>

          <!-- WhatsApp Order CTA -->
          <button type="button" onclick="MMCCart.checkoutViaWhatsApp()" class="w-full bg-[#25D366] text-white hover:bg-[#1faa53] font-bold uppercase tracking-widest text-xs py-4 px-6 rounded flex items-center justify-center gap-3 transition-colors shadow-lg active:scale-[0.99]">
            <i class="fab fa-whatsapp text-lg"></i>
            Order via WhatsApp
          </button>

          <button type="button" onclick="MMCCart.clear()" class="w-full mt-2 text-[10px] font-bold uppercase tracking-wider text-black/40 hover:text-black transition-colors text-center py-1">
            Clear Cart
          </button>
        </div>
      </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.id = 'mmcCartDrawerWrapper';
    wrapper.innerHTML = drawerHtml;
    document.body.appendChild(wrapper);
  },

  injectFloatingCartBtn() {
    if (document.getElementById('mmcFloatingCartBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'mmcFloatingCartBtn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Open Cart');
    btn.onclick = () => this.openDrawer();
    btn.className = 'fixed bottom-24 right-8 z-40 w-14 h-14 bg-black text-white border-2 border-white shadow-xl rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95';
    btn.innerHTML = `
      <i class="fas fa-shopping-bag text-lg"></i>
      <span class="cart-count-badge hidden absolute -top-1 -right-1 bg-white text-black border border-black text-[10px] font-black w-5 h-5 rounded-full items-center justify-center">0</span>
    `;
    document.body.appendChild(btn);
  }
};

// Initialize when DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MMCCart.init());
  } else {
    MMCCart.init();
  }
}
