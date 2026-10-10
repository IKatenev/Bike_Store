// Synthetic prototype fixtures for PEDAL & FIELD (draft demo brand).
// No real business data. Prices are integer pence, gross (VAT included).
// Canonical names follow docs/THESAURUS.md.

export const DEMO_BRAND = 'PEDAL & FIELD';

export const TAX_CATEGORIES = [
  { id: 'std', name: 'Demo VAT 20% (synthetic)', rate: 0.2, synthetic: true },
  { id: 'low', name: 'Demo VAT 5% (synthetic)', rate: 0.05, synthetic: true }
];

export const SHIPPING_CLASSES = [
  { id: 'standard', name: 'Standard parcel' },
  { id: 'bicycle', name: 'Bicycle' },
  { id: 'oversized', name: 'Oversized non-bicycle' }
];

// Synthetic tariff table. Real tariffs are launch data (UX-L-01); these are demo only.
export const TARIFFS = {
  currency: 'GBP',
  // base cost per shipping class for a supported address
  base: { standard: 495, bicycle: 1995, oversized: 1495 },
  // surcharge per additional item beyond the first in the same class
  extra: { standard: 0, bicycle: 1500, oversized: 500 }
};

// Synthetic region set. England/Wales/mainland Scotland supported.
// Excluded / unconfigured values are demo labels only, not real postcode rules.
export const REGIONS = [
  { id: 'england', name: 'England (supported demo)', supported: true },
  { id: 'wales', name: 'Wales (supported demo)', supported: true },
  { id: 'scotland-mainland', name: 'Mainland Scotland (supported demo)', supported: true },
  { id: 'northern-ireland', name: 'Northern Ireland (excluded demo)', supported: false },
  { id: 'isle-of-man', name: 'Isle of Man (excluded demo)', supported: false },
  { id: 'scottish-islands', name: 'Scottish Islands (excluded demo)', supported: false },
  { id: 'unconfigured', name: 'Unconfigured demo region (no tariff)', supported: null }
];

const bikeChartStandard = [
  { frameSize: 'S', minCm: 152, maxCm: 166 },
  { frameSize: 'M', minCm: 165, maxCm: 178 },
  { frameSize: 'L', minCm: 177, maxCm: 190 }
];

// Overlapping ranges are intentional (demo of ambiguity handling).
const bikeChartOverlap = [
  { frameSize: '52', minCm: 160, maxCm: 172 },
  { frameSize: '54', minCm: 168, maxCm: 178 },
  { frameSize: '56', minCm: 175, maxCm: 188 }
];

function sku(o) {
  return {
    id: o.id,
    modelId: o.modelId,
    skuCode: o.skuCode,
    colour: o.colour,
    size: o.size || null,
    frameSize: o.frameSize || null,
    priceGross: o.priceGross,
    regularGross: o.regularGross || o.priceGross,
    taxCategoryId: o.taxCategoryId || 'std',
    shippingClassId: o.shippingClassId || 'standard',
    published: o.published !== false
  };
}

export function createSeed() {
  const categories = [
    { id: 'bikes', name: 'Bikes' },
    { id: 'parts', name: 'Parts' },
    { id: 'accessories', name: 'Accessories' },
    { id: 'clothing', name: 'Clothing' }
  ];

  const brands = ['PEDAL & FIELD', 'Northgate', 'Larkhill'];

  const models = [
    {
      id: 'gravel-01', name: 'Fieldnote Gravel', brand: 'PEDAL & FIELD', categoryId: 'bikes',
      type: 'gravel', wheels: '700c', published: true, sizeChart: bikeChartStandard,
      description: 'An all-day gravel bike for mixed lanes, towpaths and light singletrack. Steel frame, wide clearances, mounts for everything.',
      specs: [
        { label: 'Frame', value: 'Butted chromoly steel' },
        { label: 'Gears', value: '1x11' },
        { label: 'Brakes', value: 'Hydraulic disc' },
        { label: 'Tyre clearance', value: 'up to 700x50' }
      ]
    },
    {
      id: 'road-01', name: 'Meridian Road', brand: 'Northgate', categoryId: 'bikes',
      type: 'road', wheels: '700c', published: true, sizeChart: bikeChartOverlap,
      description: 'A quick endurance road bike built for long weekend rides and quick commutes.',
      specs: [
        { label: 'Frame', value: 'Carbon fork, alloy frame' },
        { label: 'Gears', value: '2x11' },
        { label: 'Brakes', value: 'Hydraulic disc' }
      ]
    },
    {
      id: 'mtb-01', name: 'Ridgeline Trail', brand: 'Northgate', categoryId: 'bikes',
      type: 'mountain', wheels: '29in', published: true, sizeChart: bikeChartStandard,
      description: 'A confident trail hardtail with a slack front end and grippy 29er tyres.',
      specs: [
        { label: 'Frame', value: 'Alloy' },
        { label: 'Suspension', value: '120mm air fork' },
        { label: 'Gears', value: '1x12' }
      ]
    },
    {
      id: 'hybrid-01', name: 'Townsend City', brand: 'Larkhill', categoryId: 'bikes',
      type: 'hybrid', wheels: '700c', published: true, sizeChart: bikeChartStandard,
      description: 'An upright everyday bike with mudguards and a rack, ready for the school run and the shops.',
      specs: [
        { label: 'Frame', value: 'Alloy step-through' },
        { label: 'Gears', value: '2x8' },
        { label: 'Extras', value: 'Mudguards and rack included' }
      ]
    },
    {
      id: 'kids-01', name: 'Sprout 24', brand: 'Larkhill', categoryId: 'bikes',
      type: 'kids', wheels: '24in', published: true, sizeChart: null,
      description: 'A light 24-inch kids bike for ages roughly 7-10. No height chart is published for this model.',
      specs: [
        { label: 'Frame', value: 'Lightweight alloy' },
        { label: 'Gears', value: '1x7' },
        { label: 'Brakes', value: 'V-brake' }
      ]
    },
    {
      id: 'ebike-01', name: 'Voltbend E-Commute', brand: 'PEDAL & FIELD', categoryId: 'bikes',
      type: 'electric', wheels: '700c', published: true, sizeChart: bikeChartStandard,
      description: 'A tidy electric commuter with a mid-drive motor and integrated lights.',
      specs: [
        { label: 'Motor', value: '250W mid-drive' },
        { label: 'Battery', value: 'Demo 500Wh' },
        { label: 'Range (claimed demo)', value: 'up to 60km' }
      ]
    },
    {
      id: 'tour-01', name: 'Wayfarer Tour', brand: 'PEDAL & FIELD', categoryId: 'bikes',
      type: 'touring', wheels: '700c', published: true, sizeChart: bikeChartStandard,
      description: 'A loaded touring bike for long journeys, with a stout frame and many mounting points.',
      specs: [
        { label: 'Frame', value: 'Reynolds 520 steel' },
        { label: 'Gears', value: '3x9' },
        { label: 'Racks', value: 'Front and rear mounts' }
      ]
    },
    {
      id: 'tyre-01', name: 'Fieldnote Gravel Tyre 700x40', brand: 'PEDAL & FIELD', categoryId: 'parts',
      type: 'tyres', wheels: null, published: true, sizeChart: null,
      description: 'A tubeless-ready gravel tyre with a fast centre and confident shoulders.',
      specs: [{ label: 'Size', value: '700x40' }, { label: 'Tubeless', value: 'Ready' }]
    },
    {
      id: 'brake-01', name: 'All-Weather Brake Pads', brand: 'Northgate', categoryId: 'parts',
      type: 'brakes', wheels: null, published: true, sizeChart: null,
      description: 'Replacement disc brake pads for wet-weather riding.',
      specs: [{ label: 'Compound', value: 'Sintered' }]
    },
    {
      id: 'helmet-01', name: 'Trail Helmet', brand: 'Larkhill', categoryId: 'accessories',
      type: 'helmets', wheels: null, published: true, sizeChart: null,
      description: 'A ventilated trail helmet with a dial fit system.',
      specs: [{ label: 'Certification', value: 'Demo EN 1078' }]
    },
    {
      id: 'lock-01', name: 'Ridge D-Lock', brand: 'Northgate', categoryId: 'accessories',
      type: 'locks', wheels: null, published: true, sizeChart: null,
      description: 'A sturdy D-lock with a bracket for frame mounting.',
      specs: [{ label: 'Security', value: 'Demo Sold Secure Gold' }]
    },
    {
      id: 'light-01', name: 'Dawn Front Light', brand: 'Larkhill', categoryId: 'accessories',
      type: 'lights', wheels: null, published: true, sizeChart: null,
      description: 'A USB-rechargeable front light for commuting.',
      specs: [{ label: 'Output', value: 'Demo 700 lumens' }]
    },
    {
      id: 'jersey-01', name: 'Merino Riding Jersey', brand: 'PEDAL & FIELD', categoryId: 'clothing',
      type: 'jerseys', wheels: null, published: true, sizeChart: null,
      description: 'A soft merino-blend jersey that works across seasons.',
      specs: [{ label: 'Fabric', value: 'Merino blend' }]
    },
    {
      id: 'gloves-01', name: 'Winter Riding Gloves', brand: 'Larkhill', categoryId: 'clothing',
      type: 'gloves', wheels: null, published: true, sizeChart: null,
      description: 'Wind-resistant gloves with touchscreen fingertips.',
      specs: [{ label: 'Weather', value: 'Wind-resistant' }]
    },
    {
      id: 'jacket-01', name: 'Rain Shell Jacket', brand: 'PEDAL & FIELD', categoryId: 'clothing',
      type: 'jackets', wheels: null, published: false,
      description: 'Unpublished demo jacket kept out of the storefront to demonstrate publication rules.',
      specs: [{ label: 'Waterproofing', value: 'Demo 10k' }]
    }
  ];

  const skus = [
    // Fieldnote Gravel (gravel-01)
    sku({ id: 'gravel-01-S-sand', modelId: 'gravel-01', skuCode: 'PF-GRVL-SAND-S', colour: 'Sand', frameSize: 'S', priceGross: 129500, regularGross: 145000, shippingClassId: 'bicycle' }),
    sku({ id: 'gravel-01-M-forest', modelId: 'gravel-01', skuCode: 'PF-GRVL-FRST-M', colour: 'Forest', frameSize: 'M', priceGross: 129500, regularGross: 145000, shippingClassId: 'bicycle' }),
    sku({ id: 'gravel-01-L-ink', modelId: 'gravel-01', skuCode: 'PF-GRVL-INK-L', colour: 'Ink', frameSize: 'L', priceGross: 129500, regularGross: 145000, shippingClassId: 'bicycle' }),
    // Store-only discounted colour (warehouse stock is zero).
    sku({ id: 'gravel-01-M-terracotta', modelId: 'gravel-01', skuCode: 'PF-GRVL-TERR-M', colour: 'Terracotta', frameSize: 'M', priceGross: 119500, regularGross: 145000, shippingClassId: 'bicycle' }),
    // Meridian Road (road-01)
    sku({ id: 'road-01-52-steel', modelId: 'road-01', skuCode: 'NG-MRD-52-STL', colour: 'Steel', frameSize: '52', priceGross: 189000, shippingClassId: 'bicycle' }),
    sku({ id: 'road-01-54-ink', modelId: 'road-01', skuCode: 'NG-MRD-54-INK', colour: 'Ink', frameSize: '54', priceGross: 189000, shippingClassId: 'bicycle' }),
    sku({ id: 'road-01-56-forest', modelId: 'road-01', skuCode: 'NG-MRD-56-FRST', colour: 'Forest', frameSize: '56', priceGross: 194500, shippingClassId: 'bicycle' }),
    // Ridgeline Trail (mtb-01)
    sku({ id: 'mtb-01-M-ink', modelId: 'mtb-01', skuCode: 'NG-RDG-INK-M', colour: 'Ink', frameSize: 'M', priceGross: 165000, shippingClassId: 'bicycle' }),
    sku({ id: 'mtb-01-L-terracotta', modelId: 'mtb-01', skuCode: 'NG-RDG-TERR-L', colour: 'Terracotta', frameSize: 'L', priceGross: 165000, shippingClassId: 'bicycle' }),
    // Townsend City (hybrid-01)
    sku({ id: 'hybrid-01-S-forest', modelId: 'hybrid-01', skuCode: 'LH-TWN-FRST-S', colour: 'Forest', frameSize: 'S', priceGross: 89900, shippingClassId: 'bicycle' }),
    sku({ id: 'hybrid-01-M-sand', modelId: 'hybrid-01', skuCode: 'LH-TWN-SAND-M', colour: 'Sand', frameSize: 'M', priceGross: 89900, shippingClassId: 'bicycle' }),
    sku({ id: 'hybrid-01-L-ink', modelId: 'hybrid-01', skuCode: 'LH-TWN-INK-L', colour: 'Ink', frameSize: 'L', priceGross: 94900, shippingClassId: 'bicycle' }),
    // Sprout 24 (kids-01) - no size chart
    sku({ id: 'kids-01-one-terracotta', modelId: 'kids-01', skuCode: 'LH-SPR-TERR', colour: 'Terracotta', size: 'One size', priceGross: 39500, shippingClassId: 'bicycle' }),
    // Voltbend E-Commute (ebike-01)
    sku({ id: 'ebike-01-M-ink', modelId: 'ebike-01', skuCode: 'PF-VLT-INK-M', colour: 'Ink', frameSize: 'M', priceGross: 229500, regularGross: 249500, shippingClassId: 'bicycle' }),
    sku({ id: 'ebike-01-L-forest', modelId: 'ebike-01', skuCode: 'PF-VLT-FRST-L', colour: 'Forest', frameSize: 'L', priceGross: 229500, regularGross: 249500, shippingClassId: 'bicycle' }),
    // Wayfarer Tour (tour-01)
    sku({ id: 'tour-01-M-sand', modelId: 'tour-01', skuCode: 'PF-WYF-SAND-M', colour: 'Sand', frameSize: 'M', priceGross: 175000, shippingClassId: 'bicycle' }),
    sku({ id: 'tour-01-L-forest', modelId: 'tour-01', skuCode: 'PF-WYF-FRST-L', colour: 'Forest', frameSize: 'L', priceGross: 175000, shippingClassId: 'bicycle' }),
    // Parts
    sku({ id: 'tyre-01-one', modelId: 'tyre-01', skuCode: 'PF-TYR-7040', colour: 'Black', size: '700x40', priceGross: 4500, shippingClassId: 'standard' }),
    sku({ id: 'brake-01-one', modelId: 'brake-01', skuCode: 'NG-BRK-PAIR', colour: 'Black', size: 'Pair', priceGross: 2200, shippingClassId: 'standard' }),
    // Accessories
    sku({ id: 'helmet-01-S', modelId: 'helmet-01', skuCode: 'LH-HLM-S', colour: 'Sand', size: 'S', priceGross: 6500, shippingClassId: 'standard' }),
    sku({ id: 'helmet-01-M', modelId: 'helmet-01', skuCode: 'LH-HLM-M', colour: 'Sand', size: 'M', priceGross: 6500, shippingClassId: 'standard' }),
    sku({ id: 'helmet-01-L', modelId: 'helmet-01', skuCode: 'LH-HLM-L', colour: 'Sand', size: 'L', priceGross: 6500, shippingClassId: 'standard' }),
    sku({ id: 'lock-01-one', modelId: 'lock-01', skuCode: 'NG-LCK-D', colour: 'Black', size: 'One size', priceGross: 3900, shippingClassId: 'standard' }),
    // Oversized non-bicycle demo (uses its own tariff)
    sku({ id: 'light-01-one', modelId: 'light-01', skuCode: 'LH-LGT-700', colour: 'Black', size: 'One size', priceGross: 4900, shippingClassId: 'oversized' }),
    // Clothing (low VAT demo category)
    sku({ id: 'jersey-01-S', modelId: 'jersey-01', skuCode: 'PF-JRS-S', colour: 'Forest', size: 'S', priceGross: 7900, taxCategoryId: 'low', shippingClassId: 'standard' }),
    sku({ id: 'jersey-01-M', modelId: 'jersey-01', skuCode: 'PF-JRS-M', colour: 'Forest', size: 'M', priceGross: 7900, taxCategoryId: 'low', shippingClassId: 'standard' }),
    sku({ id: 'jersey-01-L', modelId: 'jersey-01', skuCode: 'PF-JRS-L', colour: 'Forest', size: 'L', priceGross: 7900, taxCategoryId: 'low', shippingClassId: 'standard' }),
    sku({ id: 'gloves-01-M', modelId: 'gloves-01', skuCode: 'LH-GLV-M', colour: 'Ink', size: 'M', priceGross: 3500, taxCategoryId: 'low', shippingClassId: 'standard' }),
    sku({ id: 'gloves-01-L', modelId: 'gloves-01', skuCode: 'LH-GLV-L', colour: 'Ink', size: 'L', priceGross: 3500, taxCategoryId: 'low', shippingClassId: 'standard' }),
    sku({ id: 'jacket-01-M', modelId: 'jacket-01', skuCode: 'PF-JKT-M', colour: 'Terracotta', size: 'M', priceGross: 11900, shippingClassId: 'standard', published: false })
  ];

  const stockLocations = [
    { id: 'warehouse', name: 'Central Warehouse', type: 'warehouse', address: 'Demo Warehouse, England' },
    { id: 'store-york', name: 'York Store', type: 'store', address: '1 Demo Street, York' },
    { id: 'store-bath', name: 'Bath Store', type: 'store', address: '2 Demo Road, Bath' }
  ];

  // InventoryBalance rows: physical counts. Active reservations are subtracted at read time.
  const balanceRows = [
    // warehouse (delivery source)
    ['gravel-01-S-sand', 'warehouse', 3],
    ['gravel-01-M-forest', 'warehouse', 2],
    ['gravel-01-L-ink', 'warehouse', 4],
    ['gravel-01-M-terracotta', 'warehouse', 0], // store-only
    ['road-01-52-steel', 'warehouse', 2],
    ['road-01-54-ink', 'warehouse', 3],
    ['road-01-56-forest', 'warehouse', 1],
    ['mtb-01-M-ink', 'warehouse', 2],
    ['mtb-01-L-terracotta', 'warehouse', 2],
    ['hybrid-01-S-forest', 'warehouse', 5],
    ['hybrid-01-M-sand', 'warehouse', 4],
    ['hybrid-01-L-ink', 'warehouse', 3],
    ['kids-01-one-terracotta', 'warehouse', 6],
    ['ebike-01-M-ink', 'warehouse', 2],
    ['ebike-01-L-forest', 'warehouse', 1],
    ['tour-01-M-sand', 'warehouse', 2],
    ['tour-01-L-forest', 'warehouse', 2],
    ['tyre-01-one', 'warehouse', 40],
    ['brake-01-one', 'warehouse', 30],
    ['helmet-01-S', 'warehouse', 8],
    ['helmet-01-M', 'warehouse', 8],
    ['helmet-01-L', 'warehouse', 6],
    ['lock-01-one', 'warehouse', 12],
    ['light-01-one', 'warehouse', 15],
    ['jersey-01-S', 'warehouse', 10],
    ['jersey-01-M', 'warehouse', 10],
    ['jersey-01-L', 'warehouse', 9],
    ['gloves-01-M', 'warehouse', 14],
    ['gloves-01-L', 'warehouse', 11],
    // York store
    ['gravel-01-M-terracotta', 'store-york', 1],
    ['gravel-01-M-forest', 'store-york', 1],
    ['hybrid-01-M-sand', 'store-york', 2],
    ['helmet-01-M', 'store-york', 3],
    ['tyre-01-one', 'store-york', 6],
    ['lock-01-one', 'store-york', 4],
    ['gloves-01-M', 'store-york', 5],
    // Bath store (deliberately missing gravel-01-M-terracotta and tyre-01-one)
    ['gravel-01-M-forest', 'store-bath', 1],
    ['hybrid-01-S-forest', 'store-bath', 2],
    ['helmet-01-S', 'store-bath', 2],
    ['jersey-01-M', 'store-bath', 4],
    ['gloves-01-L', 'store-bath', 3],
    ['road-01-54-ink', 'store-bath', 1]
  ].map(([skuId, locationId, qty]) => ({ skuId, locationId, qty }));

  const pages = {
    faq: {
      slug: 'faq', title: 'FAQ', published: true,
      body: 'Demo FAQ content. How do I track my order? You will receive a demo email when your order is dispatched. Can I change my order? Once an order is created its items, address and store are fixed; you can cancel where allowed and place a new order.'
    },
    company: {
      slug: 'company', title: 'About PEDAL & FIELD', published: true,
      body: 'PEDAL & FIELD is a draft demo brand for this prototype. Any similarity to a real business is coincidental. Content here is illustrative only.'
    },
    delivery: {
      slug: 'delivery', title: 'Delivery', published: true,
      body: 'We deliver to England, Wales and mainland Scotland in this demo. Delivery times are indicative. This prototype does not perform real deliveries or charge real money.'
    },
    payment: {
      slug: 'payment', title: 'Payment', published: true,
      body: 'Card payment for delivery uses a clearly labelled simulator in this prototype; no card details are collected. Collection orders are paid in store.'
    },
    returns: {
      slug: 'returns', title: 'Returns', published: true,
      body: 'You may request a return through Help with an order. Refunds are handled separately from restocking and pending refunds are never described as money already returned.'
    },
    contact: {
      slug: 'contact', title: 'Contact', published: true,
      body: 'Demo support email: support@pedal-and-field.example. No chat or ticket system is provided. Do not send real personal data.'
    }
  };

  const articles = {
    'gravel-notes': {
      slug: 'gravel-notes', title: 'Notes from the gravel lanes', published: true,
      excerpt: 'A short draft journal piece about riding mixed surfaces.',
      body: 'This is a draft journal article for the prototype. It demonstrates a published blog entry visible to customers.'
    },
    'winter-commute': {
      slug: 'winter-commute', title: 'Winter commuting, kept simple', published: false,
      excerpt: 'Draft, not yet published.',
      body: 'This draft article is unpublished and must not appear on the storefront.'
    }
  };

  // Home curation references ProductModel ids. Only published models render.
  const curations = {
    featured: {
      id: 'featured', title: 'New and interesting', published: true,
      modelIds: ['gravel-01', 'ebike-01', 'kids-01']
    },
    sale: {
      id: 'sale', title: 'Reduced this month', published: true,
      modelIds: ['gravel-01', 'ebike-01']
    },
    hidden: {
      id: 'hidden', title: 'Not configured', published: true,
      modelIds: []
    }
  };

  return {
    brand: DEMO_BRAND,
    categories,
    brands,
    models,
    skus,
    taxCategories: TAX_CATEGORIES.map((c) => ({ ...c })),
    shippingClasses: SHIPPING_CLASSES.map((c) => ({ ...c })),
    tariffs: { currency: TARIFFS.currency, base: { ...TARIFFS.base }, extra: { ...TARIFFS.extra } },
    regions: REGIONS.map((r) => ({ ...r })),
    stockLocations,
    balanceRows,
    pages,
    articles,
    curations,
    // Explicit typo samples (small, agreed demo set).
    typoSamples: [
      { query: 'graval', modelId: 'gravel-01' },
      { query: 'merdian', modelId: 'road-01' },
      { query: 'voltbnd', modelId: 'ebike-01' }
    ]
  };
}
