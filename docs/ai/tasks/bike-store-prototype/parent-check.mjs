// Independent acceptance examples chosen by Sol from FUL-01/INV-05/PAY/UX-02.
// Run only once the writer has finished; complements the worker's checks.
import assert from 'node:assert/strict';
import { createSeed } from '../../../../prototype/fixtures.mjs';
import * as domain from '../../../../prototype/domain.mjs';
import { result as orderResult, cart as cartView } from '../../../../prototype/storefront.mjs';

const results = [];
function check(name, run) {
  try { run(); results.push({ name, passed: true }); }
  catch (error) { results.push({ name, passed: false, error: error.message }); }
}
const contact = { name: 'Demo Reviewer', email: 'reviewer@example.test', phone: '07000000000' };
const address = { line1: '1 Demo Street', city: 'Demo City', postcode: 'DEMO', regionId: 'england' };
function orderFor(type, iso = '2026-10-05T11:00:00Z') {
  const seed = createSeed();
  let now = Date.parse(iso);
  const state = domain.createInitialState(seed, { now: () => now });
  state.cart.context = { type, storeId: type === 'collection' ? 'store-york' : null };
  domain.addToCart(state.cart, 'hybrid-01-M-sand', 1);
  const created = domain.createOrder(seed, state, { contact, address });
  assert.equal(created.ok, true, JSON.stringify(created));
  return { seed, state, order: created.order, setNow: (value) => { now = value; } };
}

check('Mixed classes: maximum base plus every configured quantity surcharge', () => {
  const seed = createSeed();
  seed.skus.push({ id: 'oversized-review', shippingClassId: 'oversized' });
  const cart = { items: [{ skuId: 'hybrid-01-M-sand', qty: 2 }, { skuId: 'oversized-review', qty: 2 }] };
  assert.equal(domain.computeShipping(seed, cart, address).gross, 3995);
  delete seed.tariffs.base.oversized;
  assert.equal(domain.computeShipping(seed, cart, address).ok, false);
});

check('Monday ready ends Thursday in Europe/London regardless of host timezone', () => {
  const { state, order } = orderFor('collection');
  assert.equal(domain.markReady(state, order.id, state.now()).ok, true);
  assert.equal(new Date(order.collectionDeadline).toISOString(), '2026-10-08T22:59:59.999Z');
});

check('Collection extension preserves local calendar boundary across DST', () => {
  for (const [ready, deadline, extended] of [
    ['2026-10-22T11:00:00Z', '2026-10-25T23:59:59.999Z', '2026-10-28T23:59:59.999Z'],
    ['2026-03-23T12:00:00Z', '2026-03-26T23:59:59.999Z', '2026-03-29T22:59:59.999Z']
  ]) {
    const { state, order } = orderFor('collection', ready);
    domain.markReady(state, order.id, state.now());
    assert.equal(new Date(order.collectionDeadline).toISOString(), deadline);
    assert.equal(domain.extendCollection(state, order.id, { author: 'Sol demo' }).ok, true);
    assert.equal(new Date(order.collectionDeadline).toISOString(), extended);
    assert.equal(domain.extendCollection(state, order.id, { author: 'Sol demo' }).ok, false);
  }
});

check('Collection cannot use online payment or collect against short payment', () => {
  const { seed, state, order } = orderFor('collection');
  assert.equal(domain.simulatePayment(seed, state, order.id, 'paid').ok, false);
  assert.equal(order.paymentState, 'unpaid');
  domain.markReady(state, order.id, state.now());
  assert.equal(domain.recordCollectionPayment(state, order.id, { amountGross: order.totalGross - 1, method: 'cash' }).ok, false);
  assert.equal(domain.collect(state, order.id, { codeVerified: true }).ok, false);
});

check('Failed late cancelled attempt cannot fabricate a refund', () => {
  const { seed, state, order } = orderFor('delivery');
  domain.beginPayment(seed, state, order.id);
  order.orderState = 'cancelled';
  domain.simulatePayment(seed, state, order.id, 'failed');
  assert.equal(Object.keys(state.refunds).length, 0);
  domain.simulatePayment(seed, state, order.id, 'paid');
  assert.equal(order.orderState, 'cancelled');
  assert.equal(Object.keys(state.refunds).length, 1);
  domain.simulatePayment(seed, state, order.id, 'paid');
  assert.equal(Object.keys(state.refunds).length, 1);
});

check('Reorder starts checkout with preserved old history before new order consent', () => {
  const { seed, state, order, setNow } = orderFor('delivery');
  domain.beginPayment(seed, state, order.id);
  setNow(domain.reservationDeadline(state, order.id) + 1);
  domain.startReorder(seed, state, order.id);
  assert.equal(order.orderState, 'cancelled');
  assert.equal(Object.keys(state.orders).length, 1);
  assert.deepEqual(state.cart.items, order.lines.map((line) => ({ skuId: line.skuId, qty: line.qty })));
  domain.startReorder(seed, state, order.id);
  assert.equal(Object.keys(state.orders).length, 1);
});

check('Saved order does not follow global storefront context or catalogue price', () => {
  const { seed, state, order } = orderFor('collection');
  const before = JSON.stringify({ lines: order.lines, fulfilment: order.fulfilment, totalGross: order.totalGross });
  state.cart.context = { type: 'delivery', storeId: null };
  domain.getSku(seed, 'hybrid-01-M-sand').priceGross += 10000;
  assert.equal(JSON.stringify({ lines: order.lines, fulfilment: order.fulfilment, totalGross: order.totalGross }), before);
});

check('Manager direct administrative routes blocked, content allowed', () => {
  for (const route of ['#staff/products', '#staff/product/gravel-01', '#staff/locations', '#staff/accounts']) {
    assert.equal(domain.guardStaffRoute('manager', route).allowed, false, route);
  }
  assert.equal(domain.guardStaffRoute('manager', '#staff/content').allowed, true);
});

check('From price follows matching available variants and never crosses filter conditions', () => {
  const seed = createSeed();
  const state = domain.createInitialState(seed);
  const criteria = { categoryId: 'bikes', type: 'gravel' };
  const delivery = { type: 'delivery', storeId: null };
  const york = { type: 'collection', storeId: 'store-york' };
  assert.equal(domain.filterModels(seed, state, criteria, delivery).results[0].fromPrice, 129500);
  assert.equal(domain.filterModels(seed, state, criteria, york).results[0].fromPrice, 119500);
  state.balances.find((row) => row.skuId === 'gravel-01-M-terracotta' && row.locationId === 'store-york').qty = 0;
  assert.equal(domain.filterModels(seed, state, criteria, york).results[0].fromPrice, 129500);
  assert.equal(domain.filterModels(seed, state, { ...criteria, priceMax: 120000, inStockOnly: true }, delivery).modelCount, 0);
});

check('Unstarted delivery is distinct from an expired payment reservation', () => {
  const { seed, state, order } = orderFor('delivery');
  assert.equal(domain.canReorder(state, order.id), false);
  const html = orderResult(seed, state, { orderId: order.id });
  assert.match(html, /Proceed to payment/);
  assert.doesNotMatch(html, /reservation has expired/);
});

check('Collection result describes paid completion and cancellation truthfully', () => {
  const { seed, state, order } = orderFor('collection');
  assert.equal(domain.markReady(state, order.id, state.now()).ok, true);
  assert.equal(domain.recordCollectionPayment(state, order.id, { amountGross: order.totalGross, method: 'demo card' }).ok, true);
  assert.equal(domain.collect(state, order.id, { codeVerified: true }).ok, true);
  let html = orderResult(seed, state, { orderId: order.id });
  assert.match(html, /collected/i);
  assert.doesNotMatch(html, /Pay in store when you collect/);
  const cancelled = orderFor('collection');
  assert.equal(domain.cancelUnpaidOrder(cancelled.state, cancelled.order.id).ok, true);
  html = orderResult(cancelled.seed, cancelled.state, { orderId: cancelled.order.id });
  assert.match(html, /cancelled/i);
  assert.doesNotMatch(html, /Pay in store when you collect/);
});

check('Fresh delivery cart reaches address checkout and still blocks unavailable stock', () => {
  const seed = createSeed();
  const state = domain.createInitialState(seed);
  domain.addToCart(state.cart, 'gravel-01-S-sand', 1);
  let html = cartView(seed, state, {});
  assert.match(html, /href="#checkout"/);
  assert.match(html, /Calculated at checkout/);
  assert.doesNotMatch(html, /disabled[^>]*>Proceed to checkout/);
  state.cart.items[0].qty = 999;
  html = cartView(seed, state, {});
  assert.match(html, /disabled[^>]*>Proceed to checkout/);
});

console.log(JSON.stringify({ source: 'Sol independent acceptance', results }, null, 2));
if (results.some((result) => !result.passed)) process.exitCode = 1;
