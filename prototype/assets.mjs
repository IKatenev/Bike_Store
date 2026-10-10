// Local, self-contained SVG artwork. No remote assets, no emoji imagery.
// Neutral shop palette: white/off-white surfaces, near-black ink, a single
// blue accent. Product colours are passed in so a selected SKU changes the
// drawn colour. No serif, no pastel backgrounds.

const INK = '#171717';
const BLUE = '#1769c2';
const LINE = '#d9d9d9';
const NEUTRAL = '#f5f5f5';
const PAPER = '#ffffff';

function wheel(cx, cy, r) {
  return `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${INK}" stroke-width="6"/>
    <circle cx="${cx}" cy="${cy}" r="${r - 13}" fill="none" stroke="${INK}" stroke-width="1.5" opacity="0.35"/>
    <circle cx="${cx}" cy="${cy}" r="5" fill="${INK}"/>`;
}

// A complete, recognisable bicycle: closed frame triangles, fork, head tube,
// handlebars, saddle and crank. Coordinates are within a 360x200 box.
function bikeGroup(colour, wheelR = 46) {
  const c = colour || INK;
  const seat = [148, 58];
  const headTop = [246, 64];
  const headBot = [238, 74];
  return `
    ${wheel(80, 128, wheelR)}
    ${wheel(280, 128, wheelR)}
    <circle cx="170" cy="128" r="12" fill="none" stroke="${INK}" stroke-width="4"/>
    <path d="M80 128 L170 128" stroke="${c}" stroke-width="7" stroke-linecap="round"/>
    <path d="M80 128 L${seat[0]} ${seat[1]}" stroke="${c}" stroke-width="7" stroke-linecap="round"/>
    <path d="M170 128 L${seat[0]} ${seat[1]}" stroke="${c}" stroke-width="8" stroke-linecap="round"/>
    <path d="M170 128 L${headBot[0]} ${headBot[1]}" stroke="${c}" stroke-width="8" stroke-linecap="round"/>
    <path d="M${seat[0]} ${seat[1]} L${headTop[0]} ${headTop[1]}" stroke="${c}" stroke-width="8" stroke-linecap="round"/>
    <path d="M${headBot[0]} ${headBot[1]} L${headTop[0]} ${headTop[1]}" stroke="${c}" stroke-width="9" stroke-linecap="round"/>
    <path d="M${headBot[0]} ${headBot[1]} L280 128" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <path d="M${headTop[0]} ${headTop[1]} L240 46" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <path d="M222 44 Q242 38 262 46" stroke="${INK}" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M138 56 Q148 47 160 56" stroke="${INK}" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M170 128 L170 148" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <rect x="160" y="146" width="20" height="6" rx="3" fill="${INK}"/>
    <circle cx="170" cy="128" r="3" fill="${BLUE}"/>`;
}

// A stylised bicycle. `colour` fills the frame. `type` slightly varies geometry.
export function bikeSvg(colour = INK, type = 'gravel') {
  const wheelR = type === 'kids' ? 40 : 46;
  return `<svg class="art art-bike" viewBox="0 0 360 200" role="img" aria-label="Illustration of a bicycle" xmlns="http://www.w3.org/2000/svg">
    <rect width="360" height="200" fill="${NEUTRAL}"/>
    <path d="M0 170 Q90 150 180 164 T360 158 L360 200 L0 200 Z" fill="${BLUE}" opacity="0.06"/>
    <g transform="translate(0 4)">${bikeGroup(colour, wheelR)}</g>
  </svg>`;
}

// A bicycle frameset (no wheels) for the Fieldnote Gravel Frame part.
export function frameSvg(colour = INK) {
  const c = colour || INK;
  const seat = [148, 58];
  const headTop = [246, 64];
  const headBot = [238, 74];
  return `<svg class="art art-frame" viewBox="0 0 360 200" role="img" aria-label="Illustration of a bicycle frameset" xmlns="http://www.w3.org/2000/svg">
    <rect width="360" height="200" fill="${NEUTRAL}"/>
    <path d="M0 172 Q90 154 180 166 T360 160 L360 200 L0 200 Z" fill="${BLUE}" opacity="0.06"/>
    <g transform="translate(10 8)">
      <circle cx="80" cy="128" r="12" fill="none" stroke="${INK}" stroke-width="5"/>
      <circle cx="280" cy="128" r="12" fill="none" stroke="${INK}" stroke-width="5"/>
      <path d="M80 128 L170 128" stroke="${c}" stroke-width="9" stroke-linecap="round"/>
      <path d="M80 128 L${seat[0]} ${seat[1]}" stroke="${c}" stroke-width="9" stroke-linecap="round"/>
      <path d="M170 128 L${seat[0]} ${seat[1]}" stroke="${c}" stroke-width="10" stroke-linecap="round"/>
      <path d="M170 128 L${headBot[0]} ${headBot[1]}" stroke="${c}" stroke-width="10" stroke-linecap="round"/>
      <path d="M${seat[0]} ${seat[1]} L${headTop[0]} ${headTop[1]}" stroke="${c}" stroke-width="10" stroke-linecap="round"/>
      <path d="M${headBot[0]} ${headBot[1]} L${headTop[0]} ${headTop[1]}" stroke="${c}" stroke-width="11" stroke-linecap="round"/>
      <path d="M${headBot[0]} ${headBot[1]} L280 128" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
      <path d="M${headTop[0]} ${headTop[1]} L242 44" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
      <circle cx="170" cy="128" r="4" fill="${BLUE}"/>
    </g>
  </svg>`;
}

// A close-up of the drivetrain / bottom-bracket area. Distinct from the side
// view: it draws a large chainring, crank and chain rather than the whole bike.
export function bikeDetailSvg(colour = INK) {
  const c = colour || INK;
  return `<svg class="art art-bike-detail" viewBox="0 0 360 200" role="img" aria-label="Close-up of the bicycle drivetrain" xmlns="http://www.w3.org/2000/svg">
    <rect width="360" height="200" fill="${NEUTRAL}"/>
    <path d="M0 178 Q120 158 240 172 T360 166 L360 200 L0 200 Z" fill="${BLUE}" opacity="0.06"/>
    <g transform="translate(120 40)">
      <circle cx="90" cy="90" r="52" fill="none" stroke="${c}" stroke-width="10"/>
      <circle cx="90" cy="90" r="34" fill="none" stroke="${INK}" stroke-width="3"/>
      <circle cx="90" cy="90" r="12" fill="${INK}"/>
      <path d="M90 90 L150 46" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
      <rect x="146" y="38" width="26" height="12" rx="4" fill="${INK}"/>
      <path d="M90 40 L90 12" stroke="${c}" stroke-width="9" stroke-linecap="round"/>
      <path d="M42 122 L8 158" stroke="${c}" stroke-width="9" stroke-linecap="round"/>
      <path d="M138 128 Q180 156 232 132" fill="none" stroke="${INK}" stroke-width="4" stroke-dasharray="10 6"/>
    </g>
  </svg>`;
}

// A front-on cockpit view: handlebar, stem, brake levers and the top of a wheel.
export function bikeCockpitSvg(colour = INK) {
  const c = colour || INK;
  return `<svg class="art art-bike-cockpit" viewBox="0 0 360 200" role="img" aria-label="Front view of the bicycle cockpit" xmlns="http://www.w3.org/2000/svg">
    <rect width="360" height="200" fill="${NEUTRAL}"/>
    <path d="M0 182 Q120 164 240 176 T360 170 L360 200 L0 200 Z" fill="${BLUE}" opacity="0.06"/>
    <g transform="translate(0 6)">
      <path d="M70 60 Q180 34 290 60" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round"/>
      <path d="M180 44 L180 84" stroke="${c}" stroke-width="12" stroke-linecap="round"/>
      <path d="M120 54 L120 74" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
      <path d="M240 54 L240 74" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
      <path d="M180 84 L180 132" stroke="${c}" stroke-width="10" stroke-linecap="round"/>
      <circle cx="180" cy="150" r="30" fill="none" stroke="${INK}" stroke-width="8"/>
      <path d="M150 150 L210 150" stroke="${INK}" stroke-width="4" opacity="0.4"/>
    </g>
  </svg>`;
}

// Rear dropouts / disc mount detail for a bare frameset.
export function frameDetailSvg(colour = INK) {
  const c = colour || INK;
  return `<svg class="art art-frame-detail" viewBox="0 0 360 200" role="img" aria-label="Close-up of the frameset rear dropouts" xmlns="http://www.w3.org/2000/svg">
    <rect width="360" height="200" fill="${NEUTRAL}"/>
    <path d="M0 176 Q120 158 240 170 T360 164 L360 200 L0 200 Z" fill="${BLUE}" opacity="0.06"/>
    <g transform="translate(20 10)">
      <path d="M40 40 L40 150" stroke="${c}" stroke-width="16" stroke-linecap="round"/>
      <path d="M40 40 L150 70" stroke="${c}" stroke-width="16" stroke-linecap="round"/>
      <path d="M40 150 L150 118" stroke="${c}" stroke-width="16" stroke-linecap="round"/>
      <path d="M150 70 L150 118" stroke="${c}" stroke-width="14" stroke-linecap="round"/>
      <circle cx="150" cy="70" r="18" fill="none" stroke="${INK}" stroke-width="6"/>
      <circle cx="150" cy="118" r="18" fill="none" stroke="${INK}" stroke-width="6"/>
      <circle cx="228" cy="94" r="26" fill="none" stroke="${INK}" stroke-width="5" stroke-dasharray="8 6"/>
      <circle cx="228" cy="94" r="6" fill="${BLUE}"/>
    </g>
  </svg>`;
}

// A small product art block for parts / accessories / clothing.
export function productSvg(kind = 'accessory', colour = INK) {
  const c = colour || INK;
  const shapes = {
    tyres: `<circle cx="180" cy="100" r="58" fill="none" stroke="${INK}" stroke-width="16"/>
            <circle cx="180" cy="100" r="34" fill="none" stroke="${c}" stroke-width="4"/>`,
    brakes: `<rect x="120" y="70" width="120" height="60" rx="12" fill="${c}"/>
             <rect x="140" y="86" width="80" height="28" rx="6" fill="${PAPER}"/>`,
    helmets: `<path d="M120 128 Q180 40 240 128 Z" fill="${c}"/>
              <rect x="116" y="126" width="128" height="12" rx="6" fill="${INK}"/>`,
    locks: `<rect x="140" y="96" width="80" height="70" rx="10" fill="${c}"/>
            <path d="M156 96 Q180 52 204 96" fill="none" stroke="${INK}" stroke-width="12"/>`,
    lights: `<circle cx="180" cy="100" r="40" fill="${c}"/>
             <rect x="168" y="138" width="24" height="26" rx="4" fill="${INK}"/>`,
    jerseys: `<path d="M140 70 L180 58 L220 70 L246 96 L226 110 L220 168 L140 168 L134 110 L114 96 Z" fill="${c}"/>`,
    gloves: `<path d="M150 150 L150 96 Q150 80 164 80 L164 96 L168 74 Q170 60 182 62 L184 96 L188 66 Q190 52 202 56 L204 96 Q226 96 226 120 L226 150 Z" fill="${c}"/>`,
    jackets: `<path d="M140 66 L180 56 L220 66 L248 100 L226 114 L226 168 L134 168 L134 114 L112 100 Z" fill="${c}"/>`,
    accessory: `<circle cx="180" cy="100" r="52" fill="${c}"/>`
  };
  return `<svg class="art art-product" viewBox="0 0 360 200" role="img" aria-label="Illustration of ${kind}" xmlns="http://www.w3.org/2000/svg">
    <rect width="360" height="200" fill="${NEUTRAL}"/>
    ${shapes[kind] || shapes.accessory}
  </svg>`;
}

// Manual hero slides: each variant is a distinct scene, caption and link are
// supplied by the view. `variant` is 0..2.
export function heroArt(variant = 0) {
  const scenes = [
    `<rect width="640" height="360" fill="#eef2f6"/>
     <circle cx="516" cy="96" r="52" fill="${BLUE}" opacity="0.16"/>
     <path d="M0 250 Q160 200 320 236 T640 220 L640 360 L0 360 Z" fill="${BLUE}" opacity="0.12"/>
     <path d="M0 292 Q220 256 440 280 T640 272 L640 360 L0 360 Z" fill="${INK}" opacity="0.12"/>
     <g transform="translate(150 156) scale(1.16)">${bikeGroup(BLUE, 46)}</g>`,
    `<rect width="640" height="360" fill="#f2f4f5"/>
     <rect x="0" y="0" width="640" height="360" fill="none"/>
     <path d="M0 210 L640 210 L640 360 L0 360 Z" fill="${INK}" opacity="0.05"/>
     <path d="M0 250 Q160 230 320 246 T640 240" fill="none" stroke="${LINE}" stroke-width="3"/>
     <g transform="translate(160 130) scale(1.2)">${bikeGroup(INK, 44)}</g>
     <circle cx="120" cy="86" r="30" fill="${BLUE}" opacity="0.14"/>`,
    `<rect width="640" height="360" fill="#eef1f2"/>
     <circle cx="150" cy="110" r="60" fill="${BLUE}" opacity="0.10"/>
     <path d="M0 286 Q200 258 400 278 T640 268 L640 360 L0 360 Z" fill="${INK}" opacity="0.10"/>
     <path d="M0 246 Q180 224 360 240 T640 234" fill="none" stroke="${LINE}" stroke-width="3"/>
     <g transform="translate(176 140) scale(1.12)">${bikeGroup('#3a3f45', 46)}</g>`
  ];
  const scene = scenes[variant] || scenes[0];
  return `<svg class="art art-hero" viewBox="0 0 640 360" role="img" aria-label="Illustration of a bicycle in a landscape" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    ${scene}
  </svg>`;
}

// Local editorial imagery for journal cards. `variant` is 0..3. Each scene is
// neutral and self-contained: no photos and no external requests.
export function articleArt(variant = 0) {
  const scenes = [
    `<rect width="640" height="360" fill="#eef2f6"/>
     <circle cx="470" cy="104" r="58" fill="${BLUE}" opacity="0.14"/>
     <path d="M0 250 Q160 210 320 240 T640 226 L640 360 L0 360 Z" fill="${BLUE}" opacity="0.10"/>
     <g transform="translate(150 150) scale(0.86)">${bikeGroup(BLUE, 44)}</g>`,
    `<rect width="640" height="360" fill="#f2f4f5"/>
     <circle cx="176" cy="112" r="54" fill="${BLUE}" opacity="0.12"/>
     <path d="M0 268 Q200 232 400 258 T640 244 L640 360 L0 360 Z" fill="${INK}" opacity="0.09"/>
     <g transform="translate(176 148) scale(0.84)">${bikeGroup(INK, 44)}</g>`,
    `<rect width="640" height="360" fill="#eef1f2"/>
     <circle cx="336" cy="126" r="62" fill="${BLUE}" opacity="0.10"/>
     <path d="M0 254 Q180 222 360 246 T640 232 L640 360 L0 360 Z" fill="${INK}" opacity="0.10"/>
     <g transform="translate(160 146) scale(0.88)">${bikeGroup('#3a3f45', 44)}</g>`,
    `<rect width="640" height="360" fill="#eef2f6"/>
     <circle cx="238" cy="102" r="50" fill="${BLUE}" opacity="0.13"/>
     <path d="M0 262 Q220 228 440 252 T640 238 L640 360 L0 360 Z" fill="${INK}" opacity="0.09"/>
     <g transform="translate(168 152) scale(0.82)">${bikeGroup(BLUE, 44)}</g>`
  ];
  const scene = scenes[variant] || scenes[0];
  return `<svg class="art art-article" viewBox="0 0 640 360" role="img" aria-label="Illustration for a journal article" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">${scene}</svg>`;
}

// Small mark used next to the wordmark.
export function logoSvg() {
  return `<svg class="logo-mark" viewBox="0 0 40 40" role="img" aria-label="PEDAL & FIELD logo mark" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="38" height="38" rx="9" fill="${BLUE}"/>
    <circle cx="13" cy="25" r="6" fill="none" stroke="${PAPER}" stroke-width="3"/>
    <circle cx="27" cy="25" r="6" fill="none" stroke="${PAPER}" stroke-width="3"/>
    <path d="M13 25 L20 13 L27 25 M20 13 L23 25" fill="none" stroke="${PAPER}" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}

// ---------------------------------------------------------------------------
// Inline line icons (no external icon font or remote asset)
// ---------------------------------------------------------------------------

const svgIcon = (body, label) =>
  `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

export function iconUser() {
  return svgIcon('<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>');
}

export function iconCart() {
  return svgIcon('<path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 2-1.6L20 7H6"/><circle cx="9.5" cy="20" r="1.4"/><circle cx="17.5" cy="20" r="1.4"/>');
}

export function iconOrders() {
  return svgIcon('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z"/><path d="M9 8h6M9 12h6"/>');
}

export function iconHeart() {
  return svgIcon('<path d="M12 20s-7-4.6-7-9.5A4 4 0 0 1 12 7a4 4 0 0 1 7 3.5C19 15.4 12 20 12 20Z"/>');
}

export function iconSearch() {
  return svgIcon('<circle cx="11" cy="11" r="6"/><path d="m20 20-3.6-3.6"/>');
}

export function iconFilter() {
  return svgIcon('<path d="M3 5h18M6 12h12M10 19h4"/>');
}

export function iconClose() {
  return svgIcon('<path d="M6 6l12 12M18 6 6 18"/>');
}

export function iconChevron(direction = 'right') {
  const rot = { right: 0, left: 180, down: 90, up: -90 }[direction] || 0;
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" style="transform:rotate(${rot}deg)" xmlns="http://www.w3.org/2000/svg"><path d="m9 5 7 7-7 7"/></svg>`;
}

export function iconCheck() {
  return svgIcon('<path d="m5 12 4.5 4.5L19 7"/>');
}

export function iconTruck() {
  return svgIcon('<path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.5"/><circle cx="17.5" cy="18" r="1.5"/>');
}

export function iconStore() {
  return svgIcon('<path d="M4 9h16v11H4zM3 9l1.5-5h15L21 9M9 20v-5h6v5"/>');
}
