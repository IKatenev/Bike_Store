// Storefront / customer views (P-01..P-13 and E surfaces) as HTML strings.
import {
  escapeHtml, formatGBP, getModel, getSku, skusForModel, getLocation,
  filterModels, searchModels, cartTotals, cartAvailability, contextLabel,
  computeShipping, validateCheckout, getTaxRate, availableQuantity, checkoutGate,
  reservationActive, reservationDeadline, canReorder, visibleArticles, visiblePages,
  curationModels, guestOrders, verifiedHistory, refundSaysMoneyReturned,
  londonDateTimeString, scenarioOrderId, reorderChanges, modelPriceSummary,
  chooseSku, skuOptionValue, recommendModels, isSignedIn, isWishlisted,
  wishlistModels, wishlistModelIds, latestArticles, formatArticleDate,
  reviewSummary, reviewPage
} from './domain.mjs';
import {
  bikeSvg, productSvg, heroArt, frameSvg, articleArt,
  bikeDetailSvg, bikeCockpitSvg, frameDetailSvg,
  iconUser, iconCart, iconOrders, iconHeart, iconSearch, iconFilter,
  iconClose, iconChevron, iconCheck, iconTruck, iconStore
} from './assets.mjs';

export const COLOUR_HEX = {
  Sand: '#cbb994', Forest: '#344f3c', Ink: '#242c27',
  Terracotta: '#b85b3f', Steel: '#8b98a1', Black: '#2b2b2b'
};

const ART_KIND = {
  tyres: 'tyres', brakes: 'brakes', helmets: 'helmets', locks: 'locks',
  lights: 'lights', jerseys: 'jerseys', gloves: 'gloves', jackets: 'jackets'
};

// Short, useful demo profiles for the Manufacturer tab. Synthetic brands only:
// no real manufacturer, factory or external claim is represented.
const BRAND_PROFILES = {
  'PEDAL & FIELD': 'Our in-house demonstration brand. It covers gravel, touring, electric and everyday bikes alongside a small matching parts and clothing range.',
  'Northgate': 'A demonstration brand for road, trail and mountain bikes, with a focused parts line for the same riders.',
  'Larkhill': 'A demonstration brand for city and kids bikes, helmets, lights, locks and riding clothing.'
};

export function colourHex(name) {
  return COLOUR_HEX[name] || '#344f3c';
}

export function modelArt(model, colour) {
  if (!model) return productSvg('accessory', '#344f3c');
  if (model.categoryId === 'bikes') return bikeSvg(colourHex(colour), model.type);
  if (model.type === 'frames') return frameSvg(colourHex(colour));
  return productSvg(ART_KIND[model.type] || 'accessory', colourHex(colour));
}

// Several DISTINCT local demonstration views per model. Bikes show three
// genuinely different scenes (side, drivetrain close-up, cockpit); a bare
// frameset shows two; parts/accessories/clothing show a single view so the
// one-image case has no pointless paging controls. Colour follows the selected
// SKU so the chosen variant is accurate.
export function galleryViews(model, colour) {
  const c = colourHex(colour);
  if (!model) return [{ label: 'View', svg: productSvg('accessory', c) }];
  if (model.categoryId === 'bikes') {
    return [
      { label: 'Side', svg: bikeSvg(c, model.type) },
      { label: 'Drivetrain', svg: bikeDetailSvg(c) },
      { label: 'Cockpit', svg: bikeCockpitSvg(c) }
    ];
  }
  if (model.type === 'frames') {
    return [
      { label: 'Frame', svg: frameSvg(c) },
      { label: 'Dropouts', svg: frameDetailSvg(c) }
    ];
  }
  return [{ label: 'View', svg: productSvg(ART_KIND[model.type] || 'accessory', c) }];
}

// Accessible star row: a filled/hollow star per rating value with a text label.
function stars(rating, label) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));
  const glyphs = [1, 2, 3, 4, 5].map((i) =>
    `<span class="star${i <= value ? ' star-on' : ''}" aria-hidden="true">&#9733;</span>`).join('');
  return `<span class="stars" role="img" aria-label="${escapeHtml(label || (value + ' out of 5'))}">${glyphs}</span>`;
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
      <div class="section-head"><h2>${escapeHtml(title)}</h2><a class="link" href="#catalog">See all</a></div>
      <div class="grid grid-products home-products">${models.map((m) => productCard(seed, state, m)).join('')}</div>
    </section>`;
  };

  // Three manual hero slides: each has its own scene, copy and a single link.
  // The whole visible slide is one anchor; the CTA is a styled span inside it
  // (no nested anchor/button). Controls stay outside the anchor. No autoplay.
  const slides = [
    {
      variant: 0, eyebrow: 'New season',
      title: 'Bikes and kit for the long way round.',
      text: 'Find the right ride, then choose delivery to your door or collection from a store near you.',
      href: '#catalog', cta: 'Browse the catalogue'
    },
    {
      variant: 1, eyebrow: 'Everyday riding',
      title: 'Commute, shop and explore.',
      text: 'Upright city bikes, e-commuters and practical kit built for everyday journeys.',
      href: '#catalog?category=bikes&type=hybrid', cta: 'Shop city and hybrid'
    },
    {
      variant: 2, eyebrow: 'Parts and kit',
      title: 'Keep every ride rolling.',
      text: 'Tyres, brakes, frames and the accessories that keep a good bike going for years.',
      href: '#catalog?category=parts', cta: 'Shop parts'
    }
  ];

  const heroSlides = slides.map((s, i) => `
    <div class="hero-slide" data-hero-slide="${i}"${i === 0 ? '' : ' hidden'}>
      <a class="hero-slide-link" href="${s.href}">
        <span class="hero-art">${heroArt(s.variant)}</span>
        <div class="hero-copy">
          <span class="eyebrow">${escapeHtml(s.eyebrow)}</span>
          <h1 class="hero-title">${escapeHtml(s.title)}</h1>
          <span class="hero-text">${escapeHtml(s.text)}</span>
          <span class="btn btn-primary hero-cta">${escapeHtml(s.cta)}</span>
        </div>
      </a>
    </div>`).join('');

  const heroDots = slides.map((s, i) =>
    `<button class="hero-dot" type="button" data-action="hero-slide" data-slide="${i}" aria-label="Show slide ${i + 1} of ${slides.length}" aria-current="${i === 0}"></button>`).join('');

  // Two equal temporary brand promos. Final campaign content is undecided.
  const promos = [
    { brand: 'Northgate', variant: 1, text: 'Road and trail bikes built for long days out.' },
    { brand: 'Larkhill', variant: 2, text: 'City bikes, parts and kit for everyday riding.' }
  ];
  const heroPromos = promos.map((p) => `
    <a class="promo-card" data-promo="${escapeHtml(p.brand)}" href="#catalog?brand=${encodeURIComponent(p.brand)}">
      <span class="promo-art">${heroArt(p.variant)}</span>
      <span class="promo-copy">
        <span class="eyebrow">Brand spotlight</span>
        <span class="promo-title">${escapeHtml(p.brand)}</span>
        <span class="promo-text">${escapeHtml(p.text)}</span>
        <span class="btn btn-primary promo-cta">Shop ${escapeHtml(p.brand)}</span>
      </span>
    </a>`).join('');

  const hero = `
    <section class="hero hero-promo">
      <div class="hero-main" data-hero-carousel aria-roledescription="carousel" aria-label="Featured highlights">
        <div class="hero-slides" aria-live="polite">${heroSlides}</div>
        <div class="hero-controls">
          <button class="hero-arrow" type="button" data-action="hero-prev" aria-label="Previous slide">${iconChevron('left')}</button>
          <button class="hero-arrow" type="button" data-action="hero-next" aria-label="Next slide">${iconChevron('right')}</button>
          <div class="hero-dots">${heroDots}</div>
        </div>
      </div>
      <div class="hero-promos">${heroPromos}</div>
    </section>`;

  // Latest published articles, newest first; drafted records are excluded.
  const latest = latestArticles(state, 3);
  const latestSection = latest.length ? `
    <section class="section latest">
      <div class="section-head"><h2>From the journal</h2><a class="link" href="#journal">All articles</a></div>
      <div class="grid grid-latest">
        ${latest.map((a) => `
          <a class="article-card latest-card" href="#journal?slug=${escapeHtml(a.slug)}">
            <span class="article-art">${articleArt(a.artVariant)}</span>
            <time class="article-date" datetime="${escapeHtml(a.publishedAt || '')}">${escapeHtml(formatArticleDate(a.publishedAt))}</time>
            <h3 class="article-title">${escapeHtml(a.title)}</h3>
            <p class="article-preview">${escapeHtml(a.body)}</p>
          </a>`).join('')}
      </div>
    </section>` : '';

  return `
    ${hero}

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
    </section>

    ${latestSection}`;
}

function contextReady(context) {
  return !!context && (context.type === 'delivery' || !!context.storeId);
}

function availabilityLabel(context, availableInContext) {
  if (!contextReady(context)) return 'choose a store for availability';
  return availableInContext ? 'available here' : 'no stock in this context';
}

function wishlistHeart(state, model) {
  const wishlisted = isWishlisted(state, model.id);
  const label = (wishlisted ? 'Remove ' : 'Save ') + model.name + (wishlisted ? ' from' : ' to') + ' your wishlist';
  return `<button class="wishlist-heart${wishlisted ? ' is-saved' : ''}" type="button" data-action="wishlist-toggle" data-model="${escapeHtml(model.id)}" aria-pressed="${wishlisted}" aria-label="${escapeHtml(label)}">${iconHeart()}</button>`;
}

function productCard(seed, state, model) {
  const summary = modelPriceSummary(seed, state, model, state.cart.context);
  const anyDiscount = summary.skus.some(discounted);
  return `<div class="product-card" data-model="${escapeHtml(model.id)}">
    <div class="product-art-wrap">
      <a class="product-art product-link" href="#product/${escapeHtml(model.id)}" aria-label="${escapeHtml(model.name)}">${modelArt(model, summary.chosenSku ? summary.chosenSku.colour : null)}</a>
      ${wishlistHeart(state, model)}
    </div>
    <div class="product-meta">
      <p class="product-brand">${escapeHtml(model.brand)}</p>
      <h3><a class="product-link" href="#product/${escapeHtml(model.id)}">${escapeHtml(model.name)}</a></h3>
      <p class="product-price">From ${priceHtml(summary.chosenSku)}${anyDiscount ? ' <span class="tag">Reduced</span>' : ''}</p>
      <p class="muted small">${model.wheels ? escapeHtml(model.wheels) + ' &middot; ' : ''}${escapeHtml(model.type)} &middot; ${escapeHtml(availabilityLabel(state.cart.context, summary.availableInContext))}</p>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// P-02 Catalog
// ---------------------------------------------------------------------------

// Resolve a possibly repeated query value. `queryList` holds every repeated
// value; a legacy single link is still honoured through the scalar `query`.
function multiValue(query, queryList, key) {
  const list = queryList && Array.isArray(queryList[key]) ? queryList[key].filter((v) => v !== '') : [];
  if (list.length) return list;
  const single = query[key];
  return single ? [single] : [];
}

// One checkbox group. Values are OR'd inside the group; separate groups are
// AND'ed together by the domain (one SKU must satisfy the whole conjunction).
// Shows the first four values and reveals the rest behind a native "Show more"
// disclosure; a selected value in the hidden part keeps it open after reload.
function checkboxGroup(name, label, options, selected) {
  const isSel = (v) => selected.includes(v);
  const item = (o) => `<label class="check">
    <input type="checkbox" name="${name}" value="${escapeHtml(o.value)}"${isSel(o.value) ? ' checked' : ''}>
    <span class="check-label">${escapeHtml(o.label)}</span>
    <span class="check-count">${o.count}</span>
  </label>`;
  const visible = options.slice(0, 4);
  const hidden = options.slice(4);
  const hiddenSelected = hidden.some((o) => isSel(o.value));
  return `<fieldset class="filter-group">
    <legend>${escapeHtml(label)}</legend>
    <div class="check-list">${visible.map(item).join('')}</div>
    ${hidden.length ? `<details class="filter-more"${hiddenSelected ? ' open' : ''}>
      <summary>Show more (${hidden.length})</summary>
      <div class="check-list">${hidden.map(item).join('')}</div>
    </details>` : ''}
  </fieldset>`;
}

export function catalog(seed, state, params, ctx = {}) {
  const q = params.query || {};
  const ql = params.queryList || {};
  const context = state.cart.context;
  const criteria = {
    categoryId: multiValue(q, ql, 'category'),
    brand: multiValue(q, ql, 'brand'),
    type: multiValue(q, ql, 'type'),
    wheels: multiValue(q, ql, 'wheels'),
    frameSize: multiValue(q, ql, 'frameSize'),
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

  const modelCount = (pred) => seed.models.filter((m) => m.published && pred(m)).length;
  const typeOptions = [...new Set(seed.models.filter((m) => m.published && m.type).map((m) => m.type))].sort();
  const wheelOptions = [...new Set(seed.models.filter((m) => m.published && m.wheels).map((m) => m.wheels))].sort();
  const frameOptions = [...new Set(seed.models.filter((m) => m.published && m.sizeChart).flatMap((m) => m.sizeChart.map((r) => r.frameSize)))].sort();

  const categoryOpts = seed.categories.map((c) => ({ value: c.id, label: c.name, count: modelCount((m) => m.categoryId === c.id) }));
  const brandOpts = seed.brands.map((b) => ({ value: b, label: b, count: modelCount((m) => m.brand === b) }));
  const typeOpts = typeOptions.map((t) => ({ value: t, label: t, count: modelCount((m) => m.type === t) }));
  const wheelOpts = wheelOptions.map((w) => ({ value: w, label: w, count: modelCount((m) => m.wheels === w) }));
  const frameOpts = frameOptions.map((f) => ({ value: f, label: f, count: modelCount((m) => m.sizeChart && m.sizeChart.some((r) => r.frameSize === f)) }));

  const active = [];
  if (q.q) active.push('Search: ' + q.q);
  const properties = [
    ['Category', criteria.categoryId], ['Brand', criteria.brand],
    ['Type', criteria.type], ['Wheels', criteria.wheels], ['Frame', criteria.frameSize]
  ];
  for (const [name, vals] of properties) for (const v of vals) active.push(name + ': ' + v);
  if (criteria.priceMax) active.push('Max ' + formatGBP(criteria.priceMax));
  if (criteria.heightCm) active.push('Height ' + criteria.heightCm + ' cm');
  if (criteria.inStockOnly) active.push('In stock only');
  const activeSummary = active.length
    ? `<p class="active-filters" aria-live="polite">Active filters: ${active.map((a) => `<span class="chip-static">${escapeHtml(a)}</span>`).join(' ')} <a href="#catalog">Clear all</a></p>`
    : '';

  const filters = `
    <form id="catalog-form" class="catalog-filters" data-catalog-form aria-label="Catalogue filters">
      <div class="finder-field">
        <label for="c-q">Search</label>
        <input id="c-q" name="q" type="search" value="${escapeHtml(q.q || '')}" placeholder="Name, brand or SKU">
      </div>
      ${checkboxGroup('category', 'Category', categoryOpts, criteria.categoryId)}
      ${checkboxGroup('brand', 'Brand', brandOpts, criteria.brand)}
      ${checkboxGroup('type', 'Type', typeOpts, criteria.type)}
      ${checkboxGroup('wheels', 'Wheels', wheelOpts, criteria.wheels)}
      ${checkboxGroup('frameSize', 'Frame size', frameOpts, criteria.frameSize)}
      <div class="finder-field">
        <label for="c-price">Max price (&pound;)</label>
        <input id="c-price" name="priceMax" type="number" min="0" step="0.01" inputmode="decimal" value="${q.priceMax ? (Number(q.priceMax) / 100) : ''}" placeholder="e.g. 1500">
      </div>
      <div class="finder-field">
        <label for="c-height">Your height (cm)</label>
        <input id="c-height" name="heightCm" type="number" min="100" max="220" inputmode="numeric" value="${escapeHtml(q.heightCm || '')}">
      </div>
      <div class="finder-field checkbox">
        <input id="c-stock" name="inStock" type="checkbox" value="1"${q.inStock === '1' ? ' checked' : ''}>
        <label for="c-stock">In stock in current context</label>
      </div>
      <div class="filter-actions">
        <button class="btn btn-primary" type="submit">Apply filters</button>
        <a class="btn btn-ghost" href="#catalog">Clear</a>
      </div>
    </form>`;

  const sortField = `
    <div class="sort-field">
      <label for="c-sort">Sort</label>
      <select id="c-sort" name="sort" form="catalog-form" data-auto-submit>
        <option value="">Recommended</option>
        <option value="price-asc"${q.sort === 'price-asc' ? ' selected' : ''}>Price: low to high</option>
        <option value="price-desc"${q.sort === 'price-desc' ? ' selected' : ''}>Price: high to low</option>
      </select>
    </div>`;

  const body = results.length
    ? `<div class="grid grid-products">${results.map((r) => catalogCard(seed, state, r)).join('')}</div>`
    : `<div class="empty-state"><h3>No models match</h3><p class="muted">Adjust the filters or clear the search to see more bikes.</p></div>`;

  return `
    <header class="page-head">
      <h1>Catalogue</h1>
      <p class="muted">Showing results for <strong>${escapeHtml(contextLabel(seed, context))}</strong>. Change it in the header for your next purchase.</p>
    </header>
    <div class="catalog-layout">
      <aside class="catalog-sidebar" id="catalog-filters" aria-label="Catalogue filters">
        <div class="drawer-head"><h2>Filters</h2><button class="btn btn-ghost" type="button" data-action="close-filters" aria-label="Close filters">${iconClose()}</button></div>
        ${filters}
      </aside>
      <div class="catalog-results">
        <div class="catalog-toolbar">
          <button class="btn filter-open-btn" type="button" data-action="open-filters" aria-controls="catalog-filters" aria-expanded="false">${iconFilter()} Filter</button>
          <p class="finder-count" aria-live="polite"><strong>${results.length}</strong> models match (counted once)</p>
          ${sortField}
        </div>
        ${activeSummary}
        ${body}
      </div>
    </div>
    <div class="filter-backdrop" data-filter-backdrop hidden></div>`;
}

function catalogCard(seed, state, r) {
  const m = r.model;
  const anyDiscount = r.matchingSkus.some(discounted);
  const label = availabilityLabel(state.cart.context, r.availableInContext);
  return `<div class="product-card" data-model="${escapeHtml(m.id)}">
    <div class="product-art-wrap">
      <a class="product-art product-link" href="#product/${escapeHtml(m.id)}" aria-label="${escapeHtml(m.name)}">${modelArt(m, r.chosenSku ? r.chosenSku.colour : null)}</a>
      ${wishlistHeart(state, m)}
    </div>
    <div class="product-meta">
      <p class="product-brand">${escapeHtml(m.brand)}</p>
      <h3><a class="product-link" href="#product/${escapeHtml(m.id)}">${escapeHtml(m.name)}</a></h3>
      <p class="product-price">From ${priceHtml(r.chosenSku)}${anyDiscount ? ' <span class="tag">Reduced</span>' : ''}</p>
      <p class="muted small">${m.wheels ? escapeHtml(m.wheels) + ' &middot; ' : ''}${escapeHtml(m.type)} &middot; ${escapeHtml(label)}</p>
    </div>
  </div>`;
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

  const sizeLabel = model.categoryId === 'bikes' ? 'Frame size' : 'Size';
  const colourOptions = [...new Set(skus.map((s) => s.colour))];
  const sizeOptions = [...new Set(skus.map((s) => skuOptionValue(s)))];
  const selectedSize = selected ? skuOptionValue(selected) : null;

  const avail = selected ? availableQuantity(seed, state, selected.id, context) : 0;
  const contextChosen = !!context && (context.type === 'delivery' || !!context.storeId);
  const unavailable = contextChosen && avail <= 0;

  // Gallery: distinct local demo views; colour follows the selected SKU.
  const views = galleryViews(model, selected ? selected.colour : null);
  const activeView = Math.min(Math.max(0, Number(ctx.galleryIndex) || 0), views.length - 1);
  const mainView = views[activeView];
  const multiView = views.length > 1;
  const gallery = `<div class="product-gallery" data-gallery data-count="${views.length}">
    <div class="gallery-main">
      <button class="gallery-open" type="button" data-action="open-gallery" aria-label="View larger images">${mainView.svg}</button>
      ${wishlistHeart(state, model)}
    </div>
    ${multiView ? `<div class="gallery-thumbs">${views.map((v, i) =>
      `<button class="gallery-thumb${i === activeView ? ' is-active' : ''}" type="button" data-action="gallery-view" data-index="${i}" aria-label="${escapeHtml(v.label)}" aria-pressed="${i === activeView}">${v.svg}</button>`).join('')}</div>` : ''}
  </div>`;

  // Model-level rating (never per SKU). Empty is honestly "0 Ratings".
  const summary = reviewSummary(state, model.id);
  const ratingText = summary.count === 0
    ? '<span class="rating-count">0 Ratings</span>'
    : `<span class="rating-count">(${summary.average.toFixed(1)}) - ${summary.count} Ratings</span>`;

  const related = recommendModels(seed, state, model.id);
  const relatedBlock = related.length
    ? `<section class="section related">
        <div class="section-head">
          <h2>Related products</h2>
          <p class="muted small">Chosen by name similarity only &mdash; this is not a statement that they fit or are compatible with ${escapeHtml(model.name)}.</p>
        </div>
        <div class="grid grid-products">${related.map((m) => productCard(seed, state, m)).join('')}</div>
      </section>`
    : '';

  const activeTab = ['description', 'specifications', 'reviews', 'manufacturer'].includes(ctx.tab)
    ? ctx.tab : 'description';

  const descriptionPanel = `
    <p>${escapeHtml(model.description)}</p>
    ${model.specs.length ? `<h3>Features</h3><ul class="feature-list">${model.specs.map((s) => `<li><strong>${escapeHtml(s.label)}:</strong> ${escapeHtml(s.value)}</li>`).join('')}</ul>` : ''}
    ${model.categoryId === 'bikes'
      ? (model.sizeChart
        ? `<h3>Sizes</h3><table class="data-table"><caption>Indicative rider height for each frame size. Draft demo values.</caption>
            <thead><tr><th scope="col">Frame size</th><th scope="col">Rider height</th></tr></thead>
            <tbody>${model.sizeChart.map((r) => `<tr><th scope="row">${escapeHtml(r.frameSize)}</th><td>${r.minCm}&ndash;${r.maxCm} cm</td></tr>`).join('')}</tbody></table>`
        : `<h3>Sizes</h3><p class="notice notice-warn">This model has no height chart. We will not guess your size &mdash; choose a variant directly or contact us.</p>`)
      : (sizeOptions.length
        ? `<h3>Sizes</h3><p>Available in ${escapeHtml(sizeOptions.join(', '))}.</p>`
        : '')}`;

  const specificationsPanel = `
    <table class="data-table">
      <caption>Full available specification for ${escapeHtml(model.name)}. Demo data only.</caption>
      <tbody>${model.specs.map((s) => `<tr><th scope="row">${escapeHtml(s.label)}</th><td>${escapeHtml(s.value)}</td></tr>`).join('')}</tbody>
    </table>`;

  const rp = reviewPage(state, model.id, ctx.reviewPage || 1, 5);
  const reviewItems = rp.items.length
    ? rp.items.map((r) => `<li class="review-item">
        <div class="review-head">${stars(r.rating, r.rating + ' out of 5')}<time class="review-date">${escapeHtml(r.createdAt)}</time></div>
        <h3 class="review-title">${escapeHtml(r.title)}</h3>
        ${r.description ? `<p class="review-desc">${escapeHtml(r.description)}</p>` : ''}
        <p class="muted small">${escapeHtml(r.author || 'Demo customer')}</p>
      </li>`).join('')
    : '<li class="muted">No reviews yet. Be the first to review this model.</li>';
  const pagination = rp.pageCount > 1
    ? `<nav class="review-pagination" aria-label="Review pages">${Array.from({ length: rp.pageCount }, (_, i) => i + 1)
        .map((n) => `<button class="page-btn${n === rp.page ? ' is-active' : ''}" type="button" data-action="review-page" data-page="${n}" aria-current="${n === rp.page}">${n}</button>`).join('')}</nav>`
    : '';
  const reviewsPanel = `
    <div class="reviews-summary">
      <div class="reviews-score">
        ${stars(summary.average, summary.count === 0 ? 'No ratings yet' : summary.average + ' out of 5')}
        ${summary.count === 0 ? '<span class="rating-count">0 Ratings</span>' : `<span class="rating-count">(${summary.average.toFixed(1)}) - ${summary.count} Ratings</span>`}
      </div>
      <button class="btn btn-primary" type="button" data-action="open-review">Leave a review</button>
    </div>
    <ul class="review-list">${reviewItems}</ul>
    ${pagination}`;

  const manufacturerPanel = `
    <h3>${escapeHtml(model.brand)}</h3>
    <p>${escapeHtml(BRAND_PROFILES[model.brand] || 'A synthetic demonstration brand used in this prototype.')}</p>`;

  const tabs = [
    { id: 'description', label: 'Description', panel: descriptionPanel },
    { id: 'specifications', label: 'Specifications', panel: specificationsPanel },
    { id: 'reviews', label: 'Reviews', panel: reviewsPanel },
    { id: 'manufacturer', label: 'Manufacturer', panel: manufacturerPanel }
  ];
  const tabsBlock = `<section class="product-tabs">
    <div class="tab-list" role="tablist" aria-label="Product information">
      ${tabs.map((t) => `<button class="tab" role="tab" type="button" id="tab-btn-${t.id}" data-action="product-tab" data-tab="${t.id}" aria-selected="${activeTab === t.id}" aria-controls="tab-${t.id}">${escapeHtml(t.label)}${t.id === 'reviews' && summary.count ? ` (${summary.count})` : ''}</button>`).join('')}
    </div>
    <div class="tab-panels">
      ${tabs.map((t) => `<div class="tab-panel" id="tab-${t.id}" role="tabpanel" aria-labelledby="tab-btn-${t.id}"${activeTab === t.id ? '' : ' hidden'}>${t.panel}</div>`).join('')}
    </div>
  </section>`;

  return `
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="#catalog">Catalogue</a> / <a href="#catalog?category=${escapeHtml(model.categoryId)}">${escapeHtml(model.categoryId)}</a> / <span>${escapeHtml(model.name)}</span></nav>
    <article class="product-detail">
      <div class="product-detail-art">${gallery}</div>
      <div class="product-detail-info">
        <p class="product-brand">${escapeHtml(model.brand)}</p>
        <h1>${escapeHtml(model.name)}</h1>
        <p class="product-rating" data-model-rating>${stars(summary.average, summary.count === 0 ? 'No ratings yet' : summary.average + ' out of 5')} ${ratingText}</p>
        <div class="sku-select">
          <div class="field">
            <label for="p-colour">Colour</label>
            <select id="p-colour" data-action="select-colour">
              ${colourOptions.map((col) => `<option value="${escapeHtml(col)}"${selected && selected.colour === col ? ' selected' : ''}>${escapeHtml(col)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label for="p-size">${escapeHtml(sizeLabel)}</label>
            <select id="p-size" data-action="select-size">
              ${sizeOptions.map((sz) => `<option value="${escapeHtml(sz)}"${selectedSize === sz ? ' selected' : ''}>${escapeHtml(sz)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="price-stock-row">
          <p class="product-price-lg">${priceHtml(selected)} <span class="muted small">(GBP, VAT included)</span></p>
          ${stockText(seed, state, selected, context)}
        </div>
        ${ctx.skuNote ? `<p class="notice notice-info" role="status">${escapeHtml(ctx.skuNote)}</p>` : ''}
        <div class="buy-row">
          <button class="btn btn-primary" data-action="add-to-cart" data-sku="${escapeHtml(selected.id)}"${unavailable ? ' disabled aria-disabled="true"' : ''}>${iconCart()} Add to cart</button>
          <a class="btn" href="#cart">${iconCart()} Go to cart</a>
        </div>
        ${unavailable ? `<p class="inline-error" role="alert">Not available in this fulfilment context. Choose another store or delivery in the header.</p>` : ''}
        <p class="muted small">Add to cart adds one unit; change the quantity in your cart. Adding to the cart does not reserve stock, and your selection is kept between pages.</p>
      </div>
    </article>

    ${tabsBlock}
    ${relatedBlock}`;
}

// ---------------------------------------------------------------------------
// P-04 Cart
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// P-04/P-05 Cart and checkout (one unified view)
// ---------------------------------------------------------------------------

function checkoutFormDefaults() {
  return {
    contact: { name: '', email: '', phone: '' },
    address: { line1: '', line2: '', city: '', postcode: '', regionId: 'england' }
  };
}

export function cart(seed, state, params, ctx = {}) {
  const c = state.cart;
  if (!c.items.length) {
    return `<header class="page-head"><h1>Your cart</h1></header>
      <div class="empty-state"><p>Your cart is empty, so there is nothing to check out.</p><p><a class="btn btn-primary" href="#catalog">Browse the catalogue</a></p></div>`;
  }
  const form = ctx.form || checkoutFormDefaults();
  const rawErrors = ctx.errors || {};
  const errors = { ...rawErrors };
  // Normalise contact error keys so the view's contact.* lookups work.
  if (rawErrors.name) errors['contact.name'] = rawErrors.name;
  if (rawErrors.email) errors['contact.email'] = rawErrors.email;
  if (rawErrors.phone) errors['contact.phone'] = rawErrors.phone;
  const err = (k) => errors[k] ? `<p class="field-error" id="err-${k.replace(/\./g, '-')}" role="alert">${escapeHtml(errors[k])}</p>` : '';
  const aria = (k) => errors[k] ? ` aria-invalid="true" aria-describedby="err-${k.replace(/\./g, '-')}"` : '';

  const gate = checkoutGate(seed, state, c, form);
  const { totals, pricedTotals, isDelivery, shippingPending, shippingBlocked, blocked } = gate;
  const isCollection = !isDelivery;

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

  let reorderPreview = '';
  if (state.reorderDraft && state.reorderDraft.oldOrderId) {
    const changes = reorderChanges(seed, state, state.reorderDraft.oldOrderId);
    reorderPreview = `<div class="notice notice-warn"><strong>Reordering ${escapeHtml(state.reorderDraft.oldOrderId)}.</strong>
      The old order is cancelled and preserved. Prices and availability were re-checked; review the changes before placing the new order.
      ${changes.length ? `<ul>${changes.map((ch) => `<li>${escapeHtml(ch.name)}: ${ch.kind === 'price' ? 'price changed from ' + formatGBP(ch.from) + ' to ' + formatGBP(ch.to) : ch.kind === 'stock' ? 'only ' + ch.available + ' available (wanted ' + ch.wanted + ')' : 'no longer published / removed'}</li>`).join('')}</ul>` : '<p class="muted small">No price or availability changes.</p>'}
    </div>`;
  }

  const summary = `<aside class="panel checkout-summary" aria-label="Order summary">
    <h2>Order summary</h2>
    <ul class="summary-lines">
      ${totals.lines.map((l) => `<li><span>${escapeHtml(l.model ? l.model.name : 'Item')} &times; ${l.qty}</span><span>${formatGBP(l.lineGross)}</span></li>`).join('')}
    </ul>
    <dl>
      <dt>Subtotal</dt><dd>${formatGBP(pricedTotals.subtotalGross)}</dd>
      <dt>${isCollection ? 'Collection' : 'Delivery'}</dt><dd data-summary-delivery>${!isDelivery ? 'Pay in store' : (shippingPending ? 'Calculated at checkout' : (totals.shippingOk ? formatGBP(totals.shippingGross) : 'Not configured'))}</dd>
      <dt class="total" data-summary-total-label>${shippingPending ? 'Total before delivery (VAT included)' : 'Total (VAT included)'}</dt><dd class="total" data-summary-total>${formatGBP(pricedTotals.totalGross)}</dd>
    </dl>
    <p class="muted small">Includes <span data-summary-vat>${formatGBP(pricedTotals.vatGross)}</span> VAT (synthetic demo rates).${shippingPending ? ' Delivery cost is calculated from the address you enter; availability is already checked.' : ''}</p>
    <p class="action-row">
      <button class="btn btn-primary checkout-summary-submit" type="submit" form="checkout-form" data-checkout-submit${blocked ? ' disabled aria-disabled="true"' : ''}>Place order</button>
      <a class="btn btn-ghost" href="#catalog">Continue shopping</a>
    </p>
    <p class="muted small checkout-summary-link"><a href="#checkout">Proceed to checkout</a></p>
  </aside>`;

  const fulfilmentField = `<fieldset class="panel">
    <legend>Fulfilment</legend>
    <div class="radio-row">
      <label class="radio"><input type="radio" name="fulfilment" value="delivery"${!isCollection ? ' checked' : ''} data-action="checkout-fulfilment"> ${iconTruck()} Delivery to an address</label>
      <label class="radio"><input type="radio" name="fulfilment" value="collection"${isCollection ? ' checked' : ''} data-action="checkout-fulfilment"> ${iconStore()} Collect from a store (pay in store)</label>
    </div>
  </fieldset>`;

  const addressFields = `<div class="panel" ${isCollection ? 'hidden' : ''} data-address-fields>
    <h2>Delivery address</h2>
    ${err('address.line1')}
    <div class="field"><label for="co-line1">Address line 1</label><input id="co-line1" name="line1" autocomplete="address-line1" value="${escapeHtml(form.address.line1 || '')}"${aria('address.line1')}></div>
    ${err('address.line2')}
    <div class="field"><label for="co-line2">Address line 2 (optional)</label><input id="co-line2" name="line2" autocomplete="address-line2" value="${escapeHtml(form.address.line2 || '')}"></div>
    ${err('address.city')}
    <div class="field"><label for="co-city">Town or city</label><input id="co-city" name="city" autocomplete="address-level2" value="${escapeHtml(form.address.city || '')}"${aria('address.city')}></div>
    ${err('address.postcode')}
    <div class="field"><label for="co-postcode">Postcode</label><input id="co-postcode" name="postcode" autocomplete="postal-code" value="${escapeHtml(form.address.postcode || '')}"${aria('address.postcode')}></div>
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
    <header class="page-head"><h1>Your cart and checkout</h1>
      <p class="muted">Guest checkout &mdash; no account needed. Fulfilment context: <strong>${escapeHtml(contextLabel(seed, c.context))}</strong>; change it in the header and unavailable rows are kept with a warning.</p>
    </header>
    ${reorderPreview}
    <div class="cart-layout">
      <div class="cart-rows">
        <table class="cart-table">
          <thead><tr><th scope="col">Product</th><th scope="col">Price</th><th scope="col">Quantity</th><th scope="col">Total</th><th scope="col">Remove</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        ${!totals.allAvailable ? `<p class="notice notice-warn" role="alert">Some items are not available in the chosen fulfilment context. Checkout is blocked until every row is available.</p>` : ''}
        <p class="notice notice-warn" role="alert" data-shipping-warning${shippingBlocked ? '' : ' hidden'}>${shippingBlocked ? 'Delivery cannot be priced for this address. Choose another address or a store for collection.' : ''}</p>
      </div>
      ${summary}
      <div class="checkout-main">
        <form class="checkout-form" id="checkout-form" data-checkout-form novalidate tabindex="-1">
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
          <button class="visually-hidden" type="submit" tabindex="-1" data-checkout-submit${blocked ? ' disabled aria-disabled="true"' : ''}>Place order</button>
          <p class="muted small">Delivery creates a pending order and opens a clearly labelled payment simulator. Collection is confirmed and unpaid, to pay in store.</p>
        </form>
      </div>
    </div>
    <div class="checkout-submit-fixed"><button class="btn btn-primary btn-lg" type="submit" form="checkout-form" data-action="place-order" data-checkout-submit${blocked ? ' disabled aria-disabled="true"' : ''}>Place order</button></div>`;
}

// #checkout is a compatible alias of the unified cart/checkout view: the same
// single form, the same reorder semantics and the same business checks.
export function checkout(seed, state, params, ctx = {}) {
  return cart(seed, state, params, ctx);
}

// ---------------------------------------------------------------------------
// Wishlist and account (demo persona surfaces)
// ---------------------------------------------------------------------------

function wishlistCard(seed, state, model) {
  const summary = modelPriceSummary(seed, state, model, state.cart.context);
  return `<div class="product-card wishlist-card">
    <a class="product-art" href="#product/${escapeHtml(model.id)}">${modelArt(model, summary.chosenSku ? summary.chosenSku.colour : null)}</a>
    <div class="product-meta">
      <p class="product-brand">${escapeHtml(model.brand)}</p>
      <h3><a href="#product/${escapeHtml(model.id)}">${escapeHtml(model.name)}</a></h3>
      <p class="product-price">From ${priceHtml(summary.chosenSku)}</p>
      <button class="btn btn-ghost wishlist-remove" type="button" data-action="wishlist-remove" data-model="${escapeHtml(model.id)}">${iconHeart()} Remove</button>
    </div>
  </div>`;
}

// Shared two-step email access flow, used by both the wishlist dialog and the
// #sign-in page so there is a single demonstration access system. Requesting
// access (or clicking a provider) never grants anything on its own.
function authFlow(state, ctx = {}) {
  const mode = ctx.mode === 'register' ? 'register' : 'login';
  const stage = ctx.stage || 'email';
  const provider = ctx.provider || null;
  if (stage === 'provider') {
    return `<div class="notice notice-demo" role="status">Mock ${escapeHtml(provider)} sign-in. No external request is made and no access is granted until you press confirm.</div>
      <p><button class="btn btn-primary" type="button" data-action="auth-provider-confirm" data-provider="${escapeHtml(provider)}" data-auth-autofocus>Confirm demo ${escapeHtml(provider)} sign-in</button></p>
      <p><button class="link" type="button" data-action="auth-back">Back</button></p>`;
  }
  if (stage === 'confirm') {
    return `<div class="notice notice-info" role="status">
        <strong>Check your email (demo).</strong>
        <p>A demo confirmation is ready for ${escapeHtml(ctx.pendingEmail || 'your address')}. Nothing was really sent.</p>
      </div>
      <p><button class="btn btn-primary" type="button" data-action="auth-confirm-email" data-auth-autofocus>Confirm demo email</button></p>
      <p><button class="link" type="button" data-action="auth-back">Use a different address</button></p>
      <p class="muted small">Entering an email or requesting a link does not grant access on its own; only this explicit confirmation does.</p>`;
  }
  return `<div class="auth-tabs" role="tablist" aria-label="Account mode">
      <button class="auth-tab" type="button" role="tab" data-action="auth-mode" data-mode="login" aria-selected="${mode === 'login'}">Sign in</button>
      <button class="auth-tab" type="button" role="tab" data-action="auth-mode" data-mode="register" aria-selected="${mode === 'register'}">Create account</button>
    </div>
    <form data-auth-form data-mode="${mode}">
      <div class="field"><label for="auth-email">Email address</label><input id="auth-email" name="email" type="email" autocomplete="email" required data-auth-autofocus></div>
      ${mode === 'register' ? `<div class="field"><label for="auth-name">Your name</label><input id="auth-name" name="name" autocomplete="name"></div>` : ''}
      <p><button class="btn btn-primary" type="submit">${mode === 'register' ? 'Create account' : 'Continue with email'}</button></p>
    </form>
    <div class="auth-divider">or</div>
    <div class="provider-row">
      <button class="provider-btn" type="button" data-action="auth-provider" data-provider="Google"><span class="provider-mark" aria-hidden="true">G</span> Continue with Google</button>
      <button class="provider-btn" type="button" data-action="auth-provider" data-provider="Apple"><span class="provider-mark" aria-hidden="true">A</span> Continue with Apple</button>
    </div>
    <p class="muted small">Google and Apple here are demonstrations only. Clicking them does not sign you in by itself.</p>`;
}

export function wishlist(seed, state, params, ctx = {}) {
  if (!isSignedIn(state)) {
    return `<header class="page-head"><h1>Wishlist</h1></header>
      <div class="empty-state">
        <h2>Sign in to use your wishlist</h2>
        <p class="muted">Saved models live in your account. This prototype uses one demonstration persona and no real account exists.</p>
        <p><a class="btn btn-primary" href="#sign-in">Sign in or create an account</a> <a class="btn btn-ghost" href="#catalog">Browse the catalogue</a></p>
      </div>`;
  }
  const models = wishlistModels(seed, state);
  return `
    <header class="page-head"><h1>Your wishlist</h1>
      <p class="muted">Saved models for ${escapeHtml(state.customer.name || state.customer.email || 'this demo account')}. Saving a model is not a reservation and does not guarantee availability.</p>
    </header>
    ${models.length
      ? `<div class="grid grid-products wishlist-grid">${models.map((m) => wishlistCard(seed, state, m)).join('')}</div>`
      : `<div class="empty-state"><p>Your wishlist is empty.</p><p><a class="btn btn-primary" href="#catalog">Browse the catalogue</a></p></div>`}`;
}

export function account(seed, state, params, ctx = {}) {
  const signedIn = isSignedIn(state);
  const saved = wishlistModelIds(state).length;
  return `
    <header class="page-head"><h1>Your account</h1></header>
    <section class="panel account-panel">
      ${signedIn
        ? `<div class="account-head">
            <div><h2>${escapeHtml(state.customer.name || 'Demo customer')}</h2><p class="muted">${escapeHtml(state.customer.email || '')}</p></div>
            <button class="btn" type="button" data-action="sign-out">Sign out</button>
          </div>
          <ul class="account-links">
            <li><a href="#wishlist">Wishlist (${saved} saved model${saved === 1 ? '' : 's'})</a></li>
            <li><a href="#orders">My orders</a></li>
          </ul>
          <p class="muted small">One demonstration persona. No real authentication, OAuth, email or account data exists.</p>`
        : `<h2>Sign in or create an account</h2>
          <p class="muted">Email only &mdash; no password. Google and Apple are clearly labelled demonstrations.</p>
          <p><a class="btn btn-primary" href="#sign-in">Sign in</a>
             <a class="btn" href="#sign-in?mode=register">Create account</a></p>
          <p class="muted small">A signed-out visitor cannot view a saved wishlist.</p>`}
    </section>`;
}

export function authDialog(seed, state, params, ctx = {}) {
  const mode = ctx.mode === 'register' ? 'register' : 'login';
  return `<dialog class="auth-dialog" id="auth-dialog" aria-labelledby="auth-title">
    <div class="auth-body">
      <button class="btn btn-ghost auth-close" type="button" data-action="auth-close" aria-label="Close">${iconClose()}</button>
      <h2 id="auth-title">${mode === 'register' ? 'Create your account' : 'Sign in'}</h2>
      <p class="muted small">Demo account for the wishlist. No password, no real email is sent, and Google/Apple are simulated.</p>
      ${authFlow(state, ctx)}
    </div>
  </dialog>`;
}

// Wishlist success popup. Shown only AFTER a real save (including a save that
// completes after a guest signs in). Russian copy is intentional and exact.
export function wishlistDialog(seed, state, params, ctx = {}) {
  const model = getModel(seed, ctx.modelId);
  return `<dialog class="wishlist-dialog" id="wishlist-dialog" aria-labelledby="wishlist-dialog-title">
    <div class="auth-body">
      <button class="btn btn-ghost auth-close" type="button" data-action="wishlist-dialog-close" aria-label="Закрыть">${iconClose()}</button>
      <h2 id="wishlist-dialog-title">Товар добавлен в избранное</h2>
      ${model ? `<p class="muted small">${escapeHtml(model.brand)} &mdash; ${escapeHtml(model.name)}</p>` : ''}
      <div class="wishlist-dialog-actions">
        <button class="btn btn-primary" type="button" data-action="wishlist-go">перейти в избранное</button>
        <button class="btn" type="button" data-action="wishlist-continue">продолжить покупки</button>
      </div>
    </div>
  </dialog>`;
}

// Accessible large-image viewer for a product gallery.
export function galleryDialog(seed, state, params, ctx = {}) {
  const model = getModel(seed, ctx.modelId);
  if (!model) return '';
  const skus = skusForModel(seed, model.id).filter((s) => s.published);
  const selected = skus.find((s) => s.id === ctx.selectedSkuId) || skus[0];
  const views = galleryViews(model, selected ? selected.colour : null);
  const idx = Math.min(Math.max(0, Number(ctx.index) || 0), views.length - 1);
  const multi = views.length > 1;
  return `<dialog class="gallery-dialog" id="gallery-dialog" aria-label="${escapeHtml(model.name)} images">
    <div class="gallery-dialog-body">
      <button class="btn btn-ghost gallery-close" type="button" data-action="gallery-close" aria-label="Close">${iconClose()}</button>
      <div class="gallery-stage">${views[idx].svg}</div>
      ${multi ? `<div class="gallery-dialog-controls">
        <button class="btn" type="button" data-action="gallery-prev" aria-label="Previous image">${iconChevron('left')}</button>
        <span class="gallery-counter">${idx + 1} / ${views.length}</span>
        <button class="btn" type="button" data-action="gallery-next" aria-label="Next image">${iconChevron('right')}</button>
      </div>` : ''}
    </div>
  </dialog>`;
}

// Review submission dialog. A guest gets a sign-in path; a signed-in customer
// gets the form. An invalid submission keeps the dialog open with a message and
// preserves the typed draft.
export function reviewDialog(seed, state, params, ctx = {}) {
  const model = getModel(seed, ctx.modelId);
  if (!model) return '';
  const signedIn = isSignedIn(state);
  const body = signedIn
    ? `<form data-review-form data-model="${escapeHtml(model.id)}">
        ${ctx.error ? `<p class="notice notice-warn" role="alert">${escapeHtml(ctx.error)}</p>` : ''}
        <div class="field"><label for="rev-rating">Rating (1&ndash;5)</label>
          <select id="rev-rating" name="rating">
            ${[5, 4, 3, 2, 1].map((n) => `<option value="${n}"${String(ctx.rating == null ? '' : ctx.rating) === String(n) ? ' selected' : ''}>${n} star${n === 1 ? '' : 's'}</option>`).join('')}
          </select></div>
        <div class="field"><label for="rev-title">Review title</label><input id="rev-title" name="title" value="${escapeHtml(ctx.title || '')}"></div>
        <div class="field"><label for="rev-desc">Review description (optional)</label><textarea id="rev-desc" name="description" rows="3">${escapeHtml(ctx.description || '')}</textarea></div>
        <p><button class="btn btn-primary" type="submit">Submit review</button></p>
      </form>`
    : `<div class="notice notice-info" role="status">Sign in to write a review. Any signed-in demo customer may review; buying the model is not required.</div>
      <p><button class="btn btn-primary" type="button" data-action="open-auth" data-mode="login" data-review-auth="1">Sign in to review</button></p>`;
  return `<dialog class="review-dialog" id="review-dialog" aria-labelledby="review-heading">
    <div class="auth-body">
      <button class="btn btn-ghost auth-close" type="button" data-action="review-close" aria-label="Close">${iconClose()}</button>
      <h2 id="review-heading">Leave a review</h2>
      <p class="muted small">About ${escapeHtml(model.name)}. Demo only &mdash; no real review system.</p>
      ${body}
    </div>
  </dialog>`;
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
    <header class="page-head"><h1>Sign in or create an account</h1>
      <p class="muted">Email only &mdash; no password. This is the same demonstration flow used by the wishlist dialog; no separate access system exists.</p></header>
    <section class="panel account-panel">
      ${authFlow(state, ctx)}
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
