// Local, self-contained SVG artwork. No remote assets, no emoji imagery.
// Colours are passed in so a selected SKU can change the drawn bike colour.

const INK = '#242c27';
const FOREST = '#344f3c';
const TERRACOTTA = '#b85b3f';
const OFFWHITE = '#f5f3ed';

function wheel(cx, cy, r) {
  return `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${INK}" stroke-width="6"/>
    <circle cx="${cx}" cy="${cy}" r="${r - 13}" fill="none" stroke="${INK}" stroke-width="1.5" opacity="0.45"/>
    <circle cx="${cx}" cy="${cy}" r="5" fill="${INK}"/>`;
}

// A complete, recognisable bicycle: closed frame triangles, fork, head tube,
// handlebars, saddle and crank. Coordinates are within a 360x200 box.
function bikeGroup(colour, wheelR = 46) {
  const c = colour || FOREST;
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
    <circle cx="170" cy="128" r="3" fill="${TERRACOTTA}"/>`;
}

// A stylised bicycle. `colour` fills the frame. `type` slightly varies geometry.
export function bikeSvg(colour = FOREST, type = 'gravel') {
  const wheelR = type === 'kids' ? 40 : 46;
  return `<svg class="art art-bike" viewBox="0 0 360 200" role="img" aria-label="Illustration of a bicycle" xmlns="http://www.w3.org/2000/svg">
    <rect width="360" height="200" fill="${OFFWHITE}"/>
    <path d="M0 170 Q90 150 180 164 T360 158 L360 200 L0 200 Z" fill="${FOREST}" opacity="0.10"/>
    <g transform="translate(0 4)">${bikeGroup(colour, wheelR)}</g>
  </svg>`;
}

// A small product art block for parts / accessories / clothing.
export function productSvg(kind = 'accessory', colour = FOREST) {
  const c = colour || FOREST;
  const shapes = {
    tyres: `<circle cx="180" cy="100" r="58" fill="none" stroke="${INK}" stroke-width="16"/>
            <circle cx="180" cy="100" r="34" fill="none" stroke="${c}" stroke-width="4"/>`,
    brakes: `<rect x="120" y="70" width="120" height="60" rx="12" fill="${c}"/>
             <rect x="140" y="86" width="80" height="28" rx="6" fill="${OFFWHITE}"/>`,
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
    <rect width="360" height="200" fill="${OFFWHITE}"/>
    ${shapes[kind] || shapes.accessory}
  </svg>`;
}

// Expressive hero artwork: layered landscape with a large, complete bicycle.
export function heroArt() {
  return `<svg class="art art-hero" viewBox="0 0 640 360" role="img" aria-label="Illustration of a bicycle in a landscape" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f5f3ed"/>
        <stop offset="1" stop-color="#e7e2d6"/>
      </linearGradient>
    </defs>
    <rect width="640" height="360" fill="url(#sky)"/>
    <circle cx="512" cy="92" r="46" fill="${TERRACOTTA}" opacity="0.85"/>
    <path d="M0 236 Q160 180 320 220 T640 204 L640 360 L0 360 Z" fill="${FOREST}" opacity="0.16"/>
    <path d="M0 272 Q200 230 400 260 T640 248 L640 360 L0 360 Z" fill="${FOREST}" opacity="0.28"/>
    <path d="M0 308 Q220 278 440 302 T640 294 L640 360 L0 360 Z" fill="${FOREST}" opacity="0.52"/>
    <g transform="translate(148 150) scale(1.18)">${bikeGroup(TERRACOTTA, 46)}</g>
  </svg>`;
}

// Small mark used next to the wordmark.
export function logoSvg() {
  return `<svg class="logo-mark" viewBox="0 0 40 40" role="img" aria-label="PEDAL & FIELD logo mark" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="19" fill="${FOREST}"/>
    <circle cx="12" cy="24" r="6" fill="none" stroke="${OFFWHITE}" stroke-width="3"/>
    <circle cx="28" cy="24" r="6" fill="none" stroke="${OFFWHITE}" stroke-width="3"/>
    <path d="M12 24 L20 12 L28 24 M20 12 L23 24" fill="none" stroke="${TERRACOTTA}" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}
