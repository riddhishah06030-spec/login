"use client";

import { useEffect, useId, useRef, useState } from "react";
import "./hero-mascot.css";

type HeroMascotProps = {
  username: string;
  passwordLength: number;
  showPassword: boolean;
  usernameFocused: boolean;
  passwordFocused: boolean;
  mood: "idle" | "sad" | "happy";
};

function ease(t: number) {
  return t * t * (3 - 2 * t);
}

export default function HeroMascot({
  username,
  passwordLength: _passwordLength,
  showPassword,
  usernameFocused,
  passwordFocused,
  mood,
}: HeroMascotProps) {
  void _passwordLength;
  const uid = useId().replace(/:/g, "");
  const wrapRef = useRef<HTMLDivElement>(null);
  const coverLRef = useRef<SVGGElement>(null);
  const coverRRef = useRef<SVGGElement>(null);
  const armLRef = useRef<SVGGElement>(null);
  const armRRef = useRef<SVGGElement>(null);
  const animRef = useRef({ p: 0, q: 0, tp: 0, tq: 0, raf: 0 });
  const [flip, setFlip] = useState(false);
  const [moodClass, setMoodClass] = useState("");

  const covering = passwordFocused;
  const peeking = passwordFocused && showPassword;
  const watching = usernameFocused && !passwordFocused;

  function renderCover() {
    const state = animRef.current;
    const y = (1 - ease(state.p)) * 70;
    const a = ease(state.q) * 48;
    coverLRef.current?.setAttribute("transform", `translate(0 ${y})`);
    coverRRef.current?.setAttribute("transform", `translate(0 ${y}) rotate(${a} 249 200)`);
    const opacity = String(Math.min(1, state.p * 2));
    if (coverLRef.current) coverLRef.current.style.opacity = opacity;
    if (coverRRef.current) coverRRef.current.style.opacity = opacity;
    const armOpacity = String(1 - Math.min(1, state.p * 3));
    if (armLRef.current) armLRef.current.style.opacity = armOpacity;
    if (armRRef.current) armRRef.current.style.opacity = armOpacity;
  }

  function tick() {
    const state = animRef.current;
    state.p += (state.tp - state.p) * 0.18;
    state.q += (state.tq - state.q) * 0.18;
    if (Math.abs(state.tp - state.p) < 0.004) state.p = state.tp;
    if (Math.abs(state.tq - state.q) < 0.004) state.q = state.tq;
    renderCover();
    if (state.p !== state.tp || state.q !== state.tq) {
      state.raf = requestAnimationFrame(tick);
    }
  }

  function setCover(on: boolean, peek: boolean) {
    const state = animRef.current;
    state.tp = on ? 1 : 0;
    state.tq = peek ? 1 : 0;
    cancelAnimationFrame(state.raf);
    state.raf = requestAnimationFrame(tick);
  }

  useEffect(() => {
    setCover(covering, peeking);
  }, [covering, peeking]);

  useEffect(() => {
    if (!watching) {
      wrapRef.current?.style.setProperty("--gx", "0px");
      return;
    }
    const x = Math.max(-7, Math.min(7, (username.length / 22) * 14 - 7));
    wrapRef.current?.style.setProperty("--gx", `${x}px`);
  }, [watching, username]);

  useEffect(() => {
    if (mood === "sad") {
      setMoodClass("sad");
      const timer = window.setTimeout(() => setMoodClass(""), 2800);
      return () => window.clearTimeout(timer);
    }
    if (mood === "happy") {
      setMoodClass("happy");
      const timer = window.setTimeout(() => setMoodClass(""), 2800);
      return () => window.clearTimeout(timer);
    }
    setMoodClass("");
  }, [mood]);

  useEffect(() => {
    return () => cancelAnimationFrame(animRef.current.raf);
  }, []);

  function onFlip() {
    setFlip(false);
    requestAnimationFrame(() => setFlip(true));
  }

  const className = [
    "heroMascot",
    covering ? "covering" : "",
    peeking ? "peek" : "",
    watching ? "watching" : "",
    flip ? "flip" : "",
    moodClass,
  ]
    .filter(Boolean)
    .join(" ");

  const shoeClip = `cp-shoe-clip-${uid}`;
  const shoe = `cp-shoe-${uid}`;

  return (
    <div
      className={className}
      ref={wrapRef}
      role="img"
      aria-label="Capsy, the pharmacy mascot"
      onClick={onFlip}
      onAnimationEnd={(event) => {
        if (event.animationName === "cp-flip") setFlip(false);
      }}
    >
      <svg
        className="heroMascotSvg"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="20 -20 340 370"
        aria-hidden="true"
      >
        <defs>
          <clipPath id={shoeClip}>
            <path d="M-16 -8 L-16.5 -17 Q-16.5 -21 -12 -21 L2 -21 Q5 -21 7 -18 Q10 -14 17 -12.5 Q25 -11 25 -8 Z" />
          </clipPath>
          <g id={shoe}>
            <path
              d="M0 -20 Q1 -25 6 -24 Q9.5 -23 8.5 -18 Z"
              fill="#F5F1E8"
              stroke="#0F6E56"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M-16 -8 L-16.5 -17 Q-16.5 -21 -12 -21 L2 -21 Q5 -21 7 -18 Q10 -14 17 -12.5 Q25 -11 25 -8 Z"
              fill="#F5F1E8"
              stroke="#0F6E56"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <g clipPath={`url(#${shoeClip})`}>
              <path d="M-18 -23 L-8 -23 Q-6 -15 -9 -7 L-18 -7 Z" fill="#1D9E75" />
              <path d="M14 -15 Q11 -10 13 -6 L30 -6 L30 -15 Z" fill="#1D9E75" />
              <path
                d="M-5 -12 Q3 -15 10 -9"
                stroke="#1D9E75"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                opacity="0.55"
              />
            </g>
            <path
              d="M-16.5 -17 Q-16.5 -21 -12 -21 L2 -21"
              stroke="#0F6E56"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M5.6 -18 L3.8 -15 M8.8 -15.2 L7 -12.2 M12.5 -12.6 L11 -10.4"
              stroke="#0F6E56"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
            <rect
              x="-17.5"
              y="-9"
              width="43.5"
              height="8"
              rx="4"
              fill="#ffffff"
              stroke="#0F6E56"
              strokeWidth="2"
            />
            <path
              d="M-10 -5 H20"
              stroke="#cfe3da"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </g>
        </defs>

        <ellipse
          className="cp-shadow"
          cx="190"
          cy="328"
          rx="62"
          ry="7"
          fill="#000"
          fillOpacity="0.12"
        />

        <g className="cp-flip">
          <g className="cp-hop">
            <g className="cp-sway">
              <g className="cp-leg-l">
                <path
                  d="M170 280 L170 308"
                  stroke="#1D9E75"
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                />
                <use href={`#${shoe}`} transform="translate(164 323) scale(-1 1)" />
              </g>
              <g className="cp-leg-r">
                <path
                  d="M210 280 L210 308"
                  stroke="#1D9E75"
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                />
                <use href={`#${shoe}`} transform="translate(216 323)" />
              </g>

              <g className="cp-arm-l" ref={armLRef}>
                <path
                  d="M131 200 Q106 210 100 232"
                  stroke="#1D9E75"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <circle
                  cx="99"
                  cy="236"
                  r="10"
                  fill="#F5F1E8"
                  stroke="#1D9E75"
                  strokeWidth="3"
                />
              </g>
              <g className="cp-arm-r" ref={armRRef}>
                <path
                  d="M249 185 Q282 178 288 140"
                  stroke="#1D9E75"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <circle
                  cx="289"
                  cy="134"
                  r="11"
                  fill="#F5F1E8"
                  stroke="#1D9E75"
                  strokeWidth="3"
                />
              </g>

              <rect x="130" y="50" width="120" height="230" rx="60" fill="#F5F1E8" />
              <path d="M130 155 V110 A60 60 0 0 1 250 110 V155 Z" fill="#1D9E75" />
              <rect x="130" y="150" width="120" height="8" fill="#0F6E56" />
              <rect x="146" y="62" width="10" height="60" rx="5" fill="#fff" opacity="0.35" />
              <rect
                x="130"
                y="50"
                width="120"
                height="230"
                rx="60"
                fill="none"
                stroke="#0F6E56"
                strokeWidth="3"
              />
              <g className="cp-cross">
                <rect x="182" y="82" width="16" height="44" rx="4" fill="#fff" />
                <rect x="168" y="96" width="44" height="16" rx="4" fill="#fff" />
              </g>

              <g className="cp-gaze">
                <g className="cp-eye-l">
                  <circle cx="165" cy="200" r="9" fill="#2B2B2B" />
                  <circle cx="168" cy="197" r="3" fill="#fff" />
                </g>
                <g className="cp-eye-r">
                  <circle cx="215" cy="200" r="9" fill="#2B2B2B" />
                  <circle cx="218" cy="197" r="3" fill="#fff" />
                </g>
              </g>
              <g className="cp-brows">
                <path
                  d="M155 182 Q165 176 175 182 M205 182 Q215 176 225 182"
                  stroke="#2B2B2B"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
              <ellipse cx="148" cy="222" rx="10" ry="6" fill="#F4A9A8" />
              <ellipse cx="232" cy="222" rx="10" ry="6" fill="#F4A9A8" />
              <g className="cp-mouth">
                <path
                  d="M173 220 Q190 242 207 220"
                  stroke="#2B2B2B"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>

              <g
                className="cp-cover"
                ref={coverLRef}
                transform="translate(0 70)"
                style={{ opacity: 0 }}
              >
                <path
                  d="M131 200 Q145 188 165 198"
                  stroke="#1D9E75"
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle
                  cx="165"
                  cy="200"
                  r="14"
                  fill="#F5F1E8"
                  stroke="#1D9E75"
                  strokeWidth="3"
                />
              </g>
              <g
                className="cp-cover"
                ref={coverRRef}
                transform="translate(0 70)"
                style={{ opacity: 0 }}
              >
                <path
                  d="M249 185 Q235 176 215 198"
                  stroke="#1D9E75"
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle
                  cx="215"
                  cy="200"
                  r="14"
                  fill="#F5F1E8"
                  stroke="#1D9E75"
                  strokeWidth="3"
                />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
