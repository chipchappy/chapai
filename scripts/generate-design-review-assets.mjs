import fs from "node:fs";
import path from "node:path";

const root = "C:/Users/Chapman/Desktop/ai/chapai";
const brandDir = path.join(root, "apps/web/public/brand/options");
const reviewDir = path.join(root, "apps/web/public/design-review");

fs.mkdirSync(brandDir, { recursive: true });
fs.mkdirSync(reviewDir, { recursive: true });

const sand = "#F7F1E7";
const paper = "#FBF7F0";
const dark = "#201E22";
const muted = "#786C5C";
const bone = "#DDD2C2";
const gold = "#C19A56";
const teal = "#5A7F88";
const clay = "#A7775C";
const sage = "#75866F";

function write(filePath, contents) {
  fs.writeFileSync(filePath, contents, "utf8");
}

const palettes = [
  { stroke: dark, accent: gold, soft: teal },
  { stroke: dark, accent: teal, soft: gold },
  { stroke: dark, accent: clay, soft: teal },
  { stroke: dark, accent: gold, soft: sage },
  { stroke: dark, accent: teal, soft: clay },
];

function logoFrame(inner) {
  return `<svg width="480" height="480" viewBox="0 0 480 480" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="480" height="480" rx="48" fill="${paper}"/>
  <rect x="36" y="36" width="408" height="408" rx="36" fill="url(#wash)" stroke="rgba(208,194,170,0.5)"/>
  <defs>
    <radialGradient id="wash" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(164 102) rotate(52) scale(352 352)">
      <stop stop-color="rgba(255,255,255,0.9)"/>
      <stop offset="1" stop-color="rgba(242,233,221,0.96)"/>
    </radialGradient>
  </defs>
  ${inner}
</svg>`;
}

function orbitSpine({ stroke, accent, soft }, seed) {
  const x = 240 + ((seed % 5) - 2) * 4;
  return logoFrame(`
    <circle cx="${x}" cy="240" r="136" stroke="rgba(121,111,97,0.18)" stroke-width="1.4"/>
    <ellipse cx="${x}" cy="240" rx="${86 + (seed % 4) * 6}" ry="136" stroke="${soft}" stroke-opacity="0.22" stroke-width="1.2"/>
    <path d="M${x} 108V350" stroke="${accent}" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="${x}" cy="132" r="8" fill="${paper}" stroke="${accent}" stroke-width="1.2"/>
    <path d="M${x - 28} 178C${x - 14} 164 ${x + 2} 157 ${x + 20} 157C${x + 38} 157 ${x + 54} 164 ${x + 68} 178" stroke="${stroke}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M${x - 22} 222C${x - 8} 212 ${x + 8} 207 ${x + 24} 207C${x + 42} 207 ${x + 58} 214 ${x + 72} 226" stroke="${soft}" stroke-opacity="0.72" stroke-width="2.1" stroke-linecap="round"/>
    <path d="M${x - 14} 268C${x} 258 ${x + 14} 254 ${x + 30} 254C${x + 43} 254 ${x + 55} 258 ${x + 65} 266" stroke="${accent}" stroke-opacity="0.68" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M${x - 6} 314C${x + 10} 304 ${x + 24} 300 ${x + 38} 300C${x + 52} 300 ${x + 65} 304 ${x + 76} 312" stroke="${stroke}" stroke-opacity="0.38" stroke-width="1.7" stroke-linecap="round"/>
  `);
}

function arteryBloom({ stroke, accent, soft }, seed) {
  const r = 114 + (seed % 3) * 7;
  return logoFrame(`
    <circle cx="240" cy="240" r="${r}" stroke="rgba(120,111,97,0.16)" stroke-width="1.3"/>
    <circle cx="240" cy="240" r="${r - 42}" stroke="${soft}" stroke-opacity="0.16" stroke-width="1.1"/>
    <path d="M240 152C252 164 258 176 258 190C258 206 252 220 240 232C228 220 222 206 222 190C222 176 228 164 240 152Z" stroke="${accent}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M240 232V324" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M240 252C222 244 205 232 190 216C175 200 162 183 152 164" stroke="${stroke}" stroke-width="2.1" stroke-linecap="round"/>
    <path d="M240 252C258 244 275 232 290 216C305 200 318 183 328 164" stroke="${stroke}" stroke-width="2.1" stroke-linecap="round"/>
    <path d="M240 286C220 287 202 294 186 308C171 321 160 336 152 352" stroke="${soft}" stroke-opacity="0.8" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M240 286C261 287 279 294 295 308C310 321 321 336 329 352" stroke="${soft}" stroke-opacity="0.8" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="152" cy="164" r="4.8" fill="${accent}"/>
    <circle cx="328" cy="164" r="4.8" fill="${accent}"/>
  `);
}

function lampOrbit({ stroke, accent, soft }, seed) {
  const lift = seed % 4;
  return logoFrame(`
    <ellipse cx="240" cy="236" rx="118" ry="148" stroke="rgba(120,111,97,0.16)" stroke-width="1.4"/>
    <ellipse cx="240" cy="236" rx="${82 + lift * 5}" ry="148" stroke="${soft}" stroke-opacity="0.18" stroke-width="1.15"/>
    <path d="M240 126V352" stroke="${accent}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M208 156C217 146 228 141 240 141C252 141 263 146 272 156C281 166 286 178 286 192C286 206 281 218 272 228C263 238 252 244 240 246C228 244 217 238 208 228C199 218 194 206 194 192C194 178 199 166 208 156Z" stroke="${stroke}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M218 182C225 176 232 173 240 173C248 173 255 176 262 182" stroke="${accent}" stroke-opacity="0.68" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M226 268H254" stroke="${stroke}" stroke-width="2.1" stroke-linecap="round"/>
    <path d="M214 298H266" stroke="${soft}" stroke-opacity="0.82" stroke-width="2" stroke-linecap="round"/>
    <path d="M200 332H280" stroke="${stroke}" stroke-opacity="0.36" stroke-width="1.8" stroke-linecap="round"/>
  `);
}

function ribWindow({ stroke, accent, soft }, seed) {
  const rx = 98 + (seed % 4) * 4;
  return logoFrame(`
    <rect x="128" y="106" width="224" height="264" rx="112" stroke="rgba(120,111,97,0.16)" stroke-width="1.4"/>
    <path d="M240 120V356" stroke="${accent}" stroke-width="2.1" stroke-linecap="round"/>
    <path d="M178 164C196 150 216 143 240 143C264 143 284 150 302 164" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M170 210C191 198 214 192 240 192C266 192 289 198 310 210" stroke="${soft}" stroke-opacity="0.86" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M168 258C192 246 216 240 240 240C264 240 288 246 312 258" stroke="${accent}" stroke-opacity="0.7" stroke-width="1.9" stroke-linecap="round"/>
    <path d="M172 308C194 297 217 292 240 292C263 292 286 297 308 308" stroke="${stroke}" stroke-opacity="0.45" stroke-width="1.8" stroke-linecap="round"/>
    <ellipse cx="240" cy="238" rx="${rx}" ry="138" stroke="${soft}" stroke-opacity="0.16" stroke-width="1.15"/>
  `);
}

function nerveThread({ stroke, accent, soft }, seed) {
  const startY = 148 + (seed % 3) * 4;
  return logoFrame(`
    <circle cx="240" cy="240" r="132" stroke="rgba(121,111,97,0.16)" stroke-width="1.4"/>
    <path d="M240 ${startY}C258 166 268 182 270 198C272 214 267 228 256 240C245 252 239 266 238 282C237 299 242 315 252 330" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M240 240C216 231 194 216 174 195C154 174 139 151 128 126" stroke="${soft}" stroke-opacity="0.9" stroke-width="2" stroke-linecap="round"/>
    <path d="M240 240C263 232 285 218 305 198C325 178 341 155 352 130" stroke="${soft}" stroke-opacity="0.9" stroke-width="2" stroke-linecap="round"/>
    <path d="M240 276C214 285 192 300 174 321C156 341 144 363 138 387" stroke="${accent}" stroke-opacity="0.78" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M240 276C266 286 288 301 306 322C323 342 335 364 341 388" stroke="${accent}" stroke-opacity="0.78" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="128" cy="126" r="4.8" fill="${accent}"/>
    <circle cx="352" cy="130" r="4.8" fill="${accent}"/>
    <circle cx="138" cy="387" r="4.4" fill="${soft}"/>
    <circle cx="341" cy="388" r="4.4" fill="${soft}"/>
  `);
}

function haloMonogram({ stroke, accent, soft }, seed) {
  const rx = 110 + (seed % 3) * 6;
  return logoFrame(`
    <circle cx="240" cy="240" r="132" stroke="rgba(121,111,97,0.16)" stroke-width="1.4"/>
    <ellipse cx="240" cy="240" rx="${rx}" ry="132" stroke="${soft}" stroke-opacity="0.2" stroke-width="1.15"/>
    <path d="M190 170C205 156 222 149 240 149C258 149 275 156 290 170C306 185 314 202 314 223C314 244 306 261 290 276C275 291 258 299 240 299C222 299 205 291 190 276C174 261 166 244 166 223C166 202 174 185 190 170Z" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M214 212C223 201 232 195 240 195C248 195 257 201 266 212C274 223 278 235 278 249C278 263 274 275 266 286" stroke="${accent}" stroke-width="2" stroke-linecap="round"/>
    <path d="M214 286C206 275 202 263 202 249C202 235 206 223 214 212" stroke="${accent}" stroke-width="2" stroke-linecap="round"/>
    <path d="M240 126V356" stroke="${soft}" stroke-opacity="0.66" stroke-width="1.9" stroke-linecap="round"/>
  `);
}

function crestNeedle({ stroke, accent, soft }, seed) {
  const height = 118 + (seed % 4) * 6;
  return logoFrame(`
    <path d="M240 ${124 - (seed % 3) * 4}C268 140 290 163 306 192C322 220 330 252 330 286C330 320 322 352 306 380C290 408 268 431 240 448C212 431 190 408 174 380C158 352 150 320 150 286C150 252 158 220 174 192C190 163 212 140 240 ${124 - (seed % 3) * 4}Z" stroke="rgba(121,111,97,0.18)" stroke-width="1.4"/>
    <path d="M240 140V${140 + height}" stroke="${accent}" stroke-width="2.25" stroke-linecap="round"/>
    <path d="M240 200C220 192 202 178 186 160" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M240 200C260 192 278 178 294 160" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M240 246C216 246 194 254 174 270" stroke="${soft}" stroke-opacity="0.84" stroke-width="1.9" stroke-linecap="round"/>
    <path d="M240 246C264 246 286 254 306 270" stroke="${soft}" stroke-opacity="0.84" stroke-width="1.9" stroke-linecap="round"/>
    <circle cx="240" cy="200" r="10" fill="${paper}" stroke="${accent}" stroke-width="1.2"/>
  `);
}

function archVessel({ stroke, accent, soft }, seed) {
  const lift = seed % 5;
  return logoFrame(`
    <path d="M136 318C136 242 155 184 192 144C209 125 225 114 240 112C255 114 271 125 288 144C325 184 344 242 344 318" stroke="rgba(121,111,97,0.18)" stroke-width="1.4"/>
    <path d="M160 318C160 258 174 212 201 180C212 167 225 159 240 156C255 159 268 167 279 180C306 212 320 258 320 318" stroke="${soft}" stroke-opacity="0.22" stroke-width="1.15"/>
    <path d="M240 144V338" stroke="${accent}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M208 202C217 194 228 190 240 190C252 190 263 194 272 202C281 211 286 223 286 238C286 253 281 265 272 274C263 282 252 286 240 286C228 286 217 282 208 274C199 265 194 253 194 238C194 223 199 211 208 202Z" stroke="${stroke}" stroke-width="2.45" stroke-linejoin="round"/>
    <path d="M218 322C226 304 233 294 240 294C247 294 254 304 262 322" stroke="${soft}" stroke-opacity="0.9" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M174 ${338 - lift * 4}H306" stroke="${stroke}" stroke-opacity="0.3" stroke-width="1.6" stroke-linecap="round"/>
  `);
}

function petalCompass({ stroke, accent, soft }, seed) {
  const inner = 60 + (seed % 4) * 4;
  return logoFrame(`
    <circle cx="240" cy="240" r="132" stroke="rgba(121,111,97,0.16)" stroke-width="1.4"/>
    <circle cx="240" cy="240" r="${inner}" stroke="${soft}" stroke-opacity="0.18" stroke-width="1.15"/>
    <path d="M240 136C252 164 260 189 264 212C268 189 276 164 288 136" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M344 240C316 252 291 260 268 264C291 268 316 276 344 288" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M240 344C228 316 220 291 216 268C212 291 204 316 192 344" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M136 240C164 228 189 220 212 216C189 212 164 204 136 192" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="240" cy="240" r="18" fill="${paper}" stroke="${accent}" stroke-width="1.4"/>
    <path d="M240 164V316" stroke="${accent}" stroke-opacity="0.76" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M164 240H316" stroke="${soft}" stroke-opacity="0.76" stroke-width="1.8" stroke-linecap="round"/>
  `);
}

function scriptLoop({ stroke, accent, soft }, seed) {
  const loopY = 202 + (seed % 4) * 4;
  return logoFrame(`
    <ellipse cx="240" cy="240" rx="136" ry="136" stroke="rgba(121,111,97,0.16)" stroke-width="1.4"/>
    <path d="M178 ${loopY}C194 178 214 164 240 160C266 156 289 162 308 178C327 194 336 215 334 240C332 264 320 285 298 302C276 319 248 336 214 354" stroke="${stroke}" stroke-width="2.55" stroke-linecap="round"/>
    <path d="M214 354C224 332 235 318 248 312C261 306 276 305 292 310" stroke="${accent}" stroke-width="1.95" stroke-linecap="round"/>
    <path d="M212 228C224 216 236 210 249 210C262 210 273 215 282 226" stroke="${soft}" stroke-opacity="0.88" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M198 276C212 284 226 288 240 288C254 288 268 284 282 276" stroke="${soft}" stroke-opacity="0.72" stroke-width="1.7" stroke-linecap="round"/>
  `);
}

function wordmarkBand({ stroke, accent, soft }, seed) {
  const letter = ["C", "A", "S", "P", "I"][seed % 5];
  return logoFrame(`
    <rect x="86" y="154" width="308" height="172" rx="32" fill="rgba(255,252,247,0.82)" stroke="rgba(121,111,97,0.14)"/>
    <text x="126" y="238" fill="${stroke}" font-family="Georgia, 'Times New Roman', serif" font-size="82" letter-spacing="-3">${letter}</text>
    <path d="M214 206H344" stroke="${soft}" stroke-opacity="0.55" stroke-width="1.7"/>
    <path d="M214 250H318" stroke="${accent}" stroke-opacity="0.74" stroke-width="1.9"/>
    <text x="126" y="288" fill="${stroke}" font-family="'DM Sans', Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="3">ChapAI</text>
    <text x="126" y="320" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" letter-spacing="4">NCLEX + CCRN</text>
  `);
}

function sealMedallion({ stroke, accent, soft }, seed) {
  const r = 132 - (seed % 4) * 4;
  return logoFrame(`
    <circle cx="240" cy="240" r="${r}" stroke="${stroke}" stroke-opacity="0.2" stroke-width="1.5"/>
    <circle cx="240" cy="240" r="${r - 22}" stroke="${accent}" stroke-opacity="0.7" stroke-width="1.1" stroke-dasharray="2 8"/>
    <circle cx="240" cy="240" r="${r - 44}" stroke="${soft}" stroke-opacity="0.24" stroke-width="1.1"/>
    <path d="M240 154V326" stroke="${stroke}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M194 196C206 182 221 175 240 175C259 175 274 182 286 196C298 210 304 225 304 242C304 259 298 274 286 286C274 298 259 304 240 304C221 304 206 298 194 286C182 274 176 259 176 242C176 225 182 210 194 196Z" stroke="${accent}" stroke-width="2.1"/>
    <text x="186" y="384" fill="${stroke}" font-family="'DM Sans', Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="5">CHAPAI</text>
  `);
}

function monolineSignature({ stroke, accent, soft }, seed) {
  return logoFrame(`
    <path d="M112 250C132 222 155 204 181 196C207 188 231 192 254 208C277 224 295 252 310 291C321 319 334 339 350 351" stroke="${stroke}" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M146 318C168 308 188 303 206 303C225 303 243 309 261 321C278 333 292 350 302 374" stroke="${accent}" stroke-width="2.1" stroke-linecap="round"/>
    <path d="M126 208H344" stroke="${soft}" stroke-opacity="0.24" stroke-width="1.2"/>
    <text x="124" y="156" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="15" letter-spacing="5">CHAPAI</text>
    <text x="124" y="398" fill="${stroke}" font-family="Georgia, 'Times New Roman', serif" font-size="42" letter-spacing="-1">clinical intelligence</text>
  `);
}

function columnMark({ stroke, accent, soft }, seed) {
  const lift = seed % 5;
  return logoFrame(`
    <path d="M182 138H298" stroke="${soft}" stroke-opacity="0.38" stroke-width="1.2"/>
    <path d="M196 152V330" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M240 140V344" stroke="${accent}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M284 152V330" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M176 ${336 + lift}H304" stroke="${stroke}" stroke-opacity="0.34" stroke-width="1.8"/>
    <path d="M196 192C209 181 223 176 240 176C257 176 271 181 284 192" stroke="${accent}" stroke-opacity="0.76" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M196 236C210 228 224 224 240 224C256 224 270 228 284 236" stroke="${soft}" stroke-opacity="0.84" stroke-width="1.7" stroke-linecap="round"/>
    <text x="168" y="392" fill="${stroke}" font-family="'DM Sans', Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="4">CHAPAI</text>
  `);
}

function atlasRibbon({ stroke, accent, soft }, seed) {
  return logoFrame(`
    <ellipse cx="240" cy="240" rx="146" ry="112" stroke="${soft}" stroke-opacity="0.2" stroke-width="1.1"/>
    <path d="M136 254C166 214 201 194 242 194C282 194 317 214 346 254C319 288 284 307 242 312C199 307 164 288 136 254Z" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M170 254C190 231 214 220 242 220C270 220 294 231 314 254" stroke="${accent}" stroke-width="1.9" stroke-linecap="round"/>
    <path d="M188 286H296" stroke="${soft}" stroke-opacity="0.8" stroke-width="1.7" stroke-linecap="round"/>
    <text x="176" y="374" fill="${stroke}" font-family="Georgia, 'Times New Roman', serif" font-size="54" letter-spacing="-2">ChapAI</text>
    <text x="181" y="404" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" letter-spacing="4">PREMIUM NURSING PREP</text>
  `);
}

function ecgSilhouette({ stroke, accent, soft }, seed) {
  return logoFrame(`
    <circle cx="240" cy="240" r="138" stroke="rgba(121,111,97,0.14)" stroke-width="1.4"/>
    <path d="M116 252H178L198 220L226 290L248 198L272 252H362" stroke="${stroke}" stroke-width="2.9" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M208 176C220 160 235 152 252 152C269 152 283 159 296 173C308 186 314 201 314 218C314 235 308 249 296 261C284 273 269 279 252 280C235 280 220 274 208 262C196 250 190 235 190 218C190 201 196 187 208 176Z" stroke="${accent}" stroke-width="1.9"/>
    <path d="M206 314C223 302 240 296 258 296C276 296 293 302 310 314" stroke="${soft}" stroke-opacity="0.76" stroke-width="1.7" stroke-linecap="round"/>
  `);
}

function vesicaSpine({ stroke, accent, soft }, seed) {
  const skew = (seed % 4) * 4;
  return logoFrame(`
    <ellipse cx="${220 - skew}" cy="240" rx="94" ry="148" stroke="${soft}" stroke-opacity="0.24" stroke-width="1.2"/>
    <ellipse cx="${260 + skew}" cy="240" rx="94" ry="148" stroke="${accent}" stroke-opacity="0.36" stroke-width="1.2"/>
    <path d="M240 122V346" stroke="${stroke}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M204 164C215 154 227 149 240 149C253 149 265 154 276 164C286 174 291 187 291 202C291 217 286 230 276 240C265 250 253 255 240 255C227 255 215 250 204 240C194 230 189 217 189 202C189 187 194 174 204 164Z" stroke="${stroke}" stroke-width="2.2"/>
    <path d="M214 284C223 277 232 273 242 273C252 273 262 277 271 284" stroke="${accent}" stroke-opacity="0.86" stroke-width="1.8" stroke-linecap="round"/>
  `);
}

function apothecaryStamp({ stroke, accent, soft }, seed) {
  return logoFrame(`
    <rect x="108" y="108" width="264" height="264" rx="44" stroke="rgba(121,111,97,0.14)" stroke-width="1.4"/>
    <circle cx="240" cy="240" r="106" stroke="${soft}" stroke-opacity="0.2" stroke-width="1.1"/>
    <path d="M240 138V342" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M180 198C196 182 216 174 240 174C264 174 284 182 300 198C316 214 324 234 324 258C324 282 316 302 300 318C284 334 264 342 240 342C216 342 196 334 180 318C164 302 156 282 156 258C156 234 164 214 180 198Z" stroke="${accent}" stroke-width="1.9"/>
    <path d="M196 258H284" stroke="${soft}" stroke-opacity="0.76" stroke-width="1.7" stroke-linecap="round"/>
    <text x="166" y="396" fill="${stroke}" font-family="'DM Sans', Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="5">CHAPAI</text>
  `);
}

function doubleOrbitWordmark({ stroke, accent, soft }, seed) {
  return logoFrame(`
    <ellipse cx="240" cy="194" rx="98" ry="62" stroke="${soft}" stroke-opacity="0.22" stroke-width="1.15"/>
    <ellipse cx="240" cy="194" rx="68" ry="62" stroke="${accent}" stroke-opacity="0.3" stroke-width="1.15"/>
    <path d="M192 188C205 171 221 162 240 162C259 162 275 171 288 188" stroke="${stroke}" stroke-width="2.3" stroke-linecap="round"/>
    <path d="M240 156V230" stroke="${accent}" stroke-width="1.9" stroke-linecap="round"/>
    <text x="110" y="320" fill="${stroke}" font-family="Georgia, 'Times New Roman', serif" font-size="72" letter-spacing="-2">ChapAI</text>
    <text x="114" y="360" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="15" letter-spacing="4">CCRN + NCLEX PREP</text>
    <path d="M114 384H366" stroke="rgba(121,111,97,0.18)" stroke-width="1.2"/>
  `);
}

function scribeBody({ stroke, accent, soft }, seed) {
  return logoFrame(`
    <path d="M236 118C258 118 276 125 290 140C303 155 310 173 310 195C310 217 303 235 290 250C276 265 259 272 240 272C221 272 204 265 191 251C178 237 171 220 171 200C171 180 177 163 190 148C203 133 219 123 236 118Z" stroke="${stroke}" stroke-width="2.3"/>
    <path d="M242 270C258 296 267 324 268 355C269 386 264 420 252 457C240 494 233 532 232 573C231 615 236 656 248 696" stroke="${stroke}" stroke-width="2.3" stroke-linecap="round"/>
    <path d="M238 292C212 315 190 343 171 375C152 407 138 440 130 474" stroke="${soft}" stroke-opacity="0.82" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M252 286C280 301 305 322 328 349C351 376 369 404 384 435" stroke="${accent}" stroke-opacity="0.84" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M214 192C224 180 234 174 246 174C258 174 269 180 280 192" stroke="${accent}" stroke-width="1.7" stroke-linecap="round"/>
    <path d="M122 414H380" stroke="rgba(121,111,97,0.16)" stroke-width="1.1"/>
  `);
}

const families = [orbitSpine, arteryBloom, lampOrbit, ribWindow, nerveThread, haloMonogram, crestNeedle, archVessel, petalCompass, scriptLoop];
const premiumFamilies = [wordmarkBand, sealMedallion, monolineSignature, columnMark, atlasRibbon];
const ultraFamilies = [ecgSilhouette, vesicaSpine, apothecaryStamp, doubleOrbitWordmark, scribeBody];

for (let index = 0; index < 50; index += 1) {
  const n = 101 + index;
  const family = families[index % families.length];
  const palette = palettes[index % palettes.length];
  write(path.join(brandDir, `chapai-option-${n}.svg`), family(palette, n));
}

for (let index = 0; index < 50; index += 1) {
  const n = 151 + index;
  const family = premiumFamilies[index % premiumFamilies.length];
  const palette = palettes[(index + 2) % palettes.length];
  write(path.join(brandDir, `chapai-option-${n}.svg`), family(palette, n));
}

for (let index = 0; index < 50; index += 1) {
  const n = 201 + index;
  const family = ultraFamilies[index % ultraFamilies.length];
  const palette = palettes[(index + 1) % palettes.length];
  write(path.join(brandDir, `chapai-option-${n}.svg`), family(palette, n));
}

const heroTitles = [
  "The anatomy globe built for premium nursing prep.",
  "One bold medical field for CCRN and NCLEX.",
  "Clinical prep that feels calmer and more expensive.",
  "A stronger anatomy hero for nurses who want signal.",
  "Make the first screen feel trusted, clinical, and premium.",
  "A cleaner anatomy field for sharper bedside prep.",
  "One warmer front page. Two tighter exam paths.",
  "A premium nursing product that looks ready for hospital trust.",
  "An anatomy-led hero with less clutter and more confidence.",
  "A bolder medical front page for serious exam prep.",
];

function heroFigure(kind) {
  const line = (d, cls = "figure") => `<path d="${d}" class="${cls}"/>`;
  if (kind === "vesalius") {
    return `
      ${line("M1052 192C1080 192 1103 201 1121 220C1140 239 1148 263 1146 293C1144 323 1132 349 1112 370C1091 391 1075 416 1065 446")}
      ${line("M1064 444C1056 503 1040 560 1018 616C998 669 980 721 964 772")}
      ${line("M1074 445C1093 488 1118 530 1148 570C1176 608 1207 645 1240 682")}
      ${line("M1060 280C1033 312 1003 341 968 368C932 395 894 418 854 439")}
      ${line("M1085 258C1114 252 1144 242 1175 227C1206 212 1236 194 1266 173")}
      ${line("M1070 312C1092 313 1112 321 1130 337C1148 353 1160 374 1166 399", "detail")}
      ${line("M1059 360C1084 367 1105 380 1124 399C1142 419 1154 440 1161 462", "detail")}
    `;
  }

  if (kind === "lungs") {
    return `
      ${line("M1064 210V748", "accent")}
      ${line("M1020 226C988 241 959 266 934 301C909 335 894 374 889 417C884 459 888 504 901 551")}
      ${line("M1107 226C1139 241 1168 266 1193 301C1218 335 1233 374 1238 417C1243 459 1239 504 1226 551")}
      ${line("M1030 342C1052 331 1073 327 1094 331C1114 335 1131 347 1144 367", "organ")}
      ${line("M1008 405C1036 390 1065 386 1095 392C1125 399 1147 415 1161 441", "organ")}
      ${line("M1121 346C1095 335 1069 334 1042 342C1015 350 992 367 972 393", "detail")}
    `;
  }

  if (kind === "heart") {
    return `
      ${line("M1060 214V696", "accent")}
      ${line("M1060 262C1086 242 1113 233 1140 234C1168 236 1190 247 1207 268C1224 288 1232 313 1230 342C1228 372 1217 400 1198 427C1178 455 1151 494 1117 546C1083 494 1056 455 1037 427C1018 400 1007 372 1005 342C1003 313 1011 288 1028 268C1046 248 1068 236 1095 234C1122 233 1147 242 1171 262", "figure")}
      ${line("M1086 314C1098 306 1111 302 1126 302C1140 302 1152 307 1163 316", "detail")}
      ${line("M1081 366C1099 356 1118 352 1137 356C1156 360 1171 371 1184 391", "organ")}
    `;
  }

  if (kind === "nerves") {
    return `
      ${line("M1064 176C1090 175 1112 184 1129 203C1146 222 1153 245 1150 272C1147 299 1135 321 1113 338C1091 356 1076 379 1068 408C1059 437 1054 471 1052 511")}
      ${line("M1060 176V742", "accent")}
      ${line("M1060 286C1090 292 1118 305 1144 328", "detail")}
      ${line("M1056 338C1090 349 1120 367 1146 392", "detail")}
      ${line("M1050 391C1082 403 1110 421 1136 448", "detail")}
      ${line("M1054 282C1030 297 1008 317 989 344", "organ")}
      ${line("M1047 334C1020 352 996 375 977 404", "organ")}
      ${line("M1038 390C1012 408 991 430 975 458", "organ")}
    `;
  }

  if (kind === "atlasHand") {
    return `
      ${line("M1078 198C1104 194 1126 202 1144 221C1161 240 1169 263 1167 290C1165 317 1154 340 1135 360C1116 380 1103 404 1098 431")}
      ${line("M1098 430C1098 492 1101 553 1107 614C1112 676 1117 735 1122 792")}
      ${line("M1084 430C1060 480 1031 528 996 576C962 623 929 677 898 738")}
      ${line("M1108 248C1140 236 1170 220 1200 199C1229 178 1257 152 1284 123")}
      ${line("M1070 296C1038 329 1002 356 960 378C918 399 876 418 834 434")}
      ${line("M1088 198V792", "accent")}
      ${line("M1098 334C1121 343 1141 358 1159 380C1176 401 1187 425 1190 452", "detail")}
      ${line("M1128 392C1143 387 1157 390 1171 401C1184 413 1193 427 1199 445", "organ")}
    `;
  }

  return `
    ${line("M1068 200C1092 196 1114 202 1132 219C1149 235 1157 256 1156 283C1155 309 1146 331 1129 350C1112 370 1100 392 1094 417")}
    ${line("M1092 417C1108 466 1116 519 1115 576C1114 632 1116 686 1122 738")}
    ${line("M1075 418C1064 472 1046 523 1022 571C997 620 974 675 954 736")}
    ${line("M1086 202V742", "accent")}
    ${line("M1070 246C1046 280 1018 311 984 339C950 366 914 390 876 411")}
    ${line("M1093 235C1123 228 1151 216 1179 199C1207 182 1234 163 1260 142")}
    ${line("M1082 282C1106 283 1128 292 1146 308C1164 325 1176 347 1182 374", "detail")}
    ${line("M1075 336C1101 343 1124 357 1143 377C1162 397 1174 419 1180 443", "detail")}
    ${line("M1104 402C1122 399 1138 405 1152 417C1165 430 1174 445 1179 465", "organ")}
  `;
}

function orbitShell(mode) {
  if (mode === "right-heavy") {
    return `
      <circle cx="1128" cy="504" r="432" class="shell"/>
      <ellipse cx="1128" cy="504" rx="322" ry="432" class="orbit"/>
      <ellipse cx="1166" cy="504" rx="228" ry="432" class="orbit soft"/>
      <path d="M1128 74V934" class="axis"/>
      <path d="M812 374C926 330 1032 308 1128 308C1225 308 1328 330 1434 374" class="latitude"/>
      <path d="M780 552C892 512 1008 492 1128 492C1248 492 1362 512 1472 552" class="latitude soft"/>
      <path d="M808 742C920 704 1028 686 1136 686C1244 686 1350 704 1454 742" class="latitude soft"/>
    `;
  }

  if (mode === "off-axis") {
    return `
      <circle cx="1076" cy="498" r="388" class="shell"/>
      <ellipse cx="1076" cy="498" rx="272" ry="388" class="orbit"/>
      <ellipse cx="1116" cy="498" rx="194" ry="388" class="orbit soft"/>
      <path d="M1076 110V886" class="axis"/>
      <path d="M824 390C915 352 999 334 1076 334C1154 334 1232 352 1320 390" class="latitude"/>
      <path d="M806 548C906 515 996 499 1076 499C1158 499 1247 515 1343 548" class="latitude soft"/>
      <path d="M822 704C911 678 998 664 1082 664C1163 664 1244 677 1326 704" class="latitude soft"/>
    `;
  }

  if (mode === "tight") {
    return `
      <circle cx="1042" cy="500" r="340" class="shell"/>
      <circle cx="1042" cy="500" r="284" class="orbit"/>
      <circle cx="1042" cy="500" r="228" class="orbit soft"/>
      <path d="M1042 160V840" class="axis"/>
      <path d="M820 412C899 384 972 370 1042 370C1113 370 1187 384 1264 412" class="latitude"/>
      <path d="M820 588C899 560 972 546 1042 546C1113 546 1187 560 1264 588" class="latitude soft"/>
    `;
  }

  return `
    <circle cx="1070" cy="496" r="414" class="shell"/>
    <ellipse cx="1070" cy="496" rx="306" ry="414" class="orbit"/>
    <ellipse cx="1070" cy="496" rx="214" ry="414" class="orbit soft"/>
    <path d="M1070 82V910" class="axis"/>
    <path d="M776 366C880 326 978 308 1070 308C1162 308 1260 326 1364 366" class="latitude"/>
    <path d="M748 532C856 498 960 481 1070 481C1178 481 1284 498 1391 532" class="latitude soft"/>
    <path d="M772 716C868 684 969 668 1070 668C1172 668 1273 684 1368 716" class="latitude soft"/>
  `;
}

function frontpageSvg(number, title, figure, shellMode) {
  return `<svg width="1600" height="1024" viewBox="0 0 1600 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1600" height="1024" fill="${sand}"/>
  <style>
    .shell { stroke: rgba(127,117,102,0.16); stroke-width: 1.5; fill: none; }
    .orbit { stroke: rgba(127,117,102,0.08); stroke-width: 1.15; fill: none; }
    .orbit.soft, .latitude.soft { stroke-opacity: 0.58; }
    .axis, .latitude { stroke: rgba(127,117,102,0.05); stroke-width: 1; fill: none; }
    .focus { fill: rgba(255,249,241,0.74); }
    .figure, .detail, .organ, .accent { fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .figure { stroke: rgba(49,42,35,0.3); stroke-width: 2.2; }
    .detail { stroke: rgba(105,93,78,0.12); stroke-width: 1.4; }
    .organ { stroke: rgba(193,154,86,0.22); stroke-width: 1.7; }
    .accent { stroke: rgba(193,154,86,0.84); stroke-width: 2; }
  </style>
  <rect x="264" y="78" width="1072" height="70" rx="35" fill="rgba(255,252,247,0.65)" stroke="rgba(218,206,188,0.62)"/>
  <circle cx="302" cy="113" r="21" fill="rgba(255,252,247,0.96)" stroke="rgba(218,206,188,0.72)"/>
  <path d="M302 97V129" stroke="${gold}" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M290 107C295 102 301 100 307 100C313 100 318 102 322 107C326 111 329 116 330 122" stroke="${dark}" stroke-width="1.8" stroke-linecap="round"/>
  <text x="336" y="112" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="22" font-weight="600">ChapAI</text>
  <text x="336" y="136" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="12" letter-spacing="3">NCLEX + CCRN</text>
  <text x="1126" y="117" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="15" letter-spacing="2">CCRN</text>
  <text x="1178" y="117" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="15" letter-spacing="2">NCLEX</text>
  <text x="1242" y="117" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="15" letter-spacing="2">PLANS</text>
  <rect x="1294" y="90" width="74" height="44" rx="22" fill="rgba(255,252,247,0.95)" stroke="rgba(218,206,188,0.72)"/>
  <text x="1317" y="117" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="16" font-weight="700">START</text>

  <text x="300" y="206" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="4">HERO CONCEPT ${String(number).padStart(2, "0")}</text>
  <text x="300" y="336" fill="${dark}" font-family="Georgia, 'Times New Roman', serif" font-size="96" letter-spacing="-4">${title}</text>
  <text x="300" y="644" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="22">Original questions, AI rationale, and a cleaner clinical path for nurses.</text>
  <rect x="300" y="694" width="184" height="54" rx="27" fill="${teal}"/>
  <text x="336" y="728" fill="#F7F1E6" font-family="'DM Sans', Arial, sans-serif" font-size="22" font-weight="700">Choose plan</text>
  <rect x="498" y="694" width="168" height="54" rx="27" fill="rgba(255,252,247,0.92)" stroke="rgba(218,206,188,0.62)"/>
  <text x="539" y="728" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="22" font-weight="600">Try free</text>
  <path d="M300 792H836" stroke="rgba(214,203,188,0.72)"/>
  <text x="300" y="822" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="13" letter-spacing="4">AI REVIEW + ORIGINAL QUESTIONS</text>
  <text x="564" y="822" fill="rgba(102,113,118,0.78)" font-family="'DM Sans', Arial, sans-serif" font-size="13">Cleaner rationale, better visuals, direct package paths.</text>
  <text x="300" y="904" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" letter-spacing="3">CURRENT BUILD</text>
  <text x="300" y="938" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="34" font-weight="700">435 live CCRN questions</text>
  <text x="594" y="904" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" letter-spacing="3">REVIEW STYLE</text>
  <text x="594" y="938" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="34" font-weight="700">Trend-first bedside reasoning</text>
  ${orbitShell(shellMode)}
  <ellipse cx="1068" cy="500" rx="214" ry="432" class="focus"/>
  ${heroFigure(figure)}
</svg>`;
}

[
  ["19", heroTitles[0], "vesalius", "wide"],
  ["20", heroTitles[1], "lungs", "off-axis"],
  ["21", heroTitles[2], "nerves", "tight"],
  ["22", heroTitles[3], "heart", "wide"],
  ["23", heroTitles[4], "full", "off-axis"],
  ["24", heroTitles[5], "vesalius", "tight"],
  ["25", heroTitles[6], "lungs", "wide"],
  ["26", heroTitles[7], "full", "off-axis"],
  ["27", heroTitles[8], "nerves", "tight"],
  ["28", heroTitles[9], "heart", "wide"],
].forEach(([id, title, figure, shellMode], index) => {
  write(path.join(reviewDir, `frontpage-${id}.svg`), frontpageSvg(index + 19, title, figure, shellMode));
});

[
  ["29", "A premium anatomy globe for nurses who want signal.", "atlasHand", "right-heavy"],
  ["30", "A calmer front page with one strong medical object.", "vesalius", "right-heavy"],
  ["31", "Clinical prep that looks ready for hospital trust.", "lungs", "right-heavy"],
  ["32", "A sharper anatomy field with more right-side presence.", "nerves", "right-heavy"],
  ["33", "The premium nursing prep surface, stripped of clutter.", "heart", "right-heavy"],
  ["34", "One anatomy-led hero. Two tighter exam paths.", "full", "right-heavy"],
  ["35", "A warmer globe system with cleaner medical linework.", "atlasHand", "off-axis"],
  ["36", "A bigger anatomy poster built to stand out fast.", "vesalius", "right-heavy"],
].forEach(([id, title, figure, shellMode], index) => {
  write(path.join(reviewDir, `frontpage-${id}.svg`), frontpageSvg(index + 29, title, figure, shellMode));
});

console.log("Generated logo options 101-200 and front-page concepts 19-36.");

function heroPosterFigure(kind) {
  if (kind === "balancedTorso") {
    return `
      <path d="M1098 150C1126 150 1150 160 1168 179C1186 198 1195 224 1194 257C1192 290 1180 318 1158 341C1136 365 1122 393 1115 425" class="figure"/>
      <path d="M1098 150V792" class="accent"/>
      <path d="M1064 204C1036 238 1004 268 968 294C932 320 892 343 848 362" class="figure"/>
      <path d="M1126 208C1157 204 1187 193 1218 176C1248 159 1277 138 1304 114" class="figure"/>
      <path d="M1082 284C1098 282 1112 286 1125 294C1138 303 1148 314 1154 329" class="organ"/>
      <path d="M1114 286C1127 285 1140 290 1151 299C1163 308 1172 320 1178 336" class="organ"/>
      <path d="M1098 426C1090 483 1076 540 1056 596C1038 650 1021 710 1008 776" class="figure"/>
      <path d="M1116 426C1135 475 1157 523 1183 570C1207 615 1234 660 1262 704" class="figure"/>
    `;
  }

  if (kind === "wideLungs") {
    return `
      <path d="M1102 158V786" class="accent"/>
      <path d="M1054 198C1018 216 986 245 958 284C930 323 912 366 904 412C896 458 900 507 916 558" class="figure"/>
      <path d="M1152 198C1187 216 1220 245 1248 284C1276 323 1294 366 1302 412C1310 458 1306 507 1290 558" class="figure"/>
      <path d="M1072 330C1090 318 1108 312 1126 313C1144 314 1159 323 1171 340" class="organ"/>
      <path d="M1038 400C1068 386 1098 381 1128 387C1158 393 1182 408 1198 433" class="organ"/>
      <path d="M1140 332C1118 321 1096 319 1074 325C1051 331 1031 343 1012 362" class="detail"/>
    `;
  }

  if (kind === "veins") {
    return `
      <path d="M1100 150C1128 150 1150 160 1166 179C1182 198 1189 221 1187 248C1184 275 1173 297 1154 314C1134 332 1122 353 1118 376" class="figure"/>
      <path d="M1100 150V790" class="accent"/>
      <path d="M1116 232C1149 242 1179 260 1207 286" class="detail"/>
      <path d="M1112 288C1145 300 1175 319 1202 346" class="detail"/>
      <path d="M1108 346C1139 360 1166 379 1190 406" class="detail"/>
      <path d="M1086 232C1057 248 1030 271 1006 300" class="organ"/>
      <path d="M1080 288C1050 307 1024 331 1001 361" class="organ"/>
      <path d="M1076 348C1048 366 1025 389 1004 417" class="organ"/>
      <path d="M1098 408C1093 467 1081 528 1062 590C1046 644 1034 707 1026 780" class="figure"/>
    `;
  }

  if (kind === "vesaliusReach") {
    return `
      <path d="M1110 170C1136 171 1158 181 1174 200C1190 219 1197 243 1195 272C1192 301 1180 326 1159 348C1138 370 1125 398 1120 432" class="figure"/>
      <path d="M1112 170V786" class="accent"/>
      <path d="M1106 222C1140 210 1172 194 1204 173C1234 151 1264 126 1292 98" class="figure"/>
      <path d="M1088 282C1054 316 1016 344 974 365C932 386 889 402 846 414" class="figure"/>
      <path d="M1120 430C1140 478 1162 527 1187 576C1211 624 1235 672 1260 718" class="figure"/>
      <path d="M1100 430C1095 488 1085 548 1071 610C1058 673 1049 735 1044 796" class="figure"/>
      <path d="M1112 316C1131 320 1148 331 1162 348C1176 365 1185 384 1188 406" class="detail"/>
    `;
  }

  return heroFigure("atlasHand");
}

function frontpageAltSvg(number, title, figure, shellMode) {
  return `<svg width="1600" height="1024" viewBox="0 0 1600 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1600" height="1024" fill="${sand}"/>
  <style>
    .shell { stroke: rgba(127,117,102,0.18); stroke-width: 1.45; fill: none; }
    .orbit { stroke: rgba(127,117,102,0.085); stroke-width: 1.08; fill: none; }
    .orbit.soft, .latitude.soft { stroke-opacity: 0.58; }
    .axis, .latitude { stroke: rgba(127,117,102,0.052); stroke-width: 1; fill: none; }
    .focus { fill: rgba(255,249,241,0.82); }
    .figure, .detail, .organ, .accent { fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .figure { stroke: rgba(49,42,35,0.3); stroke-width: 2.15; }
    .detail { stroke: rgba(105,93,78,0.12); stroke-width: 1.35; }
    .organ { stroke: rgba(193,154,86,0.24); stroke-width: 1.7; }
    .accent { stroke: rgba(90,127,136,0.84); stroke-width: 2.1; }
  </style>
  <rect x="266" y="74" width="1070" height="72" rx="36" fill="rgba(255,252,247,0.74)" stroke="rgba(218,206,188,0.62)"/>
  <circle cx="304" cy="110" r="21" fill="rgba(255,252,247,0.98)" stroke="rgba(218,206,188,0.74)"/>
  <path d="M304 92C310 98 313 104 313 112C313 120 310 126 304 132C298 126 295 120 295 112C295 104 298 98 304 92Z" stroke="${dark}" stroke-width="1.5" stroke-linejoin="round"/>
  <text x="340" y="111" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="22" font-weight="600">ChapAI</text>
  <text x="340" y="136" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="12" letter-spacing="3">NCLEX + CCRN</text>
  <text x="1126" y="117" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="15" letter-spacing="2">CCRN</text>
  <text x="1181" y="117" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="15" letter-spacing="2">NCLEX</text>
  <text x="1245" y="117" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="15" letter-spacing="2">PLANS</text>
  <rect x="1296" y="88" width="72" height="44" rx="22" fill="rgba(255,252,247,0.96)" stroke="rgba(218,206,188,0.72)"/>
  <text x="1318" y="116" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="16" font-weight="700">START</text>

  <text x="300" y="214" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="4">FRONT PAGE ${String(number).padStart(2, "0")}</text>
  <text x="300" y="348" fill="${dark}" font-family="Georgia, 'Times New Roman', serif" font-size="102" letter-spacing="-4.5">${title}</text>
  <text x="300" y="642" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="22">Premium questions, clearer rationale, and a cleaner clinical buying path.</text>
  <rect x="300" y="690" width="194" height="54" rx="27" fill="${teal}"/>
  <text x="332" y="724" fill="#F7F1E6" font-family="'DM Sans', Arial, sans-serif" font-size="22" font-weight="700">Choose package</text>
  <rect x="508" y="690" width="170" height="54" rx="27" fill="rgba(255,252,247,0.94)" stroke="rgba(218,206,188,0.64)"/>
  <text x="548" y="724" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="22" font-weight="600">Try free</text>
  <path d="M300 792H834" stroke="rgba(214,203,188,0.72)"/>
  <text x="300" y="826" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="13" letter-spacing="4">CALMER CLINICAL STANDARD</text>
  <text x="300" y="906" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="34" font-weight="700">435 live CCRN questions</text>
  <text x="612" y="906" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="34" font-weight="700">Free / Plus / Pro</text>
  ${orbitShell(shellMode)}
  <ellipse cx="1122" cy="506" rx="218" ry="438" class="focus"/>
  ${heroPosterFigure(figure)}
</svg>`;
}

[
  ["37", "A premium nursing surface that feels quieter and stronger.", "balancedTorso", "right-heavy"],
  ["38", "One anatomy globe. One sharper clinical story.", "wideLungs", "right-heavy"],
  ["39", "A calmer, more impressive front page for CCRN and NCLEX.", "veins", "right-heavy"],
  ["40", "A cleaner medical field with real premium presence.", "vesaliusReach", "right-heavy"],
  ["41", "Clinical prep with a more distinct anatomy signature.", "balancedTorso", "off-axis"],
  ["42", "A bold anatomy globe built to stand out faster.", "wideLungs", "right-heavy"],
  ["43", "Premium nursing prep with less clutter and more confidence.", "veins", "off-axis"],
  ["44", "A calmer premium shell with one stronger medical object.", "vesaliusReach", "right-heavy"],
  ["45", "The anatomy-led hero that makes the product feel expensive.", "balancedTorso", "right-heavy"],
  ["46", "A stronger medical front page for serious exam buyers.", "wideLungs", "right-heavy"],
].forEach(([id, title, figure, shellMode], index) => {
  write(path.join(reviewDir, `frontpage-${id}.svg`), frontpageAltSvg(index + 37, title, figure, shellMode));
});

console.log("Generated logo options 201-250 and front-page concepts 37-46.");
