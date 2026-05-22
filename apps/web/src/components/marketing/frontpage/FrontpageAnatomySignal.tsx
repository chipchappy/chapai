import type { CSSProperties } from "react";
import type { MarketingRouteKey } from "../marketingArtwork";
import type { FrontpageTone } from "./frontpage-types";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type SignalProps = {
  route: MarketingRouteKey;
  tone: FrontpageTone;
  className?: string;
};

type AccentPack = {
  line: string;
  lineSoft: string;
  glowA: string;
  glowB: string;
  node: string;
  shadow: string;
  warm: string;
  field: string;
};

function getAccents(route: MarketingRouteKey): AccentPack {
  if (route === "nclex") {
    return {
      line: "rgba(96, 134, 151, 0.86)",
      lineSoft: "rgba(96, 134, 151, 0.16)",
      glowA: "rgba(182, 214, 224, 0.2)",
      glowB: "rgba(188, 195, 228, 0.12)",
      node: "#8eaeb9",
      shadow: "rgba(82, 103, 114, 0.1)",
      warm: "#d6a384",
      field: "rgba(137, 177, 183, 0.07)",
    };
  }

  if (route === "ccrn") {
    return {
      line: "rgba(160, 117, 104, 0.86)",
      lineSoft: "rgba(160, 117, 104, 0.16)",
      glowA: "rgba(226, 191, 167, 0.2)",
      glowB: "rgba(159, 199, 191, 0.12)",
      node: "#d2a28d",
      shadow: "rgba(110, 84, 76, 0.1)",
      warm: "#deb48f",
      field: "rgba(180, 145, 120, 0.07)",
    };
  }

  return {
    line: "rgba(114, 146, 132, 0.86)",
    lineSoft: "rgba(114, 146, 132, 0.16)",
    glowA: "rgba(182, 211, 193, 0.2)",
    glowB: "rgba(154, 190, 196, 0.12)",
    node: "#97b3a2",
    shadow: "rgba(87, 111, 100, 0.1)",
    warm: "#d3a27d",
    field: "rgba(137, 178, 160, 0.07)",
  };
}

function HomeLungsSignal() {
  return (
    <svg className="anatomy-route-svg" viewBox="0 0 960 760" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="lungs-core" cx="0" cy="0" r="1" gradientTransform="translate(482 352) rotate(90) scale(246 234)" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--anatomy-glow-a)" />
          <stop offset="0.62" stopColor="rgba(255,255,255,0.02)" />
          <stop offset="1" stopColor="transparent" />
        </radialGradient>
        <filter id="lungs-blur" x="0" y="0" width="960" height="760" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>

      <g className="anatomy-route-backdrop">
        <g filter="url(#lungs-blur)" opacity="0.46">
          <path className="anatomy-route-ribbon anatomy-route-ribbon-a" d="M-32 300C102 230 206 206 316 238C408 264 476 348 596 354C720 360 826 290 992 250" />
          <path className="anatomy-route-ribbon anatomy-route-ribbon-b" d="M-24 456C116 388 214 362 328 392C430 420 508 504 634 508C754 512 842 454 992 398" />
          <path className="anatomy-route-ribbon anatomy-route-ribbon-c" d="M74 132C170 176 232 234 282 312" />
          <path className="anatomy-route-ribbon anatomy-route-ribbon-d" d="M884 150C784 194 724 250 676 326" />
          <path className="anatomy-route-ribbon anatomy-route-ribbon-e" d="M522 136C648 154 760 208 872 324C918 372 956 420 992 494" />
          <path className="anatomy-route-ribbon anatomy-route-ribbon-f" d="M500 574C634 542 754 556 912 640" />
        </g>

        <g className="anatomy-route-orbits">
          <ellipse cx="484" cy="352" rx="332" ry="246" className="anatomy-route-orbit anatomy-route-orbit-a" />
          <ellipse cx="484" cy="352" rx="278" ry="212" className="anatomy-route-orbit anatomy-route-orbit-b" />
          <path className="anatomy-route-thread anatomy-route-thread-a" d="M110 252C236 286 322 340 384 430" />
          <path className="anatomy-route-thread anatomy-route-thread-b" d="M850 264C728 296 644 350 580 434" />
          <path className="anatomy-route-thread anatomy-route-thread-c" d="M254 600C314 564 356 526 392 470" />
          <path className="anatomy-route-thread anatomy-route-thread-d" d="M708 594C644 560 604 520 570 468" />
        </g>

        <g className="anatomy-route-mesh">
          <path d="M590 192C692 212 784 264 886 362" />
          <path d="M610 246C706 282 792 336 888 430" />
          <path d="M594 502C688 494 780 514 900 588" />
          <path d="M574 556C664 560 748 586 848 654" />
        </g>

        <g className="anatomy-route-rightfield">
          <path d="M706 146C824 190 908 266 980 384" />
          <path d="M734 214C844 262 918 330 986 430" />
          <path d="M708 454C832 458 918 498 992 582" />
          <path d="M678 536C798 564 878 612 958 692" />
        </g>

        <g className="anatomy-route-contour">
          <path d="M646 108C768 136 862 200 968 316C1012 364 1046 420 1070 480" />
          <path d="M674 222C786 266 874 330 970 430" />
          <path d="M648 516C770 524 866 560 980 642" />
        </g>

        <g className="anatomy-route-scaffold">
          <path d="M628 92C730 110 814 160 900 246C946 292 980 344 1002 398" />
          <path d="M650 606C752 600 842 624 940 694" />
          <path d="M782 114L856 114L908 160" />
          <path d="M804 638L884 638L934 680" />
        </g>

        <g className="anatomy-route-sweep">
          <path d="M566 128C680 146 772 194 864 276C924 330 966 390 1002 468" />
          <path d="M612 170C714 194 794 236 870 304C924 352 966 404 996 454" />
          <path d="M626 514C732 512 818 540 918 610C956 636 988 668 1014 706" />
          <path d="M604 558C702 570 784 606 882 674" />
        </g>

        <g className="anatomy-route-pulse">
          {[
            [186, 246, 6.5],
            [248, 192, 5],
            [772, 238, 6],
            [712, 188, 5],
            [298, 596, 5.5],
            [672, 590, 5.5],
            [872, 356, 4.8],
            [890, 430, 4.4],
            [902, 590, 4.6],
          ].map(([cx, cy, r]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} className="anatomy-route-node" />)}
        </g>
      </g>

      <circle cx="482" cy="352" r="230" fill="url(#lungs-core)" className="anatomy-route-core" />

      <g className="anatomy-route-shadow" opacity="0.24">
        <path d="M462 132V272C410 296 382 342 370 406C356 472 320 536 260 586M474 132V274C528 298 556 344 568 408C582 470 620 534 684 584" stroke="var(--anatomy-shadow)" strokeWidth="18" strokeLinecap="round" />
      </g>

      <g className="anatomy-route-outline">
        <path d="M468 124V266" strokeWidth="7" />
        <path d="M468 266C420 294 394 340 382 398C368 458 334 524 274 574" strokeWidth="7" />
        <path d="M478 124V266" strokeWidth="5.5" />
        <path d="M478 266C530 294 558 340 570 398C584 458 620 526 682 576" strokeWidth="7" />
        <path d="M394 232C332 258 286 314 260 396C232 478 248 590 354 638C426 670 474 620 480 532V288C460 252 430 236 394 232Z" strokeWidth="4.2" fill="rgba(255,255,255,0.07)" />
        <path d="M548 232C610 258 656 314 682 396C710 478 694 590 588 638C516 670 468 620 462 532V288C482 252 512 236 548 232Z" strokeWidth="4.2" fill="rgba(255,255,255,0.05)" />
      </g>

      <g className="anatomy-route-detail">
        <path d="M416 314C372 354 346 394 334 444" />
        <path d="M434 362C384 404 360 448 356 506" />
        <path d="M448 416C404 452 390 494 390 540" />
        <path d="M526 316C570 356 596 396 608 444" />
        <path d="M510 364C560 404 584 448 588 506" />
        <path d="M496 418C540 452 554 494 554 540" />
      </g>

      <g className="anatomy-route-anatomy-focus">
        <path d="M472 244V310" />
        <path d="M472 310C444 328 424 350 412 382" />
        <path d="M472 310C500 328 522 350 536 382" />
        <path d="M412 382C388 404 372 430 362 462" />
        <path d="M536 382C560 404 576 430 586 462" />
        <path d="M360 462C334 490 320 522 320 556" />
        <path d="M586 462C612 490 626 522 626 556" />
      </g>

      <g className="anatomy-route-micro-node">
        {[ [412,382], [362,462], [320,556], [536,382], [586,462], [626,556] ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.1" />
        ))}
      </g>

      <g className="anatomy-route-soft-detail">
        <path d="M384 384C362 410 348 438 342 470" />
        <path d="M424 466C410 492 404 518 404 544" />
        <path d="M560 384C582 412 596 440 602 472" />
        <path d="M520 466C534 492 540 518 540 544" />
      </g>

      <g className="anatomy-route-fine-detail">
        <path d="M330 372C314 396 304 420 300 446" />
        <path d="M350 438C334 468 328 494 330 522" />
        <path d="M628 372C646 396 656 422 660 450" />
        <path d="M608 438C624 468 630 494 628 522" />
        <path d="M744 260C804 294 852 334 900 392" />
        <path d="M736 520C802 532 858 558 920 612" />
      </g>

      <g className="anatomy-route-peripheral-detail">
        <path d="M706 298C756 322 796 354 836 402" />
        <path d="M734 334C778 360 812 392 844 430" />
        <path d="M770 374C806 402 832 432 854 468" />
        <path d="M812 418C838 444 860 474 878 510" />
        <path d="M736 522C782 538 820 564 858 606" />
        <path d="M772 552C814 570 848 596 884 636" />
      </g>

      <g className="anatomy-route-peripheral-node">
        {[ [836,402], [844,430], [854,468], [878,510], [858,606], [884,636] ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.4" />
        ))}
      </g>

      <g className="anatomy-route-anatomy-cluster anatomy-route-alveoli">
        <path d="M826 344C850 358 868 374 884 394" />
        <path d="M846 394C866 408 882 426 896 448" />
        <path d="M858 446C878 458 894 478 910 504" />
        {[ [890,396], [908,420], [920,446], [928,474], [914,612], [930,638] ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="8.4" />
        ))}
      </g>

      <g className="anatomy-route-pulse">
        {[
          [334, 446, 7.5],
          [356, 506, 7],
          [390, 540, 6.5],
          [608, 446, 7.5],
          [588, 506, 7],
          [554, 540, 6.5],
          [302, 402, 4.5],
          [638, 404, 4.5],
        ].map(([cx, cy, r]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} className="anatomy-route-node" />)}
      </g>

      <path className="anatomy-route-caption-line" d="M206 204C274 186 326 194 392 222M764 214C694 220 636 244 578 284" />
    </svg>
  );
}

function NclexBrainSignal() {
  return (
    <svg className="anatomy-route-svg" viewBox="0 0 960 760" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="brain-core" cx="0" cy="0" r="1" gradientTransform="translate(482 360) rotate(90) scale(246 242)" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--anatomy-glow-b)" />
          <stop offset="0.62" stopColor="rgba(255,255,255,0.02)" />
          <stop offset="1" stopColor="transparent" />
        </radialGradient>
        <filter id="brain-blur" x="0" y="0" width="960" height="760" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>

      <g className="anatomy-route-backdrop">
        <g filter="url(#brain-blur)" opacity="0.44">
          <path className="anatomy-route-ribbon anatomy-route-ribbon-a" d="M-24 272C146 212 276 214 378 270C446 308 506 382 614 390C738 400 838 326 992 248" />
          <path className="anatomy-route-ribbon anatomy-route-ribbon-b" d="M-10 470C132 410 244 394 350 434C446 470 520 548 644 556C766 562 854 504 990 434" />
          <path className="anatomy-route-ribbon anatomy-route-ribbon-c" d="M112 158C194 196 250 242 314 318" />
          <path className="anatomy-route-ribbon anatomy-route-ribbon-d" d="M850 176C766 208 704 254 642 326" />
          <path className="anatomy-route-ribbon anatomy-route-ribbon-e" d="M530 146C660 170 774 226 884 332C930 376 968 430 994 488" />
          <path className="anatomy-route-ribbon anatomy-route-ribbon-f" d="M530 580C654 552 766 566 918 650" />
        </g>

        <g className="anatomy-route-orbits">
          <ellipse cx="482" cy="360" rx="338" ry="238" className="anatomy-route-orbit anatomy-route-orbit-a" />
          <ellipse cx="482" cy="360" rx="286" ry="204" className="anatomy-route-orbit anatomy-route-orbit-b" />
          <path className="anatomy-route-thread anatomy-route-thread-a" d="M138 310C248 338 334 374 406 456" />
          <path className="anatomy-route-thread anatomy-route-thread-b" d="M826 322C718 344 630 378 558 458" />
          <path className="anatomy-route-thread anatomy-route-thread-c" d="M290 620C340 576 386 532 432 470" />
          <path className="anatomy-route-thread anatomy-route-thread-d" d="M672 622C624 580 578 534 534 472" />
        </g>

        <g className="anatomy-route-mesh">
          <path d="M604 194C702 216 794 274 892 372" />
          <path d="M620 250C710 290 794 344 894 442" />
          <path d="M602 520C700 514 786 538 900 614" />
          <path d="M576 570C668 578 752 608 850 678" />
        </g>

        <g className="anatomy-route-rightfield">
          <path d="M718 152C836 196 918 272 988 388" />
          <path d="M746 218C852 264 924 330 992 432" />
          <path d="M724 470C842 482 922 522 992 600" />
          <path d="M694 554C810 584 886 626 964 704" />
        </g>

        <g className="anatomy-route-contour">
          <path d="M658 114C784 142 882 210 986 328C1032 380 1064 438 1082 498" />
          <path d="M690 224C808 268 894 334 988 436" />
          <path d="M660 528C780 536 878 574 992 658" />
        </g>

        <g className="anatomy-route-scaffold">
          <path d="M636 104C742 124 832 180 920 272C962 316 992 360 1010 404" />
          <path d="M660 612C768 612 856 642 952 714" />
          <path d="M790 126L866 126L920 172" />
          <path d="M812 650L894 650L944 692" />
        </g>

        <g className="anatomy-route-sweep">
          <path d="M576 142C694 160 790 210 886 300C944 352 986 408 1018 482" />
          <path d="M622 194C726 222 808 268 882 336C932 382 970 428 1002 482" />
          <path d="M632 522C742 522 826 550 926 620C964 646 998 680 1024 718" />
          <path d="M604 578C708 590 792 626 890 692" />
        </g>

        <g className="anatomy-route-pulse">
          {[
            [166, 306, 5.5],
            [228, 232, 4.6],
            [796, 316, 5.5],
            [734, 236, 4.6],
            [314, 634, 5.2],
            [650, 638, 5.2],
            [894, 372, 4.8],
            [896, 440, 4.2],
            [900, 614, 4.4],
          ].map(([cx, cy, r]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} className="anatomy-route-node" />)}
        </g>
      </g>

      <circle cx="482" cy="360" r="228" fill="url(#brain-core)" className="anatomy-route-core" />

      <g className="anatomy-route-shadow" opacity="0.24">
        <path d="M468 206C408 206 350 252 336 322C330 362 338 400 364 430C354 454 350 476 350 502C350 570 408 626 480 626C552 626 614 570 614 498C614 474 610 454 600 432C622 404 632 366 626 326C614 252 556 206 496 206H468Z" stroke="var(--anatomy-shadow)" strokeWidth="16" />
      </g>

      <g className="anatomy-route-outline">
        <path d="M468 206C408 206 350 252 336 322C330 362 338 400 364 430C354 454 350 476 350 502C350 570 408 626 480 626C552 626 614 570 614 498C614 474 610 454 600 432C622 404 632 366 626 326C614 252 556 206 496 206H468Z" strokeWidth="4.8" fill="rgba(255,255,255,0.06)" />
        <path d="M482 228V604" strokeWidth="2.6" strokeDasharray="5 8" />
        <path d="M480 258C438 246 404 252 378 278C350 304 348 338 366 364" strokeWidth="3.4" />
        <path d="M480 306C428 294 386 308 364 338C342 368 348 404 378 424" strokeWidth="3.2" />
        <path d="M480 356C440 350 408 368 394 398C382 430 394 462 426 478" strokeWidth="3" />
        <path d="M484 258C526 246 560 252 586 278C614 304 616 338 598 364" strokeWidth="3.4" />
        <path d="M484 306C536 294 578 308 600 338C622 368 616 404 586 424" strokeWidth="3.2" />
        <path d="M484 356C524 350 556 368 570 398C582 430 570 462 538 478" strokeWidth="3" />
      </g>

      <g className="anatomy-route-detail">
        <path d="M404 282C388 300 374 318 364 340" />
        <path d="M416 346C392 366 380 386 376 412" />
        <path d="M432 426C416 446 408 468 408 492" />
        <path d="M560 282C576 300 590 318 600 340" />
        <path d="M548 346C572 366 584 386 588 412" />
        <path d="M532 426C548 446 556 468 556 492" />
        <path d="M436 522C410 536 390 554 378 578" />
        <path d="M528 522C554 536 574 554 586 580" />
      </g>

      <g className="anatomy-route-anatomy-focus">
        <path d="M394 252C432 236 468 236 482 250" />
        <path d="M356 322C404 300 444 302 474 330" />
        <path d="M368 390C414 372 448 374 474 402" />
        <path d="M396 470C426 456 452 456 470 472" />
        <path d="M570 252C532 236 496 236 482 250" />
        <path d="M608 322C560 300 520 302 490 330" />
        <path d="M596 390C550 372 516 374 490 402" />
        <path d="M568 470C538 456 512 456 494 472" />
      </g>

      <g className="anatomy-route-micro-node">
        {[ [356,322], [368,390], [396,470], [608,322], [596,390], [568,470] ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.9" />
        ))}
      </g>

      <g className="anatomy-route-soft-detail">
        <path d="M176 304C246 340 292 376 360 450" />
        <path d="M790 316C722 342 666 378 604 454" />
        <path d="M314 636C360 586 404 540 454 488" />
        <path d="M652 638C608 588 566 542 516 490" />
      </g>

      <g className="anatomy-route-fine-detail">
        <path d="M360 296C332 322 316 350 314 382" />
        <path d="M350 398C330 424 322 452 326 482" />
        <path d="M604 296C632 322 648 350 650 382" />
        <path d="M614 398C634 424 642 452 638 482" />
        <path d="M748 262C812 292 860 334 912 394" />
        <path d="M738 526C808 544 864 574 926 632" />
      </g>

      <g className="anatomy-route-peripheral-detail">
        <path d="M704 284C760 302 810 336 862 388" />
        <path d="M728 330C786 352 836 390 888 448" />
        <path d="M760 384C812 408 852 442 894 492" />
        <path d="M802 430C842 456 874 492 910 542" />
        <path d="M738 534C792 548 840 576 890 624" />
        <path d="M766 572C816 590 860 620 908 668" />
      </g>

      <g className="anatomy-route-peripheral-node">
        {[ [862,388], [888,448], [894,492], [910,542], [890,624], [908,668] ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.4" />
        ))}
      </g>

      <g className="anatomy-route-anatomy-cluster anatomy-route-synapse">
        <path d="M824 330C850 350 874 374 900 406" />
        <path d="M846 410C874 432 896 462 918 498" />
        <path d="M804 560C840 574 874 600 914 646" />
        {[ [884,366], [904,396], [920,432], [930,468], [920,622], [936,652] ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.8" />
        ))}
      </g>

      <g className="anatomy-route-pulse">
        {[
          [176, 304, 5.5],
          [230, 232, 4.6],
          [790, 316, 5.5],
          [736, 236, 4.6],
          [314, 636, 5.2],
          [652, 638, 5.2],
          [364, 340, 3.8],
          [600, 340, 3.8],
          [408, 492, 3.6],
          [556, 492, 3.6],
        ].map(([cx, cy, r]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} className="anatomy-route-node" />)}
      </g>

      <path className="anatomy-route-caption-line" d="M246 196C314 176 368 182 430 212M730 210C662 222 612 246 560 284" />
    </svg>
  );
}

function CcrnHeartSignal() {
  return (
    <svg className="anatomy-route-svg" viewBox="0 0 960 760" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="heart-core" cx="0" cy="0" r="1" gradientTransform="translate(484 372) rotate(90) scale(250 226)" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--anatomy-glow-a)" />
          <stop offset="0.62" stopColor="rgba(255,255,255,0.02)" />
          <stop offset="1" stopColor="transparent" />
        </radialGradient>
        <filter id="heart-blur" x="0" y="0" width="960" height="760" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>

      <g className="anatomy-route-backdrop">
        <g filter="url(#heart-blur)" opacity="0.46">
          <path className="anatomy-route-ribbon anatomy-route-ribbon-a" d="M-18 320C126 252 236 232 346 264C446 294 530 382 652 392C770 402 858 348 992 286" />
          <path className="anatomy-route-ribbon anatomy-route-ribbon-b" d="M-10 488C120 438 222 424 332 452C438 478 524 558 650 566C772 572 860 526 994 470" />
          <path className="anatomy-route-ribbon anatomy-route-ribbon-c" d="M182 116C260 150 320 198 376 274" />
          <path className="anatomy-route-ribbon anatomy-route-ribbon-d" d="M812 132C736 162 674 208 616 284" />
          <path className="anatomy-route-ribbon anatomy-route-ribbon-e" d="M532 150C658 176 770 238 884 346C930 392 966 446 994 500" />
          <path className="anatomy-route-ribbon anatomy-route-ribbon-f" d="M538 566C664 542 770 560 922 646" />
        </g>

        <g className="anatomy-route-orbits">
          <ellipse cx="484" cy="372" rx="338" ry="236" className="anatomy-route-orbit anatomy-route-orbit-a" />
          <ellipse cx="484" cy="372" rx="288" ry="204" className="anatomy-route-orbit anatomy-route-orbit-b" />
          <path className="anatomy-route-thread anatomy-route-thread-a" d="M194 188C260 214 316 256 370 326" />
          <path className="anatomy-route-thread anatomy-route-thread-b" d="M776 198C712 220 654 260 598 328" />
          <path className="anatomy-route-thread anatomy-route-thread-c" d="M248 538C320 522 382 520 434 536" />
          <path className="anatomy-route-thread anatomy-route-thread-d" d="M724 546C646 530 584 526 532 538" />
        </g>

        <g className="anatomy-route-mesh">
          <path d="M612 212C708 244 792 294 892 388" />
          <path d="M630 276C724 322 804 374 902 462" />
          <path d="M608 520C698 514 788 534 904 606" />
          <path d="M592 568C676 578 758 608 856 674" />
        </g>

        <g className="anatomy-route-rightfield">
          <path d="M726 170C842 216 922 286 992 396" />
          <path d="M752 236C856 286 928 354 994 456" />
          <path d="M734 488C846 500 926 542 994 620" />
          <path d="M706 566C816 590 892 634 968 710" />
        </g>

        <g className="anatomy-route-contour">
          <path d="M666 130C790 162 886 230 992 348C1036 398 1068 456 1090 516" />
          <path d="M696 244C814 292 900 360 996 466" />
          <path d="M668 536C788 546 884 586 996 668" />
        </g>

        <g className="anatomy-route-scaffold">
          <path d="M642 122C742 150 826 208 910 300C952 348 986 392 1010 448" />
          <path d="M664 620C770 620 858 650 952 720" />
          <path d="M800 144L872 144L922 190" />
          <path d="M820 658L900 658L950 702" />
        </g>

        <g className="anatomy-route-sweep">
          <path d="M582 156C694 184 786 238 876 324C938 384 980 442 1010 506" />
          <path d="M624 210C724 244 804 292 874 356C926 404 964 454 996 510" />
          <path d="M630 520C742 520 828 552 926 622C964 648 998 682 1022 720" />
          <path d="M610 576C710 590 792 626 888 692" />
        </g>

        <g className="anatomy-route-pulse">
          {[
            [212, 164, 5],
            [782, 174, 5],
            [182, 454, 5.4],
            [786, 472, 5.4],
            [284, 650, 5],
            [688, 646, 5],
            [892, 390, 4.8],
            [900, 462, 4.4],
            [904, 606, 4.6],
          ].map(([cx, cy, r]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} className="anatomy-route-node" />)}
        </g>
      </g>

      <circle cx="484" cy="372" r="228" fill="url(#heart-core)" className="anatomy-route-core" />

      <g className="anatomy-route-shadow" opacity="0.24">
        <path d="M458 176V268M490 182V282M410 296C330 292 278 330 254 396C230 468 264 560 370 626C432 664 482 678 482 678C482 678 530 658 584 626C694 558 708 450 658 374C620 318 538 308 496 352C480 368 470 388 466 416C458 366 442 338 410 296Z" stroke="var(--anatomy-shadow)" strokeWidth="17" strokeLinecap="round" />
      </g>

      <g className="anatomy-route-outline">
        <path d="M458 168V268" strokeWidth="7" />
        <path d="M490 178V282" strokeWidth="6" />
        <path d="M458 216C426 214 400 234 390 264C380 296 388 330 412 356" strokeWidth="3.6" />
        <path d="M490 226C530 222 560 246 572 284C584 322 576 362 546 398" strokeWidth="3.6" />
        <path d="M410 296C330 292 278 330 254 396C230 468 264 560 370 626C432 664 482 678 482 678C482 678 530 658 584 626C694 558 708 450 658 374C620 318 538 308 496 352C480 368 470 388 466 416C458 366 442 338 410 296Z" strokeWidth="4.8" fill="rgba(255,255,255,0.05)" />
      </g>

      <g className="anatomy-route-detail">
        <path d="M430 338C390 360 360 392 346 430" />
        <path d="M414 408C382 430 362 456 354 492" />
        <path d="M530 340C568 362 594 392 606 428" />
        <path d="M548 408C584 432 604 458 610 494" />
        <path d="M470 526C440 548 414 576 396 608" />
        <path d="M524 522C556 546 582 574 600 604" />
      </g>

      <g className="anatomy-route-anatomy-focus">
        <path d="M474 168C474 146 482 128 500 108" />
        <path d="M500 108C526 124 544 146 554 182" />
        <path d="M444 352C408 382 384 414 372 452" />
        <path d="M526 356C560 384 584 414 596 450" />
        <path d="M446 468C420 496 404 526 396 560" />
        <path d="M522 468C546 494 564 522 574 556" />
      </g>

      <g className="anatomy-route-micro-node">
        {[ [500,108], [372,452], [396,560], [596,450], [574,556] ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" />
        ))}
      </g>

      <g className="anatomy-route-soft-detail">
        <path d="M254 398C330 426 388 448 460 470" />
        <path d="M656 380C592 410 544 438 502 474" />
        <path d="M212 164C262 182 320 224 370 292" />
        <path d="M782 174C724 198 670 236 620 302" />
      </g>

      <g className="anatomy-route-fine-detail">
        <path d="M356 330C326 352 306 380 296 414" />
        <path d="M336 432C316 458 308 488 312 520" />
        <path d="M616 328C644 350 662 378 672 410" />
        <path d="M632 430C652 454 662 484 660 518" />
        <path d="M758 248C820 280 870 326 922 392" />
        <path d="M742 520C810 540 868 576 930 636" />
      </g>

      <g className="anatomy-route-peripheral-detail">
        <path d="M704 252C760 270 808 300 858 344" />
        <path d="M740 298C794 318 842 348 894 392" />
        <path d="M774 348C822 370 864 402 906 446" />
        <path d="M808 404C850 428 886 460 924 502" />
        <path d="M742 520C792 532 838 556 890 598" />
        <path d="M772 560C818 576 860 602 908 642" />
      </g>

      <g className="anatomy-route-peripheral-node">
        {[ [858,344], [894,392], [906,446], [924,502], [890,598], [908,642] ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.4" />
        ))}
      </g>

      <g className="anatomy-route-anatomy-cluster anatomy-route-vessel-branch">
        <path d="M832 280C858 296 886 320 918 354" />
        <path d="M852 352C880 372 904 400 930 438" />
        <path d="M830 542C862 556 894 580 932 620" />
        <path d="M862 596C890 612 914 634 942 668" />
        {[ [918,354], [930,438], [932,620], [942,668] ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" />
        ))}
      </g>

      <g className="anatomy-route-pulse">
        {[
          [346, 430, 4.6],
          [354, 492, 4.4],
          [606, 428, 4.6],
          [610, 494, 4.4],
          [396, 608, 4.2],
          [600, 604, 4.2],
        ].map(([cx, cy, r]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} className="anatomy-route-node" />)}
      </g>

      <path className="anatomy-route-caption-line" d="M234 538C306 510 354 498 420 494C486 492 550 506 650 550" />
    </svg>
  );
}

export default function FrontpageAnatomySignal({ route, tone, className }: SignalProps) {
  const accent = getAccents(route);
  const style = {
    "--anatomy-line": accent.line,
    "--anatomy-line-soft": accent.lineSoft,
    "--anatomy-glow-a": accent.glowA,
    "--anatomy-glow-b": accent.glowB,
    "--anatomy-node": accent.node,
    "--anatomy-shadow": accent.shadow,
    "--anatomy-warm": accent.warm,
    "--anatomy-field": accent.field,
    "--anatomy-tone": tone,
  } as CSSProperties;

  return (
    <div className={cx("anatomy-signal-field", `anatomy-signal-route-${route}`, className)} style={style} aria-hidden="true">
      {route === "home" ? <HomeLungsSignal /> : null}
      {route === "nclex" ? <NclexBrainSignal /> : null}
      {route === "ccrn" ? <CcrnHeartSignal /> : null}
    </div>
  );
}
