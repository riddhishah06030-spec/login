"use client";

import { useEffect, useRef, useState } from "react";
import "./hero-mascot.css";

type Mood = "idle" | "cover" | "peek" | "wave" | "sad" | "happy";

type HeroMascotProps = {
  username: string;
  passwordLength: number;
  showPassword: boolean;
  usernameFocused: boolean;
  passwordFocused: boolean;
  mood: "idle" | "sad" | "happy";
};

export default function HeroMascot({
  username,
  passwordLength,
  showPassword,
  usernameFocused,
  passwordFocused,
  mood,
}: HeroMascotProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const bumpRef = useRef<SVGGElement>(null);
  const [act, setAct] = useState<Mood>("wave");
  const busyRef = useRef(false);

  function look(x: number, y: number) {
    heroRef.current?.style.setProperty("--ex", `${x}px`);
    heroRef.current?.style.setProperty("--ey", `${y}px`);
  }

  function bump() {
    const node = bumpRef.current;
    if (!node) return;
    node.classList.remove("bump");
    void node.getBoundingClientRect();
    node.classList.add("bump");
  }

  useEffect(() => {
    if (mood === "sad") {
      busyRef.current = true;
      setAct("sad");
      look(0, 6);
      const timer = window.setTimeout(() => {
        busyRef.current = false;
      }, 2800);
      return () => window.clearTimeout(timer);
    }
    if (mood === "happy") {
      busyRef.current = true;
      setAct("happy");
      look(0, 0);
      const timer = window.setTimeout(() => {
        busyRef.current = false;
      }, 2800);
      return () => window.clearTimeout(timer);
    }
  }, [mood]);

  useEffect(() => {
    if (busyRef.current) return;
    if (passwordFocused) {
      if (showPassword) {
        setAct("peek");
        look(-4, 8);
      } else {
        setAct("cover");
        look(0, 0);
      }
      return;
    }
    if (usernameFocused) {
      setAct("idle");
      const ratio = Math.min(username.length, 22) / 22;
      look(-10 + 20 * ratio, 7);
      return;
    }
    setAct("wave");
    look(0, 0);
  }, [passwordFocused, showPassword, usernameFocused, username]);

  useEffect(() => {
    if (usernameFocused || passwordFocused) bump();
  }, [username, passwordLength, usernameFocused, passwordFocused]);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      if (busyRef.current || usernameFocused || passwordFocused) return;
      const rect = heroRef.current?.querySelector("svg")?.getBoundingClientRect();
      if (!rect) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height * 0.55;
      const dx = Math.max(-1, Math.min(1, (event.clientX - cx) / (window.innerWidth / 2)));
      const dy = Math.max(-1, Math.min(1, (event.clientY - cy) / (window.innerHeight / 2)));
      look(dx * 12, dy * 8);
    };
    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, [usernameFocused, passwordFocused]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (busyRef.current || usernameFocused || passwordFocused) return;
      if (act !== "idle" && act !== "wave") return;
      setAct("wave");
      window.setTimeout(() => {
        setAct((current) => (current === "wave" ? "idle" : current));
      }, 2600);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [act, usernameFocused, passwordFocused]);

  const stageClass = act === "idle" ? "" : act;

  return (
    <div className="heroMascot" ref={heroRef} aria-hidden="false">
      <svg id="hero" viewBox="40 0 412 560" role="img" aria-label="PMS mascot">
        <g id="hstage" className={stageClass}>
          <ellipse id="hshadow" cx="246" cy="538" rx="88" ry="12" fill="#9fd4bf" opacity="0.55" />

          <g id="hm">
            <g id="hk" ref={bumpRef}>
              <g id="hb">
                <g className="foot foot-l">
                  <rect x="198" y="448" width="12" height="52" rx="6" fill="#1fa074" />
                  <ellipse cx="186" cy="508" rx="28" ry="12" fill="#127556" />
                </g>
                <g className="foot foot-r">
                  <rect x="278" y="448" width="12" height="52" rx="6" fill="#1fa074" />
                  <ellipse cx="306" cy="508" rx="28" ry="12" fill="#127556" />
                </g>

                <g className="ha l">
                  <path
                    d="M128 318 C96 328 78 360 74 398"
                    fill="none"
                    stroke="#1fa074"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                  <circle cx="74" cy="404" r="18" fill="#1fa074" />
                </g>
                <g className="ha r">
                  <path
                    d="M364 300 C408 292 428 248 432 208"
                    fill="none"
                    stroke="#1fa074"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                  <circle cx="434" cy="196" r="18" fill="#1fa074" />
                </g>

                <path
                  d="M128 230 H364 V360 C364 430 312 474 246 474 C180 474 128 430 128 360 Z"
                  fill="#f7f4ee"
                  stroke="#127556"
                  strokeWidth="7"
                />
                <path
                  d="M128 230 V140 C128 72 176 30 246 30 C316 30 364 72 364 140 V230 Z"
                  fill="#1fa074"
                  stroke="#127556"
                  strokeWidth="7"
                />
                <rect x="128" y="216" width="236" height="16" fill="#127556" />
                <rect x="156" y="58" width="18" height="100" rx="9" fill="#fff" opacity=".28" />
                <path
                  d="M246 88h26a7 7 0 0 1 7 7v24h12a7 7 0 0 1 7 7v12a7 7 0 0 1-7 7h-12v8a7 7 0 0 1-7 7h-26a7 7 0 0 1-7-7v-8h-12a7 7 0 0 1-7-7v-12a7 7 0 0 1 7-7h12v-24a7 7 0 0 1 7-7z"
                  fill="#fff"
                />

                <path
                  d="M176 278 Q196 268 216 279"
                  fill="none"
                  stroke="#2a2a2a"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d="M276 279 Q296 268 316 278"
                  fill="none"
                  stroke="#2a2a2a"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <g className="hbl">
                  <g className="look">
                    <circle cx="196" cy="312" r="16" fill="#2a2a2a" />
                    <circle cx="200" cy="306" r="5" fill="#fff" />
                  </g>
                </g>
                <g className="hbl">
                  <g className="look">
                    <circle cx="296" cy="312" r="16" fill="#2a2a2a" />
                    <circle cx="300" cy="306" r="5" fill="#fff" />
                  </g>
                </g>
                <ellipse className="hbs" cx="164" cy="350" rx="16" ry="10" fill="#f7a8a8" />
                <ellipse className="hbs" cx="328" cy="350" rx="16" ry="10" fill="#f7a8a8" />
                <path
                  className="hsm"
                  d="M214 348 Q246 378 278 348"
                  fill="none"
                  stroke="#2a2a2a"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path
                  className="hfr"
                  d="M216 368 Q246 346 276 368"
                  fill="none"
                  stroke="#2a2a2a"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
