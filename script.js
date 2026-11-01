/* ==========================================================
   AUREX — Men's Luxury Perfume Store (frontend demo)
   Vanilla JS. localStorage is used only to keep the demo
   cart and wishlist between page refreshes.
   ========================================================== */
(() => {
  'use strict';

  /* ---------- Data ---------- */
  const PRODUCTS = [
    { id: 1, name: 'AUREX Noir', cat: 'Woody', label: 'Woody & Spicy', price: 89, rating: 4.8, tag: 'bestseller', img: 'assets/products/noir.svg',
      desc: 'A magnetic, dark woody signature. Smoked vetiver and cedar wrapped in warm amber for a quiet, commanding trail.',
      notes: { Top: 'Black Pepper, Bergamot', Heart: 'Cedar, Vetiver', Base: 'Amber, Tonka Bean' } },
    { id: 2, name: 'Midnight Oud', cat: 'Woody', label: 'Woody & Oud', price: 110, rating: 4.9, tag: 'bestseller', img: 'assets/products/midnight-oud.svg',
      desc: 'Rich, resinous oud softened by smoky incense and leather. Built for evenings that last.',
      notes: { Top: 'Saffron, Cardamom', Heart: 'Oud, Incense', Base: 'Leather, Sandalwood' } },
    { id: 3, name: 'Royal Intense', cat: 'Oriental', label: 'Oriental & Spicy', price: 95, rating: 4.7, tag: 'bestseller', img: 'assets/products/royal-intense.svg',
      desc: 'Regal spice meets dark rose. A confident, velvet-warm statement with serious projection.',
      notes: { Top: 'Pink Pepper, Rum', Heart: 'Damask Rose, Cinnamon', Base: 'Amber, Patchouli' } },
    { id: 4, name: 'Ocean Blue', cat: 'Fresh', label: 'Fresh & Aquatic', price: 75, rating: 4.5, tag: 'new', img: 'assets/products/ocean-blue.svg',
      desc: 'Sea-spray freshness with crisp citrus and mineral musk. Clean, energetic and effortless.',
      notes: { Top: 'Lemon, Sea Salt', Heart: 'Marine Accord, Sage', Base: 'White Musk, Driftwood' } },
    { id: 5, name: 'Dark Desire', cat: 'Oriental', label: 'Oriental & Spicy', price: 99, rating: 4.6, tag: 'new', img: 'assets/products/dark-desire.svg',
      desc: 'Black plum and warm spice over a smouldering, sensual base. Magnetic after dark.',
      notes: { Top: 'Black Plum, Nutmeg', Heart: 'Labdanum, Iris', Base: 'Vanilla, Patchouli' } },
    { id: 6, name: 'Imperial Gold', cat: 'Luxury', label: 'Luxury & Signature', price: 125, rating: 5.0, tag: 'bestseller', img: 'assets/products/imperial-gold.svg',
      desc: 'Our most opulent signature. Golden saffron, rare woods and honeyed amber in a collector-worthy bottle.',
      notes: { Top: 'Saffron, Mandarin', Heart: 'Agarwood, Jasmine', Base: 'Honey, Amber, Musk' } },
    { id: 7, name: 'Urban Legend', cat: 'Fresh', label: 'Fresh & Citrus', price: 85, rating: 4.4, tag: 'bestseller', img: 'assets/products/urban-legend.svg',
      desc: 'City-bright citrus over green aromatics and clean woods. Sharp for the office, easy for the weekend.',
      notes: { Top: 'Grapefruit, Mint', Heart: 'Geranium, Green Tea', Base: 'Cedar, Vetiver' } },
    { id: 8, name: 'Black Velvet', cat: 'Luxury', label: 'Luxury & Signature', price: 105, rating: 4.8, tag: 'new', img: 'assets/products/black-velvet.svg',
      desc: 'Smooth, dark and impossibly refined. Suede, cocoa and soft woods in a silky finish.',
      notes: { Top: 'Bergamot, Cocoa', Heart: 'Suede, Iris', Base: 'Sandalwood, Vanilla' } },
  ];

  const COLLECTIONS = {
    executive: { name: 'The Executive Collection', ids: [7, 4, 1] },
    royal:     { name: 'The Royal Collection',     ids: [3, 6, 8] },
    midnight:  { name: 'The Midnight Collection',  ids: [2, 5, 1] },
  };

  const FILTER_NAMES = { all: 'All Products', bestseller: 'Best Sellers', new: 'New Arrivals' };

  /* ---------- Helpers ---------- */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const byId = id => PRODUCTS.find(p => p.id === Number(id));
  const money = n => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
    },
    set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* storage unavailable */ } },
  };

  /* ---------- State ---------- */
  let cart = {};   // { productId: quantity }
  let wish = [];   // [productId]
  const state = { filter: 'all', query: '', sort: 'featured' };

  (function loadSaved() {
    const savedCart = store.get('aurex_cart', {});
    if (savedCart && typeof savedCart === 'object') {
      Object.entries(savedCart).forEach(([id, q]) => {
        const qty = Math.floor(Number(q));
        if (byId(id) && qty > 0) cart[id] = Math.min(qty, 99);
      });
    }
    const savedWish = store.get('aurex_wishlist', []);
    if (Array.isArray(savedWish)) wish = [...new Set(savedWish.map(Number).filter(id => byId(id)))];
  })();

  const saveCart = () => store.set('aurex_cart', cart);
  const saveWish = () => store.set('aurex_wishlist', wish);
  const inWish = id => wish.includes(Number(id));
  const cartCount = () => Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = () => Object.entries(cart).reduce((sum, [id, q]) => sum + byId(id).price * q, 0);

  /* ---------- Toasts ---------- */
  const toastStack = $('#toasts');
  function toast(message, icon = 'fa-circle-check') {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i><span></span>`;
    el.lastChild.textContent = message;
    toastStack.appendChild(el);
    while (toastStack.children.length > 4) toastStack.firstChild.remove();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 350); }, 2800);
  }

  /* ---------- Rendering: stars ---------- */
  function starsHTML(rating, showNum = true) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      if (rating >= i - 0.25) html += '<i class="fa-solid fa-star"></i>';
      else if (rating >= i - 0.75) html += '<i class="fa-solid fa-star-half-stroke"></i>';
      else html += '<i class="fa-regular fa-star far"></i>';
    }
    return `<span class="stars" role="img" aria-label="Rated ${rating.toFixed(1)} out of 5">${html}${showNum ? `<span class="rate-num">${rating.toFixed(1)}</span>` : ''}</span>`;
  }

  /* ---------- Product grid ---------- */
  const grid = $('#productGrid');
  const emptyState = $('#emptyState');
  const resultInfo = $('#resultInfo');

  function visibleProducts() {
    const f = state.filter;
    let list = PRODUCTS.filter(p => {
      if (f === 'all') return true;
      if (f === 'bestseller') return p.tag === 'bestseller';
      if (f === 'new') return p.tag === 'new';
      if (f.startsWith('col:')) return COLLECTIONS[f.slice(4)].ids.includes(p.id);
      return p.cat === f;
    });
    const q = state.query.trim().toLowerCase();
    if (q) list = list.filter(p => p.name.toLowerCase().includes(q) || p.label.toLowerCase().includes(q));
    if (state.sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    if (state.sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    return list;
  }

  function productCard(p, i) {
    const badge = p.tag === 'bestseller' ? '<span class="badge best">BESTSELLER</span>' : p.tag === 'new' ? '<span class="badge new">NEW</span>' : '';
    const liked = inWish(p.id);
    return `
      <article class="product reveal" style="--d:${(i % 4) * 0.08}s" data-id="${p.id}">
        <div class="p-media">
          ${badge}
          <button class="wish" data-action="wish" data-id="${p.id}" aria-pressed="${liked}" aria-label="${liked ? 'Remove' : 'Add'} ${p.name} ${liked ? 'from' : 'to'} wishlist">
            <i class="${liked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
          </button>
          <img src="${p.img}" alt="${p.name} perfume bottle" loading="lazy" width="600" height="750">
          <div class="p-actions"><button class="quick-btn" data-action="quick" data-id="${p.id}" aria-label="Quick view ${p.name}"><i class="fa-regular fa-eye"></i> Quick View</button></div>
        </div>
        <div class="p-body">
          <span class="p-cat">${p.label}</span>
          <h3>${p.name}</h3>
          ${starsHTML(p.rating)}
          <div class="p-foot">
            <span class="price">${money(p.price)}</span>
            <button class="btn btn-gold btn-sm" data-action="add" data-id="${p.id}" aria-label="Add ${p.name} to cart">Add to Cart</button>
          </div>
        </div>
      </article>`;
  }

  function renderGrid() {
    const list = visibleProducts();
    grid.innerHTML = list.map(productCard).join('');
    emptyState.hidden = list.length > 0;
    grid.hidden = list.length === 0;
    observeReveals(grid);

    let label = FILTER_NAMES[state.filter] || state.filter;
    if (state.filter.startsWith('col:')) label = COLLECTIONS[state.filter.slice(4)].name;
    const parts = [`Showing ${list.length} of ${PRODUCTS.length} fragrances`];
    if (state.filter !== 'all') parts.push(`in ${label}`);
    if (state.query.trim()) parts.push(`matching “${state.query.trim()}”`);
    resultInfo.textContent = parts.join(' ');
    if (state.filter !== 'all' || state.query.trim()) {
      const clear = document.createElement('button');
      clear.className = 'link-btn';
      clear.type = 'button';
      clear.textContent = 'Clear filters';
      clear.addEventListener('click', resetFilters);
      resultInfo.appendChild(clear);
    }
  }

  function syncChips() {
    $$('.chip').forEach(c => {
      const on = c.dataset.filter === state.filter;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-pressed', on);
    });
  }

  function setFilter(f) {
    state.filter = f;
    syncChips();
    renderGrid();
  }

  function resetFilters() {
    state.filter = 'all'; state.query = ''; state.sort = 'featured';
    $('#shopSearch').value = ''; $('#navSearch').value = ''; $('#sortSelect').value = 'featured';
    syncChips(); renderGrid();
  }

  function setQuery(q, source) {
    state.query = q;
    if (source !== 'shop') $('#shopSearch').value = q;
    if (source !== 'nav') $('#navSearch').value = q;
    renderGrid();
  }

  /* ---------- Wishlist / cart actions ---------- */
  function syncWishButtons() {
    $$('[data-action="wish"], .wish-inline').forEach(btn => {
      const id = Number(btn.dataset.id);
      const liked = inWish(id);
      const p = byId(id);
      btn.setAttribute('aria-pressed', liked);
      if (btn.classList.contains('wish')) btn.setAttribute('aria-label', `${liked ? 'Remove' : 'Add'} ${p.name} ${liked ? 'from' : 'to'} wishlist`);
      const icon = btn.querySelector('i');
      if (icon) icon.className = `${liked ? 'fa-solid' : 'fa-regular'} fa-heart`;
    });
  }

  function toggleWish(id) {
    id = Number(id);
    const p = byId(id);
    if (inWish(id)) { wish = wish.filter(w => w !== id); toast(`${p.name} removed from wishlist`, 'fa-heart-crack'); }
    else { wish.push(id); toast(`${p.name} added to wishlist`, 'fa-heart'); }
    saveWish(); updateBadges(); syncWishButtons();
    if (drawerMode === 'wishlist' && drawer.classList.contains('open')) renderDrawer();
  }

  function addToCart(id, qty = 1) {
    const p = byId(id);
    cart[id] = Math.min((cart[id] || 0) + qty, 99);
    saveCart(); updateBadges(true);
    toast(`${p.name} added to cart`, 'fa-bag-shopping');
    if (drawerMode === 'cart' && drawer.classList.contains('open')) renderDrawer();
  }

  function setQty(id, qty) {
    if (qty <= 0) return removeFromCart(id);
    cart[id] = Math.min(qty, 99);
    saveCart(); updateBadges(); renderDrawer();
  }

  function removeFromCart(id) {
    const p = byId(id);
    delete cart[id];
    saveCart(); updateBadges(); renderDrawer();
    toast(`${p.name} removed from cart`, 'fa-trash-can');
  }

  const cartBadge = $('#cartCount');
  const wishBadge = $('#wishCount');
  function updateBadges(bump = false) {
    const c = cartCount();
    cartBadge.textContent = c; cartBadge.hidden = c === 0;
    wishBadge.textContent = wish.length; wishBadge.hidden = wish.length === 0;
    if (bump && c) { cartBadge.classList.remove('bump'); void cartBadge.offsetWidth; cartBadge.classList.add('bump'); }
  }

  /* ---------- Layers: focus trap + scroll lock ---------- */
  const overlay = $('#overlay');
  const drawer = $('#drawer');
  const modal = $('#modal');
  let activeLayer = null, lastFocus = null;

  const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
  function openLayer(el, focusEl) {
    lastFocus = document.activeElement;
    activeLayer = el;
    document.body.classList.add('no-scroll');
    el.classList.add('open');
    el.setAttribute('aria-hidden', 'false');
    setTimeout(() => (focusEl || el.querySelector(FOCUSABLE))?.focus(), 60);
  }
  function closeLayer(el) {
    el.classList.remove('open');
    el.setAttribute('aria-hidden', 'true');
    if (activeLayer === el) activeLayer = null;
    if (!drawer.classList.contains('open') && !modal.classList.contains('open')) document.body.classList.remove('no-scroll');
    lastFocus?.focus?.();
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (modal.classList.contains('open')) closeModal();
      else if (drawer.classList.contains('open')) closeDrawer();
      else if (!$('#searchPanel').hidden) toggleSearch(false);
      else closeMobileNav();
    }
    if (e.key === 'Tab' && activeLayer) {
      const f = $$(FOCUSABLE, activeLayer).filter(n => n.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Drawer (cart / wishlist) ---------- */
  let drawerMode = 'cart';
  const drawerBody = $('#drawerBody');
  const drawerFoot = $('#drawerFoot');

  function renderDrawer() {
    $('#drawerTitle').textContent = drawerMode === 'cart' ? 'Your Cart' : 'Your Wishlist';

    if (drawerMode === 'cart') {
      const entries = Object.entries(cart);
      if (!entries.length) {
        drawerBody.innerHTML = `<div class="drawer-empty"><i class="fa-solid fa-bag-shopping"></i><h3>Your cart is empty</h3><p>Add a signature scent to get started.</p><button class="btn btn-gold btn-sm" data-action="close-and-shop">Browse Fragrances</button></div>`;
        drawerFoot.innerHTML = '';
        return;
      }
      drawerBody.innerHTML = entries.map(([id, q]) => {
        const p = byId(id);
        return `<div class="line-item">
          <img src="${p.img}" alt="${p.name}" width="76" height="92">
          <div class="li-info"><span class="li-cat">${p.label}</span><h3>${p.name}</h3><span class="li-price">${money(p.price)} × ${q} = <b>${money(p.price * q)}</b></span></div>
          <div class="li-side">
            <div class="qty" role="group" aria-label="Quantity for ${p.name}">
              <button data-action="dec" data-id="${id}" aria-label="Decrease quantity"><i class="fa-solid fa-minus"></i></button>
              <span aria-live="polite">${q}</span>
              <button data-action="inc" data-id="${id}" aria-label="Increase quantity"><i class="fa-solid fa-plus"></i></button>
            </div>
            <button class="remove-btn" data-action="remove" data-id="${id}" aria-label="Remove ${p.name} from cart">Remove</button>
          </div>
        </div>`;
      }).join('');
      const total = cartTotal();
      drawerFoot.innerHTML = `
        <div class="sum-row"><span>Subtotal (${cartCount()} item${cartCount() > 1 ? 's' : ''})</span><span>${money(total)}</span></div>
        <div class="sum-row"><span>Shipping</span><span>Free (demo)</span></div>
        <div class="sum-row total"><span>Total</span><strong>${money(total)}</strong></div>
        <p class="demo-flag"><i class="fa-solid fa-circle-info"></i> Demo only: checkout and payment do not process real transactions.</p>
        <button class="btn btn-gold btn-block" data-action="checkout">Demo Checkout</button>`;
    } else {
      if (!wish.length) {
        drawerBody.innerHTML = `<div class="drawer-empty"><i class="fa-regular fa-heart"></i><h3>Your wishlist is empty</h3><p>Tap the heart on any fragrance to save it here.</p><button class="btn btn-gold btn-sm" data-action="close-and-shop">Browse Fragrances</button></div>`;
        drawerFoot.innerHTML = '';
        return;
      }
      drawerBody.innerHTML = wish.map(id => {
        const p = byId(id);
        return `<div class="line-item">
          <img src="${p.img}" alt="${p.name}" width="76" height="92">
          <div class="li-info"><span class="li-cat">${p.label}</span><h3>${p.name}</h3><span class="li-price">${money(p.price)}</span></div>
          <div class="li-side">
            <button class="btn btn-gold btn-sm" data-action="add" data-id="${id}" aria-label="Add ${p.name} to cart">Add</button>
            <button class="remove-btn" data-action="wish" data-id="${id}" aria-label="Remove ${p.name} from wishlist">Remove</button>
          </div>
        </div>`;
      }).join('');
      drawerFoot.innerHTML = `<button class="btn btn-ghost btn-block" data-action="add-all-wish">Add all to cart</button>`;
    }
  }

  function openDrawer(mode) {
    drawerMode = mode;
    renderDrawer();
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('show'));
    openLayer(drawer, $('#drawerClose'));
  }
  function closeDrawer() {
    overlay.classList.remove('show');
    setTimeout(() => { if (!drawer.classList.contains('open')) overlay.hidden = true; }, 350);
    closeLayer(drawer);
  }

  /* ---------- Modal (quick view / demo checkout) ---------- */
  const modalContent = $('#modalContent');
  function openModal(html, focusSel) {
    modalContent.innerHTML = html;
    openLayer(modal, focusSel ? $(focusSel, modal) : $('#modalClose'));
  }
  function closeModal() { closeLayer(modal); }

  function openQuickView(id) {
    const p = byId(id);
    const notes = Object.entries(p.notes).map(([k, v]) => `<div><b>${k}</b><span>${v}</span></div>`).join('');
    const badge = p.tag === 'bestseller' ? '<span class="badge best" style="position:static;align-self:flex-start">BESTSELLER</span>' : '<span class="badge new" style="position:static;align-self:flex-start">NEW</span>';
    openModal(`
      <div class="qv">
        <div class="qv-media"><img src="${p.img}" alt="${p.name} perfume bottle" width="600" height="750"></div>
        <div class="qv-body">
          ${badge}
          <span class="p-cat">${p.label}</span>
          <h2 id="modalTitle">${p.name}</h2>
          ${starsHTML(p.rating)}
          <span class="price">${money(p.price)}</span>
          <p class="qv-desc">${p.desc}</p>
          <div class="notes">${notes}</div>
          <p class="qv-desc" style="font-size:.78rem">Eau de Parfum · 100 ml · Demo product</p>
          <div class="qv-actions">
            <button class="btn btn-gold" data-action="add" data-id="${p.id}"><i class="fa-solid fa-bag-shopping"></i> Add to Cart</button>
            <button class="wish-inline" data-action="wish" data-id="${p.id}" aria-pressed="${inWish(p.id)}" aria-label="Toggle wishlist for ${p.name}"><i class="${inWish(p.id) ? 'fa-solid' : 'fa-regular'} fa-heart"></i></button>
          </div>
        </div>
      </div>`, '.btn-gold');
  }

  function openCheckout() {
    const lines = Object.entries(cart).map(([id, q]) => `<div><span>${byId(id).name} × ${q}</span><span>${money(byId(id).price * q)}</span></div>`).join('');
    closeDrawer();
    setTimeout(() => openModal(`
      <div class="checkout">
        <span class="eyebrow">DEMO CHECKOUT</span>
        <h2 id="modalTitle">Order Summary</h2>
        <div class="co-lines">${lines}<div style="border-top:1px solid var(--glass-border);padding-top:10px;color:#fff;font-weight:600"><span>Total</span><span>${money(cartTotal())}</span></div></div>
        <p class="warn"><i class="fa-solid fa-triangle-exclamation"></i> This is a portfolio demo. No payment details are collected and no real order will be placed.</p>
        <div class="co-actions">
          <button class="btn btn-ghost" data-action="close-modal">Back</button>
          <button class="btn btn-gold" data-action="place-order">Place Demo Order</button>
        </div>
      </div>`, '[data-action="place-order"]'), 380);
  }

  function placeOrder() {
    cart = {}; saveCart(); updateBadges();
    modalContent.innerHTML = `
      <div class="checkout">
        <div class="success-icon"><i class="fa-solid fa-check"></i></div>
        <h2 id="modalTitle">Thank you!</h2>
        <p class="qv-desc">Your demo order was “placed” successfully. Nothing was charged and nothing will be shipped.</p>
        <div class="co-actions" style="margin-top:22px"><button class="btn btn-gold" data-action="close-modal">Continue Browsing</button></div>
      </div>`;
    $('[data-action="close-modal"]', modal)?.focus();
    toast('Demo order placed. No real transaction.', 'fa-circle-check');
  }

  /* ---------- Global click delegation ---------- */
  document.addEventListener('click', e => {
    // Filter links/buttons (nav, hero, categories, footer)
    const filterEl = e.target.closest('[data-filter]');
    if (filterEl && !filterEl.classList.contains('chip')) {
      setFilter(filterEl.dataset.filter);
      closeMobileNav();
      return; // anchor default scroll continues
    }
    const colEl = e.target.closest('[data-collection]');
    if (colEl) {
      setFilter('col:' + colEl.dataset.collection);
      $('#shop').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      toast(`Showing ${COLLECTIONS[colEl.dataset.collection].name}`, 'fa-gem');
      return;
    }
    const chip = e.target.closest('.chip');
    if (chip) { setFilter(chip.dataset.filter); return; }

    // Demo placeholder links
    const demo = e.target.closest('a[data-demo]');
    if (demo) { e.preventDefault(); toast('Demo site: this page is not part of the project', 'fa-circle-info'); return; }

    const act = e.target.closest('[data-action]');
    if (!act) return;
    const id = act.dataset.id;
    switch (act.dataset.action) {
      case 'add': addToCart(id); break;
      case 'wish': toggleWish(id); break;
      case 'quick': openQuickView(id); break;
      case 'inc': setQty(id, (cart[id] || 0) + 1); break;
      case 'dec': setQty(id, (cart[id] || 0) - 1); break;
      case 'remove': removeFromCart(id); break;
      case 'checkout': openCheckout(); break;
      case 'place-order': placeOrder(); break;
      case 'close-modal': closeModal(); break;
      case 'close-and-shop': closeDrawer(); $('#shop').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); break;
      case 'add-all-wish': {
        wish.forEach(w => { cart[w] = Math.min((cart[w] || 0) + 1, 99); });
        saveCart(); updateBadges(true); toast('Wishlist items added to cart', 'fa-bag-shopping'); break;
      }
    }
  });

  /* ---------- Header controls ---------- */
  $('#cartBtn').addEventListener('click', () => openDrawer('cart'));
  $('#wishlistBtn').addEventListener('click', () => openDrawer('wishlist'));
  $('#drawerClose').addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
  $('#modalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  $('#accountBtn').addEventListener('click', () => toast('Accounts are not available in this demo', 'fa-user'));

  // Header shadow on scroll
  const header = $('#siteHeader');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Mobile nav
  const burger = $('#burger'), nav = $('#primaryNav');
  function closeMobileNav() {
    nav.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    burger.innerHTML = '<i class="fa-solid fa-bars"></i>';
  }
  burger.addEventListener('click', () => {
    const open = !nav.classList.contains('open');
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    burger.innerHTML = `<i class="fa-solid ${open ? 'fa-xmark' : 'fa-bars'}"></i>`;
    if (open) toggleSearch(false);
  });
  $$('.nav-link').forEach(l => l.addEventListener('click', closeMobileNav));
  window.matchMedia('(min-width: 992px)').addEventListener('change', closeMobileNav);

  // Search
  const searchPanel = $('#searchPanel'), searchToggle = $('#searchToggle');
  function toggleSearch(open) {
    searchPanel.hidden = !open;
    searchToggle.setAttribute('aria-expanded', open);
    if (open) { closeMobileNav(); setTimeout(() => $('#navSearch').focus(), 30); }
  }
  searchToggle.addEventListener('click', () => toggleSearch(searchPanel.hidden));
  $('#navSearch').addEventListener('input', e => setQuery(e.target.value, 'nav'));
  $('#navSearch').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); toggleSearch(false); $('#shop').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); }
  });
  $('#shopSearch').addEventListener('input', e => setQuery(e.target.value, 'shop'));
  $('#sortSelect').addEventListener('change', e => { state.sort = e.target.value; renderGrid(); });
  $('#resetFilters').addEventListener('click', resetFilters);

  /* ---------- Newsletter (frontend validation only) ---------- */
  const nlForm = $('#newsletterForm'), nlEmail = $('#nlEmail'), nlMsg = $('#nlMsg');
  nlForm.addEventListener('submit', e => {
    e.preventDefault();
    const v = nlEmail.value.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    nlEmail.setAttribute('aria-invalid', String(!valid));
    nlMsg.className = 'nl-msg ' + (valid ? 'ok' : 'err');
    if (!valid) {
      nlMsg.textContent = v ? 'Please enter a valid email address, e.g. name@example.com.' : 'Please enter your email address.';
      nlEmail.focus();
      return;
    }
    nlMsg.textContent = 'Welcome to the AUREX Club! (Demo only: your email was not saved or sent.)';
    nlForm.reset();
    toast('Subscribed to the AUREX Club (demo)', 'fa-envelope-circle-check');
  });
  nlEmail.addEventListener('input', () => { nlEmail.removeAttribute('aria-invalid'); nlMsg.textContent = ''; });

  /* ---------- Scroll reveal ---------- */
  let revealObserver = null;
  if ('IntersectionObserver' in window && !reduceMotion) {
    revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); obs.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  }
  function observeReveals(root = document) {
    $$('.reveal:not(.in)', root).forEach(el => revealObserver ? revealObserver.observe(el) : el.classList.add('in'));
  }

  /* ---------- Active nav link on scroll ---------- */
  const navLinks = $$('.nav-link[data-section]');
  if ('IntersectionObserver' in window) {
    const secObs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) navLinks.forEach(l => l.classList.toggle('active', l.dataset.section === en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['home', 'shop', 'collections', 'about'].forEach(id => { const s = document.getElementById(id); if (s) secObs.observe(s); });
  }

  /* ---------- Hero particles ---------- */
  (function particles() {
    const canvas = $('#particles');
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dots = [], raf = null, visible = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(70, Math.max(24, w / 22)));
      dots = Array.from({ length: count }, () => spawn(true));
    }
    function spawn(anywhere) {
      return { x: Math.random() * w, y: anywhere ? Math.random() * h : h + 10, r: Math.random() * 1.8 + .4, vy: Math.random() * .28 + .08, vx: (Math.random() - .5) * .12, a: Math.random() * .5 + .15, p: Math.random() * Math.PI * 2 };
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        d.y -= d.vy; d.x += d.vx + Math.sin(d.p += .01) * .12;
        if (d.y < -10) Object.assign(d, spawn(false));
        ctx.beginPath();
        ctx.fillStyle = `rgba(241, 213, 143, ${d.a})`;
        ctx.shadowColor = 'rgba(212, 175, 105, .8)'; ctx.shadowBlur = 8;
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
      }
      raf = visible ? requestAnimationFrame(frame) : null;
    }
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }).observe(canvas);
    let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(resize, 150); });
    resize(); raf = requestAnimationFrame(frame);
  })();

  /* ---------- Init ---------- */
  updateBadges();
  renderGrid();
  observeReveals();
})();
