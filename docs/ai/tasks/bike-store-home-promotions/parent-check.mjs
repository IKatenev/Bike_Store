import assert from 'node:assert/strict';
import {createSeed} from '../../../../prototype/fixtures.mjs';
import {createInitialState, deserializeState, serializeState, latestArticles} from '../../../../prototype/domain.mjs';

const seed = createSeed();
const state = createInitialState(seed);
state.content.articles = {
  b: {slug:'b',published:true,publishedAt:'2026-10-02',body:'B'},
  draft: {slug:'draft',published:false,publishedAt:'2026-10-10',body:'Hidden'},
  a: {slug:'a',published:true,publishedAt:'2026-10-02',body:'A'},
  old: {slug:'old',published:true,publishedAt:'2026-09-01',body:'Old'},
  newest: {slug:'newest',published:true,publishedAt:'2026-10-09',body:'New'}
};
assert.deepEqual(latestArticles(state).map(a=>a.slug),['newest','a','b']);
state.content.articles.a.published = false;
state.content.articles.b.published = false;
state.content.articles.old.published = false;
assert.deepEqual(latestArticles(state).map(a=>a.slug),['newest']);
state.content.articles.newest.published = false;
assert.deepEqual(latestArticles(state),[]);

const legacy = createInitialState(seed);
legacy.content.articles = {
  'gravel-notes': {slug:'gravel-notes',title:'Owner edited title',body:'Owner edited body',published:false},
  'winter-commute': {slug:'winter-commute',title:'Winter',body:'Hidden',published:false}
};
legacy.wishlist = ['gravel-01'];
legacy.cart.lines = [{skuId:'gravel-01-S-sand',qty:1}];
const restored = deserializeState(seed,serializeState(legacy));
assert.equal(restored.content.articles['gravel-notes'].title,'Owner edited title');
assert.equal(restored.content.articles['gravel-notes'].body,'Owner edited body');
assert.equal(restored.content.articles['gravel-notes'].published,false);
assert.ok(restored.content.articles['gravel-notes'].publishedAt);
assert.equal(latestArticles(restored).length,2);
assert.deepEqual(restored.wishlist,legacy.wishlist);
assert.deepEqual(restored.cart,legacy.cart);
assert.deepEqual(restored.orders,legacy.orders);
console.log('Independent parent: latest date/tie/draft/short/empty selection and legacy content/cart/orders/wishlist preservation passed.');
