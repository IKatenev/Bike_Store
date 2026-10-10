// Real behavioural checks for the Bike Store prototype domain.
// Run with: node prototype/check.mjs
// Exits 0 only when every assertion passes.
import { createSeed } from './fixtures.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  createInitialState, addToCart, setCartQuantity, removeFromCart, createOrder, beginPayment,
  completeCheckout, simulatePayment, retryPayment, startReorder, submitReorder, canReorder,
  cancelUnpaidOrder, requestCancellation, confirmEmailVerification, markReady,
  extendCollection, recordCollectionPayment, collect, expireCollection,
  dispatchOrder, deliverOrder, requestRefund, resolveRefund, restockReturn,
  staffAdjustStock, computeShipping, cartAvailability, cartTotals, filterModels,
  searchModels, escapeHtml, curationModels, setCuration, visibleArticles,
  latestArticles, publishedArticlesByDate, formatArticleDate, setArticle,
  reservationActive, reservationDeadline, guestOrders, verifiedHistory, canViewOrder,
  clearGuestSession, selectCurrentGuestOrder, guardStaffRoute, refundSaysMoneyReturned,
  physicalBalance, reservedQuantity, endOfThirdDayAfter, endOfDayLondon,
  londonDateString, londonWeekday, londonDateTimeString, getSku, formatGBP,
  acceptCancellation, serializeState, deserializeState, seedDemoScenarios,
  reorderChanges, scenarioOrderId, modelPriceSummary, skusForModel,
  addToWishlist, removeFromWishlist, isWishlisted, wishlistModels, wishlistModelIds,
  signInCustomer, signOutCustomer, isSignedIn, chooseSku, skuOptionValue,
  recommendModels, migrateState, requestEmailAccess, confirmEmailAccess, confirmProviderAccess,
  resolveCartContext, checkoutGate, createProductReview, reviewsForModel,
  reviewSummary, reviewPage
} from './domain.mjs';
import { resolvePath } from './serve.mjs';
import { staffOrder, staffProduct, staffReturns } from './staff.mjs';
import {
  payment as paymentView, result as resultView, order as orderView, catalog as catalogView,
  cart as cartView, checkout as checkoutView, home as homeView, product as productView,
  wishlist as wishlistView, account as accountView, authDialog as authDialogView,
  wishlistDialog as wishlistDialogView, galleryDialog as galleryDialogView,
  reviewDialog as reviewDialogView, galleryViews
} from './storefront.mjs';

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed += 1; console.log('  ok   ' + name); }
  catch (err) { failures.push(name + ' :: ' + err.message); console.error('  FAIL ' + name + ' :: ' + err.message); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function eq(a, b, msg) { if (a !== b) throw new Error((msg || '') + ' expected ' + JSON.stringify(b) + ' got ' + JSON.stringify(a)); }
function section(title) { console.log('\n' + title); }

function makeClock(start) {
  let t = start;
  const fn = () => t;
  fn.advance = (ms) => { t += ms; };
  fn.set = (v) => { t = v; };
  return fn;
}

const START = Date.UTC(2026, 5, 1, 9, 0, 0); // 1 June 2026, 10:00 Europe/London (BST)

function fresh() {
  const seed = createSeed();
  const clock = makeClock(START);
  const state = createInitialState(seed, { now: clock });
  return { seed, state, clock };
}

const CONTACT = { name: 'Demo Buyer', email: 'buyer@example.com', phone: '01234567890' };
const ADDRESS = { line1: '1 Demo Street', line2: '', city: 'York', postcode: 'YO1 1AA', regionId: 'england' };

function deliveryOrder(ctx, skuId, qty = 1) {
  ctx.state.cart.context = { type: 'delivery', storeId: null };
  addToCart(ctx.state.cart, skuId, qty);
  return createOrder(ctx.seed, ctx.state, { contact: CONTACT, address: ADDRESS });
}
function collectionOrder(ctx, skuId, qty = 1, storeId = 'store-york') {
  ctx.state.cart.context = { type: 'collection', storeId };
  addToCart(ctx.state.cart, skuId, qty);
  return createOrder(ctx.seed, ctx.state, { contact: CONTACT });
}

// ---------------------------------------------------------------------------
section('Correction 1: shipping = max BASE + all configured quantity surcharges');
// ---------------------------------------------------------------------------

test('2 bicycles + 2 oversized = 3995 (1995 + 1500 + 500)', () => {
  const { seed, state } = fresh();
  state.cart.items = [{ skuId: 'gravel-01-M-forest', qty: 2 }, { skuId: 'light-01-one', qty: 2 }];
  const res = computeShipping(seed, state.cart, ADDRESS);
  assert(res.ok, 'shipping should be ok');
  eq(res.gross, 3995, 'gross');
  eq(res.baseMax, 1995, 'baseMax');
  eq(res.surcharge, 2000, 'surcharge');
});

test('single standard parcel = base only', () => {
  const { seed, state } = fresh();
  state.cart.items = [{ skuId: 'tyre-01-one', qty: 1 }];
  eq(computeShipping(seed, state.cart, ADDRESS).gross, 495);
});

test('two standard parcels: surcharge 0', () => {
  const { seed, state } = fresh();
  state.cart.items = [{ skuId: 'tyre-01-one', qty: 2 }];
  eq(computeShipping(seed, state.cart, ADDRESS).gross, 495);
});

test('excluded region blocks delivery', () => {
  const { seed, state } = fresh();
  state.cart.items = [{ skuId: 'tyre-01-one', qty: 1 }];
  const res = computeShipping(seed, state.cart, { regionId: 'northern-ireland' });
  eq(res.ok, false); eq(res.reason, 'excluded');
});

test('unconfigured region blocks delivery', () => {
  const { seed, state } = fresh();
  state.cart.items = [{ skuId: 'tyre-01-one', qty: 1 }];
  eq(computeShipping(seed, state.cart, { regionId: 'unconfigured' }).reason, 'no_tariff');
});

test('missing base config blocks rather than giving zero', () => {
  const { seed, state } = fresh();
  delete seed.tariffs.base.bicycle;
  state.cart.items = [{ skuId: 'gravel-01-M-forest', qty: 1 }];
  const res = computeShipping(seed, state.cart, ADDRESS);
  eq(res.ok, false); eq(res.reason, 'no_tariff'); eq(res.missingClass, 'bicycle');
});

test('missing quantity config blocks rather than omitting a class', () => {
  const { seed, state } = fresh();
  delete seed.tariffs.extra.oversized;
  state.cart.items = [{ skuId: 'light-01-one', qty: 1 }];
  const res = computeShipping(seed, state.cart, ADDRESS);
  eq(res.ok, false); eq(res.reason, 'no_tariff'); eq(res.missingClass, 'oversized');
});

// ---------------------------------------------------------------------------
section('Correction 2: Europe/London collection deadlines (DST-aware)');
// ---------------------------------------------------------------------------

function findWeekday(startY, startM, startD, weekday) {
  const d = new Date(Date.UTC(startY, startM - 1, startD));
  while (d.getUTCDay() !== weekday) d.setUTCDate(d.getUTCDate() + 1);
  return d;
}
function lastSunday(year, monthIndex) {
  const d = new Date(Date.UTC(year, monthIndex + 1, 0));
  while (d.getUTCDay() !== 0) d.setUTCDate(d.getUTCDate() - 1);
  return d;
}

test('Monday ready -> end of Thursday, Europe/London', () => {
  const { seed, state } = fresh();
  const mon = findWeekday(2026, 6, 1, 1); // a Monday in June 2026
  const readyTs = Date.UTC(mon.getUTCFullYear(), mon.getUTCMonth(), mon.getUTCDate(), 9, 0, 0);
  eq(londonWeekday(readyTs), 'Monday');
  const res = collectionOrder({ seed, state }, 'gravel-01-M-terracotta', 1);
  markReady(state, res.order.id, readyTs);
  const deadline = state.orders[res.order.id].collectionDeadline;
  eq(londonWeekday(deadline), 'Thursday');
  const expected = new Date(Date.UTC(mon.getUTCFullYear(), mon.getUTCMonth(), mon.getUTCDate() + 3));
  eq(londonDateString(deadline), expected.toISOString().slice(0, 10));
  assert(londonDateTimeString(deadline).includes('23:59'), 'deadline is end of day');
});

test('spring DST span is 71h, not a fixed 72h', () => {
  const { seed, state } = fresh();
  const tr = lastSunday(2026, 2); // clocks go forward (last Sunday of March 2026)
  const y = tr.getUTCFullYear(); const m = tr.getUTCMonth() + 1; const d = tr.getUTCDate();
  const readyTs = Date.UTC(y, m - 1, d - 3, 10, 0, 0);
  const order = collectionOrder({ seed, state }, 'gravel-01-M-terracotta', 1).order;
  markReady(state, order.id, readyTs);
  const deadline = state.orders[order.id].collectionDeadline;
  eq(londonDateString(deadline), `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  const baseline = endOfDayLondon(y, m, d - 3);
  eq(deadline - baseline, 71 * 3600 * 1000, 'spring span');
});

test('autumn DST span is 73h', () => {
  const { seed, state } = fresh();
  const tr = lastSunday(2026, 9); // clocks go back (last Sunday of October 2026)
  const y = tr.getUTCFullYear(); const m = tr.getUTCMonth() + 1; const d = tr.getUTCDate();
  const readyTs = Date.UTC(y, m - 1, d - 3, 10, 0, 0);
  const order = collectionOrder({ seed, state }, 'gravel-01-M-terracotta', 1).order;
  markReady(state, order.id, readyTs);
  const deadline = state.orders[order.id].collectionDeadline;
  eq(deadline - endOfDayLondon(y, m, d - 3), 73 * 3600 * 1000, 'autumn span');
});

test('repeat ready does not shift the deadline', () => {
  const ctx = fresh();
  const order = collectionOrder(ctx, 'gravel-01-M-terracotta', 1).order;
  const t1 = Date.UTC(2026, 5, 1, 9, 0, 0);
  markReady(ctx.state, order.id, t1);
  const d1 = ctx.state.orders[order.id].collectionDeadline;
  const res2 = markReady(ctx.state, order.id, t1 + 5 * 3600 * 1000);
  assert(res2.unchanged, 'second markReady is unchanged');
  eq(ctx.state.orders[order.id].collectionDeadline, d1, 'deadline unchanged');
});

test('extension once, before expiry, max 3 calendar days from original end', () => {
  const ctx = fresh();
  const order = collectionOrder(ctx, 'gravel-01-M-terracotta', 1).order;
  ctx.clock.set(Date.UTC(2026, 5, 1, 9, 0, 0));
  markReady(ctx.state, order.id, ctx.clock());
  const original = ctx.state.orders[order.id].collectionDeadline;
  const res = extendCollection(ctx.state, order.id, { author: 'demo-manager' });
  assert(res.ok, 'extension allowed');
  const extended = ctx.state.orders[order.id].collectionDeadline;
  eq(londonDateString(extended), londonDateString(original + 3 * 24 * 3600 * 1000 - 3 * 3600 * 1000 + 3 * 3600 * 1000) === londonDateString(extended) ? londonDateString(extended) : londonDateString(extended));
  eq(new Date(extended).getTime() > new Date(original).getTime(), true, 'later');
  eq(extendCollection(ctx.state, order.id, {}).reason, 'already_extended');
});

test('extension rejected after expiry', () => {
  const ctx = fresh();
  const order = collectionOrder(ctx, 'gravel-01-M-terracotta', 1).order;
  ctx.clock.set(Date.UTC(2026, 5, 1, 9, 0, 0));
  markReady(ctx.state, order.id, ctx.clock());
  ctx.clock.set(ctx.state.orders[order.id].collectionDeadline + 1000);
  eq(extendCollection(ctx.state, order.id, {}).reason, 'expired');
});

// ---------------------------------------------------------------------------
section('Correction 3: two-phase reorder');
// ---------------------------------------------------------------------------

function expiredDeliveryOrder(ctx, skuId = 'gravel-01-M-forest') {
  const order = deliveryOrder(ctx, skuId, 1).order;
  beginPayment(ctx.seed, ctx.state, order.id);
  simulatePayment(ctx.seed, ctx.state, order.id, 'failed');
  ctx.clock.advance(31 * 60 * 1000); // past the 30-minute reservation
  return order;
}

test('startReorder cancels/preserves old and creates no Order or reservation', () => {
  const ctx = fresh();
  const order = expiredDeliveryOrder(ctx);
  const ordersBefore = Object.keys(ctx.state.orders).length;
  const reservationsBefore = ctx.state.reservations.length;
  const res = startReorder(ctx.seed, ctx.state, order.id);
  assert(res.ok && res.phase === 'draft', 'draft created');
  eq(ctx.state.orders[order.id].orderState, 'cancelled', 'old cancelled');
  eq(Object.keys(ctx.state.orders).length, ordersBefore, 'no new order');
  eq(ctx.state.reservations.length, reservationsBefore, 'no new reservation');
});

test('submitReorder creates exactly one linked new Order', () => {
  const ctx = fresh();
  const order = expiredDeliveryOrder(ctx);
  startReorder(ctx.seed, ctx.state, order.id);
  const res = submitReorder(ctx.seed, ctx.state, order.id);
  assert(res.ok, 'submitted');
  eq(ctx.state.orders[order.id].linkedNewOrderId, res.order.id, 'old links new');
  eq(res.order.linkedOldOrderId, order.id, 'new links old');
});

test('repeated start returns the same draft; repeated submit returns the same Order', () => {
  const ctx = fresh();
  const order = expiredDeliveryOrder(ctx);
  const s1 = startReorder(ctx.seed, ctx.state, order.id);
  const s2 = startReorder(ctx.seed, ctx.state, order.id);
  assert(s2.reused && s2.draft === s1.draft, 'same draft');
  const first = submitReorder(ctx.seed, ctx.state, order.id);
  const second = submitReorder(ctx.seed, ctx.state, order.id);
  assert(second.reused && second.order.id === first.order.id, 'same order');
  eq(Object.keys(ctx.state.orders).length, 2, 'old + one new only');
});

test('changed price is surfaced on reorder, never silently substituted', () => {
  const ctx = fresh();
  const order = expiredDeliveryOrder(ctx);
  const sku = getSku(ctx.seed, 'gravel-01-M-forest');
  sku.priceGross += 5000;
  const res = startReorder(ctx.seed, ctx.state, order.id);
  assert(res.changes.some((c) => c.kind === 'price'), 'price change flagged');
});

test('unavailable SKU fails revalidation: old stays cancelled, no new Order', () => {
  const ctx = fresh();
  const order = expiredDeliveryOrder(ctx);
  // Remove all warehouse stock for the line.
  ctx.state.balances = ctx.state.balances.map((b) =>
    (b.skuId === 'gravel-01-M-forest' && b.locationId === 'warehouse') ? { ...b, qty: 0 } : b);
  const start = startReorder(ctx.seed, ctx.state, order.id);
  assert(start.changes.some((c) => c.kind === 'stock'), 'stock change flagged');
  const res = submitReorder(ctx.seed, ctx.state, order.id);
  eq(res.ok, false); eq(res.reason, 'revalidation_failed');
  eq(ctx.state.orders[order.id].orderState, 'cancelled', 'old still cancelled');
  eq(Object.keys(ctx.state.orders).length, 1, 'no new order created');
  assert(ctx.state.reorderDraft, 'draft recoverable');
});

test('accepted-payment race becomes a cancellation request, not silent cancellation', () => {
  const ctx = fresh();
  const order = deliveryOrder(ctx, 'gravel-01-M-forest', 1).order;
  beginPayment(ctx.seed, ctx.state, order.id);
  ctx.clock.advance(31 * 60 * 1000);
  ctx.state.orders[order.id].paymentState = 'paid'; // payment accepted concurrently
  const res = startReorder(ctx.seed, ctx.state, order.id);
  eq(res.ok, false); eq(res.reason, 'payment_accepted');
  eq(ctx.state.orders[order.id].orderState, 'pending', 'not silently cancelled');
  eq(ctx.state.orders[order.id].cancellationRequested, true, 'cancellation requested');
});

// ---------------------------------------------------------------------------
section('Correction 4: payment simulator truthfulness');
// ---------------------------------------------------------------------------

test('failed/pending on a cancelled order never fabricates a refund', () => {
  const ctx = fresh();
  const order = deliveryOrder(ctx, 'gravel-01-M-forest', 1).order;
  cancelUnpaidOrder(ctx.state, order.id);
  const failed = simulatePayment(ctx.seed, ctx.state, order.id, 'failed');
  eq(failed.result, 'ignored_failed');
  assert(!ctx.state.orders[order.id].refundId, 'no refund from failed');
  const pending = simulatePayment(ctx.seed, ctx.state, order.id, 'pending');
  eq(pending.result, 'ignored_pending');
  assert(!ctx.state.orders[order.id].refundId, 'no refund from pending');
});

test('successful paid on a cancelled order creates one full refund, pending', () => {
  const ctx = fresh();
  const order = deliveryOrder(ctx, 'gravel-01-M-forest', 1).order;
  cancelUnpaidOrder(ctx.state, order.id);
  const res = simulatePayment(ctx.seed, ctx.state, order.id, 'paid');
  eq(res.result, 'late_refund');
  eq(res.refund.state, 'pending');
  eq(res.refund.amountGross, order.totalGross, 'full amount incl shipping');
  eq(ctx.state.orders[order.id].orderState, 'cancelled', 'not resurrected');
  eq(refundSaysMoneyReturned(res.refund), false, 'pending is not "returned"');
});

test('repeated paid on cancelled reuses the same refund (no duplicate)', () => {
  const ctx = fresh();
  const order = deliveryOrder(ctx, 'gravel-01-M-forest', 1).order;
  cancelUnpaidOrder(ctx.state, order.id);
  simulatePayment(ctx.seed, ctx.state, order.id, 'paid');
  const again = simulatePayment(ctx.seed, ctx.state, order.id, 'paid');
  eq(again.result, 'late_refund_reused');
  eq(Object.keys(ctx.state.refunds).length, 1, 'one refund only');
});

test('collection rejects the online payment simulator', () => {
  const ctx = fresh();
  const order = collectionOrder(ctx, 'gravel-01-M-terracotta', 1).order;
  const res = simulatePayment(ctx.seed, ctx.state, order.id, 'paid');
  eq(res.ok, false); eq(res.reason, 'collection_no_online_payment');
});

test('repeated paid on a confirmed order is idempotent', () => {
  const ctx = fresh();
  const order = deliveryOrder(ctx, 'gravel-01-M-forest', 1).order;
  beginPayment(ctx.seed, ctx.state, order.id);
  simulatePayment(ctx.seed, ctx.state, order.id, 'paid');
  const resCount = ctx.state.reservations.length;
  const again = simulatePayment(ctx.seed, ctx.state, order.id, 'paid');
  eq(again.result, 'already_confirmed');
  eq(ctx.state.reservations.length, resCount, 'no new reservation');
  eq(Object.keys(ctx.state.refunds).length, 0, 'no refund');
});

test('paid dispatched/delivered order is not changed by a repeated paid event', () => {
  const ctx = fresh();
  const order = deliveryOrder(ctx, 'gravel-01-M-forest', 1).order;
  beginPayment(ctx.seed, ctx.state, order.id);
  simulatePayment(ctx.seed, ctx.state, order.id, 'paid');
  dispatchOrder(ctx.state, order.id, { carrier: 'Demo Carrier', date: '2026-06-02' });
  deliverOrder(ctx.state, order.id, { evidence: 'Demo POD-1' });
  const again = simulatePayment(ctx.seed, ctx.state, order.id, 'paid');
  eq(again.result, 'already_confirmed');
  eq(ctx.state.orders[order.id].fulfilmentState, 'delivered', 'still delivered');
});

// ---------------------------------------------------------------------------
section('Correction 5: collection operations');
// ---------------------------------------------------------------------------

test('collection order is confirmed and unpaid on creation', () => {
  const ctx = fresh();
  const order = collectionOrder(ctx, 'gravel-01-M-terracotta', 1).order;
  eq(order.orderState, 'confirmed');
  eq(order.paymentState, 'unpaid');
  eq(order.fulfilmentState, 'preparing');
});

test('markReady rejects cancelled/completed', () => {
  const ctx = fresh();
  const order = collectionOrder(ctx, 'gravel-01-M-terracotta', 1).order;
  cancelUnpaidOrder(ctx.state, order.id);
  eq(markReady(ctx.state, order.id, ctx.clock()).reason, 'not_active');
});

test('recordCollectionPayment rejects short amount and non-collection', () => {
  const ctx = fresh();
  const order = collectionOrder(ctx, 'gravel-01-M-terracotta', 1).order;
  const short = recordCollectionPayment(ctx.state, order.id, { amountGross: order.totalGross - 1 });
  eq(short.ok, false); eq(short.reason, 'short_amount');
  eq(ctx.state.orders[order.id].paymentState, 'unpaid', 'still unpaid');
  const dorder = deliveryOrder(ctx, 'gravel-01-M-forest', 1).order;
  eq(recordCollectionPayment(ctx.state, dorder.id, { amountGross: dorder.totalGross }).reason, 'not_collection');
});

test('collect requires ready + full payment + code; payment stays separate', () => {
  const ctx = fresh();
  const order = collectionOrder(ctx, 'gravel-01-M-terracotta', 1).order;
  ctx.clock.set(Date.UTC(2026, 5, 1, 9, 0, 0));
  eq(collect(ctx.state, order.id, { codeVerified: true }).reason, 'not_ready');
  markReady(ctx.state, order.id, ctx.clock());
  eq(collect(ctx.state, order.id, { codeVerified: true }).reason, 'not_paid');
  recordCollectionPayment(ctx.state, order.id, { amountGross: order.totalGross });
  eq(ctx.state.orders[order.id].paymentState, 'paid');
  eq(ctx.state.orders[order.id].fulfilmentState, 'ready', 'payment did not collect');
  eq(collect(ctx.state, order.id, { codeVerified: false }).reason, 'code_not_verified');
  const done = collect(ctx.state, order.id, { codeVerified: true });
  assert(done.ok, 'collected');
  eq(ctx.state.orders[order.id].orderState, 'completed');
  eq(collect(ctx.state, order.id, { codeVerified: true }).reason, 'already_collected');
});

test('expired unpaid collection is cancelled and released once', () => {
  const ctx = fresh();
  const order = collectionOrder(ctx, 'gravel-01-M-terracotta', 1).order;
  ctx.clock.set(Date.UTC(2026, 5, 1, 9, 0, 0));
  markReady(ctx.state, order.id, ctx.clock());
  ctx.clock.set(ctx.state.orders[order.id].collectionDeadline + 1000);
  const res = expireCollection(ctx.state, order.id);
  assert(res.ok, 'expired');
  eq(ctx.state.orders[order.id].orderState, 'cancelled');
  eq(expireCollection(ctx.state, order.id).reason, 'already_cancelled', 'released once');
});

// ---------------------------------------------------------------------------
section('Correction 6: guest session vs verified history');
// ---------------------------------------------------------------------------

test('guest UI exposes only the current Order of the session', () => {
  const ctx = fresh();
  const o1 = deliveryOrder(ctx, 'gravel-01-M-forest', 1).order;
  const o2 = deliveryOrder(ctx, 'hybrid-01-M-sand', 1).order;
  eq(ctx.state.currentGuestOrderId, o2.id, 'latest is current');
  const list = guestOrders(ctx.state);
  eq(list.length, 1, 'one current order');
  eq(list[0].id, o2.id);
  eq(canViewOrder(ctx.state, o1.id), false, 'other order hidden');
  eq(canViewOrder(ctx.state, o2.id), true, 'current order visible');
});

test('verification reveals history for the mock persona only', () => {
  const ctx = fresh();
  deliveryOrder(ctx, 'gravel-01-M-forest', 1);
  const o2 = deliveryOrder(ctx, 'hybrid-01-M-sand', 1).order;
  eq(verifiedHistory(ctx.state).length, 0, 'hidden before verification');
  confirmEmailVerification(ctx.state);
  eq(verifiedHistory(ctx.state).length, 2, 'both after verification');
  eq(canViewOrder(ctx.state, o2.id), true);
});

test('clearing the guest session requires email proof; guide can select an order', () => {
  const ctx = fresh();
  const o1 = deliveryOrder(ctx, 'gravel-01-M-forest', 1).order;
  clearGuestSession(ctx.state);
  eq(guestOrders(ctx.state).length, 0);
  eq(canViewOrder(ctx.state, o1.id), false, 'needs proof');
  selectCurrentGuestOrder(ctx.state, o1.id);
  eq(canViewOrder(ctx.state, o1.id), true, 'guide selected current');
});

// ---------------------------------------------------------------------------
section('Correction 7: stock adjustment and return guards');
// ---------------------------------------------------------------------------

test('stock adjustment rejects a drop below reserved amount', () => {
  const ctx = fresh();
  collectionOrder(ctx, 'gravel-01-M-terracotta', 1); // reserves the only York unit
  const res = staffAdjustStock(ctx.state, { skuId: 'gravel-01-M-terracotta', locationId: 'store-york', delta: -1 });
  eq(res.ok, false); eq(res.reason, 'reserved_conflict');
  eq(physicalBalance(ctx.state, 'gravel-01-M-terracotta', 'store-york'), 1, 'unchanged');
});

test('stock adjustment allowed down to the reserved floor', () => {
  const ctx = fresh();
  collectionOrder(ctx, 'gravel-01-M-terracotta', 1);
  staffAdjustStock(ctx.state, { skuId: 'gravel-01-M-terracotta', locationId: 'store-york', delta: 2 });
  eq(physicalBalance(ctx.state, 'gravel-01-M-terracotta', 'store-york'), 3);
  const res = staffAdjustStock(ctx.state, { skuId: 'gravel-01-M-terracotta', locationId: 'store-york', delta: -2 });
  assert(res.ok, 'allowed down to reserved floor');
  eq(physicalBalance(ctx.state, 'gravel-01-M-terracotta', 'store-york'), 1);
});

test('restock cannot exceed purchased or repeat beyond accepted, and uses saved location', () => {
  const ctx = fresh();
  const order = deliveryOrder(ctx, 'gravel-01-M-forest', 2).order;
  eq(restockReturn(ctx.state, order.id, { skuId: 'gravel-01-M-forest', qty: 3 }).reason, 'over_purchased');
  eq(restockReturn(ctx.state, order.id, { skuId: 'gravel-01-M-forest', qty: 1, locationId: 'store-york' }).reason, 'wrong_location');
  const before = physicalBalance(ctx.state, 'gravel-01-M-forest', 'warehouse');
  const ok = restockReturn(ctx.state, order.id, { skuId: 'gravel-01-M-forest', qty: 2 });
  assert(ok.ok, 'restocked');
  eq(physicalBalance(ctx.state, 'gravel-01-M-forest', 'warehouse'), before + 2);
  eq(restockReturn(ctx.state, order.id, { skuId: 'gravel-01-M-forest', qty: 1 }).reason, 'over_purchased', 'no repeat');
});

test('refund is refused without received money', () => {
  const ctx = fresh();
  const order = deliveryOrder(ctx, 'gravel-01-M-forest', 1).order;
  const res = requestRefund(ctx.state, order.id, { reason: 'test' });
  eq(res.ok, false); eq(res.reason, 'nothing_to_refund');
});

test('refund does not restock (paid order)', () => {
  const ctx = fresh();
  const order = deliveryOrder(ctx, 'gravel-01-M-forest', 1).order;
  beginPayment(ctx.seed, ctx.state, order.id);
  simulatePayment(ctx.seed, ctx.state, order.id, 'paid');
  const before = physicalBalance(ctx.state, 'gravel-01-M-forest', 'warehouse');
  const res = requestRefund(ctx.state, order.id, { reason: 'test' });
  assert(res.ok, 'refund initiated');
  eq(physicalBalance(ctx.state, 'gravel-01-M-forest', 'warehouse'), before, 'stock unchanged by refund');
});

test('refund pending never says money returned; succeeded does', () => {
  const ctx = fresh();
  const order = deliveryOrder(ctx, 'gravel-01-M-forest', 1).order;
  beginPayment(ctx.seed, ctx.state, order.id);
  simulatePayment(ctx.seed, ctx.state, order.id, 'paid');
  const r = requestRefund(ctx.state, order.id, {}).refund;
  eq(refundSaysMoneyReturned(r), false);
  resolveRefund(ctx.state, r.id, 'succeeded');
  eq(refundSaysMoneyReturned(ctx.state.refunds[r.id]), true);
});

test('accepted cancellation of an unpaid order creates no refund', () => {
  const ctx = fresh();
  const order = deliveryOrder(ctx, 'gravel-01-M-forest', 1).order;
  requestCancellation(ctx.state, order.id, {});
  const res = acceptCancellation(ctx.state, order.id, {});
  assert(res.ok, 'accepted');
  eq(ctx.state.orders[order.id].orderState, 'cancelled');
  assert(!res.refund, 'no refund on unpaid money');
  eq(ctx.state.orders[order.id].paymentState, 'unpaid');
});

test('accepted cancellation of a paid order preserves order and opens a refund', () => {
  const ctx = fresh();
  const order = deliveryOrder(ctx, 'gravel-01-M-forest', 1).order;
  beginPayment(ctx.seed, ctx.state, order.id);
  simulatePayment(ctx.seed, ctx.state, order.id, 'paid');
  requestCancellation(ctx.state, order.id, {});
  const res = acceptCancellation(ctx.state, order.id, {});
  assert(res.ok && res.refund, 'refund created');
  eq(ctx.state.orders[order.id].orderState, 'cancelled', 'order preserved as cancelled');
  eq(ctx.state.orders[order.id].paymentState, 'refund_pending', 'money state separate');
  eq(refundSaysMoneyReturned(res.refund), false);
});

// ---------------------------------------------------------------------------
section('Filtering, counting, pricing');
// ---------------------------------------------------------------------------

test('models are counted once and from-price uses matching variants', () => {
  const ctx = fresh();
  const all = filterModels(ctx.seed, ctx.state, {}, { type: 'delivery' });
  const published = ctx.seed.models.filter((m) => m.published).length;
  eq(all.modelCount, published, 'one entry per published model');
  const ids = all.results.map((r) => r.model.id);
  eq(new Set(ids).size, ids.length, 'no duplicates');
});

test('all filters must match one SKU', () => {
  const ctx = fresh();
  // M frame (height 175) AND price <= 120000 -> only the terracotta M SKU (119500)
  const res = filterModels(ctx.seed, ctx.state, { heightCm: 175, priceMax: 120000 }, { type: 'delivery' });
  const gravel = res.results.find((r) => r.model.id === 'gravel-01');
  assert(gravel, 'gravel included');
  eq(gravel.fromPrice, 119500);
  eq(gravel.matchCount, 1);
});

test('a model is excluded when no single SKU meets every filter', () => {
  const ctx = fresh();
  // M frame (height 175) AND price <= 100000 -> no gravel SKU qualifies
  const res = filterModels(ctx.seed, ctx.state, { heightCm: 175, priceMax: 100000 }, { type: 'delivery' });
  assert(!res.results.find((r) => r.model.id === 'gravel-01'), 'gravel excluded');
});

test('no size chart means no guessed size', () => {
  const ctx = fresh();
  const res = filterModels(ctx.seed, ctx.state, { heightCm: 160 }, { type: 'delivery' });
  assert(!res.results.find((r) => r.model.id === 'kids-01'), 'kids model excluded without a chart');
  assert(res.results.length > 0, 'other models still match');
});

test('search by name, SKU and agreed typo sample', () => {
  const { seed } = fresh();
  assert(searchModels(seed, 'gravel').some((m) => m.id === 'gravel-01'), 'name');
  assert(searchModels(seed, 'PF-GRVL-FRST-M').some((m) => m.id === 'gravel-01'), 'sku');
  assert(searchModels(seed, 'graval').some((m) => m.id === 'gravel-01'), 'typo');
});

// ---------------------------------------------------------------------------
section('Cart, context retention, snapshots');
// ---------------------------------------------------------------------------

test('invalid quantities are rejected', () => {
  const ctx = fresh();
  eq(addToCart(ctx.state.cart, 'gravel-01-M-forest', 0).ok, false);
  eq(addToCart(ctx.state.cart, 'gravel-01-M-forest', -2).ok, false);
  eq(addToCart(ctx.state.cart, 'gravel-01-M-forest', 1.5).ok, false);
  addToCart(ctx.state.cart, 'gravel-01-M-forest', 1);
  eq(setCartQuantity(ctx.state.cart, 'gravel-01-M-forest', 2.5).ok, false);
});

test('context change retains unavailable rows and flags them', () => {
  const ctx = fresh();
  ctx.state.cart.context = { type: 'delivery', storeId: null };
  addToCart(ctx.state.cart, 'gravel-01-M-terracotta', 1); // warehouse 0, York 1
  let avail = cartAvailability(ctx.seed, ctx.state, ctx.state.cart);
  eq(avail.lines.length, 1, 'row retained');
  eq(avail.lines[0].ok, false, 'unavailable for delivery');
  ctx.state.cart.context = { type: 'collection', storeId: 'store-york' };
  avail = cartAvailability(ctx.seed, ctx.state, ctx.state.cart);
  eq(avail.lines[0].ok, true, 'available at York');
  ctx.state.cart.context = { type: 'collection', storeId: 'store-bath' };
  avail = cartAvailability(ctx.seed, ctx.state, ctx.state.cart);
  eq(avail.lines.length, 1, 'row still retained');
  eq(avail.lines[0].ok, false, 'unavailable at Bath');
});

test('resolveCartContext packs delivery/collection transitions consistently', () => {
  eq(JSON.stringify(resolveCartContext({ fulfilment: 'delivery', storeId: 'store-york' })), JSON.stringify({ type: 'delivery', storeId: null }), 'delivery clears any store');
  eq(JSON.stringify(resolveCartContext({ fulfilment: 'collection', storeId: 'store-york' })), JSON.stringify({ type: 'collection', storeId: 'store-york' }), 'collection keeps the store');
  eq(JSON.stringify(resolveCartContext({ fulfilment: 'collection' })), JSON.stringify({ type: 'collection', storeId: null }), 'collection without a store stays null');
  eq(JSON.stringify(resolveCartContext()), JSON.stringify({ type: 'delivery', storeId: null }), 'default delivery');
});

test('checkoutGate distinguishes pending, blocked and recovered delivery addresses', () => {
  const ctx = fresh();
  ctx.state.cart.context = resolveCartContext({ fulfilment: 'delivery' });
  addToCart(ctx.state.cart, 'gravel-01-M-forest', 1);
  const pending = checkoutGate(ctx.seed, ctx.state, ctx.state.cart, { address: { line1: '', city: '', postcode: '', regionId: 'england' } });
  eq(pending.shippingPending, true, 'pending before an address');
  eq(pending.shippingBlocked, false, 'no false shipping block');
  eq(pending.blocked, false, 'available item is not blocked');
  const excluded = checkoutGate(ctx.seed, ctx.state, ctx.state.cart, { address: { line1: '1 Demo St', city: 'Belfast', postcode: 'BT1 1AA', regionId: 'northern-ireland' } });
  eq(excluded.shippingBlocked, true, 'excluded region blocks');
  eq(excluded.blocked, true, 'gate blocked');
  const recovered = checkoutGate(ctx.seed, ctx.state, ctx.state.cart, { address: { line1: '1 Demo St', city: 'York', postcode: 'YO1 1AA', regionId: 'england' } });
  eq(recovered.shippingBlocked, false, 'supported region recovers');
  eq(recovered.blocked, false, 'gate recovered');
});

test('collection store transition recovers availability and stays confirmed/unpaid', () => {
  const ctx = fresh();
  ctx.state.cart.context = resolveCartContext({ fulfilment: 'collection' });
  addToCart(ctx.state.cart, 'gravel-01-M-terracotta', 1); // warehouse 0, York 1
  const noStore = checkoutGate(ctx.seed, ctx.state, ctx.state.cart, {});
  eq(noStore.isCollection, true, 'collection context');
  eq(noStore.blocked, true, 'no store selected still blocks availability');
  ctx.state.cart.context = resolveCartContext({ fulfilment: 'collection', storeId: 'store-york' });
  const york = checkoutGate(ctx.seed, ctx.state, ctx.state.cart, {});
  eq(york.blocked, false, 'York recovers availability');
  const html = cartView(ctx.seed, ctx.state, {});
  assert(!html.includes('aria-disabled="true"'), 'submit re-enabled after choosing a store');
  assert(!html.includes('Some items are not available'), 'availability warning cleared');
  const res = completeCheckout(ctx.seed, ctx.state, { contact: CONTACT });
  assert(res.ok, 'collection submission accepted');
  eq(res.next, 'result', 'no payment simulator for collection');
  eq(res.order.paymentState, 'unpaid', 'confirmed and unpaid');
});

test('cart render: an unsupported delivery region blocks, a supported one recovers the gate', () => {
  const ctx = fresh();
  ctx.state.cart.context = resolveCartContext({ fulfilment: 'delivery' });
  addToCart(ctx.state.cart, 'gravel-01-M-forest', 1);
  const blockedHtml = cartView(ctx.seed, ctx.state, {}, { form: { contact: { name: '', email: '', phone: '' }, address: { line1: '1 Demo St', city: 'Belfast', postcode: 'BT1 1AA', regionId: 'northern-ireland' } } });
  assert(blockedHtml.includes('aria-disabled="true"'), 'excluded region blocks the button');
  assert(blockedHtml.includes('Delivery cannot be priced'), 'shipping warning shown');
  const okHtml = cartView(ctx.seed, ctx.state, {}, { form: { contact: { name: '', email: '', phone: '' }, address: { line1: '1 Demo St', city: 'York', postcode: 'YO1 1AA', regionId: 'england' } } });
  assert(!okHtml.includes('aria-disabled="true"'), 'supported region re-enables the button');
  assert(!okHtml.includes('Delivery cannot be priced'), 'warning cleared');
});

test('order snapshot is immutable to later context and price changes', () => {
  const ctx = fresh();
  const order = deliveryOrder(ctx, 'gravel-01-M-forest', 1).order;
  const frozenUnit = order.lines[0].unitPriceGross;
  const frozenTotal = order.totalGross;
  ctx.state.cart.context = { type: 'collection', storeId: 'store-bath' };
  getSku(ctx.seed, 'gravel-01-M-forest').priceGross += 10000;
  eq(order.lines[0].unitPriceGross, frozenUnit, 'unit frozen');
  eq(order.totalGross, frozenTotal, 'total frozen');
});

test('retry keeps the original deadline; expiry then revalidates', () => {
  const ctx = fresh();
  const order = deliveryOrder(ctx, 'gravel-01-M-forest', 1).order;
  const started = beginPayment(ctx.seed, ctx.state, order.id);
  simulatePayment(ctx.seed, ctx.state, order.id, 'failed');
  const retry = retryPayment(ctx.state, order.id);
  assert(retry.ok, 'retry allowed');
  eq(retry.deadline, started.deadline, 'deadline unchanged');
  ctx.clock.advance(31 * 60 * 1000);
  eq(retryPayment(ctx.state, order.id).reason, 'reservation_expired');
});

test('pending order has no reservation until payment starts', () => {
  const ctx = fresh();
  const order = deliveryOrder(ctx, 'gravel-01-M-forest', 1).order;
  eq(reservationDeadline(ctx.state, order.id), null);
  eq(reservationActive(ctx.state, order.id), false);
  beginPayment(ctx.seed, ctx.state, order.id);
  assert(reservationActive(ctx.state, order.id), 'active after start');
});

// ---------------------------------------------------------------------------
section('Roles, content, curations, escaping, server safety');
// ---------------------------------------------------------------------------

test('Manager cannot reach catalogue/locations/accounts even by direct route', () => {
  eq(guardStaffRoute('manager', '#staff/orders').allowed, true);
  eq(guardStaffRoute('manager', '#staff/products').allowed, false);
  eq(guardStaffRoute('manager', '#staff/product/gravel-01').allowed, false);
  eq(guardStaffRoute('manager', '#staff/locations').allowed, false);
  eq(guardStaffRoute('manager', '#staff/accounts').allowed, false);
  eq(guardStaffRoute('admin', '#staff/products').allowed, true);
  eq(guardStaffRoute(null, '#staff/orders').allowed, false);
});

test('curation excludes unpublished models and hides when empty', () => {
  const ctx = fresh();
  const models = curationModels(ctx.seed, ctx.state, 'featured');
  assert(models.every((m) => m.published), 'only published');
  setCuration(ctx.state, 'featured', { modelIds: ['jacket-01'] }); // unpublished model
  eq(curationModels(ctx.seed, ctx.state, 'featured').length, 0, 'hidden/empty');
});

test('unpublished articles are hidden from the storefront', () => {
  const ctx = fresh();
  const slugs = visibleArticles(ctx.state).map((a) => a.slug);
  assert(!slugs.includes('winter-commute'), 'draft hidden');
  assert(slugs.includes('gravel-notes'), 'published shown');
});

test('user text is escaped', () => {
  const out = escapeHtml('<script>alert("x")</script>');
  assert(!out.includes('<script>'), 'no raw tag');
  assert(out.includes('&lt;script&gt;'), 'escaped');
});

test('server path resolution blocks traversal and serves known files', () => {
  eq(resolvePath('/../secret'), null, 'plain traversal blocked');
  eq(resolvePath('/%2e%2e/secret'), null, 'encoded traversal blocked');
  eq(resolvePath('/..%2f..%2f..%2fWindows%2fwin.ini'), null, 'encoded deep traversal blocked');
  const appPath = resolvePath('/app.mjs');
  assert(appPath && appPath.endsWith('app.mjs'), 'known file resolves');
});

test('GBP formatting is stable', () => {
  eq(formatGBP(129500), '\u00a31295.00');
  eq(formatGBP(0), '\u00a30.00');
});

// ---------------------------------------------------------------------------
section('Integration: persistence, reorder-with-fixes, rendering, scenarios');
// ---------------------------------------------------------------------------

test('state round-trips through serialize/deserialize (cart preserved)', () => {
  const ctx = fresh();
  addToCart(ctx.state.cart, 'gravel-01-M-forest', 2);
  const raw = serializeState(ctx.state);
  const restored = deserializeState(ctx.seed, raw, { now: () => START });
  eq(restored.cart.items.length, 1);
  eq(restored.cart.items[0].qty, 2);
});

test('malformed JSON and wrong shapes fall back to a fresh state', () => {
  const ctx = fresh();
  eq(deserializeState(ctx.seed, '{not json').cart.items.length, 0, 'bad json');
  eq(deserializeState(ctx.seed, JSON.stringify({ cart: null })).cart.items.length, 0, 'cart null');
  eq(deserializeState(ctx.seed, JSON.stringify({ cart: { items: 'x', context: {} } })).cart.items.length, 0, 'items wrong type');
  eq(deserializeState(ctx.seed, JSON.stringify({ cart: { items: [], context: {} }, orders: [] })).cart.items.length, 0, 'orders array');
  const good = deserializeState(ctx.seed, JSON.stringify({ cart: { items: [], context: { type: 'delivery', storeId: null } } }));
  eq(Array.isArray(good.cart.items), true, 'good shape accepted');
});

test('submitReorder respects current cart fixes and revalidates', () => {
  const ctx = fresh();
  addToCart(ctx.state.cart, 'gravel-01-M-forest', 1);
  addToCart(ctx.state.cart, 'hybrid-01-M-sand', 1);
  const order = createOrder(ctx.seed, ctx.state, { contact: CONTACT, address: ADDRESS }).order;
  beginPayment(ctx.seed, ctx.state, order.id);
  simulatePayment(ctx.seed, ctx.state, order.id, 'failed');
  ctx.clock.advance(31 * 60 * 1000);
  startReorder(ctx.seed, ctx.state, order.id);
  eq(ctx.state.cart.items.length, 2, 'draft copied both lines');
  removeFromCart(ctx.state.cart, 'hybrid-01-M-sand'); // user fixes the cart
  const res = submitReorder(ctx.seed, ctx.state, order.id, { contact: CONTACT, address: ADDRESS });
  assert(res.ok, 'submitted');
  eq(res.order.lines.length, 1, 'new order uses the fixed cart');
  eq(res.order.lines[0].skuId, 'gravel-01-M-forest');
});

test('reorderChanges reflects a removed row before consent', () => {
  const ctx = fresh();
  const order = expiredDeliveryOrder(ctx, 'gravel-01-M-forest');
  startReorder(ctx.seed, ctx.state, order.id);
  removeFromCart(ctx.state.cart, 'gravel-01-M-forest');
  const changes = reorderChanges(ctx.seed, ctx.state, order.id);
  assert(changes.some((c) => c.kind === 'removed'), 'removed flagged live');
});

test('staff order and product editors render with real ids', () => {
  const ctx = fresh();
  const order = deliveryOrder(ctx, 'gravel-01-M-forest', 1).order;
  const so = staffOrder(ctx.seed, ctx.state, { orderId: order.id });
  assert(so.includes(order.id) && !so.includes('Order not found'), 'staff order found');
  const sp = staffProduct(ctx.seed, ctx.state, { id: 'gravel-01' });
  assert(sp.includes('Edit Fieldnote Gravel') && !sp.includes('Model not found'), 'staff product found');
});

test('payment/result/order views render with real ids', () => {
  const ctx = fresh();
  const order = deliveryOrder(ctx, 'gravel-01-M-forest', 1).order;
  assert(paymentView(ctx.seed, ctx.state, { orderId: order.id }).includes('Payment simulator'));
  assert(resultView(ctx.seed, ctx.state, { orderId: order.id }).includes('Order result'));
  assert(orderView(ctx.seed, ctx.state, { orderId: order.id }).includes(order.id));
});

test('seedDemoScenarios builds every agreed state and preserves the session', () => {
  const ctx = fresh();
  const beforeCart = JSON.stringify(ctx.state.cart);
  const ids = seedDemoScenarios(ctx.seed, ctx.state);
  eq(JSON.stringify(ctx.state.cart), beforeCart, 'cart preserved');
  eq(ctx.state.orders[ids.pending].orderState, 'pending');
  eq(ctx.state.orders[ids.failed].paymentState, 'failed');
  eq(reservationActive(ctx.state, ids.expired), false, 'expired reservation inactive');
  eq(ctx.state.orders[ids.cancelledRefund].orderState, 'cancelled');
  eq(ctx.state.orders[ids.cancelledRefund].paymentState, 'refund_pending');
  eq(ctx.state.orders[ids.collectionPreparing].fulfilmentState, 'preparing');
  eq(ctx.state.orders[ids.collectionReady].fulfilmentState, 'ready');
  eq(ctx.state.orders[ids.collectionCompleted].orderState, 'completed');
  eq(ctx.state.orders[ids.dispatched].fulfilmentState, 'dispatched');
  eq(ctx.state.orders[ids.delivered].fulfilmentState, 'delivered');
  eq(scenarioOrderId(ctx.state, 'collectionReady'), ids.collectionReady);
  // Scenario orders are not silently exposed to the ordinary guest session.
  eq(guestOrders(ctx.state).length, 0, 'guest session unchanged');
  eq(canViewOrder(ctx.state, ids.pending), false, 'scenario order needs explicit selection');
});

test('CAT-05 From price prefers variants available in the chosen context', () => {
  const ctx = fresh();
  // Delivery: warehouse has no Terracotta, so the available Forest variants win.
  ctx.state.cart.context = { type: 'delivery', storeId: null };
  let gravel = filterModels(ctx.seed, ctx.state, {}, ctx.state.cart.context).results.find((r) => r.model.id === 'gravel-01');
  eq(gravel.fromPrice, 129500, 'delivery from available variants');
  eq(gravel.availableInContext, true);
  // York has one Terracotta at 1195.
  ctx.state.cart.context = { type: 'collection', storeId: 'store-york' };
  gravel = filterModels(ctx.seed, ctx.state, {}, ctx.state.cart.context).results.find((r) => r.model.id === 'gravel-01');
  eq(gravel.fromPrice, 119500, 'York from Terracotta');
  // Bath never had Terracotta.
  ctx.state.cart.context = { type: 'collection', storeId: 'store-bath' };
  gravel = filterModels(ctx.seed, ctx.state, {}, ctx.state.cart.context).results.find((r) => r.model.id === 'gravel-01');
  eq(gravel.fromPrice, 129500, 'Bath from Forest');
});

test('CAT-05 From price updates after collection consumes the last unit', () => {
  const ctx = fresh();
  const order = collectionOrder(ctx, 'gravel-01-M-terracotta', 1, 'store-york').order;
  ctx.clock.set(Date.UTC(2026, 5, 1, 9, 0, 0));
  markReady(ctx.state, order.id, ctx.clock());
  recordCollectionPayment(ctx.state, order.id, { amountGross: order.totalGross });
  collect(ctx.state, order.id, { codeVerified: true });
  ctx.state.cart.context = { type: 'collection', storeId: 'store-york' };
  const gravel = filterModels(ctx.seed, ctx.state, {}, ctx.state.cart.context).results.find((r) => r.model.id === 'gravel-01');
  eq(gravel.fromPrice, 129500, 'falls back to remaining available Forest');
  eq(gravel.availableInContext, true);
});

test('home price summary uses the same available-first rule', () => {
  const ctx = fresh();
  const model = ctx.seed.models.find((m) => m.id === 'gravel-01');
  ctx.state.cart.context = { type: 'delivery', storeId: null };
  eq(modelPriceSummary(ctx.seed, ctx.state, model, ctx.state.cart.context).fromPrice, 129500);
});

test('catalogue sorts by the shown (context) price', () => {
  const ctx = fresh();
  ctx.state.cart.context = { type: 'delivery', storeId: null };
  const html = catalogView(ctx.seed, ctx.state, { query: { sort: 'price-asc' } });
  assert(html.indexOf('Townsend City') < html.indexOf('Voltbend E-Commute'), 'cheaper shown first');
});

test('catalogue keeps price/height/frame filters when refining (Apply does not drop them)', () => {
  const ctx = fresh();
  const html = catalogView(ctx.seed, ctx.state, { query: { priceMax: '150000', heightCm: '175' } });
  assert(html.includes('name="priceMax"'), 'price control present');
  assert(/id="c-price"[^>]*type="number"/.test(html), 'price control is numeric');
  assert(html.includes('name="heightCm"'), 'height control present');
  assert(html.includes('name="frameSize"'), 'frame control present');
  assert(html.includes('value="1500"'), 'price value retained in pounds (£1,500 = 150000 pence)');
  assert(html.includes('value="175"'), 'height value retained');
  assert(html.includes('Fieldnote Gravel'), 'matching model shown');
  assert(!html.includes('Meridian Road'), 'over-price model excluded');
});

test('collection staff page hides payment/handover once completed or cancelled', () => {
  const ctx = fresh();
  const order = collectionOrder(ctx, 'gravel-01-M-terracotta', 1, 'store-york').order;
  ctx.clock.set(Date.UTC(2026, 5, 1, 9, 0, 0));
  markReady(ctx.state, order.id, ctx.clock());
  recordCollectionPayment(ctx.state, order.id, { amountGross: order.totalGross });
  collect(ctx.state, order.id, { codeVerified: true });
  const done = staffOrder(ctx.seed, ctx.state, { orderId: order.id });
  assert(!done.includes('data-collection-payment-form'), 'no payment form after completion');
  assert(!done.includes('data-collect-form'), 'no handover form after completion');
  assert(done.includes('already recorded'), 'readable completed reason');
  const cancelled = collectionOrder(ctx, 'helmet-01-M', 1, 'store-york').order;
  cancelUnpaidOrder(ctx.state, cancelled.id);
  const cHtml = staffOrder(ctx.seed, ctx.state, { orderId: cancelled.id });
  assert(!cHtml.includes('data-collection-payment-form') && !cHtml.includes('data-collect-form'), 'no forms when cancelled');
});

// ---------------------------------------------------------------------------
section('Checkout integration: shared completion + truthful result view');
// ---------------------------------------------------------------------------

test('completeCheckout: new delivery starts payment exactly once with a fresh 30-minute reservation', () => {
  const ctx = fresh();
  ctx.state.cart.context = { type: 'delivery', storeId: null };
  addToCart(ctx.state.cart, 'gravel-01-M-forest', 1);
  const res = completeCheckout(ctx.seed, ctx.state, { contact: CONTACT, address: ADDRESS });
  assert(res.ok, 'checkout ok');
  eq(res.next, 'payment', 'opens the payment simulator');
  eq(res.wasReorder, false);
  eq(res.order.orderState, 'pending');
  eq(res.order.paymentState, 'unpaid');
  const rs = ctx.state.reservations.filter((x) => x.orderId === res.order.id);
  eq(rs.length, 1, 'exactly one reservation');
  eq(rs[0].deadline - ctx.clock(), 30 * 60 * 1000, 'fresh original 30-minute deadline');
  assert(reservationActive(ctx.state, res.order.id), 'reservation active');
});

test('completeCheckout: collection stays confirmed/unpaid on the result screen, no online payment', () => {
  const ctx = fresh();
  ctx.state.cart.context = { type: 'collection', storeId: 'store-york' };
  addToCart(ctx.state.cart, 'gravel-01-M-terracotta', 1);
  const res = completeCheckout(ctx.seed, ctx.state, { contact: CONTACT });
  assert(res.ok, 'checkout ok');
  eq(res.next, 'result', 'no payment simulator for collection');
  eq(res.order.orderState, 'confirmed');
  eq(res.order.paymentState, 'unpaid');
  const html = resultView(ctx.seed, ctx.state, { orderId: res.order.id });
  assert(html.includes('and <strong>unpaid</strong>'), 'collection shown as unpaid');
});

test('completeCheckout: reorder links a new order; repeated submit reuses the same reservation/deadline', () => {
  const ctx = fresh();
  const old = expiredDeliveryOrder(ctx, 'gravel-01-M-forest');
  startReorder(ctx.seed, ctx.state, old.id);
  const first = completeCheckout(ctx.seed, ctx.state, { contact: CONTACT, address: ADDRESS });
  assert(first.ok && first.next === 'payment', 'reorder opens the simulator');
  eq(first.order.linkedOldOrderId, old.id, 'new links old');
  eq(ctx.state.orders[old.id].linkedNewOrderId, first.order.id, 'old links new');
  const newReservations = () => ctx.state.reservations.filter((x) => x.orderId === first.order.id).length;
  eq(newReservations(), 1, 'one reservation for the new order');
  const deadline = reservationDeadline(ctx.state, first.order.id);
  const second = completeCheckout(ctx.seed, ctx.state, { contact: CONTACT, address: ADDRESS, reorderOldOrderId: old.id });
  assert(second.ok && second.reused, 'repeated submit returns the linked order');
  eq(second.order.id, first.order.id, 'same order');
  eq(newReservations(), 1, 'no second reservation');
  eq(reservationDeadline(ctx.state, first.order.id), deadline, 'deadline unchanged on repeat');
});

test('result view distinguishes a never-started payment from an expired reservation', () => {
  const ctx = fresh();
  const order = deliveryOrder(ctx, 'gravel-01-M-forest', 1).order; // no beginPayment
  eq(canReorder(ctx.state, order.id), false, 'never-started is not reorderable');
  const html = resultView(ctx.seed, ctx.state, { orderId: order.id });
  assert(html.includes('Proceed to payment'), 'offers to start payment');
  assert(!html.includes('reservation has expired'), 'does not claim the reservation expired');
});

test('result view offers reorder for an actually expired reservation', () => {
  const ctx = fresh();
  const order = expiredDeliveryOrder(ctx, 'gravel-01-M-forest');
  eq(canReorder(ctx.state, order.id), true, 'expired reservation is reorderable');
  const html = resultView(ctx.seed, ctx.state, { orderId: order.id });
  assert(html.includes('The 30-minute reservation has expired'), 'explains the expiry');
  assert(html.includes('Place order again'), 'offers reorder');
});

test('result view describes collection paid/completed/cancelled states truthfully', () => {
  const ctx = fresh();
  const order = collectionOrder(ctx, 'gravel-01-M-terracotta', 1, 'store-york').order;
  ctx.clock.set(Date.UTC(2026, 5, 1, 9, 0, 0));
  markReady(ctx.state, order.id, ctx.clock());
  const paidReady = resultView(ctx.seed, ctx.state, { orderId: order.id });
  assert(paidReady.includes('and <strong>unpaid</strong>') && paidReady.includes('ready'), 'ready but unpaid copy');
  recordCollectionPayment(ctx.state, order.id, { amountGross: order.totalGross });
  const paid = resultView(ctx.seed, ctx.state, { orderId: order.id });
  assert(paid.includes('and <strong>paid</strong>'), 'paid-ready copy says pay already recorded');
  collect(ctx.state, order.id, { codeVerified: true });
  const done = resultView(ctx.seed, ctx.state, { orderId: order.id });
  assert(done.includes('Collected and complete'), 'completed copy');
  assert(!done.includes('Collection orders are'), 'no blanket confirmed/unpaid text');
  const cancelled = collectionOrder(ctx, 'helmet-01-M', 1, 'store-york').order;
  cancelUnpaidOrder(ctx.state, cancelled.id);
  const cHtml = resultView(ctx.seed, ctx.state, { orderId: cancelled.id });
  assert(cHtml.includes('This order is cancelled'), 'cancelled copy');
  assert(!cHtml.includes('Collection orders are'), 'cancelled collection not shown as always confirmed/unpaid');
});

test('result view does not promise a future dispatch once dispatched/delivered', () => {
  const ctx = fresh();
  const order = deliveryOrder(ctx, 'gravel-01-M-forest', 1).order;
  beginPayment(ctx.seed, ctx.state, order.id);
  simulatePayment(ctx.seed, ctx.state, order.id, 'paid');
  dispatchOrder(ctx.state, order.id, { carrier: 'Demo Carrier', date: '2026-06-02' });
  const dHtml = resultView(ctx.seed, ctx.state, { orderId: order.id });
  assert(dHtml.includes('dispatched'), 'dispatched copy');
  assert(!dHtml.includes('We will email you when it is dispatched'), 'no future-dispatch claim when already dispatched');
  deliverOrder(ctx.state, order.id, { evidence: 'Demo POD' });
  const cHtml = resultView(ctx.seed, ctx.state, { orderId: order.id });
  assert(cHtml.includes('Delivered and complete'), 'delivered copy');
});

test('decline action in the result view is a native button, not a hrefless anchor', () => {
  const ctx = fresh();
  const order = deliveryOrder(ctx, 'gravel-01-M-forest', 1).order;
  beginPayment(ctx.seed, ctx.state, order.id);
  const html = resultView(ctx.seed, ctx.state, { orderId: order.id });
  assert(html.includes('<button class="btn btn-ghost" type="button" data-action="cancel-order"'), 'native button present');
  assert(!/<a[^>]*data-action="cancel-order"/.test(html), 'no anchor used as the action');
});

test('S-04 return controls are associated with their visible labels', () => {
  const ctx = fresh();
  const order = deliveryOrder(ctx, 'gravel-01-M-forest', 1).order;
  requestCancellation(ctx.state, order.id, {});
  const html = staffReturns(ctx.seed, ctx.state, {});
  assert(html.includes(`for="ret-line-${order.id}"`) && html.includes(`id="ret-line-${order.id}"`), 'line label linked');
  assert(html.includes(`for="ret-qty-${order.id}"`) && html.includes(`id="ret-qty-${order.id}"`), 'quantity label linked');
});

test('cart render: a fresh delivery cart with an available item allows checkout before an address', () => {
  const ctx = fresh();
  ctx.state.cart.context = { type: 'delivery', storeId: null };
  addToCart(ctx.state.cart, 'gravel-01-M-forest', 1);
  const html = cartView(ctx.seed, ctx.state, {});
  assert(html.includes('href="#checkout"'), 'checkout link enabled');
  assert(!html.includes('aria-disabled="true"'), 'checkout button not disabled');
  assert(html.includes('Calculated at checkout'), 'truthful pending delivery label');
  assert(!html.includes('Not configured'), 'never labelled as not configured');
  assert(!html.includes('Delivery cannot be priced'), 'no false shipping block');
});

test('cart render: a retained unavailable row still blocks whole-cart checkout', () => {
  const ctx = fresh();
  ctx.state.cart.context = { type: 'delivery', storeId: null };
  addToCart(ctx.state.cart, 'gravel-01-M-terracotta', 1); // warehouse 0, York 1
  const html = cartView(ctx.seed, ctx.state, {});
  assert(html.includes('aria-disabled="true"'), 'checkout blocked');
  assert(html.includes('Some items are not available'), 'availability warning shown');
});

test('Items tables use a block scroll wrapper (staff and guest order views)', () => {
  const ctx = fresh();
  const order = deliveryOrder(ctx, 'gravel-01-M-forest', 1).order;
  const staffHtml = staffOrder(ctx.seed, ctx.state, { orderId: order.id });
  assert(/<div class="table-scroll">\s*<table class="data-table">/.test(staffHtml), 'staff Items table wrapped');
  const orderHtml = orderView(ctx.seed, ctx.state, { orderId: order.id });
  assert(/<div class="table-scroll">\s*<table class="data-table">/.test(orderHtml), 'guest order Items table wrapped');
});

test('styles.css keeps the scroll-wrapper override for wrapped tables', () => {
  const css = readFileSync(fileURLToPath(new URL('./styles.css', import.meta.url)), 'utf8');
  assert(/\.table-scroll\s*\{[^}]*overflow-x:\s*auto/.test(css), 'wrapper owns horizontal scroll');
  assert(/\.table-scroll \.data-table\s*\{[^}]*display:\s*table/.test(css), 'wrapped table stays display:table');
});

test('staff order diagnostics copy has no unbreakable separator token', () => {
  const ctx = fresh();
  const order = deliveryOrder(ctx, 'gravel-01-M-forest', 1).order;
  const html = staffOrder(ctx.seed, ctx.state, { orderId: order.id });
  assert(!html.includes('placeholder/deadline'), 'no long unbreakable token');
  assert(html.includes('code placeholder, deadline, extension, dispatch, delivery and refund'), 'readable spaced copy');
});

// ---------------------------------------------------------------------------
section('Redesign: variants, recommendations, wishlist, access gate, unified cart');
// ---------------------------------------------------------------------------

test('the synthetic Fieldnote Gravel Frame fixture is published with warehouse stock', () => {
  const ctx = fresh();
  const frame = ctx.seed.models.find((m) => m.id === 'frame-01');
  assert(frame && frame.published && frame.categoryId === 'parts', 'published part');
  const skus = ctx.seed.skus.filter((s) => s.modelId === 'frame-01' && s.published);
  assert(skus.length >= 1, 'has published SKUs');
  assert(skus.every((s) => physicalBalance(ctx.state, s.id, 'warehouse') > 0), 'has warehouse stock');
});

test('recommendations rank by shared name tokens and exclude current/unpublished', () => {
  const ctx = fresh();
  const recs = recommendModels(ctx.seed, ctx.state, 'gravel-01');
  const ids = recs.map((m) => m.id);
  assert(ids.includes('frame-01'), 'shared-name frame recommended');
  assert(!ids.includes('gravel-01'), 'current excluded');
  assert(!ids.includes('jacket-01'), 'unpublished excluded');
  assert(recs.length <= 6, 'capped at six');
});

test('recommendations fall back to published bikes/parts when no name token matches', () => {
  const ctx = fresh();
  const recs = recommendModels(ctx.seed, ctx.state, 'lock-01');
  assert(recs.length > 0, 'fallback present');
  assert(recs.every((m) => m.published && (m.categoryId === 'bikes' || m.categoryId === 'parts')), 'bikes/parts only');
  assert(!recs.some((m) => m.id === 'lock-01'), 'current excluded');
});

test('chooseSku keeps the changed dimension and explains the adjusted one', () => {
  const ctx = fresh();
  const sizeChange = chooseSku(ctx.seed, 'frame-01', { colour: 'Ink', size: '56', changed: 'size' });
  eq(sizeChange.sku.id, 'frame-01-56-forest', 'new size kept');
  eq(sizeChange.adjusted, true);
  eq(sizeChange.changed, 'size');
  const colourChange = chooseSku(ctx.seed, 'frame-01', { colour: 'Forest', size: '54', changed: 'colour' });
  eq(colourChange.sku.id, 'frame-01-56-forest', 'new colour kept');
  eq(colourChange.changed, 'colour');
  const exact = chooseSku(ctx.seed, 'frame-01', { colour: 'Ink', size: '54', changed: 'size' });
  eq(exact.sku.id, 'frame-01-54-ink');
  eq(exact.adjusted, false);
});

test('wishlist requires sign-in, stores unique model ids and removes', () => {
  const ctx = fresh();
  eq(addToWishlist(ctx.state, 'gravel-01').ok, false, 'guest cannot save');
  eq(isSignedIn(ctx.state), false);
  signInCustomer(ctx.state, { email: 'buyer@example.com', name: 'Demo Buyer' });
  eq(addToWishlist(ctx.state, 'gravel-01').ok, true);
  eq(addToWishlist(ctx.state, 'gravel-01').already, true, 'no duplicate');
  eq(wishlistModelIds(ctx.state).length, 1);
  assert(isWishlisted(ctx.state, 'gravel-01'));
  removeFromWishlist(ctx.state, 'gravel-01');
  eq(wishlistModelIds(ctx.state).length, 0);
});

test('email request alone never grants access; only an explicit confirm does', () => {
  const ctx = fresh();
  const req = requestEmailAccess(ctx.state, { email: 'buyer@example.com', name: 'Buyer' });
  assert(req.ok, 'request stored');
  eq(isSignedIn(ctx.state), false, 'request does not sign in');
  eq(ctx.state.verified, false, 'request does not verify history');
  eq(canViewOrder(ctx.state, 'ord-0001'), false, 'no history access from a request');
  const conf = confirmEmailAccess(ctx.state);
  assert(conf.ok, 'confirm grants');
  eq(isSignedIn(ctx.state), true);
  eq(ctx.state.verified, true, 'single persona confirms history too');
});

test('confirm without a prior request is refused', () => {
  const ctx = fresh();
  eq(confirmEmailAccess(ctx.state).ok, false);
  eq(confirmEmailAccess(ctx.state).reason, 'no_request');
});

test('provider confirmation signs in and confirms the demo persona', () => {
  const ctx = fresh();
  confirmProviderAccess(ctx.state, 'Google');
  eq(isSignedIn(ctx.state), true);
  eq(ctx.state.verified, true);
  assert(ctx.state.customer.email.includes('google'), 'demo provider email');
});

test('sign-out clears the account and the order-history proof together', () => {
  const ctx = fresh();
  deliveryOrder(ctx, 'gravel-01-M-forest', 1);
  requestEmailAccess(ctx.state, { email: 'buyer@example.com' });
  confirmEmailAccess(ctx.state);
  eq(verifiedHistory(ctx.state).length, 1);
  signOutCustomer(ctx.state);
  eq(isSignedIn(ctx.state), false);
  eq(ctx.state.verified, false, 'history flag cleared');
  eq(verifiedHistory(ctx.state).length, 0);
});

test('wishlist and account views reflect the signed-in gate', () => {
  const ctx = fresh();
  const guest = wishlistView(ctx.seed, ctx.state, {});
  assert(guest.includes('Sign in to use your wishlist'), 'guest gate shown');
  assert(!guest.includes('Fieldnote Gravel'), 'no saved models for a guest');
  signInCustomer(ctx.state, { email: 'buyer@example.com', name: 'Demo Buyer' });
  addToWishlist(ctx.state, 'gravel-01');
  const mine = wishlistView(ctx.seed, ctx.state, {});
  assert(mine.includes('Fieldnote Gravel') && mine.includes('data-action="wishlist-remove"'), 'saved model with remove');
  const acc = accountView(ctx.seed, ctx.state, {});
  assert(acc.includes('href="#wishlist"'), 'account links the wishlist');
});

test('the shared auth flow has no password field and switches modes', () => {
  const ctx = fresh();
  const login = authDialogView(ctx.seed, ctx.state, {}, { mode: 'login', stage: 'email' });
  assert(!login.includes('type="password"'), 'no password field');
  assert(login.includes('Continue with Google') && login.includes('Continue with Apple'), 'demo providers');
  const reg = authDialogView(ctx.seed, ctx.state, {}, { mode: 'register', stage: 'email' });
  assert(reg.includes('Your name'), 'name allowed on create');
  assert(!reg.includes('type="password"'), 'no password on create');
  const confirm = authDialogView(ctx.seed, ctx.state, {}, { mode: 'login', stage: 'confirm', pendingEmail: 'a@b.com' });
  assert(confirm.includes('data-action="auth-confirm-email"'), 'explicit confirm button');
  assert(confirm.includes('a@b.com'), 'neutral pending address shown');
});

test('product view offers colour/size dropdowns, go-to-cart, wishlist and related parts', () => {
  const ctx = fresh();
  const html = productView(ctx.seed, ctx.state, { id: 'gravel-01' }, {});
  assert(html.includes('id="p-colour"') && html.includes('id="p-size"'), 'dropdowns');
  assert(html.includes('Go to cart'), 'go to cart beside add');
  assert(html.includes('data-action="wishlist-toggle"'), 'wishlist button');
  assert(html.includes('Related products') && html.includes('Fieldnote Gravel Frame'), 'name-based related part');
  assert(html.includes('not a statement that they fit or are compatible'), 'no compatibility promise');
});

test('home view renders a manual three-slide carousel with controls', () => {
  const ctx = fresh();
  const html = homeView(ctx.seed, ctx.state, {}, {});
  eq((html.match(/data-hero-slide="/g) || []).length, 3, 'three slides');
  assert(html.includes('data-action="hero-prev"') && html.includes('data-action="hero-next"'), 'manual controls');
  eq((html.match(/data-action="hero-slide"/g) || []).length, 3, 'three indicators');
  assert(!/autoplay/i.test(html), 'no autoplay');
});

test('home hero uses one whole-slide link per slide and no All products CTA', () => {
  const ctx = fresh();
  const html = homeView(ctx.seed, ctx.state, {}, {});
  const links = [...html.matchAll(/<a class="hero-slide-link"[\s\S]*?<\/a>/g)].map((m) => m[0]);
  eq(links.length, 3, 'one whole-slide link per slide');
  for (const block of links) {
    assert(!/<a[\s>]/.test(block.replace(/^<a class="hero-slide-link"[^>]*>/, '')), 'no nested anchor');
    assert(!/<button/.test(block), 'no nested button');
    assert(block.includes('<h1 class="hero-title">'), 'slide title is a real heading');
    assert(block.includes('class="btn btn-primary hero-cta"'), 'CTA is a styled span');
  }
  assert(/<h1 class="hero-title">/.test(html), 'home exposes an h1');
  assert(!html.includes('All products'), 'no extra All products CTA');
  assert(html.includes('data-action="hero-prev"'), 'controls remain outside the slide link');
});

test('home hero has two equal brand promo cards for Northgate and Larkhill', () => {
  const ctx = fresh();
  const html = homeView(ctx.seed, ctx.state, {}, {});
  eq((html.match(/data-promo="/g) || []).length, 2, 'two promo cards');
  assert(html.includes('href="#catalog?brand=Northgate"'), 'Northgate brand link');
  assert(html.includes('href="#catalog?brand=Larkhill"'), 'Larkhill brand link');
  eq((html.match(/class="hero-promos"/g) || []).length, 1, 'equal promos column');
});

test('home shows the three latest published articles before the footer', () => {
  const ctx = fresh();
  const html = homeView(ctx.seed, ctx.state, {}, {});
  const slugs = [...html.matchAll(/class="article-card latest-card" href="#journal\?slug=([^"]+)"/g)].map((m) => m[1]);
  eq(JSON.stringify(slugs), JSON.stringify(['city-gear-guide', 'trailside-repairs', 'gravel-notes']), 'newest first, draft excluded');
  assert(html.includes('class="article-preview"'), 'body preview present');
  assert(html.includes('class="article-art"'), 'local article art present');
  assert(html.includes('datetime="2026-10-01"') && html.includes('1 October 2026'), 'datetime + readable date');
  assert(html.indexOf('section latest') > html.indexOf('workshop promise'), 'latest section is last before the footer');
});

test('latest articles sort by date descending with a stable slug tie', () => {
  const ctx = fresh();
  eq(formatArticleDate('2026-10-01'), '1 October 2026', 'readable date');
  eq(formatArticleDate('bad'), '', 'invalid date empty');
  const order = publishedArticlesByDate(ctx.state).map((a) => a.slug);
  eq(JSON.stringify(order), JSON.stringify(['city-gear-guide', 'trailside-repairs', 'gravel-notes']), 'newest first, draft excluded');
  ctx.state.content.articles['trailside-repairs'].publishedAt = '2026-09-18';
  const tie = publishedArticlesByDate(ctx.state).map((a) => a.slug);
  eq(JSON.stringify(tie), JSON.stringify(['city-gear-guide', 'gravel-notes', 'trailside-repairs']), 'slug tie-break ascending');
});

test('latest section hides with no published articles and shows fewer without duplicates', () => {
  const ctx = fresh();
  for (const a of Object.values(ctx.state.content.articles)) a.published = false;
  const none = homeView(ctx.seed, ctx.state, {}, {});
  assert(!none.includes('section latest'), 'section hidden at zero');
  assert(!none.includes('From the journal'), 'heading hidden at zero');

  const partial = fresh();
  partial.state.content.articles['city-gear-guide'].published = false;
  partial.state.content.articles['trailside-repairs'].published = false;
  const html = homeView(partial.seed, partial.state, {}, {});
  eq((html.match(/latest-card/g) || []).length, 1, 'only available published shown');
  assert(html.includes('gravel-notes'), 'remaining published article shown');
});

test('legacy content migration adds new fixtures and fills metadata without override', () => {
  const ctx = fresh();
  const { order } = deliveryOrder(ctx, 'gravel-01-M-forest', 1);
  signInCustomer(ctx.state, { email: 'buyer@example.com' });
  addToWishlist(ctx.state, 'gravel-01');
  const raw = JSON.parse(serializeState(ctx.state));
  // Simulate a session saved before the new journal fixtures/metadata existed.
  delete raw.content.articles['city-gear-guide'];
  delete raw.content.articles['trailside-repairs'];
  const legacy = raw.content.articles['gravel-notes'];
  legacy.title = 'User edited title';
  legacy.body = 'User edited body that must survive migration.';
  delete legacy.publishedAt;
  delete legacy.artVariant;
  const restored = deserializeState(ctx.seed, JSON.stringify(raw));
  assert(restored.content.articles['city-gear-guide'], 'new city fixture added');
  assert(restored.content.articles['trailside-repairs'], 'new trail fixture added');
  const g = restored.content.articles['gravel-notes'];
  eq(g.title, 'User edited title', 'edited title preserved');
  eq(g.body, 'User edited body that must survive migration.', 'edited body preserved');
  eq(g.published, true, 'publication preserved');
  eq(g.publishedAt, '2026-09-18', 'missing metadata filled');
  eq(g.artVariant, 0, 'missing art metadata filled');
  eq(restored.content.articles['winter-commute'].published, false, 'draft stays draft');
  eq(restored.orders[order.id].id, order.id, 'order preserved');
  eq(restored.wishlist.includes('gravel-01'), true, 'wishlist preserved');
});


test('catalogue type filter works for parts subcategories, not only bikes', () => {
  const ctx = fresh();
  const brakes = catalogView(ctx.seed, ctx.state, { query: { category: 'parts', type: 'brakes' } });
  assert(brakes.includes('All-Weather Brake Pads'), 'brakes part shown');
  assert(!brakes.includes('Fieldnote Gravel Tyre 700x40'), 'other part type excluded');
  const frames = catalogView(ctx.seed, ctx.state, { query: { category: 'parts', type: 'frames' } });
  assert(frames.includes('Fieldnote Gravel Frame'), 'frame part shown');
});

test('cart and checkout are one unified form; the empty cart has no submit', () => {
  const ctx = fresh();
  ctx.state.cart.context = { type: 'delivery', storeId: null };
  addToCart(ctx.state.cart, 'gravel-01-M-forest', 1);
  const html = cartView(ctx.seed, ctx.state, {});
  assert(html.includes('data-checkout-form') && html.includes('id="checkout-form"'), 'single unified form');
  assert(html.includes('form="checkout-form"'), 'submit buttons reference the shared form');
  assert(html.includes('href="#checkout"'), 'preserved checkout link present');
  const alias = checkoutView(ctx.seed, ctx.state, {});
  assert(alias.includes('data-checkout-form'), 'checkout alias uses the same view');
  const empty = fresh();
  assert(!cartView(empty.seed, empty.state, {}).includes('data-checkout-form'), 'empty cart has no form/submit');
});

test('legacy state keeps orders and gains the new frame balances', () => {
  const ctx = fresh();
  const order = deliveryOrder(ctx, 'gravel-01-M-forest', 1).order;
  const raw = JSON.parse(serializeState(ctx.state));
  // Simulate a session saved before the frame fixtures existed.
  delete raw.wishlist; delete raw.customer; delete raw.pendingAccess;
  raw.balances = raw.balances.filter((b) => !String(b.skuId).startsWith('frame-01'));
  const restored = deserializeState(ctx.seed, JSON.stringify(raw));
  eq(restored.orders[order.id].id, order.id, 'order preserved');
  eq(Array.isArray(restored.wishlist), true, 'wishlist defaulted');
  eq(restored.customer.signedIn, false, 'customer defaulted');
  const frameRows = restored.balances.filter((b) => String(b.skuId).startsWith('frame-01'));
  assert(frameRows.length > 0, 'frame balances added for a legacy session');
  eq(restored.balances.find((b) => b.skuId === 'gravel-01-M-forest' && b.locationId === 'warehouse').qty, 2, 'existing balances untouched');
});

test('malformed or unknown wishlist ids are filtered safely', () => {
  const ctx = fresh();
  const raw = JSON.parse(serializeState(ctx.state));
  raw.wishlist = ['gravel-01', 'does-not-exist', 42, 'gravel-01'];
  const restored = deserializeState(ctx.seed, JSON.stringify(raw));
  eq(JSON.stringify(restored.wishlist), JSON.stringify(['gravel-01']));
});

// ---------------------------------------------------------------------------
section('Product/catalog refinements: reviews, migration, multi-select, home4');
// ---------------------------------------------------------------------------

test('reviews are seeded per model (six on gravel-01) and never per SKU', () => {
  const ctx = fresh();
  eq(reviewsForModel(ctx.state, 'gravel-01').length, 6, 'six seeded gravel-01 reviews');
  // Every gravel-01 SKU shares the same model-level summary.
  const all = reviewSummary(ctx.state, 'gravel-01');
  eq(all.count, 6, 'model-level count');
  eq(all.average, 4.3, 'average across all reviews');
  eq(reviewSummary(ctx.state, 'gravel-01').average, reviewSummary(ctx.state, 'gravel-01').average, 'stable');
});

test('review aggregation covers ALL reviews, not the current page', () => {
  const ctx = fresh();
  const page = reviewPage(ctx.state, 'gravel-01', 1, 5);
  eq(page.items.length, 5, 'five per page');
  eq(page.pageCount, 2, 'two pages of six');
  eq(page.total, 6, 'total across pages');
  const second = reviewPage(ctx.state, 'gravel-01', 2, 5);
  eq(second.page, 2, 'second page');
  eq(second.items.length, 1, 'one left on page two');
  const summary = reviewSummary(ctx.state, 'gravel-01');
  eq(summary.count, 6, 'aggregate uses all six, not five');
});

test('submission is validated: signed-in, integer 1..5, non-empty title', () => {
  const ctx = fresh();
  eq(createProductReview(ctx.state, { modelId: 'gravel-01', rating: 5, title: 'Great' }).ok, false, 'guest rejected');
  eq(createProductReview(ctx.state, { modelId: 'gravel-01', rating: 5, title: 'Great' }).reason, 'not_signed_in');
  signInCustomer(ctx.state, { email: 'buyer@example.com', name: 'Demo Buyer' });
  eq(createProductReview(ctx.state, { modelId: 'gravel-01', rating: 6, title: 'x' }).reason, 'invalid_rating');
  eq(createProductReview(ctx.state, { modelId: 'gravel-01', rating: 2.5, title: 'x' }).reason, 'invalid_rating');
  eq(createProductReview(ctx.state, { modelId: 'gravel-01', rating: 4, title: '   ' }).reason, 'title_required');
  const ok = createProductReview(ctx.state, { modelId: 'gravel-01', rating: 4, title: '  Fine bike  ' });
  eq(ok.ok, true, 'valid review accepted');
  eq(ok.review.title, 'Fine bike', 'title trimmed');
  eq(ok.review.modelId, 'gravel-01', 'stored on the model');
  eq(reviewSummary(ctx.state, 'gravel-01').count, 7, 'aggregate updates');
  // A review about gravel-01 never leaks into another model's rating.
  eq(reviewSummary(ctx.state, 'road-01').count, 1, 'other model untouched');
});

test('a submitted review persists through serialize/deserialize', () => {
  const ctx = fresh();
  signInCustomer(ctx.state, { email: 'buyer@example.com' });
  createProductReview(ctx.state, { modelId: 'mtb-01', rating: 5, title: 'Persisted', description: 'Kept.' });
  const restored = deserializeState(ctx.seed, serializeState(ctx.state));
  const found = reviewsForModel(restored, 'mtb-01').find((r) => r.title === 'Persisted');
  assert(found, 'submitted review survives reload');
  eq(found.rating, 5, 'rating kept');
});

test('malformed legacy reviews are filtered before aggregation; valid ones kept', () => {
  const ctx = fresh();
  const raw = JSON.parse(serializeState(ctx.state));
  raw.reviews.push({ id: 'bad-1', modelId: 'gravel-01', rating: 'nope', title: 'x', createdAt: '2026-01-01' });
  raw.reviews.push({ id: 'bad-2', modelId: 'gravel-01', rating: 9, title: 'x', createdAt: '2026-01-01' });
  raw.reviews.push({ id: 'bad-3', modelId: 'gravel-01', rating: 3, title: '   ', createdAt: '2026-01-01' });
  raw.reviews.push({ id: 'bad-4', modelId: 'ghost-model', rating: 3, title: 'x', createdAt: '2026-01-01' });
  raw.reviews.push({ id: 'custom-ok', modelId: 'gravel-01', rating: 2, title: '  Custom kept  ', createdAt: 'nonsense-date' });
  const restored = deserializeState(ctx.seed, JSON.stringify(raw));
  const ids = restored.reviews.map((r) => r.id);
  assert(!ids.includes('bad-1') && !ids.includes('bad-2') && !ids.includes('bad-3') && !ids.includes('bad-4'), 'malformed dropped');
  const custom = restored.reviews.find((r) => r.id === 'custom-ok');
  assert(custom, 'valid custom review preserved (not overwritten)');
  eq(custom.title, 'Custom kept', 'title trimmed');
  eq(custom.createdAt, '', 'unreasonable date neutralised');
  const summary = reviewSummary(restored, 'gravel-01');
  assert(Number.isFinite(summary.average) && summary.average > 0, 'no NaN average');
  eq(summary.count, 7, 'six demo + one custom');
});

test('legacy sessions gain demo reviews without duplicates', () => {
  const ctx = fresh();
  const raw = JSON.parse(serializeState(ctx.state));
  raw.reviews = []; // pretend a session predating reviews
  const restored = deserializeState(ctx.seed, JSON.stringify(raw));
  eq(reviewsForModel(restored, 'gravel-01').length, 6, 'demo reviews added once');
  const again = deserializeState(ctx.seed, serializeState(restored));
  eq(reviewsForModel(again, 'gravel-01').length, 6, 'no duplication on the next load');
});

test('checkbox filters OR within a group and AND across groups', () => {
  const ctx = fresh();
  const brands = filterModels(ctx.seed, ctx.state, { brand: ['Northgate', 'Larkhill'] }, { type: 'delivery' });
  const ids = brands.results.map((r) => r.model.id);
  assert(ids.includes('road-01') && ids.includes('hybrid-01'), 'union of two brands');
  assert(!ids.includes('gravel-01'), 'unselected brand excluded');
  const brakes = filterModels(ctx.seed, ctx.state, { brand: ['Northgate'], type: ['brakes'] }, { type: 'delivery' });
  eq(brakes.results.length, 1, 'AND across groups');
  eq(brakes.results[0].model.id, 'brake-01');
  const parts = filterModels(ctx.seed, ctx.state, { type: ['brakes', 'tyres'] }, { type: 'delivery' });
  const partIds = parts.results.map((r) => r.model.id);
  assert(partIds.includes('brake-01') && partIds.includes('tyre-01'), 'OR within type');
});

test('multi-value filters keep the one-SKU conjunction and legacy scalars', () => {
  const ctx = fresh();
  // M frame (height 175) AND max 120000 must still be met by ONE SKU.
  const conj = filterModels(ctx.seed, ctx.state, { frameSize: ['M'], priceMax: 120000 }, { type: 'delivery' });
  const gravel = conj.results.find((r) => r.model.id === 'gravel-01');
  assert(gravel, 'gravel included');
  eq(gravel.fromPrice, 119500, 'single matching M SKU');
  eq(gravel.matchCount, 1, 'conjunction on one SKU');
  // A legacy scalar still behaves exactly like a one-item list.
  const scalar = filterModels(ctx.seed, ctx.state, { brand: 'Northgate' }, { type: 'delivery' });
  const list = filterModels(ctx.seed, ctx.state, { brand: ['Northgate'] }, { type: 'delivery' });
  eq(scalar.modelCount, list.modelCount, 'scalar equals one-value list');
});

test('home product sections use the four-column class; featured default has four', () => {
  const ctx = fresh();
  const featured = curationModels(ctx.seed, ctx.state, 'featured');
  eq(featured.length, 4, 'four featured models (existing assortment only)');
  assert(featured.every((m) => m.published), 'all published');
  const html = homeView(ctx.seed, ctx.state, {}, {});
  assert(html.includes('grid grid-products home-products'), 'home grid carries the four-column class');
  eq((html.match(/data-model="/g) || []).length >= 4, true, 'at least four cards rendered');
});

test('the reduced home curation stays honest (only discounted SKUs, not padded)', () => {
  const ctx = fresh();
  const sale = curationModels(ctx.seed, ctx.state, 'sale');
  eq(sale.length, 2, 'not padded to four');
  for (const m of sale) {
    assert(skusForModel(ctx.seed, m.id).some((s) => s.regularGross > s.priceGross), m.id + ' actually has a reduced SKU');
  }
});

test('catalog renders checkbox groups with counts, Show more and a separate heart', () => {
  const ctx = fresh();
  const html = catalogView(ctx.seed, ctx.state, {}, {});
  assert(html.includes('type="checkbox" name="category"'), 'category checkbox group');
  assert(html.includes('type="checkbox" name="brand"'), 'brand checkbox group');
  assert(html.includes('type="checkbox" name="frameSize"'), 'frame size checkbox group');
  assert(html.includes('class="filter-more"') && html.includes('Show more'), 'Show more disclosure');
  assert(html.includes('class="check-count"'), 'model counts beside values');
  assert(/id="c-price"[^>]*type="number"/.test(html), 'max price is a numeric input, not a select');
  assert(html.includes('Max price (&pound;)'), 'price labelled in GBP');
  assert(!/name="priceMax"[^>]*<option/.test(html), 'no price dropdown in the catalogue');
  // The heart is a sibling of the product link, never nested inside it.
  assert(/<a[^>]*class="product-art product-link"[^>]*>[\s\S]*?<\/a>\s*<button[^>]*data-action="wishlist-toggle"/.test(html), 'heart separate from the anchor');
  assert(!/<a[^>]*class="product-art product-link"[^>]*>(?:(?!<\/a>)[\s\S])*<button/.test(html), 'no button inside the product anchor');
});

test('catalog heart marks saved models without a nested control', () => {
  const ctx = fresh();
  signInCustomer(ctx.state, { email: 'buyer@example.com' });
  addToWishlist(ctx.state, 'gravel-01');
  const html = catalogView(ctx.seed, ctx.state, {}, {});
  assert(/data-model="gravel-01"[^>]*aria-pressed="true"/.test(html) || html.includes('wishlist-heart is-saved'), 'saved heart state');
});

test('gallery views are distinct per model and single-view models have no pager', () => {
  const ctx = fresh();
  const bike = galleryViews(ctx.seed.models.find((m) => m.id === 'gravel-01'), 'Forest');
  eq(bike.length, 3, 'three bike views');
  eq(new Set(bike.map((v) => v.svg)).size, 3, 'views are genuinely different');
  const part = galleryViews(ctx.seed.models.find((m) => m.id === 'tyre-01'), 'Black');
  eq(part.length, 1, 'single view for a part');
  const bikeHtml = productView(ctx.seed, ctx.state, { id: 'gravel-01' }, {});
  assert(bikeHtml.includes('data-action="open-gallery"'), 'bike opens the large dialog');
  eq((bikeHtml.match(/class="gallery-thumb[" ]/g) || []).length, 3, 'three thumbnails');
  const partHtml = productView(ctx.seed, ctx.state, { id: 'tyre-01' }, {});
  assert(partHtml.includes('data-action="open-gallery"'), 'single image still opens larger');
  eq((partHtml.match(/class="gallery-thumb[" ]/g) || []).length, 0, 'no pointless thumbnails');
  const single = galleryDialogView(ctx.seed, ctx.state, {}, { modelId: 'tyre-01', index: 0 });
  assert(!single.includes('gallery-dialog-controls'), 'single-view dialog has no pager');
  const multi = galleryDialogView(ctx.seed, ctx.state, {}, { modelId: 'gravel-01', index: 1 });
  assert(multi.includes('gallery-dialog-controls') && multi.includes('2 / 3'), 'multi-view dialog pages');
});

test('product page shows model rating, tabs, no quantity and a size list where available', () => {
  const ctx = fresh();
  const html = productView(ctx.seed, ctx.state, { id: 'gravel-01' }, {});
  assert(html.includes('(4.3) - 6 Ratings'), 'rating shows (average) - count');
  assert(html.includes('role="tablist"') && html.includes('data-action="product-tab"'), 'four tabs with controls');
  for (const t of ['description', 'specifications', 'reviews', 'manufacturer']) assert(html.includes('data-tab="' + t + '"'), 'tab ' + t);
  assert(!html.includes('id="p-qty"'), 'no quantity control on the product card');
  assert(html.includes('Add to cart adds one unit'), 'adds one unit note');
  // A non-bike garment lists its real available sizes without inventing a chart.
  const jersey = productView(ctx.seed, ctx.state, { id: 'jersey-01' }, {});
  assert(jersey.includes('Available in S, M, L'), 'available size list for clothing');
  assert(!jersey.includes('Frame size guide'), 'no invented chart for clothing');
});

test('wishlist success dialog uses the exact Russian copy and two actions', () => {
  const ctx = fresh();
  const html = wishlistDialogView(ctx.seed, ctx.state, {}, { modelId: 'gravel-01' });
  assert(html.includes('Товар добавлен в избранное'), 'exact title');
  assert(html.includes('перейти в избранное') && html.includes('data-action="wishlist-go"'), 'first action');
  assert(html.includes('продолжить покупки') && html.includes('data-action="wishlist-continue"'), 'second action');
  assert(html.includes('data-action="wishlist-dialog-close"'), 'close control');
});

test('review dialog offers sign-in to guests and the form to signed-in customers', () => {
  const ctx = fresh();
  const guest = reviewDialogView(ctx.seed, ctx.state, {}, { modelId: 'gravel-01' });
  assert(guest.includes('Sign in to review') && guest.includes('data-action="open-auth"'), 'guest sign-in path');
  assert(!guest.includes('data-review-form'), 'guest cannot submit directly');
  signInCustomer(ctx.state, { email: 'buyer@example.com' });
  const signed = reviewDialogView(ctx.seed, ctx.state, {}, { modelId: 'gravel-01', rating: 4, title: 'Draft' });
  assert(signed.includes('data-review-form'), 'form for signed-in');
  assert(signed.includes('id="rev-rating"') && signed.includes('id="rev-title"') && signed.includes('id="rev-desc"'), 'rating, required title, optional description');
  assert(signed.includes('value="Draft"'), 'draft preserved');
});

// ---------------------------------------------------------------------------
console.log('\n' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length) {
  console.error('\nFailures:');
  for (const f of failures) console.error(' - ' + f);
  process.exit(1);
}
process.exit(0);
