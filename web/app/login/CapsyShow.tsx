"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./capsy-show.css";

type Act = { c: string; d: number };

const ACTS: Act[] = [
  { c: "wave", d: 2800 },
  { c: "open", d: 3000 },
  { c: "juggle", d: 3600 },
  { c: "dance", d: 3200 },
];

export default function CapsyShow() {
  const [actClass, setActClass] = useState("act-wave");
  const indexRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const play = useCallback((act: Act, next: () => void) => {
    setActClass(`act-${act.c}`);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(next, act.d);
  }, []);

  const run = useCallback(() => {
    const act = ACTS[indexRef.current % ACTS.length];
    indexRef.current += 1;
    play(act, run);
  }, [play]);

  useEffect(() => {
    run();
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [run]);

  function onTap() {
    play({ c: "wave", d: 2400 }, run);
  }

  return (
    <div className="capsyShow">
      <svg
        viewBox="0 -150 492 790"
        role="img"
        aria-label="MapleRx loading mascot"
        onClick={onTap}
      >
        <ellipse
          id="sh"
          cx="236"
          cy="590"
          rx="125"
          ry="12"
          fill="var(--capsy-shadow)"
        />

        <g className={actClass} id="stage">
          <g id="m">
            <g className="foot-l">
              <rect x="190" y="480" width="14" height="60" rx="7" fill="#1fa074" />
              <ellipse cx="177" cy="563" rx="38" ry="18" fill="#127556" />
            </g>
            <g className="foot-r">
              <rect x="270" y="480" width="14" height="60" rx="7" fill="#1fa074" />
              <ellipse cx="297" cy="563" rx="38" ry="18" fill="#127556" />
            </g>

            <g className="arm-l">
              <path
                d="M118 340 C85 345 62 370 55 405"
                fill="none"
                stroke="#1fa074"
                strokeWidth="12"
                strokeLinecap="round"
              />
              <circle
                cx="55"
                cy="406"
                r="21"
                fill="#f4f0e9"
                stroke="#1fa074"
                strokeWidth="6"
              />
            </g>
            <g className="arm-r">
              <path
                d="M358 302 C410 300 428 260 432 218"
                fill="none"
                stroke="#1fa074"
                strokeWidth="12"
                strokeLinecap="round"
              />
              <circle
                cx="434"
                cy="203"
                r="22"
                fill="#f4f0e9"
                stroke="#1fa074"
                strokeWidth="6"
              />
            </g>

            <path
              d="M118 250 H356 V380 C356 450 305 494 237 494 C169 494 118 450 118 380 Z"
              fill="#f4f0e9"
              stroke="#127556"
              strokeWidth="7"
            />
            <ellipse cx="237" cy="251" rx="116" ry="9" fill="#d9d2c3" />

            <path
              d="M166 298 Q187 288 208 299"
              fill="none"
              stroke="#2a2a2a"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M265 299 Q286 288 308 298"
              fill="none"
              stroke="#2a2a2a"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <g className="eye">
              <circle cx="187" cy="334" r="18" fill="#2a2a2a" />
              <circle cx="192" cy="328" r="6" fill="#fff" />
            </g>
            <g className="eye">
              <circle cx="287" cy="334" r="18" fill="#2a2a2a" />
              <circle cx="292" cy="328" r="6" fill="#fff" />
            </g>
            <ellipse className="blush" cx="153" cy="378" rx="20" ry="12" fill="#f7a8a8" />
            <ellipse className="blush" cx="321" cy="378" rx="20" ry="12" fill="#f7a8a8" />
            <path
              className="smile"
              d="M203 374 Q237 410 272 374"
              fill="none"
              stroke="#2a2a2a"
              strokeWidth="5"
              strokeLinecap="round"
            />

            <g transform="translate(237 245)">
              <path
                className="spark"
                style={{ ["--dx" as string]: "-110px", ["--dy" as string]: "-150px", animationDelay: "0s" }}
                d="M0-12 4-4 12 0 4 4 0 12-4 4-12 0-4-4Z"
                fill="#ffd24a"
              />
              <path
                className="spark"
                style={{ ["--dx" as string]: "90px", ["--dy" as string]: "-170px", animationDelay: ".2s" }}
                d="M0-12 4-4 12 0 4 4 0 12-4 4-12 0-4-4Z"
                fill="#5fd4a8"
              />
              <path
                className="spark"
                style={{ ["--dx" as string]: "-30px", ["--dy" as string]: "-200px", animationDelay: ".4s" }}
                d="M0-12 4-4 12 0 4 4 0 12-4 4-12 0-4-4Z"
                fill="#5fd4a8"
              />
              <path
                className="spark"
                style={{ ["--dx" as string]: "140px", ["--dy" as string]: "-110px", animationDelay: ".6s" }}
                d="M0-12 4-4 12 0 4 4 0 12-4 4-12 0-4-4Z"
                fill="#ffd24a"
              />
              <path
                className="spark"
                style={{ ["--dx" as string]: "-150px", ["--dy" as string]: "-80px", animationDelay: ".8s" }}
                d="M0-12 4-4 12 0 4 4 0 12-4 4-12 0-4-4Z"
                fill="#5fd4a8"
              />
              <path
                className="spark"
                style={{ ["--dx" as string]: "30px", ["--dy" as string]: "-140px", animationDelay: "1s" }}
                d="M0-12 4-4 12 0 4 4 0 12-4 4-12 0-4-4Z"
                fill="#5fd4a8"
              />
            </g>

            <g id="cap">
              <path
                d="M118 250 V150 C118 80 168 35 237 35 C306 35 356 80 356 150 V250 Z"
                fill="#1fa074"
                stroke="#127556"
                strokeWidth="7"
              />
              <rect x="118" y="235" width="238" height="16" fill="#127556" />
              <rect x="148" y="62" width="20" height="116" rx="10" fill="#fff" opacity=".3" />
              <path
                d="M238 99h30a8 8 0 0 1 8 8v28h14a8 8 0 0 1 8 8v14a8 8 0 0 1-8 8h-14v8a8 8 0 0 1-8 8h-30a8 8 0 0 1-8-8v-8h-14a8 8 0 0 1-8-8v-14a8 8 0 0 1 8-8h14v-28a8 8 0 0 1 8-8z"
                transform="translate(-14 -2)"
                fill="#fff"
              />
            </g>
          </g>

          <g className="juggle" transform="translate(237 20)">
            <g className="jx" style={{ ["--d" as string]: "0s" }}>
              <g className="jy" style={{ ["--d" as string]: "0s" }}>
                <g className="jr">
                  <rect x="-16" y="-8" width="32" height="16" rx="8" fill="#f4f0e9" />
                  <path
                    d="M-16 0V-0A8 8 0 0 1-8-8H0V8H-8A8 8 0 0 1-16 0Z"
                    fill="#1fa074"
                  />
                </g>
              </g>
            </g>
            <g className="jx" style={{ ["--d" as string]: "-.33s" }}>
              <g className="jy" style={{ ["--d" as string]: "-.33s" }}>
                <g className="jr">
                  <rect x="-16" y="-8" width="32" height="16" rx="8" fill="#f7a8a8" />
                  <path
                    d="M-16 0A8 8 0 0 1-8-8H0V8H-8A8 8 0 0 1-16 0Z"
                    fill="#ffd24a"
                  />
                </g>
              </g>
            </g>
            <g className="jx" style={{ ["--d" as string]: "-.66s" }}>
              <g className="jy" style={{ ["--d" as string]: "-.66s" }}>
                <g className="jr">
                  <rect x="-16" y="-8" width="32" height="16" rx="8" fill="#f4f0e9" />
                  <path
                    d="M-16 0A8 8 0 0 1-8-8H0V8H-8A8 8 0 0 1-16 0Z"
                    fill="#127556"
                  />
                </g>
              </g>
            </g>
          </g>
        </g>
      </svg>

      <div className="bar" aria-hidden="true">
        <i />
      </div>
    </div>
  );
}
