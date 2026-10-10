// Prototype application shell: hash router, persistent demo state, event handling.
// Browser ES module. No build step, no dependencies.
import { createSeed } from './fixtures.mjs';
import {
  createInitialState, escapeHtml, guardStaffRoute, canViewOrder, addToCart,
  setCartQuantity, removeFromCart, findCartItem, beginPayment, simulatePayment,
  startReorder, completeCheckout, cancelUnpaidOrder, requestCancellation,
  confirmEmailVerification, markReady, extendCollection, recordCollectionPayment,
  collect, dispatchOrder, deliverOrder, requestRefund, resolveRefund, restockReturn,
  staffAdjustStock, setPage, setArticle, setCuration, setSkuPrice, logEmail,
  filterModels, getSku, getModel, selectCurrentGuestOrder, clearGuestSession,
  seedDemoHistory, seedDemoScenarios, canAccessStaff,
  acceptCancellation, serializeState, deserializeState,
  cartTotals, formatGBP, chooseSku, skuOptionValue,
  isSignedIn, isWishlisted, addToWishlist, removeFromWishlist,
  signInCustomer, signOutCustomer, requestEmailAccess, confirmEmailAccess,
  confirmProviderAccess, resolveCartContext, checkoutGate, createProductReview
} from './domain.mjs';
import * as shop from './storefront.mjs';
import * as staff from './staff.mjs';
import {
  logoSvg, iconUser, iconCart, iconOrders, iconHeart, iconSearch,
  iconChevron, iconTruck, iconStore
} from './assets.mjs';

const NS = 'bike-store-prototype';
const seed = createSeed();

let state = loadState();
let flashMessage = null;
let ui = {
  selectedSkuByModel: {},
  skuNoteByModel: {},
  productTabByModel: {},
  reviewPageByModel: {},
  galleryIndexByModel: {},
  checkoutForm: null,
  checkoutErrors: null,
  heroSlide: 0,
  authDialogOpen: false,
  authMode: 'login',
  authStage: 'email',
  authProviderPending: null,
  pendingWishlistModelId: null,
  wishlistDialogOpen: false,
  wishlistDialogModelId: null,
  galleryDialogOpen: false,
  galleryDialogModelId: null,
  reviewDialogOpen: false,
  reviewDialogModelId: null,
  reviewDraft: null,
  reviewError: null,
  reviewAfterAuth: false,
  focusRestore: null
};

function blankUi() {
  return {
    selectedSkuByModel: {}, skuNoteByModel: {}, productTabByModel: {}, reviewPageByModel: {},
    galleryIndexByModel: {}, checkoutForm: null, checkoutErrors: null,
    heroSlide: 0, authDialogOpen: false, authMode: 'login', authStage: 'email',
    authProviderPending: null, pendingWishlistModelId: null,
    wishlistDialogOpen: false, wishlistDialogModelId: null,
    galleryDialogOpen: false, galleryDialogModelId: null,
    reviewDialogOpen: false, reviewDialogModelId: null, reviewDraft: null,
    reviewError: null, reviewAfterAuth: false, focusRestore: null
  };
}

// ---------------------------------------------------------------------------
// Storage (defensive: malformed or unavailable storage must be safe)
// ---------------------------------------------------------------------------

function loadState() {
  try {
    return deserializeState(seed, window.localStorage.getItem(NS));
  } catch (err) {
    return createInitialState(seed);
  }
}

function saveState() {
  try {
    window.localStorage.setItem(NS, serializeState(state));
  } catch (err) {
    // Storage unavailable or full: the demo continues in memory only.
  }
}

function resetState() {
  try { window.localStorage.removeItem(NS); } catch (err) { /* ignore */ }
  state = createInitialState(seed);
  ui = blankUi();
  flash('Demo state reset.');
}

function flash(message) { flashMessage = message; }

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

function parseHash() {
  let raw = window.location.hash.replace(/^#/, '');
  if (!raw) raw = 'home';
  const [path, qs] = raw.split('?');
  const parts = path.split('/');
  const query = {};
  const queryList = {};
  if (qs) {
    new URLSearchParams(qs).forEach((v, k) => {
      query[k] = v; // legacy scalar: last value wins
      if (!queryList[k]) queryList[k] = [];
      queryList[k].push(v);
    });
  }
  return { raw, path, parts, query, queryList };
}

function navigate(hash) {
  if (window.location.hash === hash) render();
  else window.location.hash = hash;
}

// ---------------------------------------------------------------------------
// Shared fragments
// ---------------------------------------------------------------------------

function contextSelect() {
  const c = state.cart.context;
  const value = c.type === 'collection' && c.storeId ? c.storeId : 'delivery';
  return `<div class="context-picker">
    <label for="ctx">For your next purchase</label>
    <select id="ctx" data-action="set-context">
      <option value="delivery"${value === 'delivery' ? ' selected' : ''}>Delivery (Central Warehouse)</option>
      ${seed.stockLocations.filter((l) => l.type === 'store').map((l) => `<option value="${escapeHtml(l.id)}"${value === l.id ? ' selected' : ''}>Collect: ${escapeHtml(l.name)}</option>`).join('')}
    </select>
  </div>`;
}

function categoryButtons() {
  return seed.categories.map((cat) =>
    `<button class="nav-cat" type="button" data-action="toggle-mega" aria-expanded="false" aria-controls="mega-${escapeHtml(cat.id)}">${escapeHtml(cat.name)} ${iconChevron('down')}</button>`).join('');
}

// Panels live OUTSIDE the horizontally scrolling category row so they are never
// clipped by its overflow; they are absolutely positioned under the header.
function categoryPanels() {
  return seed.categories.map((cat) => {
    const types = [...new Set(seed.models
      .filter((m) => m.published && m.categoryId === cat.id && m.type)
      .map((m) => m.type))].sort();
    return `<div class="mega-panel" id="mega-${escapeHtml(cat.id)}">
      <h3>${escapeHtml(cat.name)}</h3>
      <ul>
        <li><a href="#catalog?category=${escapeHtml(cat.id)}">All ${escapeHtml(cat.name.toLowerCase())}</a></li>
        ${types.map((t) => `<li><a href="#catalog?category=${escapeHtml(cat.id)}&type=${escapeHtml(t)}">${escapeHtml(t)}</a></li>`).join('')}
      </ul>
    </div>`;
  }).join('');
}

function header(isStaff) {
  const count = state.cart.items.reduce((n, i) => n + i.qty, 0);
  const wishCount = isSignedIn(state) ? (Array.isArray(state.wishlist) ? state.wishlist.length : 0) : 0;
  return `<header class="site-header">
    <div class="header-top"><div class="header-inner">
      <span class="top-info">${iconTruck()} Delivery across the UK (demo)</span>
      <span class="top-info">Cards accepted (demo)</span>
      <span class="top-spacer"></span>
      <a href="#page/delivery">Delivery</a>
      <a href="#page/payment">Payment</a>
      <a href="#page/contact">Contact</a>
      <a href="#journal">Journal</a>
    </div></div>
    <div class="header-main header-inner">
      <a class="brand" href="#home">${logoSvg()}<span class="brand-name">PEDAL &amp; FIELD</span></a>
      <form class="header-search" data-header-search role="search">
        <label class="visually-hidden" for="site-search">Search products</label>
        <input id="site-search" name="q" type="search" placeholder="Search bikes, parts and kit">
        <button type="submit" aria-label="Search">${iconSearch()}</button>
      </form>
      <nav class="header-icons" aria-label="Account, wishlist, orders and cart">
        <a class="header-icon" href="#account">${iconUser()}<span>Account</span></a>
        <a class="header-icon header-icon-wishlist" href="#wishlist">${iconHeart()}<span>Wishlist${wishCount ? ' (' + wishCount + ')' : ''}</span></a>
        <a class="header-icon" href="#orders">${iconOrders()}<span>Orders</span></a>
        <a class="header-icon" href="#cart">${iconCart()}<span>Cart</span>${count ? `<span class="cart-count">${count}</span>` : ''}</a>
      </nav>
    </div>
    <div class="nav-categories"><div class="header-inner">
      <div class="nav-row nav-row-cats">
        ${categoryButtons()}
        <a class="nav-cat" href="#catalog">All products</a>
      </div>
      ${categoryPanels()}
      <div class="nav-row nav-row-util">
        ${isStaff ? '' : contextSelect()}
        <a class="nav-cat nav-staff" href="#staff/sign-in">Staff</a>
        <a class="nav-cat nav-guide" href="#guide">Guide</a>
      </div>
    </div></div>
  </header>`;
}

function footer() {
  const catLinks = seed.categories.map((c) => `<li><a href="#catalog?category=${escapeHtml(c.id)}">${escapeHtml(c.name)}</a></li>`).join('');
  return `<footer class="site-footer">
    <div class="footer-grid">
      <div class="footer-col">
        <h3>Shop</h3>
        <ul>${catLinks}<li><a href="#catalog">All products</a></li></ul>
      </div>
      <div class="footer-col">
        <h3>Help</h3>
        <ul>
          <li><a href="#page/faq">FAQ</a></li>
          <li><a href="#page/delivery">Delivery</a></li>
          <li><a href="#page/returns">Returns</a></li>
          <li><a href="#page/payment">Payment</a></li>
          <li><a href="#page/contact">Contact</a></li>
          <li><a href="#guide">Prototype guide</a></li>
          <li><a href="#staff/sign-in">Staff sign-in</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h3>Account</h3>
        <ul>
          <li><a href="#account">Your account</a></li>
          <li><a href="#wishlist">Wishlist</a></li>
          <li><a href="#orders">Orders</a></li>
          <li><a href="#journal">Journal</a></li>
          <li><a href="#page/company">About</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h3>Contact</h3>
        <ul>
          <li><a href="mailto:support@pedal-and-field.example">support@pedal-and-field.example</a></li>
          <li>York store &middot; Bath store</li>
          <li>Mon&ndash;Sat, 9:00&ndash;18:00 (demo)</li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p class="muted small">PEDAL &amp; FIELD &mdash; draft prototype for review. Synthetic data only: no real orders, payments, emails or stock.</p>
      <div class="footer-pay">
        <span class="muted small">Payment accepted (demo):</span>
        <span class="pay-chip">Visa</span>
        <span class="pay-chip">Mastercard</span>
        <span class="pay-chip">American Express</span>
        <span class="pay-chip">Apple Pay</span>
        <span class="pay-chip">Google Pay</span>
      </div>
    </div>
  </footer>`;
}

function demoBadge() {
  return `<div class="demo-badge" role="note">DEMO &mdash; prototype, not production</div>`;
}

function staffNav() {
  if (!state.staff.authenticated || !state.staff.role) return '';
  const role = state.staff.role;
  const item = (area, href, label) => canAccessStaff(role, area) ? `<a href="${href}">${label}</a>` : '';
  return `<nav class="staff-nav" aria-label="Back office">
    ${item('orders', '#staff/orders', 'Orders')}
    ${item('returns', '#staff/returns', 'Returns')}
    ${item('inventory', '#staff/inventory', 'Inventory')}
    ${item('content', '#staff/content', 'Content')}
    ${item('products', '#staff/products', 'Catalogue')}
    ${item('locations', '#staff/locations', 'Locations')}
    ${item('accounts', '#staff/accounts', 'Accounts')}
  </nav>`;
}

// ---------------------------------------------------------------------------
// View selection
// ---------------------------------------------------------------------------

function proofRequired(orderId) {
  return `<div class="empty-state">
    <h1>Verify your email first</h1>
    <p class="muted">Order ${escapeHtml(orderId)} is not part of this browser's current guest session. Access to another order requires confirming your email.</p>
    <p><a class="btn btn-primary" href="#sign-in">Request a sign-in link</a> <a class="btn btn-ghost" href="#guide">Prototype guide</a></p>
    <p class="muted small">One email or an order number alone is not enough. This is a mock demonstration; no real security is claimed.</p>
  </div>`;
}

function reasonText(reason) {
  const map = {
    not_signed_in: 'Sign in to the back office first (demo role switch).',
    manager_cannot_edit_catalogue: 'A Manager cannot edit the catalogue or prices.',
    manager_cannot_edit_locations: 'A Manager cannot edit locations or global settings.',
    manager_cannot_edit_accounts: 'A Manager cannot manage staff accounts or rights.'
  };
  return map[reason] || 'This section is not available to the current demo role.';
}

function resolveView(route) {
  const p = route.parts;
  // The identifying segment is always the last one (product/<id>, staff/order/<id>, ...).
  const last = p[p.length - 1];
  const params = { id: last, slug: last, orderId: last, query: route.query, queryList: route.queryList };
  const ctx = { flash: flashMessage, selectedSkuId: null, skuNote: null };
  const isStaffRoute = route.path.startsWith('staff');

  if (isStaffRoute && route.path !== 'staff/sign-in') {
    const guard = guardStaffRoute(state.staff.role, route.raw);
    if (!guard.allowed) return { html: staff.denied(seed, state, params, { reason: reasonText(guard.reason) }), isStaff: true };
  }

  switch (true) {
    case route.path === 'home': return { html: shop.home(seed, state, params, ctx), afterRender: () => setHero(ui.heroSlide || 0) };
    case route.path === 'catalog': return { html: shop.catalog(seed, state, params, ctx) };
    case p[0] === 'product': {
      const modelId = p[1];
      ctx.selectedSkuId = ui.selectedSkuByModel[modelId] || null;
      ctx.skuNote = ui.skuNoteByModel[modelId] || null;
      ctx.tab = ui.productTabByModel[modelId] || 'description';
      ctx.reviewPage = ui.reviewPageByModel[modelId] || 1;
      ctx.galleryIndex = ui.galleryIndexByModel[modelId] || 0;
      return { html: shop.product(seed, state, params, ctx) };
    }
    case route.path === 'cart':
    case route.path === 'checkout':
      return { html: shop.cart(seed, state, params, { ...ctx, form: ui.checkoutForm, errors: ui.checkoutErrors }), afterRender: afterCheckout };
    case p[0] === 'payment':
      if (!canViewOrder(state, p[1])) return { html: proofRequired(p[1]) };
      return { html: shop.payment(seed, state, params, ctx) };
    case p[0] === 'result':
      if (!canViewOrder(state, p[1])) return { html: proofRequired(p[1]) };
      return { html: shop.result(seed, state, params, ctx) };
    case route.path === 'sign-in': return { html: shop.signIn(seed, state, params, { ...ctx, mode: route.query.mode === 'register' ? 'register' : ui.authMode, stage: ui.authStage, provider: ui.authProviderPending, pendingEmail: state.pendingAccess ? state.pendingAccess.email : null }) };
    case route.path === 'verify': return { html: shop.verify(seed, state, params, ctx) };
    case route.path === 'orders': return { html: shop.orders(seed, state, params, ctx) };
    case route.path === 'wishlist': return { html: shop.wishlist(seed, state, params, ctx) };
    case route.path === 'account': return { html: shop.account(seed, state, params, ctx) };
    case p[0] === 'order':
      if (!canViewOrder(state, p[1])) return { html: proofRequired(p[1]) };
      return { html: shop.order(seed, state, params, ctx) };
    case p[0] === 'help':
      if (!canViewOrder(state, p[1])) return { html: proofRequired(p[1]) };
      return { html: shop.help(seed, state, params, ctx) };
    case route.path === 'journal': return { html: shop.journal(seed, state, params, ctx) };
    case p[0] === 'page': return { html: shop.page(seed, state, params, ctx) };
    case route.path === 'emails': return { html: shop.emails(seed, state, params, ctx), isStaff: state.staff.authenticated };
    case route.path === 'guide': return { html: shop.guide(seed, state, params, ctx) };

    case route.path === 'staff/sign-in': return { html: staff.staffSignIn(seed, state, params, ctx), isStaff: true };
    case route.path === 'staff/orders': return { html: staff.staffOrders(seed, state, params, ctx), isStaff: true };
    case p[0] === 'staff' && p[1] === 'order': return { html: staff.staffOrder(seed, state, params, ctx), isStaff: true };
    case route.path === 'staff/returns': return { html: staff.staffReturns(seed, state, params, ctx), isStaff: true };
    case route.path === 'staff/inventory': return { html: staff.staffInventory(seed, state, params, ctx), isStaff: true };
    case route.path === 'staff/products': return { html: staff.staffProducts(seed, state, params, ctx), isStaff: true };
    case p[0] === 'staff' && p[1] === 'product': return { html: staff.staffProduct(seed, state, params, ctx), isStaff: true };
    case route.path === 'staff/locations': return { html: staff.staffLocations(seed, state, params, ctx), isStaff: true };
    case route.path === 'staff/accounts': return { html: staff.staffAccounts(seed, state, params, ctx), isStaff: true };
    case route.path === 'staff/content': return { html: staff.staffContent(seed, state, params, ctx), isStaff: true };
    default: return { html: `<div class="empty-state"><h1>Page not found</h1><p><a class="btn" href="#home">Home</a></p></div>` };
  }
}

let pendingAfterRender = null;

function render() {
  const route = parseHash();
  const { html, isStaff, afterRender } = resolveView(route);
  const app = document.getElementById('app');
  app.innerHTML = `
    ${header(!!isStaff)}
    ${isStaff ? staffNav() : ''}
    ${flashMessage ? `<p class="notice notice-info" role="status">${escapeHtml(flashMessage)}</p>` : ''}
    <main id="main">${html}</main>
    ${footer()}
    ${ui.authDialogOpen ? shop.authDialog(seed, state, {}, { mode: ui.authMode, stage: ui.authStage, provider: ui.authProviderPending, pendingEmail: state.pendingAccess ? state.pendingAccess.email : null }) : ''}
    ${ui.wishlistDialogOpen ? shop.wishlistDialog(seed, state, {}, { modelId: ui.wishlistDialogModelId }) : ''}
    ${ui.galleryDialogOpen ? shop.galleryDialog(seed, state, {}, { modelId: ui.galleryDialogModelId, index: ui.galleryIndexByModel[ui.galleryDialogModelId] || 0, selectedSkuId: ui.selectedSkuByModel[ui.galleryDialogModelId] || null }) : ''}
    ${ui.reviewDialogOpen ? shop.reviewDialog(seed, state, {}, { modelId: ui.reviewDialogModelId, ...(ui.reviewDraft || {}), error: ui.reviewError }) : ''}`;
  document.title = 'PEDAL & FIELD prototype';
  const badge = document.querySelector('.demo-badge') || document.createElement('div');
  badge.className = 'demo-badge';
  badge.setAttribute('role', 'note');
  badge.textContent = 'DEMO — prototype, not production';
  if (!badge.parentElement) document.body.appendChild(badge);
  flashMessage = null;
  document.body.classList.toggle('has-checkout-submit', !!document.querySelector('.checkout-submit-fixed'));

  // Auth dialog (wishlist / sign-in). Only one modal is open at a time.
  mountDialog('auth-dialog', ui.authDialogOpen, () => {
    ui.authDialogOpen = false;
    ui.pendingWishlistModelId = null;
    ui.authProviderPending = null;
    ui.authStage = 'email';
    ui.reviewAfterAuth = false;
    restoreFocus();
  }, '[data-auth-autofocus]');
  mountDialog('wishlist-dialog', ui.wishlistDialogOpen, () => {
    ui.wishlistDialogOpen = false;
    restoreFocus();
  });
  mountDialog('gallery-dialog', ui.galleryDialogOpen, () => {
    ui.galleryDialogOpen = false;
    restoreFocus();
  });
  mountDialog('review-dialog', ui.reviewDialogOpen, () => {
    ui.reviewDialogOpen = false;
    ui.reviewError = null;
    restoreFocus();
  }, '[data-review-autofocus]');

  pendingAfterRender = afterRender || null;
  if (pendingAfterRender) pendingAfterRender();
  attachFinder();
  attachMega();
  if (!ui.authDialogOpen) restoreFocus();
}

// Show or close a native <dialog> to match the ui flag and wire its close event
// once per render. `onClose` clears the matching flag and restores focus.
function mountDialog(id, open, onClose, autofocusSelector) {
  const dlg = document.getElementById(id);
  if (!dlg) return;
  dlg.addEventListener('close', onClose);
  if (open && !dlg.open) {
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
    const af = autofocusSelector ? dlg.querySelector(autofocusSelector) : null;
    if (af && typeof af.focus === 'function') af.focus();
  }
}

function afterCheckout() {
  const form = document.querySelector('[data-checkout-form]');
  if (!form) return;
  // Typing must not re-render (that would lose the draft and focus): capture the
  // draft and refresh the summary amounts AND the shipping/availability gate in
  // place, so an invalid region or half-typed address recovers as soon as it is
  // valid without waiting for another render.
  form.addEventListener('input', () => { captureCheckoutDraft(form); updateCheckoutSummary(); });
  form.addEventListener('change', (event) => {
    captureCheckoutDraft(form);
    const target = event.target;
    // A fulfilment or store change must repack the cart context immediately so
    // availability rows and the submit gate reflect the new context. Re-render
    // after saving the draft; the draft is restored from ui.checkoutForm.
    if (target.matches('input[name="fulfilment"]') || target.matches('[name="storeId"]')) {
      syncCheckoutContext(form);
      return;
    }
    updateCheckoutSummary();
  });
  updateCheckoutSummary();
}

function readCheckoutDraft(form) {
  const fd = new FormData(form);
  return {
    contact: { name: fd.get('name') || '', email: fd.get('email') || '', phone: fd.get('phone') || '' },
    address: {
      line1: fd.get('line1') || '', line2: fd.get('line2') || '', city: fd.get('city') || '',
      postcode: fd.get('postcode') || '', regionId: fd.get('regionId') || ''
    }
  };
}

function captureCheckoutDraft(form) {
  ui.checkoutForm = readCheckoutDraft(form);
}

// Repack the cart context from the live form (the single transition helper) and
// re-render. The draft was captured by the caller first, so contact/address
// values survive the re-render.
function syncCheckoutContext(form) {
  const fd = new FormData(form);
  const fulfilment = fd.get('fulfilment') === 'collection' ? 'collection' : 'delivery';
  state.cart.context = resolveCartContext({ fulfilment, storeId: fd.get('storeId') });
  saveState();
  render();
}

function updateCheckoutSummary() {
  const form = document.querySelector('[data-checkout-form]');
  if (!form) return;
  const draft = readCheckoutDraft(form);
  const collection = !!form.querySelector('input[name="fulfilment"][value="collection"]')?.checked;
  const gate = checkoutGate(seed, state, state.cart, draft);
  const totals = gate.totals;
  const pricedTotals = gate.pricedTotals;
  const del = document.querySelector('[data-summary-delivery]');
  const tot = document.querySelector('[data-summary-total]');
  const vat = document.querySelector('[data-summary-vat]');
  const lbl = document.querySelector('[data-summary-total-label]');
  if (del) {
    del.textContent = collection ? 'Pay in store'
      : (gate.shippingPending ? 'Calculated at checkout'
        : (totals.shippingOk ? formatGBP(totals.shippingGross) : 'Not configured'));
  }
  if (tot) tot.textContent = formatGBP(pricedTotals.totalGross);
  if (vat) vat.textContent = formatGBP(pricedTotals.vatGross);
  if (lbl) lbl.textContent = gate.shippingPending ? 'Total before delivery (VAT included)' : 'Total (VAT included)';
  applyCheckoutGate(gate);
}

// Update the shipping warning and every submit button in place from the shared
// gate. This never enables a blocked cart: it only reflects the gate honestly.
function applyCheckoutGate(gate) {
  const blocked = gate.blocked;
  document.querySelectorAll('[data-checkout-submit]').forEach((btn) => {
    btn.disabled = blocked;
    if (blocked) btn.setAttribute('aria-disabled', 'true');
    else btn.removeAttribute('aria-disabled');
  });
  const warn = document.querySelector('[data-shipping-warning]');
  if (warn) {
    if (gate.shippingBlocked) {
      warn.hidden = false;
      warn.textContent = 'Delivery cannot be priced for this address. Choose another address or a store for collection.';
    } else {
      warn.hidden = true;
      warn.textContent = '';
    }
  }
}

// ---------------------------------------------------------------------------
// Hero carousel (manual only, no autoplay)
// ---------------------------------------------------------------------------

function setHero(index) {
  const carousel = document.querySelector('[data-hero-carousel]');
  if (!carousel) return;
  const slides = [...carousel.querySelectorAll('[data-hero-slide]')];
  const n = slides.length;
  if (!n) return;
  const idx = ((index % n) + n) % n;
  slides.forEach((s, k) => { s.hidden = k !== idx; });
  carousel.querySelectorAll('.hero-dot').forEach((d, k) => d.setAttribute('aria-current', String(k === idx)));
  ui.heroSlide = idx;
}

// ---------------------------------------------------------------------------
// Filter drawer (phones)
// ---------------------------------------------------------------------------

function openFilters() {
  const sidebar = document.getElementById('catalog-filters');
  const backdrop = document.querySelector('[data-filter-backdrop]');
  const btn = document.querySelector('[data-action="open-filters"]');
  if (!sidebar) return;
  sidebar.classList.add('open');
  if (backdrop) backdrop.hidden = false;
  if (btn) btn.setAttribute('aria-expanded', 'true');
  const first = sidebar.querySelector('input, select, button');
  if (first) first.focus();
}

function closeFilters(returnFocus = true) {
  const sidebar = document.getElementById('catalog-filters');
  const backdrop = document.querySelector('[data-filter-backdrop]');
  const btn = document.querySelector('[data-action="open-filters"]');
  if (sidebar) sidebar.classList.remove('open');
  if (backdrop) backdrop.hidden = true;
  if (btn) btn.setAttribute('aria-expanded', 'false');
  if (returnFocus && btn) btn.focus();
}

function closeMega() {
  document.querySelectorAll('.mega-panel.open').forEach((p) => p.classList.remove('open'));
  document.querySelectorAll('[data-action="toggle-mega"]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
}

function openMega(id, trigger) {
  const panel = id ? document.getElementById(id) : null;
  if (!panel) return;
  closeMega();
  panel.classList.add('open');
  if (trigger) trigger.setAttribute('aria-expanded', 'true');
}

// Mega menu open/close. A pointer tap fires mouseenter/focus before the click,
// so a naive toggle would open and immediately close on the first tap. We track
// the id an implicit hover/focus just opened and whether a pointer is active so
// the tap that focused the trigger is treated as an open, while a genuine
// second tap (or a keyboard Enter) still toggles closed.
let megaOpenedByImplicit = null;
let megaPointerActive = false;

function attachMega() {
  document.querySelectorAll('[data-action="toggle-mega"]').forEach((btn) => {
    const id = btn.getAttribute('aria-controls');
    const panel = id ? document.getElementById(id) : null;
    btn.addEventListener('pointerdown', () => { megaPointerActive = true; });
    btn.addEventListener('mouseenter', () => { megaOpenedByImplicit = id; openMega(id, btn); });
    btn.addEventListener('focus', () => { megaOpenedByImplicit = megaPointerActive ? id : null; openMega(id, btn); });
    btn.addEventListener('mouseleave', () => {
      setTimeout(() => {
        // A newer category may have opened while this trigger's delay ran.
        if (!panel || !panel.classList.contains('open')) return;
        if (panel && panel.matches(':hover')) return;
        if (btn.matches(':hover') || btn.matches(':focus')) return;
        closeMega();
      }, 140);
    });
    if (panel) {
      panel.addEventListener('mouseenter', () => openMega(id, btn));
      panel.addEventListener('mouseleave', () => {
        if (panel.classList.contains('open')) closeMega();
      });
    }
  });
}

document.addEventListener('pointerup', () => { megaPointerActive = false; }, true);

// ---------------------------------------------------------------------------
// Finder live count
// ---------------------------------------------------------------------------

function attachFinder() {
  const form = document.querySelector('[data-finder-form]');
  if (!form) return;
  const update = () => {
    const fd = new FormData(form);
    const criteria = {
      type: fd.get('type') || '',
      brand: fd.get('brand') || '',
      wheels: fd.get('wheels') || '',
      priceMax: fd.get('priceMax') ? Number(fd.get('priceMax')) : null,
      heightCm: fd.get('heightCm') ? Number(fd.get('heightCm')) : null
    };
    const res = filterModels(seed, state, criteria, state.cart.context);
    const out = form.querySelector('[data-finder-count]');
    if (out) out.textContent = `${res.modelCount} model${res.modelCount === 1 ? '' : 's'}`;
  };
  form.addEventListener('input', update);
  form.addEventListener('change', update);
}

// ---------------------------------------------------------------------------
// Wishlist / auth helpers
// ---------------------------------------------------------------------------

function finishAuth() {
  const pending = ui.pendingWishlistModelId;
  ui.authDialogOpen = false;
  ui.authProviderPending = null;
  ui.authStage = 'email';
  if (pending) {
    // Only an explicit confirmation reaches here: save the pending model once,
    // then show the success popup (a real save just happened).
    const res = addToWishlist(state, pending);
    ui.pendingWishlistModelId = null;
    saveState();
    if (res.ok) { openWishlistDialog(pending); return; }
  }
  if (ui.reviewAfterAuth) {
    // Return the customer to the still-unsigned review draft.
    ui.reviewAfterAuth = false;
    ui.reviewDialogOpen = true;
    ui.reviewError = null;
    saveState();
    render();
    return;
  }
  saveState();
  flash('Signed in (demo).');
  navigate('#account');
}

// Open the Russian wishlist success popup after a genuine save.
function openWishlistDialog(modelId) {
  ui.wishlistDialogOpen = true;
  ui.wishlistDialogModelId = modelId;
  ui.galleryDialogOpen = false;
  render();
}

function closeWishlistDialog() {
  ui.wishlistDialogOpen = false;
  ui.wishlistDialogModelId = null;
  render();
}

function openGalleryDialog(modelId) {
  ui.galleryDialogOpen = true;
  ui.galleryDialogModelId = modelId;
  render();
}

function closeGalleryDialog() {
  ui.galleryDialogOpen = false;
  ui.galleryDialogModelId = null;
  render();
}

// Remember the semantic locator of the element that opened a dialog/drawer so
// focus can be returned to its re-rendered counterpart after close.
function locatorFor(el) {
  if (!el) return null;
  if (el.hasAttribute('data-model')) return { action: el.getAttribute('data-action'), model: el.getAttribute('data-model') };
  if (el.hasAttribute('data-mode')) return { action: el.getAttribute('data-action'), mode: el.getAttribute('data-mode') };
  if (el.tagName === 'A' && el.getAttribute('href')) return { href: el.getAttribute('href') };
  if (el.hasAttribute('data-action')) return { action: el.getAttribute('data-action') };
  return null;
}

function restoreFocus() {
  const loc = ui.focusRestore;
  ui.focusRestore = null;
  if (!loc) return;
  let el = null;
  if (loc.href) el = document.querySelector(`a[href="${loc.href}"]`);
  else if (loc.action && loc.model) el = document.querySelector(`[data-action="${loc.action}"][data-model="${loc.model}"]`);
  else if (loc.action && loc.mode) el = document.querySelector(`[data-action="${loc.action}"][data-mode="${loc.mode}"]`);
  else if (loc.action) el = document.querySelector(`[data-action="${loc.action}"]`);
  if (el && typeof el.focus === 'function') el.focus();
}

function closeAuthDialog() {
  const d = document.getElementById('auth-dialog');
  if (d && d.open && typeof d.close === 'function') { d.close(); return; }
  ui.authDialogOpen = false;
  ui.pendingWishlistModelId = null;
  ui.authProviderPending = null;
  ui.authStage = 'email';
  ui.reviewAfterAuth = false;
  render();
}

// ---------------------------------------------------------------------------
// Event handling
// ---------------------------------------------------------------------------

document.addEventListener('change', (event) => {
  const el = event.target;

  if (el.matches('[data-action="set-context"]')) {
    const form = document.querySelector('[data-checkout-form]');
    if (form) captureCheckoutDraft(form);
    if (el.value === 'delivery') state.cart.context = resolveCartContext({ fulfilment: 'delivery' });
    else state.cart.context = resolveCartContext({ fulfilment: 'collection', storeId: el.value });
    saveState(); render();
    return;
  }

  if (el.matches('[data-action="set-qty"]')) {
    const skuId = el.getAttribute('data-sku');
    const res = setCartQuantity(state.cart, skuId, el.value);
    if (!res.ok) flash(res.error);
    saveState(); render();
    return;
  }

  if (el.matches('[data-action="select-colour"], [data-action="select-size"]')) {
    const modelId = parseHash().parts[1];
    const colourEl = document.getElementById('p-colour');
    const sizeEl = document.getElementById('p-size');
    const changed = el.getAttribute('data-action') === 'select-size' ? 'size' : 'colour';
    const res = chooseSku(seed, modelId, {
      colour: colourEl ? colourEl.value : null,
      size: sizeEl ? sizeEl.value : null,
      changed
    });
    if (res.sku) {
      ui.selectedSkuByModel[modelId] = res.sku.id;
      ui.skuNoteByModel[modelId] = res.adjusted
        ? (res.reason === 'size_adjusted'
          ? `That size is not available in the chosen colour, so ${res.sku.colour} / ${skuOptionValue(res.sku)} is shown instead.`
          : `That colour is not available in the chosen size, so ${res.sku.colour} / ${skuOptionValue(res.sku)} is shown instead.`)
        : null;
    }
    render();
    return;
  }

  if (el.matches('[data-auto-submit]') && el.form) {
    el.form.requestSubmit();
    return;
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const sidebar = document.getElementById('catalog-filters');
  if (sidebar && sidebar.classList.contains('open')) {
    event.preventDefault();
    closeFilters();
    return;
  }
  closeMega();
});

document.addEventListener('click', (event) => {
  const el = event.target.closest('[data-action]');
  const backdrop = event.target.closest('[data-filter-backdrop]');
  if (backdrop) { closeFilters(); return; }
  if (!el) return;
  const action = el.getAttribute('data-action');

  switch (action) {
    case 'hero-prev': setHero(ui.heroSlide - 1); break;
    case 'hero-next': setHero(ui.heroSlide + 1); break;
    case 'hero-slide': setHero(Number(el.getAttribute('data-slide'))); break;
    case 'toggle-mega': {
      const id = el.getAttribute('aria-controls');
      const panel = id ? document.getElementById(id) : null;
      if (!panel) break;
      const wasOpen = panel.classList.contains('open');
      const implicit = megaOpenedByImplicit === id;
      megaOpenedByImplicit = null;
      // If this click is the same pointer interaction that just focused/hovered
      // the trigger, keep it open; otherwise it is a real toggle (second tap or
      // keyboard Enter) and closes it.
      if (wasOpen && implicit) break;
      closeMega();
      if (!wasOpen) { panel.classList.add('open'); el.setAttribute('aria-expanded', 'true'); }
      break;
    }
    case 'open-filters': openFilters(); break;
    case 'close-filters': closeFilters(); break;
    case 'open-auth': {
      ui.focusRestore = locatorFor(el);
      ui.authMode = el.getAttribute('data-mode') === 'register' ? 'register' : 'login';
      ui.authStage = 'email';
      ui.authProviderPending = null;
      // Opening sign-in from the review dialog returns to the review afterwards.
      if (el.hasAttribute('data-review-auth') || ui.reviewDialogOpen) {
        ui.reviewAfterAuth = true;
        ui.reviewDialogOpen = false;
      }
      ui.authDialogOpen = true;
      render();
      break;
    }
    case 'auth-close': closeAuthDialog(); break;
    case 'auth-back': {
      const inDialog = !!el.closest('.auth-dialog');
      ui.authStage = 'email';
      ui.authProviderPending = null;
      ui.authDialogOpen = inDialog;
      render();
      break;
    }
    case 'auth-mode': {
      const inDialog = !!el.closest('.auth-dialog');
      ui.authMode = el.getAttribute('data-mode') === 'register' ? 'register' : 'login';
      ui.authStage = 'email';
      ui.authProviderPending = null;
      ui.authDialogOpen = inDialog;
      render();
      break;
    }
    case 'auth-provider': {
      const inDialog = !!el.closest('.auth-dialog');
      ui.authProviderPending = el.getAttribute('data-provider') || 'Google';
      ui.authStage = 'provider';
      ui.authDialogOpen = inDialog;
      render();
      break;
    }
    case 'auth-confirm-email': {
      const res = confirmEmailAccess(state);
      if (res.ok) { finishAuth(); }
      else { flash('Request a demo email first.'); ui.authStage = 'email'; render(); }
      break;
    }
    case 'auth-provider-confirm': {
      confirmProviderAccess(state, el.getAttribute('data-provider') || 'Google');
      finishAuth();
      break;
    }
    case 'sign-out': {
      signOutCustomer(state);
      flash('Signed out (demo). Your wishlist and order history are hidden until you sign in again.');
      saveState(); render();
      break;
    }
    case 'wishlist-toggle': {
      const modelId = el.getAttribute('data-model');
      if (!isSignedIn(state)) {
        ui.focusRestore = locatorFor(el);
        ui.pendingWishlistModelId = modelId;
        ui.authMode = 'login';
        ui.authStage = 'email';
        ui.authProviderPending = null;
        ui.authDialogOpen = true;
        render();
        break;
      }
      if (isWishlisted(state, modelId)) {
        removeFromWishlist(state, modelId);
        flash('Removed from your wishlist.');
        saveState(); render();
      } else {
        const res = addToWishlist(state, modelId);
        saveState();
        if (res.ok) openWishlistDialog(modelId);
        else render();
      }
      break;
    }
    case 'wishlist-dialog-close':
    case 'wishlist-continue': {
      closeWishlistDialog();
      break;
    }
    case 'wishlist-go': {
      ui.wishlistDialogOpen = false;
      ui.wishlistDialogModelId = null;
      saveState();
      navigate('#wishlist');
      break;
    }
    case 'open-gallery': {
      openGalleryDialog(parseHash().parts[1]);
      break;
    }
    case 'gallery-close': {
      closeGalleryDialog();
      break;
    }
    case 'gallery-view': {
      const modelId = parseHash().parts[1];
      ui.galleryIndexByModel[modelId] = Number(el.getAttribute('data-index')) || 0;
      render();
      break;
    }
    case 'gallery-prev':
    case 'gallery-next': {
      const modelId = ui.galleryDialogModelId;
      const delta = action === 'gallery-prev' ? -1 : 1;
      const cur = ui.galleryIndexByModel[modelId] || 0;
      const galleryEl = document.querySelector('[data-gallery]');
      const count = galleryEl ? Number(galleryEl.getAttribute('data-count')) : 0;
      ui.galleryIndexByModel[modelId] = count > 1 ? (((cur + delta) % count) + count) % count : 0;
      render();
      break;
    }
    case 'product-tab': {
      const modelId = parseHash().parts[1];
      ui.productTabByModel[modelId] = el.getAttribute('data-tab') || 'description';
      render();
      break;
    }
    case 'review-page': {
      const modelId = parseHash().parts[1];
      ui.reviewPageByModel[modelId] = Number(el.getAttribute('data-page')) || 1;
      render();
      break;
    }
    case 'open-review': {
      ui.reviewDialogOpen = true;
      ui.reviewDialogModelId = parseHash().parts[1];
      ui.reviewDraft = null;
      ui.reviewError = null;
      render();
      break;
    }
    case 'review-close': {
      ui.reviewDialogOpen = false;
      ui.reviewDialogModelId = null;
      ui.reviewDraft = null;
      ui.reviewError = null;
      render();
      break;
    }
    case 'wishlist-remove': {
      removeFromWishlist(state, el.getAttribute('data-model'));
      flash('Removed from your wishlist.');
      saveState(); render();
      break;
    }
    case 'select-sku': {
      const sku = getSku(seed, el.getAttribute('data-sku'));
      if (sku) ui.selectedSkuByModel[sku.modelId] = sku.id;
      render();
      break;
    }
    case 'add-to-cart': {
      const skuId = el.getAttribute('data-sku');
      // The product card adds one unit; quantity is adjusted in the cart (PRO-15).
      const res = addToCart(state.cart, skuId, 1);
      flash(res.ok ? 'Added to cart. Nothing is reserved yet.' : res.error);
      saveState(); render();
      break;
    }
    case 'step-qty': {
      const skuId = el.getAttribute('data-sku');
      const delta = Number(el.getAttribute('data-delta'));
      const item = findCartItem(state.cart, skuId);
      if (item) {
        const res = setCartQuantity(state.cart, skuId, item.qty + delta);
        if (!res.ok) flash(res.error);
      }
      saveState(); render();
      break;
    }
    case 'remove-item': {
      removeFromCart(state.cart, el.getAttribute('data-sku'));
      saveState(); render();
      break;
    }
    case 'begin-payment': {
      const orderId = el.getAttribute('data-order');
      const res = beginPayment(seed, state, orderId);
      if (!res.ok) flash('Payment cannot start: ' + res.reason);
      saveState(); navigate('#payment/' + orderId);
      break;
    }
    case 'pay': {
      const orderId = el.getAttribute('data-order');
      const outcome = el.getAttribute('data-outcome');
      const res = simulatePayment(seed, state, orderId, outcome);
      if (!res.ok) flash('Payment rejected: ' + res.reason);
      saveState(); navigate('#result/' + orderId);
      break;
    }
    case 'reorder': {
      const orderId = el.getAttribute('data-order');
      const res = startReorder(seed, state, orderId);
      if (res.ok) {
        flash('Order cancelled and copied into a new checkout. Review prices and availability, then place the order.');
        saveState(); navigate('#checkout');
      } else if (res.reason === 'payment_accepted') {
        flash('That order was already paid, so a cancellation request was created instead.');
        saveState(); render();
      } else {
        flash('Cannot place order again: ' + res.reason);
        render();
      }
      break;
    }
    case 'cancel-order': {
      const res = cancelUnpaidOrder(state, el.getAttribute('data-order'));
      flash(res.ok ? 'Order cancelled and reservation released.' : 'Cannot cancel: ' + res.reason);
      saveState(); render();
      break;
    }
    case 'request-cancellation': {
      const res = requestCancellation(state, el.getAttribute('data-order'), { reason: 'customer_request' });
      flash(res.ok ? 'Cancellation request submitted. It is not yet accepted and does not prove a refund.' : 'Cannot request: ' + res.reason);
      saveState(); render();
      break;
    }
    case 'confirm-verify': {
      let ok = false;
      if (state.pendingAccess) ok = confirmEmailAccess(state).ok;
      else { signInCustomer(state, { email: 'demo@example.com', name: 'Demo user' }); confirmEmailVerification(state); ok = true; }
      if (!ok) { flash('Request a demo email first.'); render(); break; }
      const pending = ui.pendingWishlistModelId;
      if (pending) { flash('Email confirmed (mock).'); finishAuth(); }
      else { flash('Email confirmed (mock). You are signed in for this demo.'); saveState(); navigate('#orders'); }
      break;
    }
    case 'mark-ready': {
      const res = markReady(state, el.getAttribute('data-order'), state.now());
      flash(res.ok ? (res.unchanged ? 'Already ready; deadline unchanged.' : 'Marked ready.') : 'Cannot mark ready: ' + res.reason);
      saveState(); render();
      break;
    }
    case 'extend-collection': {
      const res = extendCollection(state, el.getAttribute('data-order'), { author: 'demo-manager' });
      flash(res.ok ? 'Collection deadline extended once.' : 'Cannot extend: ' + res.reason);
      saveState(); render();
      break;
    }
    case 'request-refund': {
      const res = requestRefund(state, el.getAttribute('data-order'), { reason: 'accepted_cancellation' });
      flash(res.ok ? 'Refund initiated (pending). Money is not yet returned.' : 'Cannot refund: ' + res.reason);
      saveState(); render();
      break;
    }
    case 'accept-cancellation': {
      const res = acceptCancellation(state, el.getAttribute('data-order'), { reason: 'accepted_cancellation' });
      flash(res.ok
        ? (res.refund ? 'Cancellation accepted. Order preserved; refund pending (money not yet returned).' : 'Cancellation accepted. No money was received, so no refund was created.')
        : 'Cannot accept cancellation: ' + res.reason);
      saveState(); render();
      break;
    }
    case 'resolve-refund': {
      const res = resolveRefund(state, el.getAttribute('data-refund'), el.getAttribute('data-outcome'));
      flash(res.ok ? 'Refund marked ' + res.refund.state + '.' : 'Cannot resolve: ' + res.reason);
      saveState(); render();
      break;
    }
    case 'staff-signout': {
      state.staff = { role: null, authenticated: false, secondFactorPassed: false };
      flash('Left the back office (demo).');
      saveState(); navigate('#staff/sign-in');
      break;
    }
    case 'guide-select-order': {
      const res = selectCurrentGuestOrder(state, el.getAttribute('data-order'));
      flash(res.ok ? 'Current guest order set (guide action).' : 'Order not found.');
      saveState(); render();
      break;
    }
    case 'guide-clear-session': {
      clearGuestSession(state);
      flash('Simulated a new browser: guest session cleared. Order access now needs email proof.');
      saveState(); render();
      break;
    }
    case 'guide-seed-history': {
      seedDemoHistory(seed, state);
      flash('Seeded synthetic history for the mock verified persona.');
      saveState(); render();
      break;
    }
    case 'guide-seed-scenarios': {
      seedDemoScenarios(seed, state);
      flash('Seeded demo scenario orders. Open them from the guide links; your cart is unchanged.');
      saveState(); render();
      break;
    }
    case 'reset': {
      resetState();
      saveState(); navigate('#home');
      break;
    }
    default: break;
  }
});

document.addEventListener('submit', (event) => {
  const form = event.target;
  if (!form.matches('form')) return;
  event.preventDefault();

  // --- Header search ---
  if (form.matches('[data-header-search]')) {
    const fd = new FormData(form);
    const q = String(fd.get('q') || '').trim();
    navigate('#catalog' + (q ? '?q=' + encodeURIComponent(q) : ''));
    return;
  }

  // --- Account: request access. This only stores the intent; it does NOT sign
  // the demo persona in. A separate explicit confirmation grants access. ---
  if (form.matches('[data-auth-form]')) {
    const fd = new FormData(form);
    const mode = form.getAttribute('data-mode');
    const res = requestEmailAccess(state, { email: fd.get('email'), name: mode === 'register' ? fd.get('name') : null });
    if (!res.ok) { flash('Enter an email address.'); render(); return; }
    ui.authStage = 'confirm';
    saveState();
    render();
    return;
  }

  // --- Finder / catalogue ---
  if (form.matches('[data-finder-form]')) {
    const fd = new FormData(form);
    const q = new URLSearchParams();
    for (const key of ['priceMax', 'type', 'heightCm', 'wheels', 'brand']) {
      const v = fd.get(key);
      if (v) q.set(key, v);
    }
    navigate('#catalog' + (q.toString() ? '?' + q.toString() : ''));
    return;
  }
  if (form.matches('[data-catalog-form]')) {
    const fd = new FormData(form);
    const q = new URLSearchParams();
    // Multi-select groups: preserve every checked value (OR within a group).
    for (const key of ['category', 'brand', 'type', 'wheels', 'frameSize']) {
      for (const v of fd.getAll(key)) if (v) q.append(key, v);
    }
    for (const key of ['q', 'heightCm', 'sort']) {
      const v = fd.get(key);
      if (v) q.set(key, v);
    }
    // The catalogue price input is entered in pounds; the URL keeps pence so
    // legacy ?priceMax=100000 links (£1,000) still resolve identically.
    const price = fd.get('priceMax');
    if (price !== null && price !== '') {
      const pence = Math.round(Number(price) * 100);
      if (Number.isFinite(pence) && pence >= 0) q.set('priceMax', String(pence));
    }
    if (fd.get('inStock') === '1') q.set('inStock', '1');
    navigate('#catalog' + (q.toString() ? '?' + q.toString() : ''));
    return;
  }

  // --- Product review submission ---
  if (form.matches('[data-review-form]')) {
    const modelId = form.getAttribute('data-model');
    const fd = new FormData(form);
    const draft = { rating: fd.get('rating'), title: fd.get('title') || '', description: fd.get('description') || '' };
    const res = createProductReview(state, {
      modelId, rating: draft.rating, title: draft.title, description: draft.description
    });
    if (res.ok) {
      ui.reviewDialogOpen = false;
      ui.reviewDialogModelId = null;
      ui.reviewDraft = null;
      ui.reviewError = null;
      // Show the customer their own new review: newest first, page one.
      ui.reviewPageByModel[modelId] = 1;
      ui.productTabByModel[modelId] = 'reviews';
      saveState();
      flash('Thanks — your review was saved for this model.');
      render();
    } else {
      // Invalid submission keeps the dialog open and preserves the draft.
      ui.reviewDraft = draft;
      ui.reviewError = res.reason === 'not_signed_in' ? 'Sign in to submit a review.'
        : res.reason === 'invalid_rating' ? 'Choose a whole-number rating between 1 and 5.'
          : res.reason === 'title_required' ? 'Enter a review title.'
            : 'That review could not be saved.';
      saveState();
      render();
    }
    return;
  }

  // --- Cart / checkout (one unified form) ---
  if (form.matches('[data-checkout-form]')) {
    const fd = new FormData(form);
    const fulfilment = fd.get('fulfilment') || 'delivery';
    if (fulfilment === 'collection') {
      state.cart.context = { type: 'collection', storeId: fd.get('storeId') || null };
    } else {
      state.cart.context = { type: 'delivery', storeId: null };
    }
    const contact = { name: fd.get('name') || '', email: fd.get('email') || '', phone: fd.get('phone') || '' };
    const address = {
      line1: fd.get('line1') || '', line2: fd.get('line2') || '', city: fd.get('city') || '',
      postcode: fd.get('postcode') || '', regionId: fd.get('regionId') || ''
    };
    ui.checkoutForm = { contact, address };
    // The same shared completion helper the checks use: delivery starts its
    // reservation exactly once and opens the simulator; collection stays unpaid.
    const res = completeCheckout(seed, state, { contact, address });
    if (res.ok) {
      ui.checkoutForm = null; ui.checkoutErrors = null;
      flash(res.wasReorder ? 'New order placed from the reorder.' : 'Order created.');
      saveState();
      navigate(res.next === 'payment' ? '#payment/' + res.order.id : '#result/' + res.order.id);
    } else {
      ui.checkoutErrors = res.errors || { cart: 'Could not place the order (' + res.reason + ').' };
      flash('Please correct the highlighted fields.');
      saveState(); render();
      const firstErr = document.querySelector('#checkout-form [aria-invalid="true"]');
      const target = firstErr || document.getElementById('checkout-form');
      if (target && typeof target.focus === 'function') target.focus();
    }
    return;
  }

  // --- Help with an order ---
  if (form.matches('[data-help-form]')) {
    handleHelp(form);
    return;
  }

  // --- Staff sign-in ---
  if (form.matches('[data-staff-signin-form]')) {
    const fd = new FormData(form);
    state.staff.role = fd.get('role') || 'manager';
    state.staff.authenticated = true;
    state.staff.secondFactorPassed = false;
    flash('Entered back office as ' + state.staff.role + ' (demo role switch, not authentication).');
    saveState(); navigate('#staff/orders');
    return;
  }

  // --- Collection payment ---
  if (form.matches('[data-collection-payment-form]')) {
    const orderId = form.getAttribute('data-order');
    const fd = new FormData(form);
    const amount = Math.round(Number(fd.get('amount')) * 100);
    const res = recordCollectionPayment(state, orderId, { amountGross: amount, method: fd.get('method') });
    flash(res.ok ? 'Payment recorded. Handover is a separate step.' : 'Payment rejected: ' + res.reason + (res.expected ? ' (expected ' + (res.expected / 100).toFixed(2) + ')' : ''));
    saveState(); render();
    return;
  }
  if (form.matches('[data-collect-form]')) {
    const orderId = form.getAttribute('data-order');
    const fd = new FormData(form);
    const res = collect(state, orderId, { codeVerified: fd.get('codeVerified') === 'on' });
    flash(res.ok ? 'Collection confirmed.' : 'Cannot confirm collection: ' + res.reason);
    saveState(); render();
    return;
  }

  // --- Delivery ---
  if (form.matches('[data-dispatch-form]')) {
    const orderId = form.getAttribute('data-order');
    const fd = new FormData(form);
    const res = dispatchOrder(state, orderId, { carrier: fd.get('carrier'), date: fd.get('date'), tracking: fd.get('tracking') });
    flash(res.ok ? 'Dispatch registered.' : 'Cannot dispatch: ' + res.reason);
    saveState(); render();
    return;
  }
  if (form.matches('[data-deliver-form]')) {
    const orderId = form.getAttribute('data-order');
    const fd = new FormData(form);
    const res = deliverOrder(state, orderId, { evidence: fd.get('evidence') });
    flash(res.ok ? 'Delivery confirmed and order completed.' : 'Cannot confirm delivery: ' + res.reason);
    saveState(); render();
    return;
  }

  // --- Email correction ---
  if (form.matches('[data-email-correction-form]')) {
    const orderId = form.getAttribute('data-order');
    const fd = new FormData(form);
    const order = state.orders[orderId];
    if (order) {
      order.contact.email = fd.get('email');
      logEmail(state, { to: fd.get('email'), subject: 'Order update', kind: 'email corrected' });
      flash('Order email updated (demo). Ownership check is an open proposal.');
    }
    saveState(); render();
    return;
  }

  // --- Returns / inventory ---
  if (form.matches('[data-return-form]')) {
    const orderId = form.getAttribute('data-order');
    const fd = new FormData(form);
    const res = restockReturn(state, orderId, {
      skuId: fd.get('skuId'), qty: Number(fd.get('qty')),
      locationId: state.orders[orderId].fulfilment.type === 'collection' ? state.orders[orderId].fulfilment.storeId : 'warehouse',
      restock: fd.get('restock') === 'on'
    });
    flash(res.ok ? 'Return accepted' + (fd.get('restock') === 'on' ? ' and restocked once.' : '.') : 'Cannot accept return: ' + res.reason);
    saveState(); render();
    return;
  }
  if (form.matches('[data-stock-form]')) {
    const fd = new FormData(form);
    const res = staffAdjustStock(state, {
      skuId: fd.get('skuId'), locationId: fd.get('locationId'),
      delta: Number(fd.get('delta')), reason: fd.get('reason')
    });
    flash(res.ok ? 'Stock adjusted. New physical count: ' + res.next + '.' : 'Adjustment rejected: ' + res.reason);
    saveState(); render();
    return;
  }

  // --- Catalogue price / photo draft ---
  if (form.matches('[data-sku-price-form]')) {
    const skuId = form.getAttribute('data-sku');
    const fd = new FormData(form);
    const res = setSkuPrice(seed, skuId, {
      priceGross: Math.round(Number(fd.get('price')) * 100),
      regularGross: Math.round(Number(fd.get('regular')) * 100)
    });
    flash(res.ok ? 'Price saved. Existing order snapshots are unchanged.' : 'Cannot save price: ' + res.reason);
    saveState(); render();
    return;
  }
  if (form.matches('[data-photo-draft-form]')) {
    const out = document.querySelector('[data-photo-result]');
    if (out) {
      out.innerHTML = `<div class="notice notice-demo" role="status">
        <strong>Mock optimisation preview</strong>
        <p>Original kept. Proposed variants: 1600w (~180 KB), 800w (~70 KB), 400w (~25 KB) as WebP/AVIF/JPEG fallback.</p>
        <p class="muted small">Illustrative only &mdash; no files were uploaded or processed and no Payload/Sharp pipeline is claimed.</p>
      </div>`;
    }
    return;
  }

  // --- Content ---
  if (form.matches('[data-page-form]')) {
    const slug = form.getAttribute('data-slug');
    const fd = new FormData(form);
    const res = setPage(state, slug, { title: fd.get('title'), body: fd.get('body'), published: fd.get('published') === 'on' });
    flash(res.ok ? 'Page saved and published state updated.' : 'Cannot save page.');
    saveState(); render();
    return;
  }
  if (form.matches('[data-article-form]')) {
    const slug = form.getAttribute('data-slug');
    const fd = new FormData(form);
    const res = setArticle(state, slug, { title: fd.get('title'), body: fd.get('body'), published: fd.get('published') === 'on' });
    flash(res.ok ? 'Article saved and published state updated.' : 'Cannot save article.');
    saveState(); render();
    return;
  }
  if (form.matches('[data-curation-form]')) {
    const fd = new FormData(form);
    const checked = fd.getAll('model');
    const ordered = checked
      .map((id) => ({ id, order: Number(fd.get('order-' + id)) }))
      .sort((a, b) => (Number.isFinite(a.order) ? a.order : 999) - (Number.isFinite(b.order) ? b.order : 999));
    setCuration(state, 'featured', { modelIds: ordered.map((o) => o.id) });
    flash('Curation saved. Empty selections are hidden on the storefront.');
    saveState(); render();
    return;
  }
});

function handleHelp(form) {
  const orderId = form.getAttribute('data-order');
  const fd = new FormData(form);
  const action = fd.get('action');
  const order = state.orders[orderId];
  if (!order) { flash('Order not found.'); render(); return; }

  if (action === 'cancel') {
    const res = cancelUnpaidOrder(state, orderId);
    flash(res.ok ? 'Order declined and reservation released.' : 'Cannot decline: ' + res.reason);
  } else if (action === 'request-cancellation') {
    const res = requestCancellation(state, orderId, { reason: 'customer_request' });
    flash(res.ok ? 'Cancellation requested. A request is not an accepted cancellation and does not prove a refund.' : 'Cannot request: ' + res.reason);
  } else if (action === 'extend-collection') {
    order.extensionRequested = true;
    order.extensionRequestedAt = state.now();
    flash('Extension request recorded. A manager decides; this does not extend the deadline automatically.');
  } else if (action === 'return') {
    const lines = [];
    let invalid = null;
    order.lines.forEach((l, i) => {
      const raw = fd.get('return-' + i);
      const q = Number(raw);
      if (!Number.isInteger(q) || q < 0) { invalid = 'Return quantities must be whole numbers.'; return; }
      if (q > l.qty) { invalid = 'A return cannot exceed the purchased quantity for ' + l.name + '.'; return; }
      if (q > 0) lines.push({ skuId: l.skuId, qty: q });
    });
    if (invalid) flash(invalid);
    else if (!lines.length) flash('Choose at least one line quantity to return.');
    else {
      order.returnRequest = {
        lines,
        reason: fd.get('reason') || '',
        note: fd.get('note') || '',
        at: state.now()
      };
      flash('Return request submitted for review. Money and stock are decided separately.');
    }
  } else if (action === 'delivery-problem') {
    order.deliveryProblem = true;
    flash('Delivery problem reported. Support will follow up; no automatic compensation is promised.');
  }
  saveState(); render();
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

window.addEventListener('hashchange', () => {
  // Navigation always closes open dialogs so separate surfaces never coexist.
  if (ui.authDialogOpen) {
    ui.authDialogOpen = false;
    ui.pendingWishlistModelId = null;
    ui.authProviderPending = null;
    ui.authStage = 'email';
  }
  ui.wishlistDialogOpen = false;
  ui.wishlistDialogModelId = null;
  ui.galleryDialogOpen = false;
  ui.galleryDialogModelId = null;
  ui.reviewDialogOpen = false;
  ui.reviewDialogModelId = null;
  ui.reviewDraft = null;
  ui.reviewError = null;
  ui.reviewAfterAuth = false;
  render();
});
render();
