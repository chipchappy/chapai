/**
 * NclexBrainIllustration — homepage hero for the NCLEX page.
 * Clean editorial brain: coronal/frontal view, cortical sulci, cerebellum.
 * No labels. No grids. No badges. No decoration.
 */
export default function NclexBrainIllustration() {
  return (
    <div
      className="relative flex w-full max-w-[28rem] items-center justify-center lg:max-w-[32rem]"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 500 480"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-auto w-full"
        style={{ filter: "drop-shadow(0 16px 32px rgba(78,60,41,0.06))" }}
      >
        {/* ── Very subtle warm oval field ── */}
        <ellipse
          cx="250" cy="260"
          rx="190" ry="200"
          fill="rgba(229,180,120,0.06)"
        />

        {/* ── Brain stem ── */}
        <path
          d="M226 386 C222 398 218 412 216 428 C214 444 216 458 220 468"
          stroke="rgba(52,47,42,0.28)" strokeWidth="2.2" strokeLinecap="round"
        />
        <path
          d="M256 384 C260 396 264 412 266 428 C268 444 266 458 262 468"
          stroke="rgba(52,47,42,0.28)" strokeWidth="2.2" strokeLinecap="round"
        />
        <path
          d="M220 468 C230 472 250 474 262 468"
          stroke="rgba(52,47,42,0.22)" strokeWidth="2" strokeLinecap="round"
        />
        {/* Pons */}
        <path
          d="M210 416 C190 418 174 424 162 434"
          stroke="rgba(52,47,42,0.18)" strokeWidth="1.6" strokeLinecap="round"
        />
        <path
          d="M270 416 C288 418 306 424 318 434"
          stroke="rgba(52,47,42,0.18)" strokeWidth="1.6" strokeLinecap="round"
        />

        {/* ── Cerebellum ── */}
        <path
          d="M162 434 C148 428 136 418 128 404 C118 388 118 370 128 356 C138 342 154 336 174 338 C190 340 204 350 216 364"
          stroke="rgba(52,47,42,0.30)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        />
        <path
          d="M318 434 C332 428 344 418 352 404 C362 388 362 370 352 356 C342 342 326 336 306 338 C290 340 276 350 264 364"
          stroke="rgba(52,47,42,0.30)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        />
        {/* Cerebellar folia */}
        {[
          "M136 390 C148 386 160 384 172 386",
          "M130 374 C142 368 156 366 172 370",
          "M134 406 C146 404 158 402 170 406",
          "M346 390 C336 386 322 384 308 386",
          "M352 374 C340 368 326 366 308 370",
          "M346 406 C336 404 322 402 308 406",
        ].map((d, i) => (
          <path key={i} d={d} stroke="rgba(52,47,42,0.14)" strokeWidth="1.1" strokeLinecap="round"/>
        ))}

        {/* ── Cerebral hemisphere outlines ── */}
        {/* Left hemisphere */}
        <path
          d="M190 364 C172 348 158 328 150 306 C140 280 138 252 146 226 C154 200 168 178 190 160 C212 142 238 132 250 130"
          stroke="rgba(52,47,42,0.34)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
        />
        {/* Right hemisphere */}
        <path
          d="M310 364 C328 348 342 328 350 306 C360 280 362 252 354 226 C346 200 332 178 310 160 C288 142 262 132 250 130"
          stroke="rgba(52,47,42,0.34)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
        />
        {/* Frontal pole */}
        <path
          d="M190 160 C196 144 208 130 222 120 C236 110 250 106 264 108 C276 110 288 118 298 130 C308 142 314 156 310 160"
          stroke="rgba(52,47,42,0.34)" strokeWidth="2.4" strokeLinecap="round"
        />
        {/* Interhemispheric fissure */}
        <path
          d="M250 108 C250 180 250 280 240 370"
          stroke="rgba(52,47,42,0.10)" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="4 5"
        />

        {/* ── Major sulci — left hemisphere ── */}
        {/* Central sulcus */}
        <path
          d="M196 170 C206 184 212 200 210 218 C208 236 202 250 196 262"
          stroke="rgba(52,47,42,0.22)" strokeWidth="1.5" strokeLinecap="round"
        />
        {/* Lateral (Sylvian) fissure */}
        <path
          d="M166 236 C182 228 200 224 218 224 C236 224 252 228 264 236"
          stroke="rgba(52,47,42,0.26)" strokeWidth="1.8" strokeLinecap="round"
        />
        {/* Superior frontal sulcus */}
        <path
          d="M198 150 C206 162 210 176 208 190"
          stroke="rgba(52,47,42,0.16)" strokeWidth="1.2" strokeLinecap="round"
        />
        {/* Inferior frontal sulcus */}
        <path
          d="M184 162 C194 176 198 192 196 208"
          stroke="rgba(52,47,42,0.14)" strokeWidth="1.1" strokeLinecap="round"
        />
        {/* Superior temporal sulcus */}
        <path
          d="M166 260 C178 258 192 258 204 262 C216 266 224 274 228 284"
          stroke="rgba(52,47,42,0.18)" strokeWidth="1.3" strokeLinecap="round"
        />
        {/* Postcentral sulcus */}
        <path
          d="M208 216 C218 230 224 248 222 266"
          stroke="rgba(52,47,42,0.15)" strokeWidth="1.2" strokeLinecap="round"
        />
        {/* Intraparietal sulcus */}
        <path
          d="M216 218 C226 224 234 234 238 248 C242 262 240 278 234 292"
          stroke="rgba(52,47,42,0.15)" strokeWidth="1.1" strokeLinecap="round"
        />
        {/* Calcarine sulcus */}
        <path
          d="M220 304 C228 312 236 322 242 334 C246 342 246 352 242 360"
          stroke="rgba(52,47,42,0.16)" strokeWidth="1.2" strokeLinecap="round"
        />

        {/* ── Major sulci — right hemisphere (mirrored) ── */}
        <path
          d="M304 170 C294 184 288 200 290 218 C292 236 298 250 304 262"
          stroke="rgba(52,47,42,0.22)" strokeWidth="1.5" strokeLinecap="round"
        />
        <path
          d="M334 236 C318 228 300 224 282 224 C264 224 248 228 236 236"
          stroke="rgba(52,47,42,0.26)" strokeWidth="1.8" strokeLinecap="round"
        />
        <path
          d="M302 150 C294 162 290 176 292 190"
          stroke="rgba(52,47,42,0.16)" strokeWidth="1.2" strokeLinecap="round"
        />
        <path
          d="M316 162 C306 176 302 192 304 208"
          stroke="rgba(52,47,42,0.14)" strokeWidth="1.1" strokeLinecap="round"
        />
        <path
          d="M334 260 C322 258 308 258 296 262 C284 266 276 274 272 284"
          stroke="rgba(52,47,42,0.18)" strokeWidth="1.3" strokeLinecap="round"
        />
        <path
          d="M292 216 C282 230 276 248 278 266"
          stroke="rgba(52,47,42,0.15)" strokeWidth="1.2" strokeLinecap="round"
        />
        <path
          d="M284 218 C274 224 266 234 262 248 C258 262 260 278 266 292"
          stroke="rgba(52,47,42,0.15)" strokeWidth="1.1" strokeLinecap="round"
        />
        <path
          d="M280 304 C272 312 264 322 258 334 C254 342 254 352 258 360"
          stroke="rgba(52,47,42,0.16)" strokeWidth="1.2" strokeLinecap="round"
        />

        {/* ── Neural accent — single dashed path, very subtle ── */}
        <path
          d="M250 130 C260 152 268 174 270 198 C272 222 266 244 254 264 C244 280 234 296 230 316"
          stroke="rgba(160,120,54,0.28)"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeDasharray="2 7"
        />
      </svg>
    </div>
  );
}
