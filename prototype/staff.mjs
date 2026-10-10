// Staff / back-office views (S-01..S-10) as HTML strings.
// The demo role switcher is a viewing tool, NOT authentication.
import {
  escapeHtml, formatGBP, getModel, getSku, getLocation, skusForModel,
  reservationActive, refundSaysMoneyReturned, canAccessStaff,
  physicalBalance, reservedQuantity, londonDateTimeString
} from './domain.mjs';
import { productSvg } from './assets.mjs';

function stateBadge(label, value, kind) {
  return `<span class="state-badge state-${escapeHtml(kind)}"><span class="state-label">${escapeHtml(label)}</span> ${escapeHtml(value)}</span>`;
}

function roleLabel(role) {
  if (role === 'manager') return 'Manager (demo)';
  if (role === 'admin') return 'Network Administrator (demo)';
  return 'Not signed in';
}

// ---------------------------------------------------------------------------
// S-01 Staff sign-in
// ---------------------------------------------------------------------------

export function staffSignIn(seed, state, params, ctx = {}) {
  const role = state.staff.role;
  return `
    <header class="page-head"><h1>Staff sign-in</h1></header>
    <section class="panel">
      <p class="notice notice-demo" role="note"><strong>Demo role switch, not authentication.</strong> No real credentials are checked and no real security is provided.</p>
      <form data-staff-signin-form class="stack" novalidate>
        <div class="field"><label for="si-email">Work email</label><input id="si-email" type="email" value="manager@pedal-and-field.example" autocomplete="username"></div>
        <div class="field"><label for="si-password">Password</label><input id="si-password" type="password" value="demo" autocomplete="current-password"></div>
        <fieldset class="panel">
          <legend>Second factor (open proposal)</legend>
          <p class="muted small">Required in production. The type is not selected (UX-05). This prototype makes no TOTP or code-length assumption.</p>
          <div class="field">
            <label for="si-2fa">Second-factor method</label>
            <select id="si-2fa" disabled aria-describedby="si-2fa-note">
              <option>Not selected &mdash; open proposal</option>
            </select>
            <p id="si-2fa-note" class="muted small">A second factor is required; the method and recovery are undecided.</p>
          </div>
        </fieldset>
        <div class="field">
          <label for="si-role">Demo role to preview</label>
          <select id="si-role" name="role">
            <option value="manager"${role === 'manager' ? ' selected' : ''}>Manager &mdash; network orders, inventory, content/curations</option>
            <option value="admin"${role === 'admin' ? ' selected' : ''}>Network Administrator &mdash; full network</option>
          </select>
        </div>
        <p><button class="btn btn-primary" type="submit">Enter back office (demo)</button></p>
      </form>
      <p>Current demo role: <strong>${escapeHtml(roleLabel(role))}</strong>.</p>
      ${role ? `<p><button class="btn btn-ghost" data-action="staff-signout">Leave back office</button></p>` : ''}
      ${ctx.flash ? `<p class="notice notice-info" role="status">${escapeHtml(ctx.flash)}</p>` : ''}
      <p class="muted small">Access is granted by the owner in production (UX-05); password reset is by email and is not a second factor.</p>
    </section>`;
}

// ---------------------------------------------------------------------------
// S-02 Network orders
// ---------------------------------------------------------------------------

export function staffOrders(seed, state, params, ctx = {}) {
  const orders = Object.values(state.orders).sort((a, b) => b.createdAt - a.createdAt);
  return `
    <header class="page-head"><h1>Network orders</h1>
      <p class="muted">All stores, not just one. Signed in as ${escapeHtml(roleLabel(state.staff.role))}.</p></header>
    <section class="panel">
      <form class="filter-row" data-staff-orders-filter>
        <div class="finder-field"><label for="so-state">Filter by order state</label>
          <select id="so-state" name="orderState">
            <option value="">All</option>
            <option value="pending">pending</option>
            <option value="confirmed">confirmed</option>
            <option value="cancelled">cancelled</option>
            <option value="completed">completed</option>
          </select>
        </div>
      </form>
      ${orders.length ? `<table class="data-table">
        <thead><tr><th scope="col">Order</th><th scope="col">Created</th><th scope="col">Fulfilment</th><th scope="col">Total</th><th scope="col">States</th></tr></thead>
        <tbody>${orders.map((o) => `<tr>
          <td><a href="#staff/order/${escapeHtml(o.id)}">${escapeHtml(o.id)}</a></td>
          <td>${escapeHtml(londonDateTimeString(o.createdAt))}</td>
          <td>${o.fulfilment.type === 'collection' ? 'Collection - ' + escapeHtml(o.fulfilment.storeName) : 'Delivery'}</td>
          <td>${formatGBP(o.totalGross)}</td>
          <td><div class="state-row state-row-compact">${stateBadge('Order', o.orderState, o.orderState)}${stateBadge('Payment', o.paymentState, o.paymentState)}${stateBadge('Fulfilment', o.fulfilmentState, o.fulfilmentState)}</div></td>
        </tr>`).join('')}</tbody>
      </table>` : '<p class="muted">No demo orders yet. Create one from the storefront.</p>'}
    </section>`;
}

// ---------------------------------------------------------------------------
// S-03 Process an order
// ---------------------------------------------------------------------------

export function staffOrder(seed, state, params, ctx = {}) {
  const order = state.orders[params.orderId];
  if (!order) {
    return `<div class="empty-state"><h1>Order not found</h1><p><a class="btn" href="#staff/orders">Back to orders</a></p></div>`;
  }
  const isCollection = order.fulfilment.type === 'collection';
  const refund = order.refundId ? state.refunds[order.refundId] : null;

  const lines = order.lines.map((l) => `<tr>
    <td>${escapeHtml(l.name)}</td><td>${escapeHtml([l.colour, l.size || l.frameSize].filter(Boolean).join(' / '))}</td>
    <td>${escapeHtml(l.skuCode)}</td><td>${l.qty}</td><td>${formatGBP(l.unitPriceGross)}</td></tr>`).join('');

  let ops = '';

  if (isCollection) {
    ops += `<section class="panel"><h2>Collection operations</h2>`;
    ops += `<p>Ready: ${order.readyAt ? 'yes' : 'no'}${order.collectionDeadline ? ` &middot; collect by ${escapeHtml(londonDateTimeString(order.collectionDeadline))} (Europe/London)` : ''}${order.collectionExtended ? ' &middot; extended once' : ''}.</p>`;
    if (order.orderState === 'cancelled') {
      ops += `<p class="notice notice-warn">This collection order is cancelled${order.cancelledReason ? ' (' + escapeHtml(order.cancelledReason) + ')' : ''}. No payment or handover actions are available.</p>`;
    } else if (order.orderState === 'completed') {
      ops += `<p class="notice notice-success">Collected and completed${order.collectedAt ? ' on ' + escapeHtml(londonDateTimeString(order.collectedAt)) : ''}. Payment and handover are already recorded.</p>`;
    } else {
      if (!order.readyAt) {
        ops += `<p><button class="btn" data-action="mark-ready" data-order="${escapeHtml(order.id)}">Mark ready for collection</button></p>`;
      } else if (!order.collectionExtended) {
        ops += `<p><button class="btn" data-action="extend-collection" data-order="${escapeHtml(order.id)}">Extend once by up to 3 days</button> <span class="muted small">Only before expiry; repeat is rejected.</span></p>`;
      }
      if (order.paymentState !== 'paid') {
        ops += `<form class="stack" data-collection-payment-form data-order="${escapeHtml(order.id)}">
          <h3>Record full payment (separate from handover)</h3>
          <div class="field"><label for="cp-amount">Amount (GBP)</label><input id="cp-amount" name="amount" type="number" step="0.01" min="0" value="${(order.totalGross / 100).toFixed(2)}"></div>
          <div class="field"><label for="cp-method">Method</label><select id="cp-method" name="method"><option>card in store</option><option>cash in store</option></select></div>
          <p><button class="btn" type="submit">Record payment</button> <span class="muted small">A short amount cannot mark the order paid.</span></p>
        </form>`;
      } else {
        ops += `<p class="notice notice-info">Full payment of ${formatGBP(order.paymentRecord ? order.paymentRecord.amountGross : order.totalGross)} recorded${order.paymentRecord ? ' (' + escapeHtml(order.paymentRecord.method) + ')' : ''}. Handover is a separate step.</p>`;
      }
      if (order.fulfilmentState === 'ready' && order.paymentState === 'paid') {
        ops += `<form class="stack" data-collect-form data-order="${escapeHtml(order.id)}">
          <h3>Handover</h3>
          <label class="checkbox"><input type="checkbox" name="codeVerified"> Demo: collection code verified (placeholder &mdash; format is an open proposal)</label>
          <p><button class="btn btn-primary" type="submit">Confirm collection</button> <span class="muted small">Requires ready + full recorded payment + code check.</span></p>
        </form>`;
      } else if (order.paymentState === 'paid') {
        ops += `<p class="muted small">Handover becomes available once the order is marked ready.</p>`;
      } else {
        ops += `<p class="muted small">Record full payment and mark the order ready before handover.</p>`;
      }
    }
    ops += `</section>`;
  } else {
    ops += `<section class="panel"><h2>Delivery operations</h2>`;
    if (order.orderState === 'confirmed' && order.fulfilmentState === 'unfulfilled') {
      ops += `<form class="stack" data-dispatch-form data-order="${escapeHtml(order.id)}">
        <h3>Register dispatch</h3>
        <div class="field"><label for="dp-carrier">Carrier</label><input id="dp-carrier" name="carrier" required></div>
        <div class="field"><label for="dp-date">Dispatch date</label><input id="dp-date" name="date" type="date" required></div>
        <div class="field"><label for="dp-tracking">Tracking number (optional)</label><input id="dp-tracking" name="tracking"></div>
        <p><button class="btn" type="submit">Register dispatch</button></p>
      </form>`;
    }
    if (order.fulfilmentState === 'dispatched') {
      ops += `<form class="stack" data-deliver-form data-order="${escapeHtml(order.id)}">
        <h3>Confirm delivery</h3>
        <p class="muted small">Dispatch alone is not delivery. Record the carrier evidence you actually have.</p>
        <div class="field"><label for="dl-evidence">Delivery evidence (carrier confirmation reference)</label><input id="dl-evidence" name="evidence" required></div>
        <p><button class="btn btn-primary" type="submit">Confirm delivered</button></p>
      </form>`;
    }
    if (order.fulfilmentState === 'delivered') {
      ops += `<p class="notice notice-success">Delivered and completed. Evidence: ${escapeHtml(order.deliveryEvidence || '')}.</p>`;
    }
    ops += `</section>`;
  }

  let cancellationBlock = '';
  if (order.cancellationRequested) {
    cancellationBlock = `<section class="panel"><h2>Cancellation request</h2>
      <p>A cancellation was requested (${escapeHtml(order.cancellationReason || '')}). A request is not an accepted cancellation and does not prove a refund.</p>
      <p><button class="btn" data-action="accept-cancellation" data-order="${escapeHtml(order.id)}">Accept cancellation</button></p>
      <p class="muted small">Accepting cancels and preserves the order. A refund is initiated only if money was actually received; money and stock stay separate.</p></section>`;
  }

  let refundBlock = '';
  if (refund) {
    refundBlock = `<section class="panel"><h2>Refund (money, separate from stock)</h2>
      <p>Amount ${formatGBP(refund.amountGross)} &mdash; state <strong>${escapeHtml(refund.state)}</strong>.</p>
      <p class="muted small">${refundSaysMoneyReturned(refund) ? 'Provider confirmed.' : 'Pending/failed is never described as money returned.'} Refunds do not restock.</p>
      ${refund.state === 'pending' ? `<p>
        <button class="btn" data-action="resolve-refund" data-refund="${escapeHtml(refund.id)}" data-outcome="succeeded">Mark succeeded</button>
        <button class="btn btn-ghost" data-action="resolve-refund" data-refund="${escapeHtml(refund.id)}" data-outcome="failed">Mark failed</button></p>` : ''}
    </section>`;
  }

  return `
    <nav class="breadcrumb"><a href="#staff/orders">Orders</a> / <span>${escapeHtml(order.id)}</span></nav>
    <header class="page-head"><h1>Order ${escapeHtml(order.id)}</h1>
      <div class="state-row">${stateBadge('Order', order.orderState, order.orderState)}${stateBadge('Payment', order.paymentState, order.paymentState)}${stateBadge('Fulfilment', order.fulfilmentState, order.fulfilmentState)}</div>
    </header>
    <section class="panel"><h2>Customer and fulfilment</h2>
      <p>${escapeHtml(order.contact.name)} &middot; ${escapeHtml(order.contact.email)} &middot; ${escapeHtml(order.contact.phone)}</p>
      <p>${isCollection ? 'Collection at ' + escapeHtml(order.fulfilment.storeName) : 'Delivery to ' + escapeHtml(order.fulfilment.address.line1 + ', ' + order.fulfilment.address.city + ', ' + order.fulfilment.address.postcode)}</p>
      ${order.shipment ? `<p>Carrier ${escapeHtml(order.shipment.carrier)} &middot; ${escapeHtml(order.shipment.date)}${order.shipment.tracking ? ' &middot; ' + escapeHtml(order.shipment.tracking) : ' &middot; no tracking'}</p>` : ''}
      <form class="inline-form" data-email-correction-form data-order="${escapeHtml(order.id)}">
        <label for="ec-email">Correct email (staff, after ownership check)</label>
        <input id="ec-email" name="email" type="email" value="${escapeHtml(order.contact.email)}">
        <button class="btn" type="submit">Update email</button>
      </form>
      <p class="muted small">Ownership-check procedure is an open proposal (UX-07). This does not grant access to any account.</p>
    </section>
    <section class="panel"><h2>Items</h2>
      <div class="table-scroll">
        <table class="data-table"><thead><tr><th scope="col">Item</th><th scope="col">Variant</th><th scope="col">SKU</th><th scope="col">Qty</th><th scope="col">Unit</th></tr></thead>
        <tbody>${lines}</tbody></table>
      </div>
      <dl class="totals"><dt>Subtotal</dt><dd>${formatGBP(order.subtotalGross)}</dd><dt>${isCollection ? 'Collection' : 'Delivery'}</dt><dd>${formatGBP(order.shippingGross)}</dd><dt class="total">Total</dt><dd class="total">${formatGBP(order.totalGross)}</dd></dl>
    </section>
    ${ops}
    ${cancellationBlock}
    ${refundBlock}
    <section class="panel"><h2>Email diagnostics</h2>
      <p class="muted small">E samples created vs confirmed; code placeholder, deadline, extension, dispatch, delivery and refund are kept truthful. See <a href="#emails">Email samples</a>.</p>
      ${state.emails.length ? `<ul>${state.emails.slice(-6).map((e) => `<li>${escapeHtml(e.subject)} &mdash; ${escapeHtml(e.kind || '')}</li>`).join('')}</ul>` : '<p class="muted">No emails logged.</p>'}
    </section>`;
}

// ---------------------------------------------------------------------------
// S-04 Returns / refunds
// ---------------------------------------------------------------------------

export function staffReturns(seed, state, params, ctx = {}) {
  const orders = Object.values(state.orders);
  const relevant = orders.filter((o) => o.orderState === 'completed' || o.orderState === 'cancelled' || o.refundId || o.cancellationRequested);
  return `
    <header class="page-head"><h1>Returns and refunds</h1>
      <p class="muted">Money and stock are separate operations. A refund never restocks; a restock never implies a refund.</p></header>
    <section class="panel">
      ${relevant.length ? relevant.map((o) => {
        const refund = o.refundId ? state.refunds[o.refundId] : null;
        return `<article class="return-card">
          <h2>${escapeHtml(o.id)} <span class="muted small">${o.fulfilment.type}</span></h2>
          <div class="two-col">
            <div>
              <h3>Money</h3>
              ${refund ? `<p>Refund ${formatGBP(refund.amountGross)} &mdash; <strong>${escapeHtml(refund.state)}</strong>. ${refundSaysMoneyReturned(refund) ? 'Confirmed.' : 'Not returned yet.'}</p>` : '<p class="muted">No refund requested.</p>'}
              ${!refund && o.cancellationRequested ? `<p><button class="btn" data-action="accept-cancellation" data-order="${escapeHtml(o.id)}">Accept cancellation</button></p><p class="muted small">Refund only if money was received.</p>` : ''}
              ${!refund && !o.cancellationRequested && o.paymentState === 'paid' ? `<p><button class="btn" data-action="request-refund" data-order="${escapeHtml(o.id)}">Initiate refund</button></p>` : ''}
              ${refund && refund.state === 'pending' ? `<p><button class="btn" data-action="resolve-refund" data-refund="${escapeHtml(refund.id)}" data-outcome="succeeded">Mark succeeded</button> <button class="btn btn-ghost" data-action="resolve-refund" data-refund="${escapeHtml(refund.id)}" data-outcome="failed">Mark failed</button></p>` : ''}
            </div>
            <div>
              <h3>Stock acceptance</h3>
              <form class="stack" data-return-form data-order="${escapeHtml(o.id)}">
                <div class="field"><label for="ret-line-${escapeHtml(o.id)}">Line</label>
                  <select id="ret-line-${escapeHtml(o.id)}" name="skuId">${o.lines.map((l) => `<option value="${escapeHtml(l.skuId)}" data-max="${l.qty}">${escapeHtml(l.name)} (${escapeHtml(l.skuCode)}) bought ${l.qty}</option>`).join('')}</select>
                </div>
                <div class="field"><label for="ret-qty-${escapeHtml(o.id)}">Quantity to accept</label><input id="ret-qty-${escapeHtml(o.id)}" name="qty" type="number" min="1" step="1" value="1"></div>
                <label class="checkbox"><input type="checkbox" name="restock" checked> Restock into the saved location</label>
                <p><button class="btn" type="submit">Accept return</button></p>
              </form>
              <p class="muted small">Cannot exceed the purchased quantity minus already accepted, and only the saved location.</p>
            </div>
          </div>
        </article>`;
      }).join('') : '<p class="muted">No orders require returns or refunds yet.</p>'}
    </section>`;
}

// ---------------------------------------------------------------------------
// S-05 Inventory / physical sale / correction
// ---------------------------------------------------------------------------

export function staffInventory(seed, state, params, ctx = {}) {
  const rows = state.balances
    .map((b) => ({ ...b, physical: b.qty, reserved: reservedQuantity(state, b.skuId, b.locationId) }))
    .filter((b) => b.physical !== 0 || b.reserved !== 0);
  return `
    <header class="page-head"><h1>Inventory</h1><p class="muted">SKU &times; location. Adjustments protect reserved amounts.</p></header>
    <section class="panel">
      <table class="data-table"><thead><tr><th scope="col">SKU</th><th scope="col">Location</th><th scope="col">Physical</th><th scope="col">Reserved</th><th scope="col">Available</th></tr></thead>
      <tbody>${rows.map((b) => {
        const sku = getSku(seed, b.skuId); const loc = getLocation(seed, b.locationId);
        return `<tr><td>${escapeHtml(sku ? sku.skuCode : b.skuId)}</td><td>${escapeHtml(loc ? loc.name : b.locationId)}</td><td>${b.physical}</td><td>${b.reserved}</td><td>${b.physical - b.reserved}</td></tr>`;
      }).join('')}</tbody></table>
    </section>
    <section class="panel">
      <h2>Record a sale or correction</h2>
      <form class="stack" data-stock-form>
        <div class="field"><label for="st-sku">SKU</label>
          <select id="st-sku" name="skuId">${seed.skus.filter((s) => s.published).map((s) => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.skuCode)} &mdash; ${escapeHtml(getModel(seed, s.modelId).name)}</option>`).join('')}</select>
        </div>
        <div class="field"><label for="st-loc">Location</label>
          <select id="st-loc" name="locationId">${seed.stockLocations.map((l) => `<option value="${escapeHtml(l.id)}">${escapeHtml(l.name)}</option>`).join('')}</select>
        </div>
        <div class="field"><label for="st-delta">Change (negative for a sale)</label><input id="st-delta" name="delta" type="number" step="1" value="-1"></div>
        <div class="field"><label for="st-reason">Reason</label><input id="st-reason" name="reason" value="in-store sale"></div>
        <p><button class="btn btn-primary" type="submit">Apply</button></p>
      </form>
      <p class="muted small">A change that would drop the physical count below the reserved amount is rejected, not silently clamped.</p>
    </section>`;
}

// ---------------------------------------------------------------------------
// S-06 Catalogue
// ---------------------------------------------------------------------------

export function staffProducts(seed, state, params, ctx = {}) {
  return `
    <header class="page-head"><h1>Catalogue</h1><p class="muted">Network Administrator only. Manual publishing, no bulk import (UX-13).</p></header>
    <section class="panel">
      <table class="data-table"><thead><tr><th scope="col">Model</th><th scope="col">Brand</th><th scope="col">Category</th><th scope="col">Published</th><th scope="col">SKUs</th><th scope="col">Edit</th></tr></thead>
      <tbody>${seed.models.map((m) => `<tr>
        <td>${escapeHtml(m.name)}</td><td>${escapeHtml(m.brand)}</td><td>${escapeHtml(m.categoryId)}</td>
        <td>${m.published ? 'yes' : 'no'}</td><td>${skusForModel(seed, m.id).length}</td>
        <td><a href="#staff/product/${escapeHtml(m.id)}">Edit</a></td></tr>`).join('')}</tbody></table>
    </section>`;
}

// ---------------------------------------------------------------------------
// S-07 Model / SKU editor
// ---------------------------------------------------------------------------

export function staffProduct(seed, state, params, ctx = {}) {
  const model = getModel(seed, params.id);
  if (!model) return `<div class="empty-state"><h1>Model not found</h1><p><a class="btn" href="#staff/products">Back</a></p></div>`;
  const skus = skusForModel(seed, model.id);
  return `
    <nav class="breadcrumb"><a href="#staff/products">Catalogue</a> / <span>${escapeHtml(model.name)}</span></nav>
    <header class="page-head"><h1>Edit ${escapeHtml(model.name)}</h1><p class="muted">Draft editor. Prices apply to the storefront; existing order snapshots are never rewritten.</p></header>
    <section class="panel"><h2>SKU prices</h2>
      ${skus.map((s) => `<form class="inline-form" data-sku-price-form data-sku="${escapeHtml(s.id)}">
        <span class="sku-label">${escapeHtml(s.skuCode)} (${escapeHtml(s.colour)}${s.frameSize ? ' / ' + escapeHtml(s.frameSize) : s.size ? ' / ' + escapeHtml(s.size) : ''})</span>
        <label>Price &pound;<input name="price" type="number" step="0.01" min="0" value="${(s.priceGross / 100).toFixed(2)}"></label>
        <label>Regular &pound;<input name="regular" type="number" step="0.01" min="0" value="${(s.regularGross / 100).toFixed(2)}"></label>
        <button class="btn" type="submit">Save price</button>
      </form>`).join('')}
    </section>
    <section class="panel"><h2>Photos (illustrative upload workflow)</h2>
      <p class="notice notice-demo" role="note">Illustrative only. This prototype does not claim a working Payload/Sharp pipeline and stores no files.</p>
      <form class="stack" data-photo-draft-form>
        <div class="field"><label for="ph-file">Choose a photo</label><input id="ph-file" type="file" accept="image/*"></div>
        <p><button class="btn" type="submit">Show proposed optimisation (mock)</button></p>
      </form>
      <div data-photo-result></div>
      <p class="muted small">Proposed: keep the original and generate sized, compressed variants served adaptively (WebP as one example). Complex cases may be deferred with a recorded reason (QUA-03).</p>
    </section>
    <section class="panel"><h2>Size chart</h2>
      ${model.sizeChart ? `<table class="data-table"><thead><tr><th scope="col">Frame</th><th scope="col">Min cm</th><th scope="col">Max cm</th></tr></thead><tbody>${model.sizeChart.map((r) => `<tr><td>${escapeHtml(r.frameSize)}</td><td>${r.minCm}</td><td>${r.maxCm}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">No chart. The storefront will not guess a size.</p>'}
    </section>`;
}

// ---------------------------------------------------------------------------
// S-08 Locations and tariffs
// ---------------------------------------------------------------------------

export function staffLocations(seed, state, params, ctx = {}) {
  return `
    <header class="page-head"><h1>Locations and tariffs</h1><p class="muted">Network Administrator only. Values here are synthetic demo data, not launch data.</p></header>
    <section class="panel"><h2>Stock locations</h2>
      <table class="data-table"><thead><tr><th scope="col">Name</th><th scope="col">Type</th><th scope="col">Address</th></tr></thead>
      <tbody>${seed.stockLocations.map((l) => `<tr><td>${escapeHtml(l.name)}</td><td>${escapeHtml(l.type)}</td><td>${escapeHtml(l.address)}</td></tr>`).join('')}</tbody></table>
      <p class="muted small">Store calendars and address rules are demo placeholders; real values are launch data (UX-L-01).</p>
    </section>
    <section class="panel"><h2>Shipping tariffs (synthetic)</h2>
      <table class="data-table"><thead><tr><th scope="col">Class</th><th scope="col">Base (GBP)</th><th scope="col">Extra per additional item</th></tr></thead>
      <tbody>${seed.shippingClasses.map((c) => `<tr><td>${escapeHtml(c.name)}</td><td>${formatGBP(seed.tariffs.base[c.id])}</td><td>${formatGBP(seed.tariffs.extra[c.id])}</td></tr>`).join('')}</tbody></table>
      <p class="muted small">Cart cost = the most expensive applicable BASE tariff, plus every applicable quantity surcharge. Missing configuration blocks delivery.</p>
    </section>`;
}

// ---------------------------------------------------------------------------
// S-09 Staff accounts
// ---------------------------------------------------------------------------

export function staffAccounts(seed, state, params, ctx = {}) {
  const accounts = [
    { email: 'owner@pedal-and-field.example', role: 'Owner (concept only)', status: 'grants access' },
    { email: 'manager@pedal-and-field.example', role: 'Manager', status: 'active demo' },
    { email: 'admin@pedal-and-field.example', role: 'Network Administrator', status: 'active demo' }
  ];
  return `
    <header class="page-head"><h1>Staff accounts and rights</h1><p class="muted">Network Administrator only. No new roles or approval levels are added.</p></header>
    <section class="panel">
      <table class="data-table"><thead><tr><th scope="col">Account</th><th scope="col">Role</th><th scope="col">Status</th></tr></thead>
      <tbody>${accounts.map((a) => `<tr><td>${escapeHtml(a.email)}</td><td>${escapeHtml(a.role)}</td><td>${escapeHtml(a.status)}</td></tr>`).join('')}</tbody></table>
      <p class="muted small">Synthetic accounts. The owner grants access; second factor and recovery are open proposals (UX-05).</p>
    </section>`;
}

// ---------------------------------------------------------------------------
// S-10 Content and curations
// ---------------------------------------------------------------------------

export function staffContent(seed, state, params, ctx = {}) {
  const pages = Object.values(state.content.pages);
  const articles = Object.values(state.content.articles);
  const publishedModels = seed.models.filter((m) => m.published);
  const featured = state.content.curations.featured;
  const selected = (id) => featured.modelIds.indexOf(id);

  return `
    <header class="page-head"><h1>Content and home curations</h1>
      <p class="muted">Manager and Administrator can edit pages, the journal and home curations. Prices and catalogue stay out of reach.</p></header>
    ${ctx.flash ? `<p class="notice notice-info" role="status">${escapeHtml(ctx.flash)}</p>` : ''}
    <section class="panel"><h2>Informational pages</h2>
      ${pages.map((p) => `<form class="stack content-form" data-page-form data-slug="${escapeHtml(p.slug)}">
        <div class="field"><label for="pg-${escapeHtml(p.slug)}-title">Title</label><input id="pg-${escapeHtml(p.slug)}-title" name="title" value="${escapeHtml(p.title)}"></div>
        <div class="field"><label for="pg-${escapeHtml(p.slug)}-body">Body</label><textarea id="pg-${escapeHtml(p.slug)}-body" name="body" rows="3">${escapeHtml(p.body)}</textarea></div>
        <label class="checkbox"><input type="checkbox" name="published"${p.published ? ' checked' : ''}> Published</label>
        <p><button class="btn" type="submit">Save page</button> <a class="link" href="#page/${escapeHtml(p.slug)}">View</a></p>
      </form>`).join('')}
    </section>
    <section class="panel"><h2>Journal</h2>
      ${articles.map((a) => `<form class="stack content-form" data-article-form data-slug="${escapeHtml(a.slug)}">
        <div class="field"><label for="ar-${escapeHtml(a.slug)}-title">Title</label><input id="ar-${escapeHtml(a.slug)}-title" name="title" value="${escapeHtml(a.title)}"></div>
        <div class="field"><label for="ar-${escapeHtml(a.slug)}-body">Body</label><textarea id="ar-${escapeHtml(a.slug)}-body" name="body" rows="3">${escapeHtml(a.body)}</textarea></div>
        <label class="checkbox"><input type="checkbox" name="published"${a.published ? ' checked' : ''}> Published</label>
        <p><button class="btn" type="submit">Save article</button> <a class="link" href="#journal?slug=${escapeHtml(a.slug)}">View</a></p>
      </form>`).join('')}
    </section>
    <section class="panel"><h2>Home curation: ${escapeHtml(featured.title)}</h2>
      <p class="muted small">Select published models and set their order. Empty curations are hidden on the storefront.</p>
      <form data-curation-form data-curation="featured">
        <ul class="curation-editor">
          ${publishedModels.map((m) => `<li>
            <label class="checkbox"><input type="checkbox" name="model" value="${escapeHtml(m.id)}"${selected(m.id) >= 0 ? ' checked' : ''}> ${escapeHtml(m.name)}</label>
            <label class="small">Order <input type="number" name="order-${escapeHtml(m.id)}" min="0" step="1" value="${selected(m.id) >= 0 ? selected(m.id) : ''}"></label>
          </li>`).join('')}
        </ul>
        <p><button class="btn btn-primary" type="submit">Save curation</button></p>
      </form>
    </section>`;
}

// ---------------------------------------------------------------------------
// Denied view (route guard)
// ---------------------------------------------------------------------------

export function denied(seed, state, params, ctx = {}) {
  return `
    <div class="empty-state">
      <h1>Not allowed</h1>
      <p class="muted">This demo role (${escapeHtml(roleLabel(state.staff.role))}) cannot open this section, even by direct link.</p>
      <p>${escapeHtml(ctx.reason || '')}</p>
      <p><a class="btn" href="#staff/sign-in">Switch demo role</a> <a class="btn btn-ghost" href="#staff/orders">Network orders</a></p>
    </div>`;
}
