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
  acceptCancellation, serializeState, deserializeState
} from './domain.mjs';
import * as shop from './storefront.mjs';
import * as staff from './staff.mjs';
import { logoSvg } from './assets.mjs';

const NS = 'bike-store-prototype';
const seed = createSeed();

let state = loadState();
let flashMessage = null;
let ui = { selectedSkuByModel: {} };

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
  ui = { selectedSkuByModel: {} };
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
  if (qs) new URLSearchParams(qs).forEach((v, k) => { query[k] = v; });
  return { raw, path, parts, query };
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

function header(isStaff) {
  const count = state.cart.items.reduce((n, i) => n + i.qty, 0);
  return `<header class="site-header">
    <a class="brand" href="#home">${logoSvg()}<span class="brand-name">PEDAL &amp; FIELD</span></a>
    <nav class="main-nav" aria-label="Main">
      <a href="#catalog">Catalogue</a>
      <a href="#journal">Journal</a>
      <a href="#orders">Orders</a>
      <a href="#cart" class="cart-link">Cart${count ? ` <span class="cart-count">${count}</span>` : ''}</a>
      <a href="#guide">Guide</a>
      <a href="#staff/sign-in">Staff</a>
    </nav>
    ${isStaff ? '' : contextSelect()}
  </header>`;
}

function footer() {
  return `<footer class="site-footer">
    <div>
      <p><strong>PEDAL &amp; FIELD</strong> &mdash; draft prototype for review.</p>
      <p class="muted small">Synthetic data only. No real orders, payments, emails or stock. Support: support@pedal-and-field.example</p>
    </div>
    <nav aria-label="Information">
      <a href="#page/faq">FAQ</a><a href="#page/company">Company</a><a href="#page/delivery">Delivery</a>
      <a href="#page/payment">Payment</a><a href="#page/returns">Returns</a><a href="#page/contact">Contact</a>
    </nav>
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
  const params = { id: last, slug: last, orderId: last, query: route.query };
  const ctx = { flash: flashMessage, selectedSkuId: null };
  const isStaffRoute = route.path.startsWith('staff');

  if (isStaffRoute && route.path !== 'staff/sign-in') {
    const guard = guardStaffRoute(state.staff.role, route.raw);
    if (!guard.allowed) return { html: staff.denied(seed, state, params, { reason: reasonText(guard.reason) }), isStaff: true };
  }

  switch (true) {
    case route.path === 'home': return { html: shop.home(seed, state, params, ctx) };
    case route.path === 'catalog': return { html: shop.catalog(seed, state, params, ctx) };
    case p[0] === 'product': {
      const modelId = p[1];
      ctx.selectedSkuId = ui.selectedSkuByModel[modelId] || null;
      return { html: shop.product(seed, state, params, ctx) };
    }
    case route.path === 'cart': return { html: shop.cart(seed, state, params, ctx) };
    case route.path === 'checkout': return { html: shop.checkout(seed, state, params, { ...ctx, form: ui.checkoutForm, errors: ui.checkoutErrors }), afterRender: afterCheckout };
    case p[0] === 'payment':
      if (!canViewOrder(state, p[1])) return { html: proofRequired(p[1]) };
      return { html: shop.payment(seed, state, params, ctx) };
    case p[0] === 'result':
      if (!canViewOrder(state, p[1])) return { html: proofRequired(p[1]) };
      return { html: shop.result(seed, state, params, ctx) };
    case route.path === 'sign-in': return { html: shop.signIn(seed, state, params, ctx) };
    case route.path === 'verify': return { html: shop.verify(seed, state, params, ctx) };
    case route.path === 'orders': return { html: shop.orders(seed, state, params, ctx) };
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
    ${footer()}`;
  document.title = 'PEDAL & FIELD prototype';
  const badge = document.querySelector('.demo-badge') || document.createElement('div');
  badge.className = 'demo-badge';
  badge.setAttribute('role', 'note');
  badge.textContent = 'DEMO — prototype, not production';
  if (!badge.parentElement) document.body.appendChild(badge);
  flashMessage = null;
  pendingAfterRender = afterRender || null;
  if (pendingAfterRender) pendingAfterRender();
  attachFinder();
}

function afterCheckout() {
  const radios = document.querySelectorAll('input[name="fulfilment"]');
  radios.forEach((r) => r.addEventListener('change', () => {
    const collection = document.querySelector('input[name="fulfilment"][value="collection"]').checked;
    const addr = document.querySelector('[data-address-fields]');
    const store = document.querySelector('[data-store-fields]');
    if (addr) addr.hidden = collection;
    if (store) store.hidden = !collection;
  }));
}

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
// Event handling
// ---------------------------------------------------------------------------

document.addEventListener('change', (event) => {
  const el = event.target;

  if (el.matches('[data-action="set-context"]')) {
    if (el.value === 'delivery') state.cart.context = { type: 'delivery', storeId: null };
    else state.cart.context = { type: 'collection', storeId: el.value };
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
});

document.addEventListener('click', (event) => {
  const el = event.target.closest('[data-action]');
  if (!el) return;
  const action = el.getAttribute('data-action');

  switch (action) {
    case 'select-sku': {
      const sku = getSku(seed, el.getAttribute('data-sku'));
      if (sku) ui.selectedSkuByModel[sku.modelId] = sku.id;
      render();
      break;
    }
    case 'add-to-cart': {
      const skuId = el.getAttribute('data-sku');
      const qtyInput = document.getElementById('p-qty');
      const qty = qtyInput ? Number(qtyInput.value) : 1;
      const res = addToCart(state.cart, skuId, qty);
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
      confirmEmailVerification(state);
      flash('Email confirmed (mock). Order history is now visible.');
      saveState(); navigate('#orders');
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
    for (const key of ['q', 'category', 'brand', 'type', 'wheels', 'frameSize', 'priceMax', 'heightCm', 'sort', 'inStock']) {
      const v = fd.get(key);
      if (v) q.set(key, v);
    }
    navigate('#catalog' + (q.toString() ? '?' + q.toString() : ''));
    return;
  }

  // --- Checkout ---
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
    }
    return;
  }

  // --- Guest login (mock) ---
  if (form.matches('[data-login-form]')) {
    const fd = new FormData(form);
    logEmail(state, { to: fd.get('email'), subject: 'Sign in to your orders', kind: 'E-01 request' });
    flash('If that address matches an account, a sign-in link will be sent. Nothing is sent in this demo.');
    saveState(); render();
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

window.addEventListener('hashchange', render);
render();
