// Velvet - Premium Pakistani Clothing Brand
// JavaScript file

(function initVelvetNavbar() {
  const openBtn = document.querySelector('[data-menu-open]');
  const closeBtn = document.querySelector('[data-menu-close]');
  const menu = document.querySelector('[data-mobile-menu]');

  if (!openBtn || !closeBtn || !menu) return;

  const setOpen = (open) => {
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    openBtn.setAttribute('aria-expanded', String(open));
  };

  openBtn.addEventListener('click', () => setOpen(true));
  closeBtn.addEventListener('click', () => setOpen(false));

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) setOpen(false);
  });
})();

(function initVelvetFilters() {
  const tabs = document.querySelectorAll('.velvet-filter-tab');
  const grid = document.querySelector('[data-product-grid]');
  if (!tabs.length || !grid) return;

  const cards = Array.from(grid.querySelectorAll('.velvet-product-card'));

  const applyFilter = (filter) => {
    cards.forEach((card) => card.classList.add('is-filtering'));

    setTimeout(() => {
      cards.forEach((card) => {
        const category = card.dataset.category || '';
        const price = Number(card.dataset.price || 0);
        let show = false;

        if (filter === 'all') show = true;
        else if (filter === 'under-3000') show = price < 3000;
        else show = category === filter;

        card.classList.toggle('is-hidden', !show);
      });

      requestAnimationFrame(() => {
        cards.forEach((card) => card.classList.remove('is-filtering'));
      });
    }, 200);
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.classList.contains('is-active')) return;
      tabs.forEach((t) => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      applyFilter(tab.dataset.filter);
    });
  });
})();

(function initVelvetWishlist() {
  const buttons = document.querySelectorAll('[data-wishlist]');
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const active = btn.classList.toggle('is-active');
      btn.setAttribute('aria-label', active ? 'Remove from wishlist' : 'Add to wishlist');
      btn.setAttribute('aria-pressed', String(active));
    });
  });
})();

(function initVelvetShop() {
  const grid = document.querySelector('[data-shop-grid]');
  if (!grid) return;

  const pills = Array.from(document.querySelectorAll('[data-shop-pill]'));
  const sortSelect = document.querySelector('[data-shop-sort]');
  const viewBtns = Array.from(document.querySelectorAll('[data-shop-view]'));
  const countEl = document.querySelector('[data-shop-count]');
  const emptyEl = document.querySelector('[data-shop-empty]');
  const form = document.querySelector('[data-shop-filter-form]');
  const clearBtns = Array.from(document.querySelectorAll('[data-shop-clear]'));

  const priceMin = document.querySelector('[data-shop-price-min]');
  const priceMax = document.querySelector('[data-shop-price-max]');
  const priceMinLabel = document.querySelector('[data-shop-price-min-label]');
  const priceMaxLabel = document.querySelector('[data-shop-price-max-label]');
  const priceFill = document.querySelector('[data-shop-price-fill]');

  const sidebar = document.querySelector('[data-shop-sidebar]');
  const sidebarOverlay = document.querySelector('[data-shop-sidebar-overlay]');
  const sidebarOpenBtn = document.querySelector('[data-shop-sidebar-open]');
  const sidebarCloseBtn = document.querySelector('[data-shop-sidebar-close]');

  const PRICE_FLOOR = 0;
  const PRICE_CEIL = 30000;

  const cards = Array.from(grid.querySelectorAll('.velvet-product-card'));
  const originalOrder = cards.map((c) => c);

  const fmt = (n) => n.toLocaleString('en-US');

  const state = {
    pill: 'all',
    categories: new Set(),
    sizes: new Set(),
    colors: new Set(),
    availability: new Set(),
    priceMin: PRICE_FLOOR,
    priceMax: PRICE_CEIL,
    sort: 'featured',
  };

  // ---------- Filtering ----------
  const matchesPill = (card) => {
    const cat = card.dataset.category || '';
    const isNew = card.dataset.new === 'true';
    const isSale = card.dataset.sale === 'true';
    switch (state.pill) {
      case 'all': return true;
      case 'lawn': return cat === 'lawn';
      case 'formals': return cat === 'formals';
      case 'casuals': return cat === 'casuals';
      case 'sale': return isSale;
      case 'new': return isNew;
      default: return true;
    }
  };

  const matchesCategory = (card) => {
    if (!state.categories.size) return true;
    const cat = card.dataset.category || '';
    const sub = card.dataset.subcategory || '';
    for (const c of state.categories) {
      if (c === cat || c === sub) return true;
    }
    return false;
  };

  const matchesSize = (card) => {
    if (!state.sizes.size) return true;
    const sizes = (card.dataset.sizes || '').split(',').map((s) => s.trim());
    for (const s of state.sizes) {
      if (sizes.includes(s)) return true;
    }
    return false;
  };

  const matchesColor = (card) => {
    if (!state.colors.size) return true;
    const colors = (card.dataset.colors || '').split(',').map((s) => s.trim());
    for (const c of state.colors) {
      if (colors.includes(c)) return true;
    }
    return false;
  };

  const matchesAvailability = (card) => {
    if (!state.availability.size) return true;
    const stock = card.dataset.stock || '';
    const isNew = card.dataset.new === 'true';
    const isSale = card.dataset.sale === 'true';
    for (const a of state.availability) {
      if (a === 'in-stock' && stock === 'in-stock') return true;
      if (a === 'sale' && isSale) return true;
      if (a === 'new' && isNew) return true;
    }
    return false;
  };

  const matchesPrice = (card) => {
    const price = Number(card.dataset.price || 0);
    return price >= state.priceMin && price <= state.priceMax;
  };

  const cardMatches = (card) =>
    matchesPill(card) &&
    matchesCategory(card) &&
    matchesSize(card) &&
    matchesColor(card) &&
    matchesAvailability(card) &&
    matchesPrice(card);

  // ---------- Sorting ----------
  const sortCards = () => {
    const arr = cards.slice();
    switch (state.sort) {
      case 'newest':
        arr.sort((a, b) => {
          const an = a.dataset.new === 'true' ? 1 : 0;
          const bn = b.dataset.new === 'true' ? 1 : 0;
          if (bn !== an) return bn - an;
          return Number(a.dataset.order) - Number(b.dataset.order);
        });
        break;
      case 'price-asc':
        arr.sort((a, b) => Number(a.dataset.price) - Number(b.dataset.price));
        break;
      case 'price-desc':
        arr.sort((a, b) => Number(b.dataset.price) - Number(a.dataset.price));
        break;
      case 'best-selling':
        arr.sort((a, b) => Number(b.dataset.popularity || 0) - Number(a.dataset.popularity || 0));
        break;
      case 'featured':
      default:
        arr.sort((a, b) => Number(a.dataset.order) - Number(b.dataset.order));
        break;
    }
    arr.forEach((card) => grid.appendChild(card));
  };

  // ---------- Apply ----------
  const apply = () => {
    cards.forEach((card) => card.classList.add('is-filtering'));

    setTimeout(() => {
      let visible = 0;
      cards.forEach((card) => {
        const show = cardMatches(card);
        card.classList.toggle('is-hidden', !show);
        if (show) visible++;
      });

      if (countEl) countEl.textContent = String(visible);
      if (emptyEl) emptyEl.hidden = visible !== 0;

      sortCards();

      requestAnimationFrame(() => {
        cards.forEach((card) => card.classList.remove('is-filtering'));
      });
    }, 180);
  };

  // ---------- Pill listeners ----------
  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      pills.forEach((p) => {
        p.classList.remove('is-active');
        p.setAttribute('aria-selected', 'false');
      });
      pill.classList.add('is-active');
      pill.setAttribute('aria-selected', 'true');
      state.pill = pill.dataset.shopPill;
      apply();
    });
  });

  // ---------- Sort ----------
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      state.sort = sortSelect.value;
      apply();
    });
  }

  // ---------- View toggle ----------
  viewBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      viewBtns.forEach((b) => {
        b.classList.remove('is-active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');
      grid.classList.toggle('is-list-view', btn.dataset.shopView === 'list');
    });
  });

  // ---------- Sidebar form (checkboxes) ----------
  const collectCheckboxes = (attr, target) => {
    const inputs = form ? form.querySelectorAll('input[' + attr + ']') : [];
    target.clear();
    inputs.forEach((input) => {
      if (input.checked) target.add(input.value);
    });
  };

  if (form) {
    form.addEventListener('change', (e) => {
      const t = e.target;
      if (!(t instanceof HTMLInputElement)) return;
      if (t.hasAttribute('data-shop-cat')) collectCheckboxes('data-shop-cat', state.categories);
      else if (t.hasAttribute('data-shop-size')) collectCheckboxes('data-shop-size', state.sizes);
      else if (t.hasAttribute('data-shop-color')) collectCheckboxes('data-shop-color', state.colors);
      else if (t.hasAttribute('data-shop-avail')) collectCheckboxes('data-shop-avail', state.availability);
      apply();
    });
  }

  // ---------- Price range ----------
  const updatePriceFill = () => {
    if (!priceFill) return;
    const minPct = ((state.priceMin - PRICE_FLOOR) / (PRICE_CEIL - PRICE_FLOOR)) * 100;
    const maxPct = ((state.priceMax - PRICE_FLOOR) / (PRICE_CEIL - PRICE_FLOOR)) * 100;
    priceFill.style.left = minPct + '%';
    priceFill.style.right = (100 - maxPct) + '%';
  };

  const updatePriceLabels = () => {
    if (priceMinLabel) priceMinLabel.textContent = fmt(state.priceMin);
    if (priceMaxLabel) priceMaxLabel.textContent = fmt(state.priceMax);
  };

  const onPriceInput = () => {
    let lo = Number(priceMin.value);
    let hi = Number(priceMax.value);
    if (lo > hi - 100) {
      // Keep at least 100 PKR gap
      if (this === priceMin) lo = hi - 100;
      else hi = lo + 100;
      priceMin.value = lo;
      priceMax.value = hi;
    }
    state.priceMin = lo;
    state.priceMax = hi;
    updatePriceFill();
    updatePriceLabels();
  };

  if (priceMin && priceMax) {
    [priceMin, priceMax].forEach((input) => {
      input.addEventListener('input', () => {
        let lo = Number(priceMin.value);
        let hi = Number(priceMax.value);
        if (lo > hi - 100) {
          if (input === priceMin) lo = Math.max(PRICE_FLOOR, hi - 100);
          else hi = Math.min(PRICE_CEIL, lo + 100);
          priceMin.value = String(lo);
          priceMax.value = String(hi);
        }
        state.priceMin = lo;
        state.priceMax = hi;
        updatePriceFill();
        updatePriceLabels();
      });
      input.addEventListener('change', apply);
    });
    updatePriceFill();
    updatePriceLabels();
  }

  // ---------- Clear all ----------
  const clearAll = () => {
    state.pill = 'all';
    state.categories.clear();
    state.sizes.clear();
    state.colors.clear();
    state.availability.clear();
    state.priceMin = PRICE_FLOOR;
    state.priceMax = PRICE_CEIL;
    state.sort = 'featured';

    pills.forEach((p) => {
      const active = p.dataset.shopPill === 'all';
      p.classList.toggle('is-active', active);
      p.setAttribute('aria-selected', String(active));
    });

    if (form) {
      form.querySelectorAll('input[type="checkbox"]').forEach((input) => { input.checked = false; });
    }
    if (priceMin) priceMin.value = String(PRICE_FLOOR);
    if (priceMax) priceMax.value = String(PRICE_CEIL);
    updatePriceFill();
    updatePriceLabels();

    if (sortSelect) sortSelect.value = 'featured';

    // Reset order back to original
    originalOrder.forEach((card) => grid.appendChild(card));

    apply();
  };

  clearBtns.forEach((btn) => btn.addEventListener('click', clearAll));

  // ---------- Sidebar drawer (mobile) ----------
  const setSidebar = (open) => {
    if (!sidebar) return;
    sidebar.classList.toggle('is-open', open);
    if (sidebarOverlay) sidebarOverlay.classList.toggle('is-visible', open);
    document.body.classList.toggle('menu-open', open);
  };

  if (sidebarOpenBtn) sidebarOpenBtn.addEventListener('click', () => setSidebar(true));
  if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', () => setSidebar(false));
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', () => setSidebar(false));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar && sidebar.classList.contains('is-open')) setSidebar(false);
  });

  // Initial count
  if (countEl) countEl.textContent = String(cards.length);
})();

(function initVelvetProductDetail() {
  const product = document.querySelector('[data-pd-product]');
  if (!product) return;

  // ----- Gallery thumbnails -----
  const mainImage = document.querySelector('[data-pd-main-image]');
  const thumbs = Array.from(document.querySelectorAll('[data-pd-thumb]'));
  if (mainImage && thumbs.length) {
    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => {
        if (thumb.classList.contains('is-active')) return;
        thumbs.forEach((t) => {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        thumb.classList.add('is-active');
        thumb.setAttribute('aria-selected', 'true');
        mainImage.classList.add('is-swapping');
        const next = thumb.dataset.image;
        setTimeout(() => {
          mainImage.src = next;
          requestAnimationFrame(() => mainImage.classList.remove('is-swapping'));
        }, 180);
      });
    });
  }

  // ----- Wishlist heart -----
  const heart = document.querySelector('[data-pd-wishlist]');
  if (heart) {
    heart.addEventListener('click', () => {
      const active = heart.classList.toggle('is-active');
      heart.setAttribute('aria-pressed', String(active));
      heart.setAttribute('aria-label', active ? 'Remove from wishlist' : 'Add to wishlist');
    });
  }

  // ----- Share menu -----
  const shareEl = document.querySelector('[data-pd-share]');
  const shareToggle = document.querySelector('[data-pd-share-toggle]');
  const shareMenu = document.querySelector('[data-pd-share-menu]');
  const shareCopy = document.querySelector('[data-pd-share-copy]');
  const shareCopyLabel = document.querySelector('[data-pd-share-copy-label]');

  const setShareOpen = (open) => {
    if (!shareMenu || !shareToggle) return;
    shareMenu.hidden = !open;
    shareToggle.setAttribute('aria-expanded', String(open));
  };

  if (shareToggle && shareMenu) {
    shareToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      setShareOpen(shareMenu.hidden);
    });
    document.addEventListener('click', (e) => {
      if (shareEl && !shareEl.contains(e.target)) setShareOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setShareOpen(false);
    });
  }

  if (shareCopy && shareCopyLabel) {
    shareCopy.addEventListener('click', async () => {
      const url = window.location.href;
      try {
        await navigator.clipboard.writeText(url);
      } catch (e) {
        const tmp = document.createElement('input');
        tmp.value = url;
        document.body.appendChild(tmp);
        tmp.select();
        try { document.execCommand('copy'); } catch (err) {}
        document.body.removeChild(tmp);
      }
      const prev = shareCopyLabel.textContent;
      shareCopyLabel.textContent = 'Copied!';
      setTimeout(() => { shareCopyLabel.textContent = prev; }, 1600);
    });
  }

  // ----- Zoom modal -----
  const zoomOpen = document.querySelector('[data-pd-zoom-open]');
  const zoomModal = document.querySelector('[data-pd-zoom-modal]');
  const zoomImage = document.querySelector('[data-pd-zoom-image]');
  const zoomClose = document.querySelector('[data-pd-zoom-close]');

  const openZoom = () => {
    if (!zoomModal || !zoomImage || !mainImage) return;
    zoomImage.src = mainImage.src;
    zoomModal.hidden = false;
    zoomModal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => zoomModal.classList.add('is-open'));
    document.body.classList.add('menu-open');
  };

  const closeZoom = () => {
    if (!zoomModal) return;
    zoomModal.classList.remove('is-open');
    zoomModal.setAttribute('aria-hidden', 'true');
    setTimeout(() => { zoomModal.hidden = true; }, 280);
    document.body.classList.remove('menu-open');
  };

  if (zoomOpen) zoomOpen.addEventListener('click', openZoom);
  if (zoomClose) zoomClose.addEventListener('click', closeZoom);
  if (zoomModal) {
    zoomModal.addEventListener('click', (e) => {
      if (e.target === zoomModal) closeZoom();
    });
  }

  // ----- Size guide modal -----
  const sgOpenBtn = document.querySelector('[data-pd-sizeguide-open]');
  const sgModal = document.querySelector('[data-pd-sizeguide-modal]');
  const sgClose = document.querySelector('[data-pd-sizeguide-close]');

  const openSizeGuide = () => {
    if (!sgModal) return;
    sgModal.hidden = false;
    sgModal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => sgModal.classList.add('is-open'));
    document.body.classList.add('menu-open');
  };

  const closeSizeGuide = () => {
    if (!sgModal) return;
    sgModal.classList.remove('is-open');
    sgModal.setAttribute('aria-hidden', 'true');
    setTimeout(() => { sgModal.hidden = true; }, 280);
    document.body.classList.remove('menu-open');
  };

  if (sgOpenBtn) sgOpenBtn.addEventListener('click', openSizeGuide);
  if (sgClose) sgClose.addEventListener('click', closeSizeGuide);
  if (sgModal) {
    sgModal.addEventListener('click', (e) => {
      if (e.target === sgModal) closeSizeGuide();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (zoomModal && !zoomModal.hidden) closeZoom();
    if (sgModal && !sgModal.hidden) closeSizeGuide();
  });

  // ----- Color selection -----
  const colorBtns = Array.from(document.querySelectorAll('[data-pd-color]'));
  const colorNameEl = document.querySelector('[data-pd-color-name]');
  colorBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      colorBtns.forEach((b) => {
        b.classList.remove('is-selected');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-selected');
      btn.setAttribute('aria-pressed', 'true');
      if (colorNameEl) colorNameEl.textContent = btn.dataset.pdColor || '';
    });
  });

  // ----- Size selection -----
  const sizeBtns = Array.from(document.querySelectorAll('[data-pd-size]'));
  const sizeNameEl = document.querySelector('[data-pd-size-name]');
  sizeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach((b) => {
        b.classList.remove('is-selected');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-selected');
      btn.setAttribute('aria-pressed', 'true');
      if (sizeNameEl) sizeNameEl.textContent = btn.dataset.pdSize || '';
    });
  });

  // ----- Quantity -----
  const qtyInput = document.querySelector('[data-pd-qty-input]');
  const qtyDec = document.querySelector('[data-pd-qty-dec]');
  const qtyInc = document.querySelector('[data-pd-qty-inc]');

  const clampQty = () => {
    if (!qtyInput) return;
    const min = Number(qtyInput.min) || 1;
    const max = Number(qtyInput.max) || 99;
    let v = Number(qtyInput.value) || min;
    if (v < min) v = min;
    if (v > max) v = max;
    qtyInput.value = String(v);
  };

  if (qtyDec) qtyDec.addEventListener('click', () => {
    if (!qtyInput) return;
    qtyInput.value = String(Math.max(Number(qtyInput.min) || 1, (Number(qtyInput.value) || 1) - 1));
    clampQty();
  });
  if (qtyInc) qtyInc.addEventListener('click', () => {
    if (!qtyInput) return;
    qtyInput.value = String((Number(qtyInput.value) || 1) + 1);
    clampQty();
  });
  if (qtyInput) qtyInput.addEventListener('change', clampQty);

  // ----- Add to cart / Buy now -----
  const cartBadge = document.querySelector('[data-cart-count]');
  const addedMsg = document.querySelector('[data-pd-added]');
  const addCartBtn = document.querySelector('[data-pd-addcart]');
  const buyNowBtn = document.querySelector('[data-pd-buynow]');

  const bumpCart = () => {
    if (!cartBadge) return;
    const qty = qtyInput ? Number(qtyInput.value) || 1 : 1;
    cartBadge.textContent = String((Number(cartBadge.textContent) || 0) + qty);
  };

  const showAdded = (label) => {
    if (!addedMsg) return;
    addedMsg.textContent = label;
    addedMsg.hidden = false;
    requestAnimationFrame(() => addedMsg.classList.add('is-visible'));
    setTimeout(() => {
      addedMsg.classList.remove('is-visible');
      setTimeout(() => { addedMsg.hidden = true; }, 350);
    }, 2200);
  };

  if (addCartBtn) addCartBtn.addEventListener('click', () => {
    bumpCart();
    showAdded('Added to your cart.');
  });
  if (buyNowBtn) buyNowBtn.addEventListener('click', () => {
    bumpCart();
    showAdded('Heading to checkout…');
  });

  // ----- Write a review (placeholder) -----
  const writeBtn = document.querySelector('[data-pd-write-review]');
  if (writeBtn) {
    writeBtn.addEventListener('click', () => {
      writeBtn.textContent = 'Coming soon — thanks!';
      writeBtn.disabled = true;
      setTimeout(() => {
        writeBtn.textContent = 'Write a Review';
        writeBtn.disabled = false;
      }, 2400);
    });
  }

  // ----- Track product into Recently Viewed -----
  try {
    const STORAGE_KEY = 'velvet:recently-viewed';
    const item = {
      id: product.dataset.productId || product.dataset.productName,
      name: product.dataset.productName || '',
      category: product.dataset.productCategory || '',
      price: product.dataset.productPrice || '',
      image: mainImage ? mainImage.src : '',
      ts: Date.now(),
    };
    let list = [];
    try { list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (e) { list = []; }
    list = list.filter((p) => p.id !== item.id);
    list.unshift(item);
    list = list.slice(0, 12);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {}
})();

(function initVelvetRecentlyViewed() {
  const grid = document.querySelector('[data-recent-grid]');
  const emptyEl = document.querySelector('[data-recent-empty]');
  const STORAGE_KEY = 'velvet:recently-viewed';
  const MAX_ITEMS = 4;

  const trackProduct = (card) => {
    if (!card) return;
    const img = card.querySelector('img');
    const nameEl = card.querySelector('.velvet-product-card__name');
    const catEl = card.querySelector('.velvet-product-card__category');
    const priceEl = card.querySelector('.velvet-product-card__price');
    if (!img || !nameEl || !priceEl) return;

    const id = card.dataset.order || nameEl.textContent.trim();
    const item = {
      id,
      name: nameEl.textContent.trim(),
      category: catEl ? catEl.textContent.trim() : '',
      price: priceEl.textContent.trim(),
      image: img.getAttribute('src') || '',
      ts: Date.now(),
    };

    let list = [];
    try { list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (e) { list = []; }
    list = list.filter((p) => p.id !== item.id);
    list.unshift(item);
    list = list.slice(0, 12);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) {}
  };

  // Track clicks on product card links / quick view buttons across pages
  document.querySelectorAll('.velvet-product-card').forEach((card) => {
    card.querySelectorAll('a[href*="product-detail"], .velvet-quickview-btn').forEach((trigger) => {
      trigger.addEventListener('click', () => trackProduct(card));
    });
  });

  if (!grid) return;

  const buildCardMarkup = (p) => {
    return (
      '<article class="velvet-product-card">' +
        '<a href="product-detail.html" class="velvet-product-card__link">' +
          '<div class="velvet-product-card__image-wrap">' +
            '<img src="' + p.image + '" alt="' + p.name + '" class="velvet-product-card__image" loading="lazy" />' +
          '</div>' +
        '</a>' +
        '<div class="velvet-product-card__body">' +
          '<span class="velvet-product-card__category">' + (p.category || '') + '</span>' +
          '<h3 class="velvet-product-card__name"><a href="product-detail.html">' + p.name + '</a></h3>' +
          '<div class="velvet-product-card__pricing"><span class="velvet-product-card__price">' + p.price + '</span></div>' +
        '</div>' +
      '</article>'
    );
  };

  const render = () => {
    let list = [];
    try { list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (e) { list = []; }

    // On a product detail page, exclude the current product
    const currentProduct = document.querySelector('[data-pd-product]');
    const currentId = currentProduct ? (currentProduct.dataset.productId || currentProduct.dataset.productName) : null;
    if (currentId) {
      list = list.filter((p) => String(p.id) !== String(currentId));
    }

    if (!list.length) {
      // Seed with sample items so the section isn't empty on first visit
      const sampleSelectors = [
        '[data-shop-grid] .velvet-product-card',
        '.velvet-related .velvet-product-card',
      ];
      let sample = [];
      for (const sel of sampleSelectors) {
        sample = Array.from(document.querySelectorAll(sel)).slice(0, 4);
        if (sample.length) break;
      }
      list = sample.map((card) => {
        const img = card.querySelector('img');
        const nameEl = card.querySelector('.velvet-product-card__name');
        const catEl = card.querySelector('.velvet-product-card__category');
        const priceEl = card.querySelector('.velvet-product-card__price');
        return {
          id: card.dataset.order || (nameEl ? nameEl.textContent.trim() : ''),
          name: nameEl ? nameEl.textContent.trim() : '',
          category: catEl ? catEl.textContent.trim() : '',
          price: priceEl ? priceEl.textContent.trim() : '',
          image: img ? img.getAttribute('src') : '',
          ts: Date.now(),
        };
      });
    }

    const items = list.slice(0, MAX_ITEMS);
    if (!items.length) {
      grid.innerHTML = '';
      if (emptyEl) emptyEl.hidden = false;
      return;
    }

    grid.innerHTML = items.map(buildCardMarkup).join('');
    if (emptyEl) emptyEl.hidden = true;
  };

  render();
})();

(function initVelvetNewsletter() {
  const form = document.querySelector('[data-newsletter-form]');
  const success = document.querySelector('[data-newsletter-success]');
  if (!form || !success) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    if (!input || !input.value.trim() || !input.checkValidity()) {
      input?.focus();
      return;
    }

    form.classList.add('is-submitted');
    success.hidden = false;
    requestAnimationFrame(() => success.classList.add('is-visible'));
    input.value = '';
  });
})();

(function initVelvetContactForm() {
  const form = document.querySelector('[data-contact-form]');
  const success = document.querySelector('[data-contact-success]');
  if (!form || !success) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const required = form.querySelectorAll('[required]');
    for (const field of required) {
      if (!field.value || !field.checkValidity()) {
        field.focus();
        return;
      }
    }

    success.hidden = false;
    form.reset();
    success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
})();

(function initVelvetFaqAccordion() {
  const faq = document.querySelector('[data-faq]');
  if (!faq) return;

  const items = Array.from(faq.querySelectorAll('.velvet-faq__item'));
  items.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        items.forEach((other) => { if (other !== item) other.open = false; });
      }
    });
  });
})();

/* ============================================
   VELVET STORE — cart + wishlist persistence layer
   ============================================ */

const VelvetStore = (function () {
  const CART_KEY = 'velvet:cart';
  const WISH_KEY = 'velvet:wishlist';

  const read = (k) => {
    try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch (e) { return []; }
  };
  const write = (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
  };

  const cartListeners = new Set();
  const wishListeners = new Set();

  const parsePrice = (str) => {
    if (typeof str === 'number') return str;
    const m = String(str || '').replace(/[^\d.]/g, '');
    return Number(m) || 0;
  };

  const fmtPKR = (n) => 'PKR ' + Math.round(Number(n) || 0).toLocaleString('en-US');

  const productFromCard = (card) => {
    if (!card) return null;
    const img = card.querySelector('img');
    const nameEl = card.querySelector('.velvet-product-card__name');
    const catEl = card.querySelector('.velvet-product-card__category');
    const priceEl = card.querySelector('.velvet-product-card__price');
    const name = nameEl ? nameEl.textContent.trim() : '';
    if (!name) return null;
    return {
      id: card.dataset.productId || card.dataset.order || name,
      name,
      category: catEl ? catEl.textContent.trim() : '',
      price: Number(card.dataset.price) || parsePrice(priceEl ? priceEl.textContent : 0),
      image: img ? img.getAttribute('src') : '',
      sizes: (card.dataset.sizes || 'S,M,L').split(',').map((s) => s.trim()).filter(Boolean),
    };
  };

  // CART
  const getCart = () => read(CART_KEY);
  const saveCart = (cart) => {
    write(CART_KEY, cart);
    cartListeners.forEach((fn) => { try { fn(cart); } catch (e) {} });
  };
  const addToCart = (item, qty = 1, size = '') => {
    if (!item || !item.id) return;
    const cart = getCart();
    const key = item.id + '::' + (size || '');
    const existing = cart.find((c) => c.key === key);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        key,
        id: item.id,
        name: item.name,
        category: item.category || '',
        price: Number(item.price) || 0,
        image: item.image || '',
        size: size || '',
        qty,
      });
    }
    saveCart(cart);
  };
  const removeFromCart = (key) => {
    saveCart(getCart().filter((c) => c.key !== key));
  };
  const updateQty = (key, qty) => {
    const cart = getCart();
    const item = cart.find((c) => c.key === key);
    if (!item) return;
    item.qty = Math.max(1, qty);
    saveCart(cart);
  };
  const clearCart = () => saveCart([]);
  const cartCount = (cart) => (cart || getCart()).reduce((n, c) => n + c.qty, 0);
  const cartSubtotal = (cart) => (cart || getCart()).reduce((n, c) => n + c.price * c.qty, 0);
  const onCartChange = (fn) => { cartListeners.add(fn); fn(getCart()); };

  // WISHLIST
  const getWishlist = () => read(WISH_KEY);
  const saveWishlist = (list) => {
    write(WISH_KEY, list);
    wishListeners.forEach((fn) => { try { fn(list); } catch (e) {} });
  };
  const hasInWishlist = (id) => getWishlist().some((w) => w.id === id);
  const toggleWishlist = (item) => {
    if (!item || !item.id) return false;
    const list = getWishlist();
    const idx = list.findIndex((w) => w.id === item.id);
    if (idx >= 0) {
      list.splice(idx, 1);
      saveWishlist(list);
      return false;
    }
    list.unshift({
      id: item.id,
      name: item.name,
      category: item.category || '',
      price: Number(item.price) || 0,
      image: item.image || '',
    });
    saveWishlist(list);
    return true;
  };
  const removeFromWishlist = (id) => {
    saveWishlist(getWishlist().filter((w) => w.id !== id));
  };
  const onWishChange = (fn) => { wishListeners.add(fn); fn(getWishlist()); };

  // Cross-tab sync
  window.addEventListener('storage', (e) => {
    if (e.key === CART_KEY) cartListeners.forEach((fn) => { try { fn(getCart()); } catch (e) {} });
    if (e.key === WISH_KEY) wishListeners.forEach((fn) => { try { fn(getWishlist()); } catch (e) {} });
  });

  return {
    parsePrice, fmtPKR, productFromCard,
    getCart, addToCart, removeFromCart, updateQty, clearCart, cartCount, cartSubtotal, onCartChange,
    getWishlist, hasInWishlist, toggleWishlist, removeFromWishlist, onWishChange,
  };
})();

/* ============================================
   CART DRAWER — injects markup, opens on cart icon
   ============================================ */

(function initVelvetCart() {
  // Inject drawer once
  if (!document.querySelector('[data-cart-drawer]')) {
    const wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="velvet-drawer-overlay" data-cart-overlay aria-hidden="true"></div>' +
      '<aside class="velvet-cart-drawer" data-cart-drawer aria-hidden="true" role="dialog" aria-label="Shopping cart" tabindex="-1">' +
      '  <header class="velvet-cart-drawer__head">' +
      '    <h2 class="velvet-cart-drawer__title">Your Cart <span class="velvet-cart-drawer__count" data-cart-drawer-count>(0)</span></h2>' +
      '    <button type="button" class="velvet-cart-drawer__close" data-cart-close aria-label="Close cart">' +
      '      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"></line><line x1="18" y1="6" x2="6" y2="18"></line></svg>' +
      '    </button>' +
      '  </header>' +
      '  <div class="velvet-cart-drawer__body" data-cart-body></div>' +
      '  <footer class="velvet-cart-drawer__foot" data-cart-foot hidden>' +
      '    <div class="velvet-cart-drawer__subtotal">' +
      '      <span>Subtotal</span>' +
      '      <span data-cart-subtotal>PKR 0</span>' +
      '    </div>' +
      '    <p class="velvet-cart-drawer__note">Shipping &amp; taxes calculated at checkout.</p>' +
      '    <div class="velvet-cart-drawer__actions">' +
      '      <button type="button" class="velvet-btn velvet-btn--outline-dark" data-cart-view>View Cart</button>' +
      '      <button type="button" class="velvet-btn velvet-btn--primary" data-cart-checkout>Checkout</button>' +
      '    </div>' +
      '    <p class="velvet-cart-drawer__demo" data-cart-demo hidden>This is a demo store. No real orders will be placed.</p>' +
      '  </footer>' +
      '</aside>';
    document.body.appendChild(wrap);
  }

  const drawer = document.querySelector('[data-cart-drawer]');
  const overlay = document.querySelector('[data-cart-overlay]');
  const closeBtn = document.querySelector('[data-cart-close]');
  const body = document.querySelector('[data-cart-body]');
  const foot = document.querySelector('[data-cart-foot]');
  const subtotalEl = document.querySelector('[data-cart-subtotal]');
  const countEl = document.querySelector('[data-cart-drawer-count]');
  const viewBtn = document.querySelector('[data-cart-view]');
  const checkoutBtn = document.querySelector('[data-cart-checkout]');
  const demoMsg = document.querySelector('[data-cart-demo]');

  const setOpen = (open) => {
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    overlay.classList.toggle('is-visible', open);
    overlay.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('velvet-lock', open);
    if (open) drawer.focus();
  };

  const renderItem = (item) => {
    const sizeRow = item.size ? '<span class="velvet-cart-item__size">Size: ' + item.size + '</span>' : '';
    return (
      '<article class="velvet-cart-item" data-key="' + item.key + '">' +
        '<div class="velvet-cart-item__image-wrap">' +
          '<img src="' + (item.image || '') + '" alt="' + item.name + '" class="velvet-cart-item__image" loading="lazy" />' +
        '</div>' +
        '<div class="velvet-cart-item__body">' +
          '<div class="velvet-cart-item__head">' +
            '<h3 class="velvet-cart-item__name">' + item.name + '</h3>' +
            '<button type="button" class="velvet-cart-item__remove" data-cart-remove="' + item.key + '" aria-label="Remove item">' +
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"></line><line x1="18" y1="6" x2="6" y2="18"></line></svg>' +
            '</button>' +
          '</div>' +
          sizeRow +
          '<div class="velvet-cart-item__foot">' +
            '<div class="velvet-cart-item__qty">' +
              '<button type="button" data-cart-dec="' + item.key + '" aria-label="Decrease quantity">−</button>' +
              '<span>' + item.qty + '</span>' +
              '<button type="button" data-cart-inc="' + item.key + '" aria-label="Increase quantity">+</button>' +
            '</div>' +
            '<span class="velvet-cart-item__price">' + VelvetStore.fmtPKR(item.price * item.qty) + '</span>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  };

  const render = (cart) => {
    if (!cart.length) {
      body.innerHTML = (
        '<div class="velvet-cart-empty">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>' +
          '<p>Your cart is empty.</p>' +
          '<a href="shop.html" class="velvet-btn velvet-btn--primary velvet-cart-empty__cta">Browse the Shop</a>' +
        '</div>'
      );
      foot.hidden = true;
    } else {
      body.innerHTML = cart.map(renderItem).join('');
      foot.hidden = false;
      subtotalEl.textContent = VelvetStore.fmtPKR(VelvetStore.cartSubtotal(cart));
    }
    countEl.textContent = '(' + VelvetStore.cartCount(cart) + ')';

    // Sync badge across page
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = String(VelvetStore.cartCount(cart));
    });
  };

  VelvetStore.onCartChange(render);

  // Drawer events
  closeBtn.addEventListener('click', () => setOpen(false));
  overlay.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) setOpen(false);
  });

  body.addEventListener('click', (e) => {
    const t = e.target.closest('[data-cart-remove], [data-cart-inc], [data-cart-dec]');
    if (!t) return;
    if (t.hasAttribute('data-cart-remove')) {
      VelvetStore.removeFromCart(t.getAttribute('data-cart-remove'));
    } else if (t.hasAttribute('data-cart-inc')) {
      const key = t.getAttribute('data-cart-inc');
      const item = VelvetStore.getCart().find((c) => c.key === key);
      if (item) VelvetStore.updateQty(key, item.qty + 1);
    } else if (t.hasAttribute('data-cart-dec')) {
      const key = t.getAttribute('data-cart-dec');
      const item = VelvetStore.getCart().find((c) => c.key === key);
      if (item) {
        if (item.qty <= 1) VelvetStore.removeFromCart(key);
        else VelvetStore.updateQty(key, item.qty - 1);
      }
    }
  });

  viewBtn.addEventListener('click', () => {
    setOpen(false);
    // Demo: stay where we are, but flash a message
    demoMsg.textContent = 'Cart page is a demo — items above are your basket.';
    demoMsg.hidden = false;
    setTimeout(() => { demoMsg.hidden = true; }, 2400);
  });

  checkoutBtn.addEventListener('click', () => {
    demoMsg.textContent = 'This is a demo store. No real orders will be placed.';
    demoMsg.hidden = false;
  });

  // Open cart when navbar cart icon is clicked
  document.querySelectorAll('.velvet-icon-btn[aria-label="Cart"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(true);
    });
  });

  // Add to cart from product cards (index, shop)
  document.querySelectorAll('.velvet-addcart-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const card = btn.closest('.velvet-product-card');
      const product = VelvetStore.productFromCard(card);
      if (!product) return;
      VelvetStore.addToCart(product, 1, '');
      setOpen(true);
      btn.classList.add('is-added');
      btn.textContent = 'Added';
      setTimeout(() => {
        btn.classList.remove('is-added');
        btn.textContent = 'Add to Cart';
      }, 1600);
    });
  });

  // Add to cart from product detail
  const pdAddBtn = document.querySelector('[data-pd-addcart]');
  const pdBuyBtn = document.querySelector('[data-pd-buynow]');
  const pdProduct = document.querySelector('[data-pd-product]');
  const pdAddFromDetail = () => {
    if (!pdProduct) return;
    const qtyInput = document.querySelector('[data-pd-qty-input]');
    const sizeBtn = document.querySelector('[data-pd-size].is-selected');
    const mainImage = document.querySelector('[data-pd-main-image]');
    const item = {
      id: pdProduct.dataset.productId || pdProduct.dataset.productName,
      name: pdProduct.dataset.productName || '',
      category: pdProduct.dataset.productCategory || '',
      price: VelvetStore.parsePrice(pdProduct.dataset.productPrice),
      image: mainImage ? mainImage.src : '',
    };
    const qty = qtyInput ? Math.max(1, Number(qtyInput.value) || 1) : 1;
    const size = sizeBtn ? sizeBtn.dataset.pdSize || '' : '';
    VelvetStore.addToCart(item, qty, size);
  };
  if (pdAddBtn) pdAddBtn.addEventListener('click', () => { pdAddFromDetail(); setOpen(true); });
  if (pdBuyBtn) pdBuyBtn.addEventListener('click', () => { pdAddFromDetail(); setOpen(true); });

  // Initial render
  render(VelvetStore.getCart());
})();

/* ============================================
   WISHLIST — persistence + navbar badge + modal
   ============================================ */

(function initVelvetWishlistStore() {
  // Inject modal once
  if (!document.querySelector('[data-wishlist-modal]')) {
    const wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="velvet-modal" data-wishlist-modal hidden aria-hidden="true" role="dialog" aria-modal="true" aria-label="Wishlist">' +
      '  <div class="velvet-modal__card">' +
      '    <header class="velvet-modal__head">' +
      '      <h2 class="velvet-modal__title">Your Wishlist <span data-wishlist-modal-count>(0)</span></h2>' +
      '      <button type="button" class="velvet-modal__close" data-wishlist-close aria-label="Close wishlist">' +
      '        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"></line><line x1="18" y1="6" x2="6" y2="18"></line></svg>' +
      '      </button>' +
      '    </header>' +
      '    <div class="velvet-modal__body" data-wishlist-body></div>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(wrap);
  }

  const modal = document.querySelector('[data-wishlist-modal]');
  const closeBtn = document.querySelector('[data-wishlist-close]');
  const body = document.querySelector('[data-wishlist-body]');
  const countLabel = document.querySelector('[data-wishlist-modal-count]');

  const setOpen = (open) => {
    if (open) {
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(() => modal.classList.add('is-open'));
      document.body.classList.add('velvet-lock');
    } else {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      setTimeout(() => { modal.hidden = true; }, 280);
      document.body.classList.remove('velvet-lock');
    }
  };

  closeBtn.addEventListener('click', () => setOpen(false));
  modal.addEventListener('click', (e) => { if (e.target === modal) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) setOpen(false);
  });

  // Inject wishlist count badge into nav wishlist buttons
  document.querySelectorAll('.velvet-icon-btn[aria-label="Wishlist"]').forEach((btn) => {
    if (!btn.querySelector('[data-wishlist-count]')) {
      const badge = document.createElement('span');
      badge.className = 'velvet-cart-badge velvet-cart-badge--wishlist';
      badge.setAttribute('data-wishlist-count', '');
      badge.textContent = '0';
      btn.appendChild(badge);
    }
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(true);
    });
  });

  const renderModal = (list) => {
    countLabel.textContent = '(' + list.length + ')';
    document.querySelectorAll('[data-wishlist-count]').forEach((el) => {
      el.textContent = String(list.length);
      el.classList.toggle('is-empty', list.length === 0);
    });
    if (!list.length) {
      body.innerHTML = (
        '<div class="velvet-wishlist-empty">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>' +
          '<p>You haven&rsquo;t saved anything yet.</p>' +
          '<a href="shop.html" class="velvet-btn velvet-btn--primary">Explore the Shop</a>' +
        '</div>'
      );
      return;
    }
    body.innerHTML = list.map((item) =>
      '<article class="velvet-wishlist-item" data-id="' + item.id + '">' +
        '<div class="velvet-wishlist-item__image-wrap">' +
          '<img src="' + (item.image || '') + '" alt="' + item.name + '" class="velvet-wishlist-item__image" loading="lazy" />' +
        '</div>' +
        '<div class="velvet-wishlist-item__body">' +
          '<span class="velvet-wishlist-item__category">' + (item.category || '') + '</span>' +
          '<h3 class="velvet-wishlist-item__name">' + item.name + '</h3>' +
          '<span class="velvet-wishlist-item__price">' + VelvetStore.fmtPKR(item.price) + '</span>' +
          '<div class="velvet-wishlist-item__actions">' +
            '<button type="button" class="velvet-btn velvet-btn--primary" data-wishlist-add="' + item.id + '">Add to Cart</button>' +
            '<button type="button" class="velvet-wishlist-item__remove" data-wishlist-remove="' + item.id + '" aria-label="Remove from wishlist">Remove</button>' +
          '</div>' +
        '</div>' +
      '</article>'
    ).join('');
  };

  body.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-wishlist-remove]');
    if (rm) {
      VelvetStore.removeFromWishlist(rm.getAttribute('data-wishlist-remove'));
      return;
    }
    const add = e.target.closest('[data-wishlist-add]');
    if (add) {
      const id = add.getAttribute('data-wishlist-add');
      const item = VelvetStore.getWishlist().find((w) => w.id === id);
      if (item) VelvetStore.addToCart(item, 1, '');
      add.textContent = 'Added ✓';
      setTimeout(() => { add.textContent = 'Add to Cart'; }, 1400);
    }
  });

  // Wire up product-card heart buttons → persistence
  const refreshHeartStates = () => {
    const list = VelvetStore.getWishlist();
    document.querySelectorAll('[data-wishlist]').forEach((btn) => {
      const card = btn.closest('.velvet-product-card') || document.querySelector('[data-pd-product]');
      if (!card) return;
      const id = card.dataset.productId || card.dataset.order || (card.querySelector('.velvet-product-card__name, [data-product-name]')?.textContent || '').trim() || card.dataset.productName || '';
      const active = list.some((w) => w.id === id);
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  };

  document.querySelectorAll('[data-wishlist]').forEach((btn) => {
    // Avoid re-binding for product detail page heart which is separate
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const card = btn.closest('.velvet-product-card');
      let product;
      if (card) {
        product = VelvetStore.productFromCard(card);
      } else {
        const pd = document.querySelector('[data-pd-product]');
        if (!pd) return;
        const mainImage = document.querySelector('[data-pd-main-image]');
        product = {
          id: pd.dataset.productId || pd.dataset.productName,
          name: pd.dataset.productName || '',
          category: pd.dataset.productCategory || '',
          price: VelvetStore.parsePrice(pd.dataset.productPrice),
          image: mainImage ? mainImage.src : '',
        };
      }
      if (!product) return;
      VelvetStore.toggleWishlist(product);
    });
  });

  // Product detail wishlist heart
  const pdHeart = document.querySelector('[data-pd-wishlist]');
  if (pdHeart) {
    pdHeart.addEventListener('click', (e) => {
      e.preventDefault();
      const pd = document.querySelector('[data-pd-product]');
      if (!pd) return;
      const mainImage = document.querySelector('[data-pd-main-image]');
      const product = {
        id: pd.dataset.productId || pd.dataset.productName,
        name: pd.dataset.productName || '',
        category: pd.dataset.productCategory || '',
        price: VelvetStore.parsePrice(pd.dataset.productPrice),
        image: mainImage ? mainImage.src : '',
      };
      VelvetStore.toggleWishlist(product);
    });
  }

  VelvetStore.onWishChange((list) => {
    renderModal(list);
    refreshHeartStates();
  });
})();

/* ============================================
   QUICK VIEW — modal for product cards
   ============================================ */

(function initVelvetQuickView() {
  if (!document.querySelector('[data-quickview-modal]')) {
    const wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="velvet-modal" data-quickview-modal hidden aria-hidden="true" role="dialog" aria-modal="true" aria-label="Quick view">' +
      '  <div class="velvet-modal__card velvet-modal__card--wide">' +
      '    <button type="button" class="velvet-modal__close" data-quickview-close aria-label="Close quick view">' +
      '      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"></line><line x1="18" y1="6" x2="6" y2="18"></line></svg>' +
      '    </button>' +
      '    <div class="velvet-quickview" data-quickview-content></div>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(wrap);
  }

  const modal = document.querySelector('[data-quickview-modal]');
  const closeBtn = document.querySelector('[data-quickview-close]');
  const content = document.querySelector('[data-quickview-content]');

  let currentProduct = null;
  let selectedSize = '';

  const setOpen = (open) => {
    if (open) {
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(() => modal.classList.add('is-open'));
      document.body.classList.add('velvet-lock');
    } else {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      setTimeout(() => { modal.hidden = true; }, 280);
      document.body.classList.remove('velvet-lock');
    }
  };

  closeBtn.addEventListener('click', () => setOpen(false));
  modal.addEventListener('click', (e) => { if (e.target === modal) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) setOpen(false);
  });

  const render = (p) => {
    selectedSize = p.sizes[0] || '';
    const sizesHtml = p.sizes.map((s, i) =>
      '<button type="button" class="velvet-quickview__size' + (i === 0 ? ' is-selected' : '') + '" data-qv-size="' + s + '">' + s + '</button>'
    ).join('');
    content.innerHTML =
      '<div class="velvet-quickview__image-wrap">' +
        '<img src="' + p.image + '" alt="' + p.name + '" class="velvet-quickview__image" />' +
      '</div>' +
      '<div class="velvet-quickview__info">' +
        '<span class="velvet-quickview__category">' + (p.category || '') + '</span>' +
        '<h2 class="velvet-quickview__name">' + p.name + '</h2>' +
        '<div class="velvet-quickview__price">' + VelvetStore.fmtPKR(p.price) + '</div>' +
        '<p class="velvet-quickview__desc">Crafted from premium fabric and finished with hand-detailed embroidery. A Velvet staple — made to be worn often.</p>' +
        '<div class="velvet-quickview__field">' +
          '<span class="velvet-quickview__label">Select Size</span>' +
          '<div class="velvet-quickview__sizes">' + sizesHtml + '</div>' +
        '</div>' +
        '<div class="velvet-quickview__actions">' +
          '<button type="button" class="velvet-btn velvet-btn--primary velvet-quickview__add" data-qv-add>Add to Cart</button>' +
          '<a href="product-detail.html" class="velvet-btn velvet-btn--outline-dark velvet-quickview__details">View Details</a>' +
        '</div>' +
      '</div>';

    content.querySelectorAll('[data-qv-size]').forEach((btn) => {
      btn.addEventListener('click', () => {
        content.querySelectorAll('[data-qv-size]').forEach((b) => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        selectedSize = btn.dataset.qvSize;
      });
    });

    content.querySelector('[data-qv-add]').addEventListener('click', () => {
      VelvetStore.addToCart(currentProduct, 1, selectedSize);
      setOpen(false);
      const drawer = document.querySelector('[data-cart-drawer]');
      const overlay = document.querySelector('[data-cart-overlay]');
      if (drawer && overlay) {
        drawer.classList.add('is-open');
        drawer.setAttribute('aria-hidden', 'false');
        overlay.classList.add('is-visible');
        document.body.classList.add('velvet-lock');
      }
    });
  };

  document.querySelectorAll('.velvet-quickview-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const card = btn.closest('.velvet-product-card');
      const product = VelvetStore.productFromCard(card);
      if (!product) return;
      currentProduct = product;
      render(product);
      setOpen(true);
    });
  });
})();

/* ============================================
   SCROLL REVEAL — fade product cards & sections in
   ============================================ */

(function initVelvetScrollReveal() {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const targets = document.querySelectorAll(
    '.velvet-product-card, .velvet-collection-card, .velvet-review-card, .velvet-value-card, .velvet-store-card, .velvet-social-card, .velvet-contact-card, .velvet-stat'
  );
  if (!targets.length) return;

  targets.forEach((el) => el.classList.add('velvet-reveal'));

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  targets.forEach((el) => io.observe(el));
})();

/* ============================================
   ACTIVE NAV — highlight current page
   ============================================ */

(function initVelvetActiveNav() {
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const matchKey = path.includes('shop') ? 'shop.html'
    : path.includes('about') ? 'about.html'
    : path.includes('contact') ? 'contact.html'
    : path.includes('product-detail') ? 'shop.html'
    : 'index.html';

  document.querySelectorAll('.velvet-nav__link, .velvet-mobile-menu__link').forEach((link) => {
    const href = (link.getAttribute('href') || '').toLowerCase();
    if (href === matchKey) link.classList.add('is-active');
  });
})();
