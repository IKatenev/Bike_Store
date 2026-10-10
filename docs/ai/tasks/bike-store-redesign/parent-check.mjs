import assert from 'node:assert/strict';
import { createSeed } from '../../../../prototype/fixtures.mjs';
import {
  createInitialState, serializeState, deserializeState, addToCart,
  signInCustomer, signOutCustomer, addToWishlist, removeFromWishlist,
  wishlistModels, recommendModels, chooseSku, skuOptionValue,
  filterModels, requestEmailAccess, confirmEmailAccess
} from '../../../../prototype/domain.mjs';

const seed = createSeed();
const state = createInitialState(seed);
const source = seed.models.find(m => m.id === 'gravel-01');
assert.equal(addToWishlist(state, source.id).ok, false);
assert.deepEqual(state.wishlist, []);
assert.equal(confirmEmailAccess(state).ok,false);
requestEmailAccess(state,{email:'review@example.test'});
assert.equal(state.customer.signedIn,false);
assert.equal(state.verified,false);
assert.equal(addToWishlist(state,source.id).ok,false);
confirmEmailAccess(state);
assert.equal(state.customer.signedIn,true);
assert.equal(state.verified,true);
signInCustomer(state, { email: 'review@example.test' });
addToWishlist(state, source.id);
addToWishlist(state, source.id);
assert.deepEqual(state.wishlist, [source.id]);
const roundTrip = deserializeState(seed, serializeState(state));
assert.deepEqual(wishlistModels(seed, roundTrip).map(m => m.id), [source.id]);
removeFromWishlist(roundTrip, source.id);
assert.deepEqual(roundTrip.wishlist, []);
signOutCustomer(state);
assert.equal(state.verified,false);
assert.equal(removeFromWishlist(state, source.id).ok, false);

const legacy = createInitialState(seed);
addToCart(legacy.cart, seed.skus.find(s => s.modelId === source.id).id, 1);
legacy.orders.preserved = { id: 'preserved', marker: 'original data' };
const raw = JSON.parse(serializeState(legacy));
raw.balances = raw.balances.filter(b=>!b.skuId.startsWith('frame-01'));
raw.balances[0].qty = 0;
delete raw.customer;
delete raw.wishlist;
const migrated = deserializeState(seed, JSON.stringify(raw));
assert.equal(migrated.orders.preserved.marker, 'original data');
assert.equal(migrated.cart.items.length, 1);
assert.deepEqual(migrated.wishlist, []);
assert.equal(migrated.balances[0].qty,0);
assert.ok(migrated.balances.some(b=>b.skuId==='frame-01-54-ink' && b.qty===3));
raw.wishlist = [source.id, source.id, 'unknown', null, 12];
raw.customer = 'bad';
const sanitised = deserializeState(seed, JSON.stringify(raw));
assert.deepEqual(sanitised.wishlist, [source.id]);
assert.equal(sanitised.customer.signedIn, false);

const related = recommendModels(seed, state, source.id);
assert.ok(related.length);
assert.ok(related.some(m=>m.name==='Fieldnote Gravel Frame'));
assert.ok(related.every(m => m.id !== source.id && m.published));
const rankingSeed = { ...seed, models: [source,
  {...source,id:'partial',name:'Gravel Toolkit',brand:'Other'},
  {...source,id:'closest',name:'Fieldnote Gravel Replacement',brand:'Other'},
  {...source,id:'unpublished',name:source.name,published:false},
  {...source,id:'brand-only',name:'Workshop Component'}] };
assert.deepEqual(recommendModels(rankingSeed, state, source.id).map(m=>m.id), ['closest','partial']);
const fallbackSeed = { ...seed, models: seed.models.map(m => m.id === source.id ? {...m,name:'UniqueReviewToken'} : m) };
assert.ok(recommendModels(fallbackSeed,state,source.id).every(m=>['bikes','parts'].includes(m.categoryId) && m.id !== source.id));

for (const sku of seed.skus.filter(s=>s.modelId===source.id && s.published)) {
  const selected = chooseSku(seed, source.id, {colour:sku.colour,size:skuOptionValue(sku)});
  assert.equal(selected.sku.colour, sku.colour);
  assert.equal(skuOptionValue(selected.sku), skuOptionValue(sku));
}
const adjusted = chooseSku(seed,source.id,{colour:'nonexistent',size:'nonexistent'});
assert.ok(seed.skus.some(s=>s.id===adjusted.sku.id));
const frameSizeFirst=chooseSku(seed,'frame-01',{colour:'Ink',size:'56',changed:'size'});
assert.equal(skuOptionValue(frameSizeFirst.sku),'56');
assert.equal(frameSizeFirst.sku.colour,'Forest');
const frameColourFirst=chooseSku(seed,'frame-01',{colour:'Ink',size:'56',changed:'colour'});
assert.equal(frameColourFirst.sku.colour,'Ink');
assert.equal(skuOptionValue(frameColourFirst.sku),'54');
const frames = filterModels(seed,state,{categoryId:'parts',type:'frames'},state.cart.context).results;
assert.ok(frames.some(r=>r.model.name==='Fieldnote Gravel Frame'));
console.log('Parent independent review: wishlist gating/persistence, legacy storage, recommendation ranking/fallback, real SKU selection and frame filter passed.');
