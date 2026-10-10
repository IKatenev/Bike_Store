// Storefront / customer views (P-01..P-13 and E surfaces) as HTML strings.
import {
  escapeHtml, formatGBP, getModel, getSku, skusForModel, getLocation,
  filterModels, searchModels, cartTotals, cartAvailability, contextLabel,
  computeShipping, validateCheckout, getTaxRate, availableQuantity,
  reservationActive, reservationDeadline, canReorder, visibleArticles, visiblePages,
  curationModels, guestOrders, verifiedHistory, refundSaysMoneyReturned,
  londonDateTimeString, scenarioOrderId, reorderChanges, modelPriceSummary
} from './domain.mjs';
import { bikeSvg, productSvg, heroArt } from './assets.mjs';

export const COLOUR_HEX = {
  Sand: '#cbb994', Forest: '#344f3c', Ink: '#242c27',
  Terracotta: '#b85b3f', Steel: '#8b98a1', Black: '#2b2b2b'
};

const ART_KIND = {
  tyres: 'tyres', brakes: 'brakes', helmets: 'helmets', locks: 'locks',
  lights: 'lights', jerseys: 'jerseys', gloves: 'gloves', jackets: 'jackets'
};

export function colourHex(name) {
  return COLOUR_HEX[name] || '#344f3c';
}

export function modelArt(model, colour) {
  if (!model) return productSvg('accessory', '#344f3c');
  if (model.categoryId === 'bikes') return bikeSvg(colourHex(colour), model.type);
  return productSvg(ART_KIND[model.type] || 'accessory', colourHex(colour));
}

function discounted(sku) {
  return sku.regularGross > sku.priceGross;
}

export function priceHtml(sku) {
  if (!sku) return '';
  if (discounted(sku)) {
    return `<span class="price"><span class="now">${formatGBP(sku.priceGross)}</span> <s>${formatGBP(sku.regularGross)}</s></span>`;
  }
  return `<span class="price">${formatGBP(sku.priceGross)}</span>`;
}

function stockText(seed, state, sku, context) {
  if (!sku) return '';
  const loc = contextLocationLabel(seed, context);
  const qty = availableQuantity(seed, state, sku.id, context);
  if (!context || (context.type === 'collection' && !context.storeId)) {
    return `<span class="stock stock-unknown">Availability depends on the chosen ${context && context.type === 'collection' ? 'store' : 'delivery'} context.</span>`;
  }
  if (qty <= 0) return `<span class="stock stock-out">Not available for ${escapeHtml(loc)}</span>`;
  return `<span class="stock stock-in">${qty} available for ${escapeHtml(loc)}</span>`;
}

function contextLocationLabel(seed, context) {
  if (!context) return 'the chosen context';
  if (context.type === 'collection') return context.storeId ? (getLocation(seed, context.storeId) || {}).name : 'the chosen store';
  return 'Delivery (Central Warehouse)';
}

function stateBadge(label, value, kind) {
  return `<span class="state-badge state-${escapeHtml(kind)}"><span class="state-label">${escapeHtml(label)}</span> ${escapeHtml(value)}</span>`;
}

// ---------------------------------------------------------------------------
// P-01 Home
// ---------------------------------------------------------------------------

export function home(seed, state, params, ctx = {}) {
  const allBikes = seed.models.filter((m) => m.published && m.categoryId === 'bikes');
  const types = [...new Set(allBikes.map((m) => m.type))].sort();
  const wheels = [...new Set(allBikes.map((m) => m.wheels))].sort();

  const finder = `
    <form class="finder" data-finder-form aria-label="Bike finder">
      <div class="finder-field">
        <label for="f-price-max">Max price</label>
        <select id="f-price-max" name="priceMax">
          <option value="">Any</option>
          <option value="100000">&pound;1,000</option>
          <option value="150000">&pound;1,500</option>
          <option value="200000">&pound;2,000</option>
          <option value="250000">&pound;2,500</option>
        </select>
      </div>
      <div class="finder-field">
        <label for="f-type">Type</label>
        <select id="f-type" name="type"><option value="">Any</option>${types.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('')}</select>
      </div>
      <div class="finder-field">
        <label for="f-height">Your height (cm)</label>
        <input id="f-height" name="heightCm" type="number" min="100" max="220" inputmode="numeric" placeholder="e.g. 175">
      </div>
      <div class="finder-field">
        <label for="f-wheels">Wheels</label>
        <select id="f-wheels" name="wheels"><option value="">Any</option>${wheels.map((w) => `<option value="${escapeHtml(w)}">${escapeHtml(w)}</option>`).join('')}</select>
      </div>
      <div class="finder-field">
        <label for="f-brand">Brand</label>
        <select id="f-brand" name="brand"><option value="">Any</option>${seed.brands.map((b) => `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join('')}</select>
      </div>
      <div class="finder-actions">
        <p class="finder-count" data-finder-count aria-live="polite">${allBikes.length} models</p>
        <button class="btn btn-primary" type="submit">Show bikes</button>
      </div>
    </form>`;

  const featured = curationModels(seed, state, 'featured');
  const sale = curationModels(seed, state, 'sale');

  const grid = (title, models) => {
    if (!models.length) return ''; // empty curation is hidden
    return `<section class="curation">
      <div class="section-head"><h2>${escapeHtml(title)}</h2></div>
      <div class="grid grid-products">${models.map((m) => productCard(seed, state, m)).join('')}</div>
    </section>`;
  };

  return `
    <section class="hero">
      <div class="hero-art">${heroArt()}</div>
      <div class="hero-copy">
        <p class="eyebrow">New season</p>
        <h1>Bikes and kit for the long way round.</h1>
        <p class="lede">Find the right ride, then choose delivery to your door or collection from a store near you. From city commutes to gravel weekends.</p>
        <p><a class="btn btn-primary" href="#catalog">Browse the catalogue</a> <a class="btn btn-ghost" href="#guide">Open prototype guide</a></p>
      </div>
    </section>

    <section class="section">
      <div class="section-head"><h2>Find your bike</h2><p class="muted">Tell us your budget, riding and height, and we'll show the models that fit.</p></div>
      ${finder}
    </section>

    <section class="section">
      <div class="section-head"><h2>Shop by category</h2></div>
      <div class="grid grid-categories">
        ${seed.categories.map((c) => `<a class="category-card" href="#catalog?category=${escapeHtml(c.id)}">${escapeHtml(c.name)}</a>`).join('')}
      </div>
    </section>

    ${grid(featured.length ? 'New and interesting' : '', featured)}
    ${grid('Reduced this month', sale)}

    <section class="section">
      <div class="section-head"><h2>The workshop promise (draft)</h2></div>
      <p class="muted">This is illustrative marketing copy for layout review only. Nothing here is a real offer, price guarantee or service commitment.</p>
    </section>`;
}

function contextReady(context) {
  return !!context && (context.type === 'delivery' || !!context.storeId);
}

function availabilityLabel(context, availableInContext) {
  if (!contextReady(context)) return 'choose a store for availability';
  return availableInContext ? 'available here' : 'no stock in this context';
}

function productCard(seed, state, model) {
  const summary = modelPriceSummary(seed, state, model, state.cart.context);
  const anyDiscount = summary.skus.some(discounted);
  return `<a class="product-card" href="#product/${escapeHtml(model.id)}">
    <div class="product-art">${modelArt(model, summary.chosenSku ? summary.chosenSku.colour : null)}</div>
    <div class="product-meta">
      <p class="product-brand">${escapeHtml(model.brand)}</p>
      <h3>${escapeHtml(model.name)}</h3>
      <p class="product-price">From ${priceHtml(summary.chosenSku)}${anyDiscount ? ' <span class="tag">Reduced</span>' : ''}</p>
      <p class="muted small">${model.wheels ? escapeHtml(model.wheels) + ' &middot; ' : ''}${escapeHtml(model.type)} &middot; ${escapeHtml(availabilityLabel(state.cart.context, summary.availableInContext))}</p>
    </div>
  </a>`;
}

// ---------------------------------------------------------------------------
// P-02 Catalog
// ---------------------------------------------------------------------------

export function catalog(seed, state, params, ctx = {}) {
  const q = params.query || {};
  const context = state.cart.context;
  const criteria = {
    categoryId: q.category || '',
    brand: q.brand || '',
    type: q.type || '',
    wheels: q.wheels || '',
    frameSize: q.frameSize || '',
    priceMax: q.priceMax ? Number(q.priceMax) : null,
    heightCm: q.heightCm ? Number(q.heightCm) : null,
    inStockOnly: q.inStock === '1'
  };
  let results = filterModels(seed, state, criteria, context).results;
  if (q.q) {
    const ids = new Set(searchModels(seed, q.q).map((m) => m.id));
    results = results.filter((r) => ids.has(r.model.id));
  }
  // sort
  if (q.sort === 'price-asc') results.sort((a, b) => a.fromPrice - b.fromPrice);
  else if (q.sort === 'price-desc') results.sort((a, b) => b.fromPrice - a.fromPrice);

  const typeOptions = [...new Set(seed.models.filter((m) => m.published && m.categoryId === 'bikes').map((m) => m.type))].sort();
  const wheelOptions = [...new Set(seed.models.filter((m) => m.published && m.wheels).map((m) => m.wheels))].sort();
  const frameOptions = [...new Set(seed.models.filter((m) => m.published && m.sizeChart).flatMap((m) => m.sizeChart.map((r) => r.frameSize)))].sort();

  const active = [];
  if (q.q) active.push('Search: ' + q.q);
  if (criteria.categoryId) active.push('Category: ' + criteria.categoryId);
  if (criteria.brand) active.push('Brand: ' + criteria.brand);
  if (criteria.type) active.push('Type: ' + criteria.type);
  if (criteria.wheels) active.push('Wheels: ' + criteria.wheels);
  if (criteria.frameSize) active.push('Frame: ' + criteria.frameSize);
  if (criteria.priceMax) active.push('Max ' + formatGBP(criteria.priceMax));
  if (criteria.heightCm) active.push('Height ' + criteria.heightCm + ' cm');
  if (criteria.inStockOnly) active.push('In stock only');
  const activeSummary = active.length
    ? `<p class="active-filters" aria-live="polite">Active filters: ${active.map((a) => `<span class="chip-static">${escapeHtml(a)}</span>`).join(' ')} <a href="#catalog">Clear all</a></p>`
    : '';

  const filters = `
    <form class="catalog-filters" data-catalog-form aria-label="Catalogue filters">
      <div class="filter-row">
        <div class="finder-field">
          <label for="c-q">Search</label>
          <input id="c-q" name="q" type="search" value="${escapeHtml(q.q || '')}" placeholder="Name, brand or SKU">
        </div>
        <div class="finder-field">
          <label for="c-category">Category</label>
          <select id="c-category" name="category"><option value="">All</option>${seed.categories.map((c) => `<option value="${c.id}"${q.category === c.id ? ' selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}</select>
        </div>
        <div class="finder-field">
          <label for="c-brand">Brand</label>
          <select id="c-brand" name="brand"><option value="">Any</option>${seed.brands.map((b) => `<option value="${escapeHtml(b)}"${q.brand === b ? ' selected' : ''}>${escapeHtml(b)}</option>`).join('')}</select>
        </div>
        <div class="finder-field">
          <label for="c-type">Type</label>
          <select id="c-type" name="type"><option value="">Any</option>${typeOptions.map((t) => `<option value="${escapeHtml(t)}"${q.type === t ? ' selected' : ''}>${escapeHtml(t)}</option>`).join('')}</select>
        </div>
        <div class="finder-field">
          <label for="c-wheels">Wheels</label>
          <select id="c-wheels" name="wheels"><option value="">Any</option>${wheelOptions.map((w) => `<option value="${escapeHtml(w)}"${q.wheels === w ? ' selected' : ''}>${escapeHtml(w)}</option>`).join('')}</select>
        </div>
        <div class="finder-field">
          <label for="c-frame">Frame size</label>
          <select id="c-frame" name="frameSize"><option value="">Any</option>${frameOptions.map((f) => `<option value="${escapeHtml(f)}"${q.frameSize === f ? ' selected' : ''}>${escapeHtml(f)}</option>`).join('')}</select>
        </div>
        <div class="finder-field">
          <label for="c-price">Max price</label>
          <select id="c-price" name="priceMax"><option value="">Any</option>${[100000, 150000, 200000, 250000].map((p) => `<option value="${p}"${String(q.priceMax) === String(p) ? ' selected' : ''}>${formatGBP(p)}</option>`).join('')}</select>
        </div>
        <div class="finder-field">
          <label for="c-height">Your height (cm)</label>
          <input id="c-height" name="heightCm" type="number" min="100" max="220" inputmode="numeric" value="${escapeHtml(q.heightCm || '')}">
        </div>
        <div class="finder-field">
          <label for="c-sort">Sort</label>
          <select id="c-sort" name="sort">
            <option value="">Recommended</option>
            <option value="price-asc"${q.sort === 'price-asc' ? ' selected' : ''}>Price: low to high</option>
            <option value="price-desc"${q.sort === 'price-desc' ? ' selected' : ''}>Price: high to low</option>
          </select>
        </div>
        <div class="finder-field checkbox">
          <input id="c-stock" name="inStock" type="checkbox" value="1"${q.inStock === '1' ? ' checked' : ''}>
          <label for="c-stock">In stock in current context</label>
        </div>
      </div>
      <div class="filter-actions">
        <p class="finder-count" aria-live="polite"><strong>${results.length}</strong> models match (counted once)</p>
        <button class="btn btn-primary" type="submit">Apply</button>
        <a class="btn btn-ghost" href="#catalog">Clear</a>
      </div>
    </form>`;

  const body = results.length
    ? `<div class="grid grid-products">${results.map((r) => catalogCard(seed, state, r)).join('')}</div>`
    : `<div class="empty-state"><h3>No models match</h3><p class="muted">Adjust the filters or clear the search to see more bikes.</p></div>`;

  return `
    <header class="page-head">
      <h1>Catalogue</h1>
      <p class="muted">Showing results for <strong>${escapeHtml(contextLabel(seed, context))}</strong>. Change it in the header for your next purchase.</p>
    </header>
    ${filters}
    ${activeSummary}
    ${body}`;
}

function catalogCard(seed, state, r) {
  const m = r.model;
  const anyDiscount = r.matchingSkus.some(discounted);
  const label = availabilityLabel(state.cart.context, r.availableInContext);
  return `<a class="product-card" href="#product/${escapeHtml(m.id)}">
    <div class="product-art">${modelArt(m, r.chosenSku ? r.chosenSku.colour : null)}</div>
    <div class="product-meta">
      <p class="product-brand">${escapeHtml(m.brand)}</p>
      <h3>${escapeHtml(m.name)}</h3>
      <p class="product-price">From ${priceHtml(r.chosenSku)}${anyDiscount ? ' <span class="tag">Reduced</span>' : ''}</p>
      <p class="muted small">${m.wheels ? escapeHtml(m.wheels) + ' &middot; ' : ''}${escapeHtml(m.type)} &middot; ${escapeHtml(label)}</p>
    </div>
  </a>`;
}

// ---------------------------------------------------------------------------
// P-03 Product / SKU
// ---------------------------------------------------------------------------

export function product(seed, state, params, ctx = {}) {
  const model = getModel(seed, params.id);
  if (!model || !model.published) {
    return `<div class="empty-state"><h1>Model not found</h1><p class="muted">This product is not published.</p><p><a class="btn" href="#catalog">Back to catalogue</a></p></div>`;
  }
  const skus = skusForModel(seed, model.id).filter((s) => s.published);
  const selected = skus.find((s) => s.id === ctx.selectedSkuId) || skus[0];
  const context = state.cart.context;

  const sizeOptions = [...new Set(skus.map((s) => s.size || s.frameSize).filter(Boolean))];
  const colourOptions = [...new Set(skus.map((s) => s.colour))];

  let chart = '';
  if (model.categoryId === 'bikes') {
    if (model.sizeChart) {
      chart = `<section class="panel"><h2>Frame size guide (draft)</h2>
        <table class="data-table"><caption>Indicative rider height for each frame size. Draft demo values.</caption>
        <thead><tr><th scope="col">Frame size</th><th scope="col">Rider height</th></tr></thead>
        <tbody>${model.sizeChart.map((r) => `<tr><th scope="row">${escapeHtml(r.frameSize)}</th><td>${r.minCm}&ndash;${r.maxCm} cm</td></tr>`).join('')}</tbody></table></section>`;
    } else {
      chart = `<section class="panel notice notice-warn"><h2>No size chart published</h2>
        <p>This model has no height chart. We will not guess your size &mdash; choose a variant directly or contact us.</p></section>`;
    }
  }

  return `
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="#catalog">Catalogue</a> / <span>${escapeHtml(model.name)}</span></nav>
    <article class="product-detail">
      <div class="product-detail-art">${modelArt(model, selected ? selected.colour : null)}</div>
      <div class="product-detail-info">
        <p class="product-brand">${escapeHtml(model.brand)}</p>
        <h1>${escapeHtml(model.name)}</h1>
        <p class="lede">${escapeHtml(model.description)}</p>
        <p class="product-price-lg">${priceHtml(selected)} <span class="muted small">(GBP, VAT included)</span></p>
        ${stockText(seed, state, selected, context)}
        <div class="sku-select">
          <fieldset>
            <legend>Colour</legend>
            <div class="chip-row">
              ${colourOptions.map((col) => {
                const s = skus.find((x) => x.colour === col);
                return `<button type="button" class="chip${selected && selected.colour === col ? ' chip-active' : ''}" data-action="select-sku" data-sku="${escapeHtml(s.id)}" aria-pressed="${selected && selected.colour === col}">
                  <span class="swatch" style="background:${colourHex(col)}"></span>${escapeHtml(col)}</button>`;
              }).join('')}
            </div>
          </fieldset>
          ${sizeOptions.length > 1 ? `<fieldset>
            <legend>${model.categoryId === 'bikes' ? 'Frame size' : 'Size'}</legend>
            <div class="chip-row">
              ${sizeOptions.map((sz) => {
                const s = skus.find((x) => (x.size || x.frameSize) === sz);
                return `<button type="button" class="chip${selected && (selected.size === sz || selected.frameSize === sz) ? ' chip-active' : ''}" data-action="select-sku" data-sku="${escapeHtml(s.id)}" aria-pressed="${selected && (selected.size === sz || selected.frameSize === sz)}">${escapeHtml(sz)}</button>`;
              }).join('')}
            </div>
          </fieldset>` : ''}
        </div>
        <div class="buy-row">
          <div class="qty-control">
            <label for="p-qty">Quantity</label>
            <input id="p-qty" type="number" min="1" step="1" value="1" inputmode="numeric">
          </div>
          <button class="btn btn-primary" data-action="add-to-cart" data-sku="${escapeHtml(selected.id)}">Add to cart</button>
        </div>
        <p class="muted small">Adding to the cart does not reserve stock. The cart keeps your selection between pages.</p>
      </div>
    </article>

    <section class="panel">
      <h2>Specifications</h2>
      <table class="data-table">
        <tbody>${model.specs.map((s) => `<tr><th scope="row">${escapeHtml(s.label)}</th><td>${escapeHtml(s.value)}</td></tr>`).join('')}</tbody>
      </table>
    </section>
    ${chart}`;
}

// ---------------------------------------------------------------------------
// P-04 Cart
// ---------------------------------------------------------------------------

export function cart(seed, state, params, ctx = {}) {
  const c = state.cart;
  const totals = cartTotals(seed, state, c, { address: c.context.address });
  if (!c.items.length) {
    return `<header class="page-head"><h1>Your cart</h1></header>
      <div class="empty-state"><p>Your cart is empty.</p><p><a class="btn btn-primary" href="#catalog">Browse the catalogue</a></p></div>`;
  }

  const rows = totals.lines.map((l) => {
    const sku = l.sku;
    return `<tr class="${l.ok ? '' : 'row-unavailable'}">
      <td class="cell-product">
        <div class="cart-thumb">${modelArt(l.model, sku ? sku.colour : null)}</div>
        <div>
          <a href="#product/${escapeHtml(l.model ? l.model.id : '')}">${escapeHtml(l.model ? l.model.name : 'Unknown')}</a>
          <div class="muted small">${escapeHtml(sku ? sku.colour + (sku.size ? ' / ' + sku.size : (sku.frameSize ? ' / ' + sku.frameSize : '')) : '')} &middot; ${escapeHtml(sku ? sku.skuCode : '')}</div>
          ${l.ok ? '' : `<div class="inline-error">Only ${l.availableQty} available in this context. Keep the row and choose another store or delivery.</div>`}
        </div>
      </td>
      <td class="cell-price">${priceHtml(sku)}</td>
      <td class="cell-qty">
        <div class="qty-control">
          <button type="button" class="qty-btn" data-action="step-qty" data-sku="${escapeHtml(l.skuId)}" data-delta="-1" aria-label="Decrease quantity">-</button>
          <input type="number" min="1" step="1" value="${l.qty}" inputmode="numeric" data-action="set-qty" data-sku="${escapeHtml(l.skuId)}" aria-label="Quantity for ${escapeHtml(l.model ? l.model.name : '')}">
          <button type="button" class="qty-btn" data-action="step-qty" data-sku="${escapeHtml(l.skuId)}" data-delta="1" aria-label="Increase quantity">+</button>
        </div>
      </td>
      <td class="cell-total">${formatGBP(l.lineGross)}</td>
      <td><button type="button" class="link-btn" data-action="remove-item" data-sku="${escapeHtml(l.skuId)}">Remove</button></td>
    </tr>`;
  }).join('');

  // A delivery cart cannot price shipping until an address is supplied at
  // checkout. That is "pending", not an unavailable/invalid tariff, so it must
  // not block checkout; only a real shipping problem (excluded/missing tariff
  // for a supplied address) blocks. An unavailable row still blocks the cart.
  const isDelivery = c.context.type === 'delivery';
  const shippingPending = isDelivery && totals.shippingReason === 'no_address';
  const shippingBlocked = isDelivery && !totals.shippingOk && !shippingPending;
  const blocked = !totals.allAvailable || shippingBlocked;

  return `
    <header class="page-head"><h1>Your cart</h1>
      <p class="muted">Fulfilment context: <strong>${escapeHtml(contextLabel(seed, c.context))}</strong>. Change it in the header &mdash; unavailable rows are kept with a warning.</p>
    </header>
    <table class="cart-table">
      <thead><tr><th scope="col">Product</th><th scope="col">Price</th><th scope="col">Quantity</th><th scope="col">Total</th><th scope="col">Remove</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>

    ${!totals.allAvailable ? `<p class="notice notice-warn" role="alert">Some items are not available in the chosen fulfilment context. Checkout is blocked until every row is available.</p>` : ''}
    ${shippingBlocked ? `<p class="notice notice-warn" role="alert">Delivery cannot be priced for this address. Choose another address or a store for collection.</p>` : ''}

    <section class="cart-summary panel">
      <dl>
        <dt>Subtotal</dt><dd>${formatGBP(totals.subtotalGross)}</dd>
        <dt>Delivery</dt><dd>${!isDelivery ? 'Free &mdash; pay in store' : (shippingPending ? 'Calculated at checkout' : (totals.shippingOk ? formatGBP(totals.shippingGross) : 'Not configured'))}</dd>
        <dt class="total">${shippingPending ? 'Total before delivery (VAT included)' : 'Total (VAT included)'}</dt><dd class="total">${formatGBP(totals.totalGross)}</dd>
      </dl>
      <p class="muted small">Includes ${formatGBP(totals.vatGross)} VAT (synthetic demo rates).${shippingPending ? ' Delivery cost is calculated at checkout from the address you enter; availability is already checked.' : ''}</p>
      <p>
        ${blocked
          ? `<button class="btn btn-primary" type="button" disabled aria-disabled="true">Proceed to checkout</button>`
          : `<a class="btn btn-primary" href="#checkout">Proceed to checkout</a>`}
        <a class="btn btn-ghost" href="#catalog">Continue shopping</a>
      </p>
    </section>`;
}

// ---------------------------------------------------------------------------
// P-05 Checkout (one page)
// ---------------------------------------------------------------------------

export function checkout(seed, state, params, ctx = {}) {
  const c = state.cart;
  if (!c.items.length) {
    return `<header class="page-head"><h1>Checkout</h1></header>
      <div class="empty-state"><p>Your cart is empty, so there is nothing to check out.</p><p><a class="btn" href="#catalog">Browse the catalogue</a></p></div>`;
  }
  const form = ctx.form || { contact: { name: '', email: '', phone: '' }, address: { line1: '', line2: '', city: '', postcode: '', regionId: 'england' } };
  const rawErrors = ctx.errors || {};
  const errors = { ...rawErrors };
  // Normalise contact error keys so the view's contact.* lookups work.
  if (rawErrors.name) errors['contact.name'] = rawErrors.name;
  if (rawErrors.email) errors['contact.email'] = rawErrors.email;
  if (rawErrors.phone) errors['contact.phone'] = rawErrors.phone;
  const err = (k) => errors[k] ? `<p class="field-error" id="err-${k.replace(/\./g, '-')}" role="alert">${escapeHtml(errors[k])}</p>` : '';
  const aria = (k) => errors[k] ? ` aria-invalid="true" aria-describedby="err-${k.replace(/\./g, '-')}"` : '';

  const totals = cartTotals(seed, state, c, { address: form.address });
  const isCollection = c.context.type === 'collection';

  let reorderPreview = '';
  if (state.reorderDraft && state.reorderDraft.oldOrderId) {
    const changes = reorderChanges(seed, state, state.reorderDraft.oldOrderId);
    reorderPreview = `<div class="notice notice-warn"><strong>Reordering ${escapeHtml(state.reorderDraft.oldOrderId)}.</strong>
      The old order is cancelled and preserved. Prices and availability were re-checked; review the changes before placing the new order.
      ${changes.length ? `<ul>${changes.map((ch) => `<li>${escapeHtml(ch.name)}: ${ch.kind === 'price' ? 'price changed from ' + formatGBP(ch.from) + ' to ' + formatGBP(ch.to) : ch.kind === 'stock' ? 'only ' + ch.available + ' available (wanted ' + ch.wanted + ')' : 'no longer published / removed'}</li>`).join('')}</ul>` : '<p class="muted small">No price or availability changes.</p>'}
    </div>`;
  }

  const summary = `<aside class="panel checkout-summary">
    <h2>Order summary</h2>
    <ul class="summary-lines">
      ${totals.lines.map((l) => `<li><span>${escapeHtml(l.model ? l.model.name : 'Item')} &times; ${l.qty}</span><span>${formatGBP(l.lineGross)}</span></li>`).join('')}
    </ul>
    <dl>
      <dt>Subtotal</dt><dd>${formatGBP(totals.subtotalGross)}</dd>
      <dt>${isCollection ? 'Collection' : 'Delivery'}</dt><dd>${isCollection ? 'Pay in store' : (totals.shippingOk ? formatGBP(totals.shippingGross) : 'Not configured')}</dd>
      <dt class="total">Total (VAT included)</dt><dd class="total">${formatGBP(totals.totalGross)}</dd>
    </dl>
    <p class="muted small">Includes ${formatGBP(totals.vatGross)} VAT. Return conditions are summarised in <a href="#page/returns">Returns</a>.</p>
  </aside>`;

  const fulfilmentField = `<fieldset class="panel">
    <legend>Fulfilment</legend>
    <div class="radio-row">
      <label class="radio"><input type="radio" name="fulfilment" value="delivery"${!isCollection ? ' checked' : ''} data-action="checkout-fulfilment"> Delivery to an address</label>
      <label class="radio"><input type="radio" name="fulfilment" value="collection"${isCollection ? ' checked' : ''} data-action="checkout-fulfilment"> Collect from a store (pay in store)</label>
    </div>
  </fieldset>`;

  const addressFields = `<div class="panel" ${isCollection ? 'hidden' : ''} data-address-fields>
    <h2>Delivery address</h2>
    ${err('address.line1')}
    <div class="field"><label for="co-line1">Address line 1</label><input id="co-line1" name="line1" value="${escapeHtml(form.address.line1 || '')}"${aria('address.line1')}></div>
    ${err('address.line2')}
    <div class="field"><label for="co-line2">Address line 2 (optional)</label><input id="co-line2" name="line2" value="${escapeHtml(form.address.line2 || '')}"></div>
    ${err('address.city')}
    <div class="field"><label for="co-city">Town or city</label><input id="co-city" name="city" value="${escapeHtml(form.address.city || '')}"${aria('address.city')}></div>
    ${err('address.postcode')}
    <div class="field"><label for="co-postcode">Postcode</label><input id="co-postcode" name="postcode" value="${escapeHtml(form.address.postcode || '')}"${aria('address.postcode')}></div>
    ${err('address.regionId')}
    <div class="field"><label for="co-region">Region</label>
      <select id="co-region" name="regionId"${aria('address.regionId')}>
        ${seed.regions.map((r) => `<option value="${r.id}"${form.address.regionId === r.id ? ' selected' : ''}>${escapeHtml(r.name)}</option>`).join('')}
      </select>
    </div>
    <p class="muted small">Delivery tariffs here are synthetic demo values. Supported regions and exclusions are demo labels, not real postcode rules.</p>
  </div>`;

  const storeFields = `<div class="panel" ${isCollection ? '' : 'hidden'} data-store-fields>
    <h2>Collection store</h2>
    ${err('store')}
    <div class="field"><label for="co-store">Choose a store</label>
      <select id="co-store" name="storeId">
        <option value="">Select a store</option>
        ${seed.stockLocations.filter((l) => l.type === 'store').map((l) => `<option value="${l.id}"${c.context.storeId === l.id ? ' selected' : ''}>${escapeHtml(l.name)} &mdash; ${escapeHtml(l.address)}</option>`).join('')}
      </select>
    </div>
    <p class="muted small">Collection orders are confirmed immediately and paid in store. No online payment is taken for collection.</p>
  </div>`;

  return `
    <header class="page-head"><h1>Checkout</h1><p class="muted">Guest checkout &mdash; no account needed. One page, with errors shown beside each field.</p></header>
    ${reorderPreview}
    <form class="checkout-form" data-checkout-form novalidate>
      <div class="checkout-grid">
        <div class="checkout-main">
          <fieldset class="panel">
            <legend>Your details</legend>
            ${err('contact.name')}
            <div class="field"><label for="co-name">Name</label><input id="co-name" name="name" autocomplete="name" value="${escapeHtml(form.contact.name || '')}"${aria('contact.name')}></div>
            ${err('contact.email')}
            <div class="field"><label for="co-email">Email</label><input id="co-email" name="email" type="email" autocomplete="email" value="${escapeHtml(form.contact.email || '')}"${aria('contact.email')}></div>
            ${err('contact.phone')}
            <div class="field"><label for="co-phone">Phone</label><input id="co-phone" name="phone" type="tel" autocomplete="tel" value="${escapeHtml(form.contact.phone || '')}"${aria('contact.phone')}></div>
          </fieldset>
          ${fulfilmentField}
          ${addressFields}
          ${storeFields}
          ${errors.cart ? `<p class="notice notice-warn" role="alert">${escapeHtml(errors.cart)}</p>` : ''}
          ${errors.availability ? `<p class="notice notice-warn" role="alert">${escapeHtml(errors.availability)}</p>` : ''}
          <p><button class="btn btn-primary btn-lg" type="submit" data-action="place-order">Place order</button></p>
          <p class="muted small">Delivery creates a pending order and opens a clearly labelled payment simulator. Collection is confirmed and unpaid, to pay in store.</p>
        </div>
        ${summary}
      </div>
    </form>`;
}

// ---------------------------------------------------------------------------
// P-06 Payment simulator / result
// ---------------------------------------------------------------------------

export function payment(seed, state, params, ctx = {}) {
  const order = state.orders[params.orderId];
  if (!order) return notFoundOrder();
  const deadline = reservationDeadline(state, order.id);
  const active = reservationActive(state, order.id);
  return `
    <header class="page-head"><h1>Payment simulator</h1>
      <p class="notice notice-demo" role="note"><strong>Simulator only.</strong> No card fields, no real payment provider and no network calls. A return to the site never confirms payment by itself.</p>
    </header>
    <section class="panel">
      <p>Order <strong>${escapeHtml(order.id)}</strong> for ${formatGBP(order.totalGross)} (VAT included).</p>
      <p>Reservation: ${order.reservationId ? (active ? `held until <strong>${escapeHtml(londonDateTimeString(deadline))}</strong> (Europe/London; fixed original 30-minute deadline)` : 'expired') : 'not started'}.</p>
      <div class="sim-actions">
        <button class="btn btn-primary" data-action="pay" data-order="${escapeHtml(order.id)}" data-outcome="paid">Simulate successful payment</button>
        <button class="btn" data-action="pay" data-order="${escapeHtml(order.id)}" data-outcome="failed">Simulate bank refusal</button>
        <button class="btn btn-ghost" data-action="pay" data-order="${escapeHtml(order.id)}" data-outcome="pending">Simulate pending</button>
      </div>
      <p><a href="#result/${escapeHtml(order.id)}">Back to order result</a></p>
    </section>`;
}

export function result(seed, state, params, ctx = {}) {
  const order = state.orders[params.orderId];
  if (!order) return notFoundOrder();
  const active = reservationActive(state, order.id);
  const deadline = reservationDeadline(state, order.id);
  const isCollection = order.fulfilment.type === 'collection';
  const reorderable = canReorder(state, order.id);
  const refund = order.refundId ? state.refunds[order.refundId] : null;

  let nextStep = '';
  if (order.orderState === 'cancelled') {
    nextStep = refund
      ? `<p class="notice notice-warn">This order is cancelled. A full refund of ${formatGBP(refund.amountGross)} (including delivery) is <strong>${escapeHtml(refund.state)}</strong>. ${refundSaysMoneyReturned(refund) ? 'The provider confirmed the refund.' : 'Money is not yet returned while the refund is pending or failed.'}</p>`
      : `<p class="notice notice-warn">This order is cancelled. No refund is outstanding.</p>`;
  } else if (isCollection) {
    const collectBy = order.collectionDeadline ? escapeHtml(londonDateTimeString(order.collectionDeadline)) : '';
    if (order.orderState === 'completed') {
      nextStep = `<p class="notice notice-success">Collected and complete. Payment was recorded in store; nothing further is due.</p>
        <p><a class="btn" href="#order/${escapeHtml(order.id)}">View order details</a></p>`;
    } else if (order.paymentState === 'paid') {
      nextStep = `<p class="notice notice-success">Collection order <strong>confirmed</strong> and <strong>paid</strong> (payment recorded in store).${order.fulfilmentState === 'ready' && collectBy ? ` It is ready; bring your collection code before ${collectBy}.` : ' The store prepares it for collection.'}</p>
        <p><a class="btn" href="#order/${escapeHtml(order.id)}">View order details</a></p>`;
    } else if (order.fulfilmentState === 'ready') {
      nextStep = `<p class="notice notice-info">Collection order <strong>confirmed</strong> and <strong>unpaid</strong>. It is ready${collectBy ? `; collect by ${collectBy}` : ''}. Pay in store when you collect. No online payment is taken.</p>
        <p><a class="btn" href="#order/${escapeHtml(order.id)}">View order details</a></p>`;
    } else {
      nextStep = `<p class="notice notice-info">Collection order <strong>confirmed</strong> and <strong>unpaid</strong>. The store prepares it by its next working day. Pay in store when you collect. No online payment is taken.</p>
        <p><a class="btn" href="#order/${escapeHtml(order.id)}">View order details</a></p>`;
    }
  } else if (order.paymentState === 'paid') {
    if (order.fulfilmentState === 'delivered') {
      nextStep = `<p class="notice notice-success">Delivered and complete. Delivery was confirmed with the carrier evidence on record.</p>
        <p><a class="btn" href="#order/${escapeHtml(order.id)}">View order details</a></p>`;
    } else if (order.fulfilmentState === 'dispatched') {
      nextStep = `<p class="notice notice-success">Payment confirmed and dispatched. Dispatch alone does not mean delivered; a delivery is shown only once it is confirmed.</p>
        <p><a class="btn" href="#order/${escapeHtml(order.id)}">View order details</a></p>`;
    } else {
      nextStep = `<p class="notice notice-success">Payment confirmed and stock assured. We will email you when it is dispatched.</p>
        <p><a class="btn" href="#order/${escapeHtml(order.id)}">View order details</a></p>`;
    }
  } else if (active) {
    nextStep = `<p class="notice notice-info">Payment not confirmed yet. You can retry while the original reservation is active (until ${escapeHtml(londonDateTimeString(deadline))}).</p>
      <p><a class="btn btn-primary" href="#payment/${escapeHtml(order.id)}">Retry payment</a> <button class="btn btn-ghost" type="button" data-action="cancel-order" data-order="${escapeHtml(order.id)}">Decline this order</button></p>`;
  } else if (reorderable) {
    nextStep = `<p class="notice notice-warn">The 30-minute reservation has expired. Stock is released. Place the order again to re-check price and availability.</p>
      <p><button class="btn btn-primary" type="button" data-action="reorder" data-order="${escapeHtml(order.id)}">Place order again</button></p>`;
  } else if (order.orderState === 'pending' && order.paymentState === 'unpaid') {
    nextStep = `<p class="notice notice-info">Order created. Delivery payment has not started, so nothing is reserved yet.</p>
      <p><button class="btn btn-primary" type="button" data-action="begin-payment" data-order="${escapeHtml(order.id)}">Proceed to payment</button></p>`;
  } else {
    nextStep = `<p class="notice notice-info">This order is ${escapeHtml(order.orderState)}.</p>`;
  }

  return `
    <header class="page-head"><h1>Order result</h1><p class="muted">Order ${escapeHtml(order.id)}</p></header>
    ${nextStep}
    <section class="panel">
      <h2>Separate states</h2>
      <div class="state-row">
        ${stateBadge('Order', order.orderState, order.orderState)}
        ${stateBadge('Payment', order.paymentState, order.paymentState)}
        ${stateBadge('Fulfilment', order.fulfilmentState, order.fulfilmentState)}
      </div>
      <p class="muted small">These are shown separately, as required. A "received" email does not confirm payment.</p>
    </section>
    <section class="panel">
      <h2>What happens next</h2>
      <p>To see your order history, confirm your email at <a href="#sign-in">Sign in</a>. Opening a link alone does not grant history in this demo &mdash; you must press the confirm button.</p>
      <p>Need to change or stop this order? Use <a href="#help/${escapeHtml(order.id)}">Help with an order</a>.</p>
    </section>`;
}

function notFoundOrder() {
  return `<div class="empty-state"><h1>Order not found</h1><p class="muted">This demo order does not exist. Open the guide to create scenario orders.</p><p><a class="btn" href="#guide">Prototype guide</a></p></div>`;
}

// ---------------------------------------------------------------------------
// P-07 / P-08 email access
// ---------------------------------------------------------------------------

export function signIn(seed, state, params, ctx = {}) {
  return `
    <header class="page-head"><h1>Sign in to your orders</h1></header>
    <section class="panel">
      <p class="notice notice-demo" role="note">Mock email only. Nothing is sent; a sample appears in <a href="#emails">Email samples</a>.</p>
      <form data-login-form class="stack">
        <div class="field"><label for="li-email">Email address</label><input id="li-email" name="email" type="email" autocomplete="email" required></div>
        <p><button class="btn btn-primary" type="submit">Send me a sign-in link</button></p>
      </form>
      <p class="muted small">For privacy, the response is always neutral: it never says whether an account exists.</p>
      ${ctx.flash ? `<p class="notice notice-info" role="status">${escapeHtml(ctx.flash)}</p>` : ''}
    </section>`;
}

export function verify(seed, state, params, ctx = {}) {
  const stateName = (params.query && params.query.state) || 'valid';
  let inner;
  if (stateName === 'invalid' || stateName === 'used' || stateName === 'expired') {
    inner = `<p class="notice notice-warn" role="alert">This link is <strong>${escapeHtml(stateName)}</strong> and cannot be used. Request a new link from <a href="#sign-in">Sign in</a>. The order is not changed by an expired link.</p>`;
  } else {
    inner = `<p>Press the button to confirm. Simply opening this link does <strong>not</strong> grant access in this demo.</p>
      <p><button class="btn btn-primary" data-action="confirm-verify">Confirm this email</button></p>
      <p class="muted small">Open states: link expiry, single use and session details are open proposals (see the guide).</p>`;
  }
  return `
    <header class="page-head"><h1>Confirm your email</h1></header>
    <section class="panel">${inner}</section>`;
}

// ---------------------------------------------------------------------------
// P-09 / P-10 orders
// ---------------------------------------------------------------------------

function orderRow(seed, order) {
  return `<li class="order-row">
    <div>
      <a href="#order/${escapeHtml(order.id)}"><strong>${escapeHtml(order.id)}</strong></a>
      <div class="muted small">${escapeHtml(new Date(order.createdAt).toLocaleDateString('en-GB'))} &middot; ${order.fulfilment.type === 'collection' ? 'Collection' : 'Delivery'} &middot; ${formatGBP(order.totalGross)}</div>
    </div>
    <div class="state-row state-row-compact">
      ${stateBadge('Order', order.orderState, order.orderState)}
      ${stateBadge('Payment', order.paymentState, order.paymentState)}
      ${stateBadge('Fulfilment', order.fulfilmentState, order.fulfilmentState)}
    </div>
  </li>`;
}

export function orders(seed, state, params, ctx = {}) {
  const guests = guestOrders(state);
  const history = verifiedHistory(state);
  return `
    <header class="page-head"><h1>My orders</h1></header>
    <section class="panel">
      <h2>Current demo guest session</h2>
      <p class="muted small">The active browser session can act on its own current order(s) only. It cannot see the wider account history.</p>
      ${guests.length ? `<ul class="order-list">${guests.map((o) => orderRow(seed, o)).join('')}</ul>` : '<p class="muted">No current order in this session yet.</p>'}
    </section>
    <section class="panel">
      <h2>Account history</h2>
      ${state.verified
        ? (history.length ? `<ul class="order-list">${history.map((o) => orderRow(seed, o)).join('')}</ul>` : '<p class="muted">No orders in the account history.</p>')
        : `<p class="notice notice-info">History is hidden until you confirm your email. <a href="#sign-in">Sign in</a> then press the confirm button on the link screen.</p>`}
    </section>`;
}

export function order(seed, state, params, ctx = {}) {
  const order = state.orders[params.orderId];
  if (!order) return notFoundOrder();
  const active = reservationActive(state, order.id);
  const deadline = reservationDeadline(state, order.id);
  const isCollection = order.fulfilment.type === 'collection';
  const refund = order.refundId ? state.refunds[order.refundId] : null;
  const reorderable = canReorder(state, order.id);

  const lines = order.lines.map((l) => `<tr>
    <td>${escapeHtml(l.name)}</td>
    <td>${escapeHtml([l.colour, l.size || l.frameSize].filter(Boolean).join(' / '))}</td>
    <td>${escapeHtml(l.skuCode)}</td>
    <td>${l.qty}</td>
    <td>${formatGBP(l.unitPriceGross)}</td>
    <td>${formatGBP(l.lineGross)}</td>
  </tr>`).join('');

  const savedFulfilment = isCollection
    ? `Collection at <strong>${escapeHtml(order.fulfilment.storeName)}</strong>`
    : `Delivery to <strong>${escapeHtml(order.fulfilment.address.line1)}, ${escapeHtml(order.fulfilment.address.city)}, ${escapeHtml(order.fulfilment.address.postcode)}</strong> (${escapeHtml(order.fulfilment.address.regionName)})`;

  let actions = '';
  if (order.orderState === 'pending' && active) {
    actions += `<a class="btn btn-primary" href="#payment/${escapeHtml(order.id)}">Retry payment</a> `;
    actions += `<button class="btn" data-action="cancel-order" data-order="${escapeHtml(order.id)}">Decline this order</button> `;
  }
  if (order.orderState === 'pending' && order.paymentState === 'unpaid' && !active && !reorderable) {
    actions += `<button class="btn btn-primary" data-action="begin-payment" data-order="${escapeHtml(order.id)}">Proceed to payment</button> `;
  }
  if (reorderable) {
    actions += `<button class="btn btn-primary" data-action="reorder" data-order="${escapeHtml(order.id)}">Place order again</button> `;
  }
  if (order.orderState === 'confirmed' && !isCollection) {
    actions += `<button class="btn" data-action="request-cancellation" data-order="${escapeHtml(order.id)}">Request cancellation</button> `;
  }
  actions += `<a class="btn btn-ghost" href="#help/${escapeHtml(order.id)}">Help with an order</a>`;

  let refundBlock = '';
  if (refund) {
    refundBlock = `<section class="panel">
      <h2>Refund</h2>
      <p>Amount ${formatGBP(refund.amountGross)} ${refund.includesShipping ? '(including delivery)' : ''} &mdash; state <strong>${escapeHtml(refund.state)}</strong>.</p>
      <p class="muted small">${refundSaysMoneyReturned(refund) ? 'Provider confirmed the refund.' : 'A pending or failed refund is never described as money returned. Bank timing depends on the provider.'}</p>
    </section>`;
  }

  let shipmentBlock = '';
  if (order.shipment) {
    shipmentBlock = `<section class="panel"><h2>Shipment</h2>
      <p>Carrier: ${escapeHtml(order.shipment.carrier)} &middot; dispatched ${escapeHtml(order.shipment.date)}${order.shipment.tracking ? ' &middot; tracking ' + escapeHtml(order.shipment.tracking) : ' &middot; no tracking number provided'}.</p>
      <p class="muted small">Dispatch alone does not mean delivered. Delivery requires explicit confirmation.</p></section>`;
  }

  let collectionBlock = '';
  if (isCollection) {
    collectionBlock = `<section class="panel"><h2>Collection</h2>
      <p>Store: ${escapeHtml(order.fulfilment.storeName)}. Ready: ${order.readyAt ? 'yes' : 'not yet'}.
      ${order.collectionDeadline ? `Collect by ${escapeHtml(londonDateTimeString(order.collectionDeadline))} (Europe/London)${order.collectionExtended ? ', extended once' : ''}.` : ''}</p>
      <p class="muted small">A special collection code is required at handover; its format is an open proposal. Number alone is not enough. Payment is recorded in store separately from handover.</p></section>`;
  }

  return `
    <header class="page-head"><h1>Order ${escapeHtml(order.id)}</h1><p class="muted">A frozen snapshot of what was bought. It never changes when you switch storefront context.</p></header>
    <section class="panel">
      <h2>States</h2>
      <div class="state-row">
        ${stateBadge('Order', order.orderState, order.orderState)}
        ${stateBadge('Payment', order.paymentState, order.paymentState)}
        ${stateBadge('Fulfilment', order.fulfilmentState, order.fulfilmentState)}
      </div>
      ${order.orderState === 'pending' && !active && !reorderable ? `<p class="notice notice-info">Delivery payment has not started, so nothing is reserved yet.</p>` : ''}
      ${reorderable ? `<p class="notice notice-warn">Reservation expired${deadline ? ' at ' + escapeHtml(londonDateTimeString(deadline)) : ''}. Stock released; place the order again to re-check.</p>` : ''}
      ${order.revalidation && order.revalidation.length ? `<div class="notice notice-warn"><strong>Changed when this order was placed again:</strong><ul>${order.revalidation.map((c) => `<li>${escapeHtml(c.name)}: ${c.kind === 'price' ? 'price changed from ' + formatGBP(c.from) + ' to ' + formatGBP(c.to) : c.kind === 'stock' ? 'only ' + c.available + ' available (wanted ' + c.wanted + ')' : 'no longer published'}</li>`).join('')}</ul></div>` : ''}
    </section>
    <section class="panel">
      <h2>Items</h2>
      <div class="table-scroll">
        <table class="data-table"><thead><tr><th scope="col">Item</th><th scope="col">Variant</th><th scope="col">SKU</th><th scope="col">Qty</th><th scope="col">Unit</th><th scope="col">Line</th></tr></thead>
        <tbody>${lines}</tbody></table>
      </div>
      <dl class="totals">
        <dt>Subtotal</dt><dd>${formatGBP(order.subtotalGross)}</dd>
        <dt>${isCollection ? 'Collection' : 'Delivery'}</dt><dd>${formatGBP(order.shippingGross)}</dd>
        <dt class="total">Total (VAT included)</dt><dd class="total">${formatGBP(order.totalGross)}</dd>
      </dl>
    </section>
    <section class="panel">
      <h2>Saved fulfilment</h2>
      <p>${savedFulfilment}</p>
      <p class="muted small">The global selector in the header is labelled "For your next purchase" and does not change this order.</p>
    </section>
    ${collectionBlock}
    ${shipmentBlock}
    ${refundBlock}
    <section class="panel">
      <h2>Actions</h2>
      <p class="action-row">${actions}</p>
    </section>`;
}

// ---------------------------------------------------------------------------
// P-11 Help with an order
// ---------------------------------------------------------------------------

export function help(seed, state, params, ctx = {}) {
  const order = state.orders[params.orderId];
  if (!order) return notFoundOrder();
  const reasonOptions = ['I changed my mind', 'Faulty item', 'Wrong item received', 'Delivery problem', 'Other'];
  return `
    <header class="page-head"><h1>Help with order ${escapeHtml(order.id)}</h1></header>
    <section class="panel">
      <p class="notice notice-demo" role="note">Demo form. No ticket system, chat or mandatory registration. Actions change demo states only.</p>
      <form data-help-form data-order="${escapeHtml(order.id)}" class="stack">
        <div class="field">
          <label for="h-action">What would you like to do?</label>
          <select id="h-action" name="action">
            <option value="cancel">Decline an unpaid order</option>
            <option value="request-cancellation">Request cancellation (after payment)</option>
            <option value="extend-collection">Ask to extend a collection deadline</option>
            <option value="return">Start a return</option>
            <option value="delivery-problem">Report a delivery problem</option>
          </select>
        </div>
        <fieldset class="panel">
          <legend>Return lines (for returns)</legend>
          ${order.lines.map((l, i) => `<div class="return-line">
            <span>${escapeHtml(l.name)} <span class="muted small">(${escapeHtml(l.skuCode)}, bought ${l.qty})</span></span>
            <label class="small">Qty <input type="number" min="0" max="${l.qty}" value="0" name="return-${i}" data-sku="${escapeHtml(l.skuId)}" inputmode="numeric"></label>
          </div>`).join('')}
        </fieldset>
        <div class="field">
          <label for="h-reason">Reason</label>
          <select id="h-reason" name="reason">${reasonOptions.map((r) => `<option>${escapeHtml(r)}</option>`).join('')}</select>
        </div>
        <div class="field">
          <label for="h-note">Notes (optional)</label>
          <textarea id="h-note" name="note" rows="3"></textarea>
        </div>
        <p><button class="btn btn-primary" type="submit">Submit request</button></p>
      </form>
      ${ctx.flash ? `<p class="notice notice-info" role="status">${escapeHtml(ctx.flash)}</p>` : ''}
      <p class="muted small">Prefer email? Write to <strong>support@pedal-and-field.example</strong>. This address is synthetic.</p>
    </section>`;
}

// ---------------------------------------------------------------------------
// P-12 Journal / P-13 Info pages
// ---------------------------------------------------------------------------

export function journal(seed, state, params, ctx = {}) {
  const slug = params.query && params.query.slug;
  const articles = visibleArticles(state);
  if (slug) {
    const a = articles.find((x) => x.slug === slug);
    if (!a) return `<div class="empty-state"><h1>Article not found</h1><p><a class="btn" href="#journal">Back to journal</a></p></div>`;
    return `
      <nav class="breadcrumb"><a href="#journal">Journal</a> / <span>${escapeHtml(a.title)}</span></nav>
      <article class="prose">
        <h1>${escapeHtml(a.title)}</h1>
        <p class="muted">Draft editorial content for layout review.</p>
        <p>${escapeHtml(a.body)}</p>
      </article>`;
  }
  return `
    <header class="page-head"><h1>Journal</h1><p class="muted">Published demo articles only. Unpublished drafts are hidden.</p></header>
    ${articles.length ? `<div class="grid grid-articles">${articles.map((a) => `
      <a class="article-card" href="#journal?slug=${escapeHtml(a.slug)}">
        <h2>${escapeHtml(a.title)}</h2><p class="muted">${escapeHtml(a.excerpt)}</p>
      </a>`).join('')}</div>` : '<div class="empty-state"><p>No published articles.</p></div>'}`;
}

export function page(seed, state, params, ctx = {}) {
  const p = state.content.pages[params.slug];
  if (!p || !p.published) return `<div class="empty-state"><h1>Page not found</h1><p><a class="btn" href="#home">Home</a></p></div>`;
  return `
    <article class="prose">
      <h1>${escapeHtml(p.title)}</h1>
      <p>${escapeHtml(p.body)}</p>
      <p class="muted small">Draft information page. Real text and contacts are launch data (UX-L-01).</p>
    </article>`;
}

// ---------------------------------------------------------------------------
// E surfaces / email samples
// ---------------------------------------------------------------------------

export function emails(seed, state, params, ctx = {}) {
  const samples = [
    { id: 'E-01', subject: 'Confirm your email', body: 'Opens the explicit confirmation screen (P-08). The link does not grant history until you press confirm.' },
    { id: 'E-02a', subject: 'Order received (delivery)', body: 'Says the request was received. It does NOT promise confirmed payment.' },
    { id: 'E-02b', subject: 'Order confirmed', body: 'Sent only when payment is confirmed and stock assured. Late payment of a cancelled order does not send this.' },
    { id: 'E-02c', subject: 'Ready for collection', body: 'States the collection deadline and that a special code is needed. Not a delivery notice.' },
    { id: 'E-02d', subject: 'Collection deadline extended', body: 'States the new deadline, author and time.' },
    { id: 'E-02e', subject: 'Dispatched', body: 'Carrier, date and optional tracking. Dispatch is not delivery.' },
    { id: 'E-02f', subject: 'Delivered', body: 'Sent after explicit confirmation of delivery, not automatically on dispatch.' },
    { id: 'E-03', subject: 'Refund update', body: 'Distinguishes pending, succeeded and failed. A pending refund never says money has been returned.' }
  ];
  return `
    <header class="page-head"><h1>Email samples (mock)</h1><p class="muted">Draft transactional copy for E-01&ndash;E-03. Nothing is sent; these are illustrative only.</p></header>
    <div class="grid grid-emails">
      ${samples.map((s) => `<article class="email-card"><p class="eyebrow">${escapeHtml(s.id)}</p><h2>${escapeHtml(s.subject)}</h2><p>${escapeHtml(s.body)}</p></article>`).join('')}
    </div>
    ${state.staff.authenticated ? `<section class="panel">
      <h2>Session email log (staff diagnostic)</h2>
      ${state.emails.length ? `<ul>${state.emails.map((e) => `<li><strong>${escapeHtml(e.subject)}</strong> to ${escapeHtml(e.to || 'demo')} &mdash; ${escapeHtml(e.kind || '')}</li>`).join('')}</ul>` : '<p class="muted">No emails logged in this session yet.</p>'}
    </section>` : `<p class="muted small">A staff-only diagnostic log of this session's mock emails is hidden while signed out.</p>`}`;
}

// ---------------------------------------------------------------------------
// Prototype guide
// ---------------------------------------------------------------------------

export function guide(seed, state, params, ctx = {}) {
  const sid = (s) => scenarioOrderId(state, s);
  const anyOrder = Object.keys(state.orders)[0] || null;
  const row = (id, name, href) => `<li><span class="guide-id">${escapeHtml(id)}</span> <a href="${href}">${escapeHtml(name)}</a> <code>${escapeHtml(href)}</code></li>`;
  const need = (name, scenario) => {
    const id = sid(scenario);
    return id ? row('P-06', name, '#payment/' + id) : `<li><span class="guide-id">P-06</span> ${escapeHtml(name)} &mdash; seed scenarios below</li>`;
  };

  const orderScreens = [];
  orderScreens.push(sid('failed') ? row('P-06', 'Payment simulator (failed)', '#payment/' + sid('failed')) : '<li><span class="guide-id">P-06</span> Payment simulator &mdash; seed scenarios below</li>');
  orderScreens.push(sid('expired') ? row('P-06', 'Order result (expired / reorder)', '#result/' + sid('expired')) : '<li><span class="guide-id">P-06</span> Order result &mdash; seed scenarios below</li>');
  orderScreens.push(sid('cancelledRefund') ? row('P-06', 'Order result (cancelled + refund pending)', '#result/' + sid('cancelledRefund')) : '<li><span class="guide-id">P-06</span> Cancelled + refund &mdash; seed scenarios below</li>');
  orderScreens.push(anyOrder ? row('P-10', 'Order details', '#order/' + anyOrder) : '<li><span class="guide-id">P-10</span> Order details &mdash; seed scenarios below</li>');
  orderScreens.push(anyOrder ? row('P-11', 'Help with an order', '#help/' + anyOrder) : '<li><span class="guide-id">P-11</span> Help &mdash; seed scenarios below</li>');
  orderScreens.push(sid('collectionReady') ? row('S-03', 'Staff: collection ready order', '#staff/order/' + sid('collectionReady')) : '<li><span class="guide-id">S-03</span> Staff order &mdash; seed scenarios below</li>');
  orderScreens.push(sid('dispatched') ? row('S-03', 'Staff: dispatched delivery order', '#staff/order/' + sid('dispatched')) : '<li><span class="guide-id">S-03</span> Staff dispatched &mdash; seed scenarios below</li>');

  const fixed = [
    row('P-01', 'Home / finder', '#home'),
    row('P-02', 'Catalogue / search', '#catalog'),
    row('P-03', 'Product model / SKU', '#product/gravel-01'),
    row('P-04', 'Cart', '#cart'),
    row('P-05', 'Checkout', '#checkout'),
    row('P-07', 'Request sign-in link', '#sign-in'),
    row('P-08', 'Confirm email', '#verify'),
    row('P-08', 'Confirm email (invalid link)', '#verify?state=invalid'),
    row('P-09', 'My orders', '#orders'),
    row('P-12', 'Journal list', '#journal'),
    row('P-12', 'Journal article', '#journal?slug=gravel-notes'),
    row('P-13', 'Info page (FAQ)', '#page/faq'),
    row('P-13', 'Info page (Returns)', '#page/returns'),
    row('E-01..E-03', 'Email samples', '#emails'),
    row('S-01', 'Staff sign-in', '#staff/sign-in'),
    row('S-02', 'Network orders', '#staff/orders'),
    row('S-04', 'Returns / refunds', '#staff/returns'),
    row('S-05', 'Inventory / restock', '#staff/inventory'),
    row('S-06', 'Catalogue admin', '#staff/products'),
    row('S-07', 'Model / SKU editor', '#staff/product/gravel-01'),
    row('S-08', 'Locations / tariffs', '#staff/locations'),
    row('S-09', 'Staff accounts', '#staff/accounts'),
    row('S-10', 'Content editor', '#staff/content')
  ];

  return `
    <header class="page-head"><h1>Prototype guide</h1><p class="muted">Draft prototype for review. Every screen below has a distinct link. Order-dependent screens use real seeded ids.</p></header>
    <section class="panel">
      <h2>Scenario builder</h2>
      <p>Build one demo order in each agreed state, then open them from the links below. This preserves your cart and the normal guest-history rules.</p>
      <p><button class="btn btn-primary" data-action="guide-seed-scenarios">Seed demo scenarios</button></p>
      ${Object.values(state.orders).filter((o) => o.demoScenario).length ? `<p class="muted small">Seeded: ${Object.values(state.orders).filter((o) => o.demoScenario).map((o) => escapeHtml(o.demoScenario)).join(', ')}.</p>` : '<p class="muted small">No scenarios seeded yet.</p>'}
    </section>
    <section class="panel">
      <h2>Screens and routes</h2>
      <ul class="guide-links">${[...fixed, ...orderScreens].join('')}</ul>
    </section>
    <section class="panel">
      <h2>Scenario controls</h2>
      <p>Use the header's "For your next purchase" selector to switch between delivery and stores. Staff roles are switched on the <a href="#staff/sign-in">staff sign-in</a> screen.</p>
      <p><button class="btn" data-action="reset">Reset all demo state</button></p>
    </section>
    <section class="panel">
      <h2>Guest session (guide-only controls)</h2>
      <p class="muted small">The ordinary guest UI may act only on the current order of this demo session. These controls deliberately change that for demonstration; they are not shown in the normal flow.</p>
      <p>Current guest order: <strong>${escapeHtml(state.currentGuestOrderId || 'none')}</strong> &middot; verified mock persona: <strong>${state.verified ? 'yes' : 'no'}</strong>.</p>
      <div class="action-row">
        <button class="btn" data-action="guide-clear-session">Simulate new browser (clear guest session)</button>
        <button class="btn" data-action="guide-seed-history">Seed synthetic history (mock verified persona)</button>
      </div>
      ${Object.values(state.orders).length ? `<ul class="order-list">${Object.values(state.orders).map((o) => `<li>${escapeHtml(o.id)} <span class="muted small">${escapeHtml(o.orderState)}${o.demoScenario ? ' / ' + escapeHtml(o.demoScenario) : ''}</span> <button class="link-btn" data-action="guide-select-order" data-order="${escapeHtml(o.id)}">Make current</button></li>`).join('')}</ul>` : '<p class="muted">No orders yet.</p>'}
    </section>
    <section class="panel">
      <h2>Open UX proposals (not decided)</h2>
      <ul>
        <li>Guest session mechanism and timeout (UX-01).</li>
        <li>Second-factor type for staff sign-in (UX-05).</li>
        <li>Collection code format and checks (UX-06).</li>
        <li>Email correction and access re-binding procedure (UX-07).</li>
        <li>Photo optimisation workflow details (J-10 / QUA-03).</li>
      </ul>
      <p class="muted small">These are shown as placeholders; no production behaviour is claimed. No real authentication is provided.</p>
    </section>`;
}
