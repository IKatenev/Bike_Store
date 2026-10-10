// Pure, dependency-free domain logic for the Bike Store prototype.
// Importable from both Node (checks) and the browser (ES modules).
// Canonical names follow docs/THESAURUS.md: ProductModel, SKU, Cart,
// Order/OrderLineItem, Reservation, Collection, Refund, StockLocation.
// OrderState / PaymentState / FulfilmentState are kept strictly separate.

const DAY_MS = 24 * 60 * 60 * 1000;
export const RESERVATION_WINDOW_MS = 30 * 60 * 1000; // 30 minutes, demo
const LONDON_TZ = 'Europe/London';

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------

export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatGBP(pence) {
  const n = Number(pence) || 0;
  return '\u00a3' + (n / 100).toFixed(2);
}

export function netFromGross(gross, rate) {
  return Math.round(gross / (1 + rate));
}

// ---------------------------------------------------------------------------
// Europe/London calendar helpers (DST-aware; no external dependencies)
// ---------------------------------------------------------------------------

const londonPartsFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: LONDON_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
});

export function londonParts(ts) {
  const parts = londonPartsFmt.formatToParts(new Date(ts));
  const map = {};
  for (const p of parts) if (p.type !== 'literal') map[p.type] = p.value;
  return {
    year: Number(map.year), month: Number(map.month), day: Number(map.day),
    hour: Number(map.hour), minute: Number(map.minute), second: Number(map.second)
  };
}

function londonOffsetMs(ts) {
  const p = londonParts(ts);
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUTC - ts;
}

function londonWallToUtc(year, month, day, hour, minute, second) {
  const base = Date.UTC(year, month - 1, day, hour, minute, second);
  let utc = base;
  for (let i = 0; i < 3; i++) utc = base - londonOffsetMs(utc);
  return utc;
}

function addCalendarDays(year, month, day, n) {
  const dt = new Date(Date.UTC(year, month - 1, day + n));
  return { year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1, day: dt.getUTCDate() };
}

// End of the given London calendar day (23:59:59.999 Europe/London).
export function endOfDayLondon(year, month, day) {
  return londonWallToUtc(year, month, day, 23, 59, 59) + 999;
}

// End of the third calendar day after the ready instant, Europe/London.
export function endOfThirdDayAfter(ts) {
  const p = londonParts(ts);
  const t = addCalendarDays(p.year, p.month, p.day, 3);
  return endOfDayLondon(t.year, t.month, t.day);
}

export function londonDateString(ts) {
  const p = londonParts(ts);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

export function londonWeekday(ts) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: LONDON_TZ, weekday: 'long' }).format(new Date(ts));
}

export function londonDateTimeString(ts) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: LONDON_TZ, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ts));
}

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export function getModel(seed, id) {
  return seed.models.find((m) => m.id === id) || null;
}

export function getSku(seed, id) {
  return seed.skus.find((s) => s.id === id) || null;
}

export function skusForModel(seed, modelId) {
  return seed.skus.filter((s) => s.modelId === modelId);
}

export function getLocation(seed, id) {
  return seed.stockLocations.find((l) => l.id === id) || null;
}

export function getTaxRate(seed, taxCategoryId) {
  const c = seed.taxCategories.find((t) => t.id === taxCategoryId);
  return c ? c.rate : 0;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function createInitialState(seed, options = {}) {
  const now = options.now || (() => Date.now());
  return {
    cart: { items: [], context: { type: 'delivery', storeId: null } },
    orders: {},
    orderSeq: 1,
    guestOrderIds: [],
    currentGuestOrderId: null,
    verified: false,
    staff: { role: null, authenticated: false, secondFactorPassed: false },
    content: {
      pages: clone(seed.pages),
      articles: clone(seed.articles),
      curations: clone(seed.curations)
    },
    balances: seed.balanceRows.map((r) => ({ ...r })),
    reservations: [],
    refunds: {},
    refundSeq: 1,
    emails: [],
    reorderDraft: null,
    now,
    eventLog: []
  };
}

function logEvent(state, event) {
  state.eventLog.push({ at: state.now(), ...event });
}

function nextOrderId(state) {
  const id = 'ord-' + String(state.orderSeq).padStart(4, '0');
  state.orderSeq += 1;
  return id;
}

// ---------------------------------------------------------------------------
// Persistence helpers (defensive against malformed stored JSON shapes)
// ---------------------------------------------------------------------------

export function serializeState(state) {
  const { now, ...rest } = state;
  return JSON.stringify(rest);
}

function isValidStateShape(s) {
  if (!s || typeof s !== 'object' || Array.isArray(s)) return false;
  if (!s.cart || typeof s.cart !== 'object' || Array.isArray(s.cart)) return false;
  if (!Array.isArray(s.cart.items)) return false;
  if (!s.cart.context || typeof s.cart.context !== 'object' || Array.isArray(s.cart.context)) return false;
  if (!s.orders || typeof s.orders !== 'object' || Array.isArray(s.orders)) return false;
  if (!Array.isArray(s.balances) || !Array.isArray(s.reservations)) return false;
  if (!Array.isArray(s.emails) || !Array.isArray(s.guestOrderIds)) return false;
  if (!s.content || typeof s.content !== 'object' || Array.isArray(s.content)) return false;
  if (s.content.pages != null && (typeof s.content.pages !== 'object' || Array.isArray(s.content.pages))) return false;
  return true;
}

export function deserializeState(seed, raw, options = {}) {
  const base = createInitialState(seed, options);
  if (raw == null || raw === '') return base;
  let parsed;
  try { parsed = JSON.parse(raw); } catch (err) { return base; }
  if (!isValidStateShape(parsed)) return base;
  return Object.assign(base, parsed, { now: options.now || (() => Date.now()) });
}


// ---------------------------------------------------------------------------
// Inventory / availability
// ---------------------------------------------------------------------------

export function physicalBalance(state, skuId, locationId) {
  const row = state.balances.find((b) => b.skuId === skuId && b.locationId === locationId);
  return row ? row.qty : 0;
}

export function adjustBalance(state, skuId, locationId, delta) {
  let row = state.balances.find((b) => b.skuId === skuId && b.locationId === locationId);
  if (!row) {
    row = { skuId, locationId, qty: 0 };
    state.balances.push(row);
  }
  row.qty += delta;
  if (row.qty < 0) row.qty = 0;
  return row.qty;
}

export function reservationIsActive(state, r) {
  if (!r || r.released) return false;
  if (r.assured) return true;
  if (r.type === 'collection') return true;
  return typeof r.deadline === 'number' && r.deadline > state.now();
}

export function reservedQuantity(state, skuId, locationId) {
  let sum = 0;
  for (const r of state.reservations) {
    if (r.locationId !== locationId || !reservationIsActive(state, r)) continue;
    for (const item of (r.items || [])) {
      if (item.skuId === skuId) sum += item.qty;
    }
  }
  return sum;
}

export function contextLocationId(context) {
  if (!context) return 'warehouse';
  if (context.type === 'collection') return context.storeId || null;
  return 'warehouse';
}

export function availableQuantity(seed, state, skuId, context) {
  const locationId = contextLocationId(context);
  if (!locationId) return 0;
  return physicalBalance(state, skuId, locationId) - reservedQuantity(state, skuId, locationId);
}

export function contextLabel(seed, context) {
  if (!context) return 'No fulfilment chosen';
  if (context.type === 'collection') {
    const loc = getLocation(seed, context.storeId);
    return loc ? 'Collection - ' + loc.name : 'Collection - store not chosen';
  }
  return 'Delivery - Central Warehouse';
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

function editDistance(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

export function searchModels(seed, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return seed.models.filter((m) => m.published);
  const exact = new Set();
  for (const m of seed.models) {
    if (!m.published) continue;
    const haystack = [m.name, m.brand, m.type, m.wheels].join(' ').toLowerCase();
    if (haystack.includes(q)) exact.add(m.id);
  }
  for (const s of seed.skus) {
    if (!s.published) continue;
    if (s.skuCode.toLowerCase().includes(q)) {
      const m = getModel(seed, s.modelId);
      if (m && m.published) exact.add(m.id);
    }
  }
  for (const t of seed.typoSamples) {
    if (q === t.query || editDistance(q, t.query) <= 1) exact.add(t.modelId);
  }
  const qWords = q.split(/\s+/).filter(Boolean);
  for (const m of seed.models) {
    if (!m.published) continue;
    const words = m.name.toLowerCase().split(/\s+/);
    for (const qw of qWords) {
      if (qw.length < 4) continue;
      for (const w of words) if (editDistance(qw, w) <= 1) exact.add(m.id);
    }
  }
  return seed.models.filter((m) => exact.has(m.id));
}

// ---------------------------------------------------------------------------
// Filtering / bike finder
// ---------------------------------------------------------------------------

function skuMatchesCriteria(seed, state, sku, model, criteria, context) {
  if (!sku.published) return false;
  if (criteria.brand && model.brand !== criteria.brand) return false;
  if (criteria.type && model.type !== criteria.type) return false;
  if (criteria.wheels && model.wheels !== criteria.wheels) return false;
  if (criteria.categoryId && model.categoryId !== criteria.categoryId) return false;
  if (criteria.frameSize && sku.frameSize !== criteria.frameSize) return false;
  if (criteria.priceMin != null && sku.priceGross < criteria.priceMin) return false;
  if (criteria.priceMax != null && sku.priceGross > criteria.priceMax) return false;
  if (criteria.heightCm != null && criteria.heightCm !== '') {
    if (!model.sizeChart) return false; // never guess a size without a chart
    const fs = sku.frameSize;
    if (!fs) return false;
    const row = model.sizeChart.find((r) => r.frameSize === fs);
    if (!row) return false;
    if (criteria.heightCm < row.minCm || criteria.heightCm > row.maxCm) return false;
  }
  if (criteria.inStockOnly) {
    if (availableQuantity(seed, state, sku.id, context) <= 0) return false;
  }
  return true;
}

// Every filter must be satisfied by ONE SKU. Models are counted once.
// From price prefers matching variants AVAILABLE in the chosen context and only
// falls back to matching unavailable variants when none are available. Criteria
// are never relaxed to obtain an available SKU (CAT-05).
export function filterModels(seed, state, criteria, context) {
  const out = [];
  for (const model of seed.models) {
    if (!model.published) continue;
    if (criteria.categoryId && model.categoryId !== criteria.categoryId) continue;
    const skus = skusForModel(seed, model.id);
    const matching = skus.filter((s) => skuMatchesCriteria(seed, state, s, model, criteria, context));
    if (!matching.length) continue;
    const availableMatching = matching.filter((s) => availableQuantity(seed, state, s.id, context) > 0);
    const pool = availableMatching.length ? availableMatching : matching;
    const chosen = pool.reduce((a, b) => (a && a.priceGross <= b.priceGross ? a : b), null);
    out.push({
      model,
      matchingSkus: matching,
      availableMatching,
      availableInContext: availableMatching.length > 0,
      chosenSku: chosen,
      fromPrice: chosen ? chosen.priceGross : Infinity,
      matchCount: matching.length
    });
  }
  return { results: out, modelCount: out.length };
}

// Shared price summary for a single model (home cards and curations), applying
// the same available-first rule with the current context.
export function modelPriceSummary(seed, state, model, context) {
  const skus = skusForModel(seed, model.id).filter((s) => s.published);
  const available = skus.filter((s) => availableQuantity(seed, state, s.id, context) > 0);
  const pool = available.length ? available : skus;
  const chosen = pool.reduce((a, b) => (a && a.priceGross <= b.priceGross ? a : b), null);
  return {
    skus,
    available,
    availableInContext: available.length > 0,
    chosenSku: chosen,
    fromPrice: chosen ? chosen.priceGross : null
  };
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

export function findCartItem(cart, skuId) {
  return cart.items.find((i) => i.skuId === skuId) || null;
}

export function addToCart(cart, skuId, qty = 1) {
  if (!Number.isInteger(qty) || qty <= 0) {
    return { ok: false, error: 'Quantity must be a whole number greater than zero.' };
  }
  const item = findCartItem(cart, skuId);
  if (item) item.qty += qty;
  else cart.items.push({ skuId, qty });
  return { ok: true };
}

export function setCartQuantity(cart, skuId, raw) {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    return { ok: false, error: 'Quantity must be a whole number greater than zero.' };
  }
  const item = findCartItem(cart, skuId);
  if (!item) return { ok: false, error: 'Item is not in the cart.' };
  item.qty = n;
  return { ok: true };
}

export function removeFromCart(cart, skuId) {
  cart.items = cart.items.filter((i) => i.skuId !== skuId);
}

export function cartLineCount(cart) {
  return cart.items.reduce((n, i) => n + i.qty, 0);
}

export function cartAvailability(seed, state, cart) {
  const lines = cart.items.map((item) => {
    const sku = getSku(seed, item.skuId);
    const model = sku ? getModel(seed, sku.modelId) : null;
    const availableQty = sku ? availableQuantity(seed, state, sku.id, cart.context) : 0;
    return {
      skuId: item.skuId,
      qty: item.qty,
      sku,
      model,
      availableQty,
      ok: !!sku && item.qty <= availableQty
    };
  });
  return { lines, allAvailable: lines.length > 0 && lines.every((l) => l.ok) };
}

// ---------------------------------------------------------------------------
// Shipping (synthetic demo tariffs, FUL-01)
// max of BASE tariffs PLUS all applicable configured quantity surcharges.
// ---------------------------------------------------------------------------

export function computeShipping(seed, cart, address) {
  if (!address) return { ok: false, reason: 'no_address' };
  const region = seed.regions.find((r) => r.id === address.regionId);
  if (!region) return { ok: false, reason: 'no_region' };
  if (region.supported === false) return { ok: false, reason: 'excluded', region };
  if (region.supported === null) return { ok: false, reason: 'no_tariff', region };

  const counts = {};
  for (const item of cart.items) {
    const sku = getSku(seed, item.skuId);
    if (!sku) continue;
    const cls = sku.shippingClassId;
    counts[cls] = (counts[cls] || 0) + item.qty;
  }

  // Missing base or quantity configuration for any present class must block,
  // not silently give zero or omit the class.
  let baseMax = 0;
  let chargedClass = null;
  let surcharge = 0;
  for (const [cls, qty] of Object.entries(counts)) {
    const base = seed.tariffs.base[cls];
    const extra = seed.tariffs.extra[cls];
    if (typeof base !== 'number' || typeof extra !== 'number') {
      return { ok: false, reason: 'no_tariff', missingClass: cls };
    }
    if (base > baseMax) {
      baseMax = base;
      chargedClass = cls;
    }
    surcharge += extra * Math.max(0, qty - 1);
  }
  return { ok: true, gross: baseMax + surcharge, baseMax, surcharge, chargedClass, counts };
}

// ---------------------------------------------------------------------------
// Totals
// ---------------------------------------------------------------------------

export function cartTotals(seed, state, cart, options = {}) {
  const avail = cartAvailability(seed, state, cart);
  let subtotalGross = 0;
  const lines = avail.lines.map((l) => {
    const lineGross = l.sku ? l.sku.priceGross * l.qty : 0;
    subtotalGross += lineGross;
    const rate = l.sku ? getTaxRate(seed, l.sku.taxCategoryId) : 0;
    return { ...l, lineGross, rate };
  });

  let shippingGross = 0;
  let shipping = { ok: true, gross: 0 };
  if (cart.context.type === 'delivery') {
    shipping = computeShipping(seed, cart, options.address || cart.context.address);
    if (shipping.ok) shippingGross = shipping.gross;
  }

  const totalGross = subtotalGross + shippingGross;

  let vatGross = 0;
  for (const l of lines) {
    const net = netFromGross(l.lineGross, l.rate);
    vatGross += l.lineGross - net;
  }
  if (shipping.ok && shippingGross > 0) {
    const rate = 0.2;
    const net = netFromGross(shippingGross, rate);
    vatGross += shippingGross - net;
  }

  return {
    lines,
    allAvailable: avail.allAvailable,
    subtotalGross,
    shippingGross,
    shippingOk: cart.context.type === 'collection' ? true : shipping.ok,
    shippingReason: shipping.reason || null,
    totalGross,
    vatGross
  };
}

// ---------------------------------------------------------------------------
// Checkout validation and Order creation
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContact(contact) {
  const errors = {};
  if (!contact || !String(contact.name || '').trim()) errors.name = 'Enter a name.';
  const email = String((contact && contact.email) || '').trim();
  if (!email) errors.email = 'Enter an email address.';
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';
  const phone = String((contact && contact.phone) || '').trim();
  if (!phone) errors.phone = 'Enter a phone number.';
  else if (!/^[0-9 ()+-]{7,}$/.test(phone)) errors.phone = 'Enter a valid phone number.';
  return errors;
}

export function validateCheckout(seed, state, cart, form) {
  const errors = validateContact(form.contact);
  if (cart.items.length === 0) errors.cart = 'Your cart is empty.';
  const avail = cartAvailability(seed, state, cart);
  if (cart.items.length > 0 && !avail.allAvailable) {
    errors.availability = 'Some items are not available in the chosen fulfilment context.';
  }
  if (cart.context.type === 'collection') {
    if (!cart.context.storeId) errors.store = 'Choose a store for collection.';
  } else {
    const address = form.address || {};
    if (!address.line1 || !String(address.line1).trim()) errors['address.line1'] = 'Enter an address line.';
    if (!address.city || !String(address.city).trim()) errors['address.city'] = 'Enter a town or city.';
    if (!address.postcode || !String(address.postcode).trim()) errors['address.postcode'] = 'Enter a postcode.';
    if (!address.regionId) errors['address.regionId'] = 'Choose a region.';
    const shipping = computeShipping(seed, cart, address);
    if (!shipping.ok) {
      if (shipping.reason === 'excluded') errors['address.regionId'] = 'We do not deliver to this region. Try another address.';
      else if (shipping.reason === 'no_tariff') errors['address.regionId'] = 'No delivery tariff is configured for this region. Change the address or choose collection.';
      else errors['address.regionId'] = 'Choose a supported region.';
    }
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

function snapshotLine(seed, item) {
  const sku = getSku(seed, item.skuId);
  const model = getModel(seed, sku.modelId);
  return {
    skuId: sku.id,
    skuCode: sku.skuCode,
    modelId: model.id,
    name: model.name,
    brand: model.brand,
    colour: sku.colour,
    size: sku.size,
    frameSize: sku.frameSize,
    qty: item.qty,
    unitPriceGross: sku.priceGross,
    regularGross: sku.regularGross,
    taxCategoryId: sku.taxCategoryId,
    vatRate: getTaxRate(seed, sku.taxCategoryId),
    shippingClassId: sku.shippingClassId,
    lineGross: sku.priceGross * item.qty
  };
}

export function createOrder(seed, state, options) {
  const { contact, address } = options;
  const cart = state.cart;
  const validation = validateCheckout(seed, state, cart, { contact, address });
  if (!validation.ok) return { ok: false, errors: validation.errors };

  const totals = cartTotals(seed, state, cart, { address });
  const id = nextOrderId(state);
  const fulfilment = cart.context.type === 'collection'
    ? {
        type: 'collection',
        storeId: cart.context.storeId,
        storeName: (getLocation(seed, cart.context.storeId) || {}).name || 'Unknown store'
      }
    : {
        type: 'delivery',
        address: {
          line1: address.line1,
          line2: address.line2 || '',
          city: address.city,
          postcode: address.postcode,
          regionId: address.regionId,
          regionName: (seed.regions.find((r) => r.id === address.regionId) || {}).name || ''
        }
      };

  const order = {
    id,
    createdAt: state.now(),
    contact: { name: contact.name.trim(), email: contact.email.trim(), phone: contact.phone.trim() },
    fulfilment,
    lines: cart.items.map((item) => snapshotLine(seed, item)),
    shippingGross: totals.shippingGross,
    subtotalGross: totals.subtotalGross,
    totalGross: totals.totalGross,
    vatGross: totals.vatGross,
    currency: 'GBP',
    orderState: 'pending',
    paymentState: 'unpaid',
    fulfilmentState: 'unfulfilled',
    reservationId: null,
    shipment: null,
    readyAt: null,
    collectionDeadline: null,
    collectionExtended: false,
    linkedOldOrderId: null,
    linkedNewOrderId: null,
    revalidation: null,
    refundId: null,
    cancellationRequested: false,
    returnAccepted: null,
    notes: []
  };

  if (fulfilment.type === 'collection') {
    const rid = 'res-' + id;
    state.reservations.push({
      id: rid, orderId: id, type: 'collection', locationId: fulfilment.storeId,
      deadline: null, released: false, assured: false,
      items: order.lines.map((l) => ({ skuId: l.skuId, qty: l.qty }))
    });
    order.reservationId = rid;
    order.orderState = 'confirmed';
    order.fulfilmentState = 'preparing';
    logEvent(state, { type: 'order.created', orderId: id, fulfilment: 'collection' });
  } else {
    logEvent(state, { type: 'order.created', orderId: id, fulfilment: 'delivery' });
  }

  state.orders[id] = order;
  if (!state.guestOrderIds.includes(id)) state.guestOrderIds.push(id);
  state.currentGuestOrderId = id; // the current browser session may act on this order
  state.cart = { items: [], context: { ...cart.context } };
  return { ok: true, order };
}

// ---------------------------------------------------------------------------
// Payment simulator
// ---------------------------------------------------------------------------

export function beginPayment(seed, state, orderId) {
  const order = state.orders[orderId];
  if (!order) return { ok: false, reason: 'not_found' };
  if (order.fulfilment.type === 'collection') return { ok: false, reason: 'collection_no_online_payment' };
  if (order.orderState === 'cancelled') return { ok: false, reason: 'cancelled' };
  if (order.reservationId) {
    const r = state.reservations.find((x) => x.id === order.reservationId);
    return { ok: true, deadline: r ? r.deadline : null };
  }
  const rid = 'res-' + orderId;
  const deadline = state.now() + RESERVATION_WINDOW_MS;
  state.reservations.push({
    id: rid, orderId, type: 'delivery', locationId: 'warehouse',
    deadline, released: false, assured: false,
    items: order.lines.map((l) => ({ skuId: l.skuId, qty: l.qty }))
  });
  order.reservationId = rid;
  logEvent(state, { type: 'payment.started', orderId, deadline });
  return { ok: true, deadline };
}

export function reservationDeadline(state, orderId) {
  const order = state.orders[orderId];
  if (!order || !order.reservationId) return null;
  const r = state.reservations.find((x) => x.id === order.reservationId);
  return r ? r.deadline : null;
}

export function reservationActive(state, orderId) {
  const order = state.orders[orderId];
  if (!order || !order.reservationId) return false;
  const r = state.reservations.find((x) => x.id === order.reservationId);
  return reservationIsActive(state, r);
}

function orderLinesAvailable(seed, state, order, locationId) {
  return order.lines.every((l) => {
    const available = physicalBalance(state, l.skuId, locationId) - reservedQuantity(state, l.skuId, locationId);
    return available >= l.qty;
  });
}

function createFullRefund(state, order, reason) {
  const id = 'ref-' + String(state.refundSeq).padStart(4, '0');
  state.refundSeq += 1;
  const refund = {
    id, orderId: order.id, amountGross: order.totalGross, includesShipping: true,
    reason, state: 'pending', createdAt: state.now()
  };
  state.refunds[id] = refund;
  order.refundId = id;
  order.paymentState = 'refund_pending';
  logEvent(state, { type: 'refund.pending', orderId: order.id, refundId: id });
  return refund;
}

export function simulatePayment(seed, state, orderId, outcome) {
  const order = state.orders[orderId];
  if (!order) return { ok: false, reason: 'not_found' };
  // Validate the outcome BEFORE any state branch: failed/pending must never fabricate money.
  if (outcome !== 'paid' && outcome !== 'failed' && outcome !== 'pending') {
    return { ok: false, reason: 'bad_outcome' };
  }
  // Collection has no online payment path.
  if (order.fulfilment.type === 'collection') {
    return { ok: false, reason: 'collection_no_online_payment' };
  }

  if (order.orderState === 'cancelled') {
    if (outcome !== 'paid') {
      // A failed/pending event on a cancelled order is ignored; no refund is created.
      logEvent(state, { type: 'payment.ignored_cancelled', orderId, outcome });
      return { ok: true, result: 'ignored_' + outcome };
    }
    if (order.refundId) {
      // Repeated paid event: reuse the existing refund, never duplicate it.
      return { ok: true, result: 'late_refund_reused', refund: state.refunds[order.refundId] };
    }
    const refund = createFullRefund(state, order, 'late_payment_cancelled');
    return { ok: true, result: 'late_refund', refund };
  }

  // Repeated confirmation on an already-confirmed / dispatched / completed order.
  if (order.paymentState === 'paid' || order.orderState === 'confirmed' || order.orderState === 'completed') {
    logEvent(state, { type: 'payment.repeat_ignored', orderId });
    return { ok: true, result: 'already_confirmed' };
  }

  if (order.orderState !== 'pending') return { ok: false, reason: 'not_pending' };

  if (outcome === 'failed') {
    order.paymentState = 'failed';
    logEvent(state, { type: 'payment.failed', orderId });
    return { ok: true, result: 'failed' };
  }
  if (outcome === 'pending') {
    order.paymentState = 'pending';
    logEvent(state, { type: 'payment.pending', orderId });
    return { ok: true, result: 'pending' };
  }

  // outcome === 'paid'
  const active = reservationActive(state, orderId);
  if (active) {
    order.paymentState = 'paid';
    order.orderState = 'confirmed';
    const r = state.reservations.find((x) => x.id === order.reservationId);
    if (r) r.assured = true;
    logEvent(state, { type: 'payment.confirmed', orderId });
    return { ok: true, result: 'confirmed' };
  }

  // Reservation expired (late payment): re-validate the whole cart before accepting.
  if (orderLinesAvailable(seed, state, order, 'warehouse')) {
    const rid = 'res-' + orderId + '-late';
    state.reservations.push({
      id: rid, orderId, type: 'delivery', locationId: 'warehouse',
      deadline: state.now() + RESERVATION_WINDOW_MS, released: false, assured: true,
      items: order.lines.map((l) => ({ skuId: l.skuId, qty: l.qty }))
    });
    order.reservationId = rid;
    order.paymentState = 'paid';
    order.orderState = 'confirmed';
    logEvent(state, { type: 'payment.confirmed_late', orderId });
    return { ok: true, result: 'confirmed_late' };
  }

  const refund = createFullRefund(state, order, 'late_payment_unavailable');
  logEvent(state, { type: 'payment.late_unavailable', orderId });
  return { ok: true, result: 'late_refund', refund };
}

export function retryPayment(state, orderId) {
  const order = state.orders[orderId];
  if (!order) return { ok: false, reason: 'not_found' };
  if (order.fulfilment.type === 'collection') return { ok: false, reason: 'collection_no_online_payment' };
  if (order.orderState !== 'pending') return { ok: false, reason: 'not_pending' };
  if (order.paymentState !== 'failed' && order.paymentState !== 'pending') {
    return { ok: false, reason: 'not_retryable' };
  }
  if (!reservationActive(state, orderId)) return { ok: false, reason: 'reservation_expired' };
  // Retry must NOT reset the original deadline.
  return { ok: true, deadline: reservationDeadline(state, orderId) };
}

// ---------------------------------------------------------------------------
// Cancellation request (RET-01) — used for paid-order cancellation and races
// ---------------------------------------------------------------------------

export function requestCancellation(state, orderId, meta = {}) {
  const order = state.orders[orderId];
  if (!order) return { ok: false, reason: 'not_found' };
  if (order.orderState === 'cancelled' || order.orderState === 'completed') {
    return { ok: false, reason: 'not_cancellable' };
  }
  if (!order.cancellationRequested) {
    order.cancellationRequested = true;
    order.cancellationRequestedAt = state.now();
    order.cancellationReason = meta.reason || 'customer_request';
  }
  logEvent(state, { type: 'cancellation.requested', orderId });
  return { ok: true, order };
}

export function cancelUnpaidOrder(state, orderId) {
  const order = state.orders[orderId];
  if (!order) return { ok: false, reason: 'not_found' };
  if (order.paymentState === 'paid') return { ok: false, reason: 'paid_use_cancellation_request' };
  if (order.orderState !== 'pending' && order.orderState !== 'confirmed') {
    return { ok: false, reason: 'not_cancellable' };
  }
  releaseReservation(state, order.reservationId);
  order.orderState = 'cancelled';
  order.cancelledReason = 'customer_declined';
  order.cancelledAt = state.now();
  logEvent(state, { type: 'order.cancelled', orderId });
  return { ok: true, order };
}

// ---------------------------------------------------------------------------
// Reorder (UX-02), two phases:
//   1) startReorder: cancel/preserve old, build an idempotent checkout draft.
//   2) submitReorder: create/link ONE new Order only on valid submission.
// ---------------------------------------------------------------------------

// A delivery order is only reorderable once its delivery payment reservation
// actually existed and has since expired or been released. A never-started
// payment (no reservation yet) is NOT an expired reservation: it must offer
// "Proceed to payment" instead, otherwise an unpaid order is mislabelled.
export function canReorder(state, orderId) {
  const order = state.orders[orderId];
  if (!order) return false;
  if (order.linkedNewOrderId) return false;
  if (order.fulfilment.type !== 'delivery') return false;
  if (order.paymentState === 'paid') return false;
  if (order.orderState !== 'pending') return false;
  if (!order.reservationId) return false; // never started -> not expired
  const r = state.reservations.find((x) => x.id === order.reservationId);
  if (!r) return false;
  return !reservationIsActive(state, r); // an actual expired/released reservation
}

// Compare the OLD order lines against the CURRENT cart/context. Used both when
// the draft starts and just before consent, so user fixes are reflected.
export function reorderChanges(seed, state, oldOrderId) {
  const oldOrder = state.orders[oldOrderId];
  if (!oldOrder) return [];
  const locationId = state.cart.context.type === 'collection' ? state.cart.context.storeId : 'warehouse';
  const changes = [];
  for (const l of oldOrder.lines) {
    const item = state.cart.items.find((i) => i.skuId === l.skuId);
    if (!item) { changes.push({ skuId: l.skuId, name: l.name, kind: 'removed' }); continue; }
    const sku = getSku(seed, l.skuId);
    if (!sku || !sku.published) { changes.push({ skuId: l.skuId, name: l.name, kind: 'removed' }); continue; }
    if (sku.priceGross !== l.unitPriceGross) {
      changes.push({ skuId: l.skuId, name: l.name, kind: 'price', from: l.unitPriceGross, to: sku.priceGross });
    }
    const available = physicalBalance(state, l.skuId, locationId) - reservedQuantity(state, l.skuId, locationId);
    if (available < item.qty) {
      changes.push({ skuId: l.skuId, name: l.name, kind: 'stock', available, wanted: item.qty });
    }
  }
  return changes;
}

export function startReorder(seed, state, oldOrderId) {
  const oldOrder = state.orders[oldOrderId];
  if (!oldOrder) return { ok: false, reason: 'not_found' };

  // Idempotent: a linked order or an existing draft is reused.
  if (oldOrder.linkedNewOrderId) {
    return { ok: true, phase: 'linked', order: state.orders[oldOrder.linkedNewOrderId], reused: true };
  }
  if (state.reorderDraft && state.reorderDraft.oldOrderId === oldOrderId) {
    return { ok: true, phase: 'draft', draft: state.reorderDraft, reused: true };
  }
  if (oldOrder.orderState !== 'pending' || reservationActive(state, oldOrderId)) {
    return { ok: false, reason: 'not_reorderable' };
  }
  // Accepted-payment race: never silently cancel a paid order; request cancellation.
  if (oldOrder.paymentState === 'paid') {
    const cr = requestCancellation(state, oldOrderId, { reason: 'reorder_race_payment_accepted' });
    return { ok: false, reason: 'payment_accepted', cancellationRequest: cr, oldOrder };
  }

  // Cancel and preserve the old order; its reservation is already expired.
  oldOrder.orderState = 'cancelled';
  oldOrder.cancelledReason = 'reorder';
  oldOrder.cancelledAt = state.now();

  const context = oldOrder.fulfilment.type === 'collection'
    ? { type: 'collection', storeId: oldOrder.fulfilment.storeId }
    : { type: 'delivery', storeId: null };
  const address = oldOrder.fulfilment.type === 'delivery' ? { ...oldOrder.fulfilment.address } : undefined;

  const items = oldOrder.lines
    .filter((l) => { const s = getSku(seed, l.skuId); return s && s.published; })
    .map((l) => ({ skuId: l.skuId, qty: l.qty }));

  state.cart = { items: items.map((i) => ({ ...i })), context: { ...context } };
  const changes = reorderChanges(seed, state, oldOrderId);
  state.reorderDraft = {
    oldOrderId,
    contact: { ...oldOrder.contact },
    address,
    changes,
    startedAt: state.now()
  };
  oldOrder.reorderDraft = true;
  logEvent(state, { type: 'reorder.started', oldOrderId, changes: changes.length });
  return { ok: true, phase: 'draft', draft: state.reorderDraft, changes };
}

// Submit uses the CURRENT cart/context and the CURRENT checkout fields so any
// user fixes are respected; the old order stays cancelled and linked exactly once.
export function submitReorder(seed, state, oldOrderId, options = {}) {
  const oldOrder = state.orders[oldOrderId];
  if (!oldOrder) return { ok: false, reason: 'not_found' };
  if (oldOrder.linkedNewOrderId) {
    return { ok: true, order: state.orders[oldOrder.linkedNewOrderId], reused: true };
  }
  const draft = state.reorderDraft;
  if (!draft || draft.oldOrderId !== oldOrderId) return { ok: false, reason: 'no_draft' };

  const contact = options.contact || draft.contact;
  const address = options.address || draft.address;
  // Compute changes BEFORE creating the order (collection creation reserves stock).
  const changes = reorderChanges(seed, state, oldOrderId);
  const created = createOrder(seed, state, { contact, address });
  if (!created.ok) {
    // Old order stays cancelled, draft/cart remain recoverable, no new Order is created.
    return { ok: false, reason: 'revalidation_failed', errors: created.errors, draft };
  }
  const newOrder = created.order;
  newOrder.linkedOldOrderId = oldOrderId;
  newOrder.revalidation = changes;
  oldOrder.linkedNewOrderId = newOrder.id;
  state.reorderDraft = null;
  logEvent(state, { type: 'order.reordered', oldOrderId, newOrderId: newOrder.id });
  return { ok: true, order: newOrder, changes, reused: false };
}

// Narrow shared checkout completion used by BOTH the UI submit handler
// (app.mjs) and the behavioural checks. This is the single place that turns a
// valid cart + contact into an Order and, for delivery, starts the payment
// reservation before the caller navigates to the simulator. Because it is the
// real integration path, tests that call it exercise the same code the UI runs.
//   - collection -> confirmed/unpaid order, next screen is the result
//   - delivery   -> pending order with a fresh 30-minute reservation, next
//                   screen is the payment simulator
// beginPayment is idempotent, so a repeated reorder submission reuses the
// linked order's existing reservation and deadline instead of creating another.
export function completeCheckout(seed, state, options = {}) {
  const { contact, address } = options;
  const oldOrderId = options.reorderOldOrderId
    || (state.reorderDraft ? state.reorderDraft.oldOrderId : null);
  const wasReorder = oldOrderId != null;
  const res = wasReorder
    ? submitReorder(seed, state, oldOrderId, { contact, address })
    : createOrder(seed, state, { contact, address });
  if (!res.ok) {
    return { ok: false, wasReorder, reason: res.reason, errors: res.errors };
  }
  const order = res.order;
  if (order.fulfilment.type === 'collection') {
    return { ok: true, wasReorder, reused: !!res.reused, order, next: 'result' };
  }
  const pay = beginPayment(seed, state, order.id);
  if (!pay.ok) return { ok: false, wasReorder, reused: !!res.reused, order, reason: pay.reason };
  return { ok: true, wasReorder, reused: !!res.reused, order, next: 'payment', deadline: pay.deadline };
}

// ---------------------------------------------------------------------------
// Collection lifecycle (S-03)
// ---------------------------------------------------------------------------

export function markReady(state, orderId, at) {
  const order = state.orders[orderId];
  if (!order) return { ok: false, reason: 'not_found' };
  if (order.fulfilment.type !== 'collection') return { ok: false, reason: 'not_collection' };
  if (order.orderState === 'cancelled' || order.orderState === 'completed') {
    return { ok: false, reason: 'not_active' };
  }
  if (order.orderState !== 'confirmed') return { ok: false, reason: 'not_confirmed' };
  if (order.readyAt) return { ok: true, order, unchanged: true }; // repeat does not shift the deadline
  order.readyAt = at;
  order.fulfilmentState = 'ready';
  order.collectionDeadline = endOfThirdDayAfter(at);
  logEvent(state, { type: 'collection.ready', orderId, deadline: order.collectionDeadline });
  return { ok: true, order };
}

export function extendCollection(state, orderId, meta = {}) {
  const order = state.orders[orderId];
  if (!order) return { ok: false, reason: 'not_found' };
  if (order.fulfilment.type !== 'collection') return { ok: false, reason: 'not_collection' };
  if (!order.collectionDeadline) return { ok: false, reason: 'not_ready' };
  if (order.collectionExtended) return { ok: false, reason: 'already_extended' };
  if (state.now() >= order.collectionDeadline) return { ok: false, reason: 'expired' };
  // Extension is 3 calendar days from the ORIGINAL end, Europe/London (DST-aware).
  const p = londonParts(order.collectionDeadline);
  const t = addCalendarDays(p.year, p.month, p.day, 3);
  order.collectionExtended = true;
  order.collectionExtendedBy = meta.author || 'demo-manager';
  order.collectionExtendedAt = state.now();
  order.collectionDeadline = endOfDayLondon(t.year, t.month, t.day);
  logEvent(state, { type: 'collection.extended', orderId, newDeadline: order.collectionDeadline });
  return { ok: true, order };
}

export function recordCollectionPayment(state, orderId, meta = {}) {
  const order = state.orders[orderId];
  if (!order) return { ok: false, reason: 'not_found' };
  if (order.fulfilment.type !== 'collection') return { ok: false, reason: 'not_collection' };
  if (order.orderState === 'cancelled' || order.orderState === 'completed') {
    return { ok: false, reason: 'not_active' };
  }
  if (order.orderState !== 'confirmed') return { ok: false, reason: 'not_confirmed' };
  if (order.paymentState === 'paid') return { ok: true, order, unchanged: true };
  const amount = meta.amountGross;
  if (typeof amount !== 'number' || amount <= 0) return { ok: false, reason: 'invalid_amount' };
  if (amount !== order.totalGross) return { ok: false, reason: 'short_amount', expected: order.totalGross };
  order.paymentState = 'paid';
  order.paymentRecord = {
    amountGross: amount, method: meta.method || 'card in store',
    staff: meta.staff || 'demo-manager', at: state.now()
  };
  logEvent(state, { type: 'collection.paid', orderId });
  return { ok: true, order };
}

export function collect(state, orderId, meta = {}) {
  const order = state.orders[orderId];
  if (!order) return { ok: false, reason: 'not_found' };
  if (order.fulfilment.type !== 'collection') return { ok: false, reason: 'not_collection' };
  if (order.fulfilmentState === 'collected' || order.orderState === 'completed') {
    return { ok: false, reason: 'already_collected' };
  }
  if (order.orderState === 'cancelled') return { ok: false, reason: 'cancelled' };
  if (order.orderState !== 'confirmed') return { ok: false, reason: 'not_confirmed' };
  if (order.fulfilmentState !== 'ready') return { ok: false, reason: 'not_ready' };
  if (order.paymentState !== 'paid') return { ok: false, reason: 'not_paid' };
  if (!meta || meta.codeVerified !== true) return { ok: false, reason: 'code_not_verified' };
  if (order.collectionDeadline && state.now() >= order.collectionDeadline) {
    return { ok: false, reason: 'expired' };
  }
  for (const l of order.lines) adjustBalance(state, l.skuId, order.fulfilment.storeId, -l.qty);
  releaseReservation(state, order.reservationId);
  order.fulfilmentState = 'collected';
  order.orderState = 'completed';
  order.collectedAt = state.now();
  order.collectedBy = meta.staff || 'demo-manager';
  logEvent(state, { type: 'collection.collected', orderId });
  return { ok: true, order };
}

// INV-05: expired unpaid uncollected collection is cancelled, reservation released once.
export function expireCollection(state, orderId) {
  const order = state.orders[orderId];
  if (!order) return { ok: false, reason: 'not_found' };
  if (order.fulfilment.type !== 'collection') return { ok: false, reason: 'not_collection' };
  if (order.fulfilmentState === 'collected' || order.orderState === 'completed') {
    return { ok: false, reason: 'already_collected' };
  }
  if (order.orderState === 'cancelled') return { ok: false, reason: 'already_cancelled' };
  if (!order.collectionDeadline) return { ok: false, reason: 'not_ready' };
  if (state.now() < order.collectionDeadline) return { ok: false, reason: 'not_expired' };
  if (order.paymentState === 'paid') return { ok: false, reason: 'paid_not_cancelled' };
  releaseReservation(state, order.reservationId);
  order.orderState = 'cancelled';
  order.cancelledReason = 'collection_expired';
  order.cancelledAt = state.now();
  logEvent(state, { type: 'collection.expired', orderId });
  return { ok: true, order };
}

// ---------------------------------------------------------------------------
// Delivery lifecycle (S-03)
// ---------------------------------------------------------------------------

export function dispatchOrder(state, orderId, meta = {}) {
  const order = state.orders[orderId];
  if (!order) return { ok: false, reason: 'not_found' };
  if (order.fulfilment.type !== 'delivery') return { ok: false, reason: 'not_delivery' };
  if (order.orderState !== 'confirmed') return { ok: false, reason: 'not_confirmed' };
  order.fulfilmentState = 'dispatched';
  order.shipment = {
    carrier: meta.carrier, date: meta.date, tracking: meta.tracking || null,
    at: state.now(), staff: meta.staff || 'demo-manager'
  };
  logEvent(state, { type: 'order.dispatched', orderId });
  return { ok: true, order };
}

export function deliverOrder(state, orderId, meta = {}) {
  const order = state.orders[orderId];
  if (!order) return { ok: false, reason: 'not_found' };
  if (order.fulfilmentState !== 'dispatched') return { ok: false, reason: 'not_dispatched' };
  if (!meta.evidence) return { ok: false, reason: 'no_evidence' };
  for (const l of order.lines) adjustBalance(state, l.skuId, 'warehouse', -l.qty);
  releaseReservation(state, order.reservationId);
  order.fulfilmentState = 'delivered';
  order.orderState = 'completed';
  order.deliveredAt = state.now();
  order.deliveryEvidence = meta.evidence;
  order.deliveredBy = meta.staff || 'demo-manager';
  logEvent(state, { type: 'order.delivered', orderId });
  return { ok: true, order };
}

// ---------------------------------------------------------------------------
// Refunds vs restock (kept separate)
// ---------------------------------------------------------------------------

export function requestRefund(state, orderId, meta = {}) {
  const order = state.orders[orderId];
  if (!order) return { ok: false, reason: 'not_found' };
  if (order.refundId) return { ok: true, refund: state.refunds[order.refundId], reused: true };
  // No refund without received money.
  if (order.paymentState !== 'paid') return { ok: false, reason: 'nothing_to_refund' };
  const refund = createFullRefund(state, order, meta.reason || 'customer_request');
  if (typeof meta.amountGross === 'number') refund.amountGross = meta.amountGross;
  return { ok: true, refund };
}

// Accept a cancellation request: cancel + preserve the order, and initiate a
// refund ONLY when money was actually received. Money and stock stay separate.
export function acceptCancellation(state, orderId, meta = {}) {
  const order = state.orders[orderId];
  if (!order) return { ok: false, reason: 'not_found' };
  if (order.orderState === 'cancelled') {
    if (order.paymentState === 'paid' && !order.refundId) {
      const refund = createFullRefund(state, order, 'accepted_cancellation');
      return { ok: true, order, refund, reused: false };
    }
    return { ok: true, order, reused: true };
  }
  if (order.orderState === 'completed') return { ok: false, reason: 'not_cancellable' };
  releaseReservation(state, order.reservationId);
  order.orderState = 'cancelled';
  order.cancelledReason = meta.reason || 'accepted_cancellation';
  order.cancelledAt = state.now();
  order.cancellationAccepted = true;
  let refund = null;
  if (order.paymentState === 'paid') refund = createFullRefund(state, order, 'accepted_cancellation');
  logEvent(state, { type: 'cancellation.accepted', orderId, refund: refund ? refund.id : null });
  return { ok: true, order, refund, reused: false };
}

export function resolveRefund(state, refundId, outcome) {
  const refund = state.refunds[refundId];
  if (!refund) return { ok: false, reason: 'not_found' };
  if (refund.state !== 'pending') return { ok: false, reason: 'already_resolved' };
  if (outcome !== 'succeeded' && outcome !== 'failed') return { ok: false, reason: 'bad_outcome' };
  refund.state = outcome;
  refund.resolvedAt = state.now();
  const order = state.orders[refund.orderId];
  if (order) order.paymentState = outcome === 'succeeded' ? 'refunded' : 'refund_failed';
  logEvent(state, { type: 'refund.' + outcome, refundId });
  return { ok: true, refund };
}

export function refundSaysMoneyReturned(refund) {
  return !!refund && refund.state === 'succeeded';
}

// Physical return acceptance + restock. Separate from money/refund.
// Guards: purchased SKU only, never above purchased minus already accepted,
// and always the saved fulfilment location.
export function restockReturn(state, orderId, meta = {}) {
  const order = state.orders[orderId];
  if (!order) return { ok: false, reason: 'not_found' };
  const line = order.lines.find((l) => l.skuId === meta.skuId);
  if (!line) return { ok: false, reason: 'not_in_order' };
  const qty = meta.qty;
  if (!Number.isInteger(qty) || qty <= 0) return { ok: false, reason: 'invalid_qty' };
  order.returnAccepted = order.returnAccepted || {};
  const already = order.returnAccepted[meta.skuId] || 0;
  if (already + qty > line.qty) return { ok: false, reason: 'over_purchased', purchased: line.qty, already };
  const savedLocation = order.fulfilment.type === 'collection' ? order.fulfilment.storeId : 'warehouse';
  if (meta.locationId && meta.locationId !== savedLocation) {
    return { ok: false, reason: 'wrong_location', expected: savedLocation };
  }
  order.returnAccepted[meta.skuId] = already + qty;
  if (meta.restock !== false) adjustBalance(state, meta.skuId, savedLocation, qty);
  logEvent(state, { type: 'return.restocked', orderId, skuId: meta.skuId, locationId: savedLocation, qty });
  return { ok: true, locationId: savedLocation, accepted: order.returnAccepted[meta.skuId] };
}

function releaseReservation(state, reservationId) {
  const r = state.reservations.find((x) => x.id === reservationId);
  if (r && !r.released) {
    r.released = true;
    r.releasedAt = state.now();
  }
}

// ---------------------------------------------------------------------------
// Staff roles, route guards, inventory adjustment
// ---------------------------------------------------------------------------

export const MANAGER_ALLOWED_AREAS = ['orders', 'order', 'returns', 'inventory', 'content', 'emails'];
export const ADMIN_ALLOWED_AREAS = ['orders', 'order', 'returns', 'inventory', 'content', 'emails', 'products', 'product', 'locations', 'accounts'];

export function canAccessStaff(role, area) {
  if (role === 'admin') return ADMIN_ALLOWED_AREAS.includes(area);
  if (role === 'manager') return MANAGER_ALLOWED_AREAS.includes(area);
  return false;
}

export function routeAreaFor(hash) {
  const path = String(hash || '').replace(/^#/, '');
  if (!path.startsWith('staff/')) {
    if (path === 'emails') return 'emails';
    return null;
  }
  const parts = path.split('/');
  if (parts[1] === 'sign-in') return 'sign-in';
  if (parts[1] === 'orders' || parts[1] === 'order') return 'orders';
  if (parts[1] === 'returns') return 'returns';
  if (parts[1] === 'inventory') return 'inventory';
  if (parts[1] === 'content') return 'content';
  if (parts[1] === 'products' || parts[1] === 'product') return 'products';
  if (parts[1] === 'locations') return 'locations';
  if (parts[1] === 'accounts') return 'accounts';
  return null;
}

export function guardStaffRoute(role, hash) {
  const area = routeAreaFor(hash);
  if (area === null || area === 'sign-in') return { allowed: true, area };
  if (!role) return { allowed: false, area, reason: 'not_signed_in' };
  if (area === 'products' || area === 'product') {
    if (!canAccessStaff(role, 'products')) return { allowed: false, area, reason: 'manager_cannot_edit_catalogue' };
  }
  if (area === 'locations' && !canAccessStaff(role, 'locations')) {
    return { allowed: false, area, reason: 'manager_cannot_edit_locations' };
  }
  if (area === 'accounts' && !canAccessStaff(role, 'accounts')) {
    return { allowed: false, area, reason: 'manager_cannot_edit_accounts' };
  }
  return { allowed: canAccessStaff(role, area), area };
}

// Staff inventory adjustment that protects reserved amounts.
export function staffAdjustStock(state, meta = {}) {
  const { skuId, locationId, delta } = meta;
  if (!Number.isInteger(delta) || delta === 0) return { ok: false, reason: 'invalid_delta' };
  const physical = physicalBalance(state, skuId, locationId);
  const reserved = reservedQuantity(state, skuId, locationId);
  if (physical + delta < reserved) {
    return { ok: false, reason: 'reserved_conflict', physical, reserved, delta };
  }
  const next = adjustBalance(state, skuId, locationId, delta);
  logEvent(state, {
    type: 'inventory.adjusted', skuId, locationId, delta, next,
    staff: meta.staff || 'demo-manager', reason: meta.reason || 'correction'
  });
  return { ok: true, next };
}

// ---------------------------------------------------------------------------
// Content and curations
// ---------------------------------------------------------------------------

export function visibleArticles(state) {
  return Object.values(state.content.articles).filter((a) => a.published);
}

export function visiblePages(state) {
  return Object.values(state.content.pages).filter((p) => p.published);
}

export function curationModels(seed, state, curationId) {
  const c = state.content.curations[curationId];
  if (!c || !c.published || !c.modelIds.length) return [];
  return c.modelIds.map((id) => getModel(seed, id)).filter((m) => m && m.published);
}

export function setCuration(state, curationId, patch) {
  const c = state.content.curations[curationId];
  if (!c) return { ok: false, reason: 'not_found' };
  if (patch.title != null) c.title = patch.title;
  if (patch.published != null) c.published = !!patch.published;
  if (Array.isArray(patch.modelIds)) c.modelIds = patch.modelIds.slice();
  logEvent(state, { type: 'curation.updated', curationId });
  return { ok: true, curation: c };
}

export function setPage(state, slug, patch) {
  const p = state.content.pages[slug];
  if (!p) return { ok: false, reason: 'not_found' };
  if (patch.title != null) p.title = patch.title;
  if (patch.body != null) p.body = patch.body;
  if (patch.published != null) p.published = !!patch.published;
  logEvent(state, { type: 'page.updated', slug });
  return { ok: true, page: p };
}

export function setArticle(state, slug, patch) {
  const a = state.content.articles[slug];
  if (!a) return { ok: false, reason: 'not_found' };
  if (patch.title != null) a.title = patch.title;
  if (patch.body != null) a.body = patch.body;
  if (patch.excerpt != null) a.excerpt = patch.excerpt;
  if (patch.published != null) a.published = !!patch.published;
  logEvent(state, { type: 'article.updated', slug });
  return { ok: true, article: a };
}

// Catalogue price edit (admin only). Updates the seed SKU in place; existing
// Order snapshots keep their frozen unit prices (CHK-04 / CAT-06).
export function setSkuPrice(seed, skuId, patch) {
  const sku = getSku(seed, skuId);
  if (!sku) return { ok: false, reason: 'not_found' };
  const price = patch.priceGross;
  if (price != null && (!Number.isInteger(price) || price < 0)) {
    return { ok: false, reason: 'invalid_price' };
  }
  const regular = patch.regularGross != null ? patch.regularGross : sku.regularGross;
  if (regular != null && (!Number.isInteger(regular) || regular < 0)) {
    return { ok: false, reason: 'invalid_price' };
  }
  if (price != null) sku.priceGross = price;
  sku.regularGross = regular;
  return { ok: true, sku };
}

// ---------------------------------------------------------------------------
// Emails (mock, diagnostic only)
// ---------------------------------------------------------------------------

export function logEmail(state, email) {
  const entry = { at: state.now(), ...email };
  state.emails.push(entry);
  logEvent(state, { type: 'email.logged', subject: email.subject });
  return entry;
}

// ---------------------------------------------------------------------------
// Guest session vs verified history
// ---------------------------------------------------------------------------

// The ordinary guest UI may act ONLY on the current Order of this demo session.
export function guestOrders(state) {
  if (!state.currentGuestOrderId) return [];
  const o = state.orders[state.currentGuestOrderId];
  return o ? [o] : [];
}

export function canViewOrder(state, orderId) {
  if (state.verified) return true;
  return state.currentGuestOrderId === orderId;
}

export function verifiedHistory(state) {
  if (!state.verified) return [];
  return Object.values(state.orders);
}

export function confirmEmailVerification(state) {
  state.verified = true;
  logEvent(state, { type: 'email.verified' });
  return { ok: true };
}

// Guide-only: deliberately select which demo Order the guest session may act on.
export function selectCurrentGuestOrder(state, orderId) {
  if (!state.orders[orderId]) return { ok: false, reason: 'not_found' };
  state.currentGuestOrderId = orderId;
  logEvent(state, { type: 'guest.selected', orderId });
  return { ok: true };
}

// Guide-only: simulate a new browser / lost guest session.
export function clearGuestSession(state) {
  state.currentGuestOrderId = null;
  state.guestOrderIds = [];
  logEvent(state, { type: 'guest.cleared' });
  return { ok: true };
}

// Guide-only: seed a clearly synthetic history for the mock verified persona.
export function seedDemoHistory(seed, state) {
  if (Object.keys(state.orders).length === 0) seedDemoScenarios(seed, state);
  state.guestOrderIds = Object.keys(state.orders);
  state.verified = true;
  logEvent(state, { type: 'guide.seed_history' });
  return { ok: true, count: state.guestOrderIds.length };
}

// Guide-only: build a set of Orders across the agreed demo states so every
// screen has a real, clickable link. Restores the user's cart and the ordinary
// guest session afterwards (these orders are NOT auto-exposed to the guest UI).
export function seedDemoScenarios(seed, state) {
  const savedCart = clone(state.cart);
  const savedCurrent = state.currentGuestOrderId;
  const savedGuestIds = state.guestOrderIds.slice();
  const created = {};
  const contact = { name: 'Demo Scenario', email: 'scenario@example.com', phone: '01234567890' };
  const address = { line1: '1 Demo Street', line2: '', city: 'York', postcode: 'YO1 1AA', regionId: 'england' };

  const mkDelivery = (skuId, qty = 1) => {
    state.cart = { items: [], context: { type: 'delivery', storeId: null } };
    addToCart(state.cart, skuId, qty);
    return createOrder(seed, state, { contact, address }).order;
  };
  const mkCollection = (skuId, storeId = 'store-york', qty = 1) => {
    state.cart = { items: [], context: { type: 'collection', storeId } };
    addToCart(state.cart, skuId, qty);
    return createOrder(seed, state, { contact }).order;
  };

  const pending = mkDelivery('gravel-01-M-forest', 1); pending.demoScenario = 'pending';
  created.pending = pending.id;

  const failed = mkDelivery('hybrid-01-M-sand', 1);
  beginPayment(seed, state, failed.id);
  simulatePayment(seed, state, failed.id, 'failed');
  failed.demoScenario = 'failed'; created.failed = failed.id;

  const expired = mkDelivery('road-01-54-ink', 1);
  beginPayment(seed, state, expired.id);
  simulatePayment(seed, state, expired.id, 'failed');
  const resv = state.reservations.find((x) => x.orderId === expired.id);
  if (resv) resv.deadline = state.now() - 1000;
  expired.demoScenario = 'expired'; created.expired = expired.id;

  const cancelled = mkDelivery('tyre-01-one', 1);
  cancelUnpaidOrder(state, cancelled.id);
  simulatePayment(seed, state, cancelled.id, 'paid'); // late payment -> full refund pending
  cancelled.demoScenario = 'cancelledRefund'; created.cancelledRefund = cancelled.id;

  const preparing = mkCollection('gravel-01-M-terracotta', 'store-york', 1);
  preparing.demoScenario = 'collectionPreparing'; created.collectionPreparing = preparing.id;

  const ready = mkCollection('helmet-01-M', 'store-york', 1);
  markReady(state, ready.id, state.now());
  ready.demoScenario = 'collectionReady'; created.collectionReady = ready.id;

  const completed = mkCollection('gloves-01-M', 'store-york', 1);
  markReady(state, completed.id, state.now());
  recordCollectionPayment(state, completed.id, { amountGross: completed.totalGross });
  collect(state, completed.id, { codeVerified: true });
  completed.demoScenario = 'collectionCompleted'; created.collectionCompleted = completed.id;

  const dispatched = mkDelivery('ebike-01-M-ink', 1);
  beginPayment(seed, state, dispatched.id);
  simulatePayment(seed, state, dispatched.id, 'paid');
  dispatchOrder(state, dispatched.id, { carrier: 'Demo Carrier', date: '2026-06-02' });
  dispatched.demoScenario = 'dispatched'; created.dispatched = dispatched.id;

  const delivered = mkDelivery('tour-01-M-sand', 1);
  beginPayment(seed, state, delivered.id);
  simulatePayment(seed, state, delivered.id, 'paid');
  dispatchOrder(state, delivered.id, { carrier: 'Demo Carrier', date: '2026-06-02', tracking: 'DEMO123' });
  deliverOrder(state, delivered.id, { evidence: 'Demo POD-9' });
  delivered.demoScenario = 'delivered'; created.delivered = delivered.id;

  // Restore cart and the ordinary guest session; scenario orders remain in the
  // catalogue of demo orders but are not exposed as the current guest order.
  state.cart = savedCart;
  state.currentGuestOrderId = savedCurrent;
  state.guestOrderIds = savedGuestIds;
  logEvent(state, { type: 'guide.seed_scenarios', created });
  return created;
}

export function scenarioOrderId(state, scenario) {
  const o = Object.values(state.orders).find((x) => x.demoScenario === scenario);
  return o ? o.id : null;
}

