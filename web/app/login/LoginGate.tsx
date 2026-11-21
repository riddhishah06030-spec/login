"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { consumeSkipSplash } from "@/lib/auth";
import CapsyShow from "./CapsyShow";
import LoginForm from "./LoginForm";
import styles from "./splash.module.css";

const SPLASH_MS = 5000;
const PRELOAD_LOGIN_MS = 4200;
const FADE_MS = 650;

type GateMode = "pending" | "splash" | "ready";

export default function LoginGate() {
  const [mode, setMode] = useState<GateMode>("pending");
  const [showLogin, setShowLogin] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashFading, setSplashFading] = useState(false);

  useEffect(() => {
    if (consumeSkipSplash()) {
      setShowLogin(true);
      setSplashVisible(false);
      setMode("ready");
      return;
    }

    setMode("splash");

    const preloadTimer = window.setTimeout(() => {
      setShowLogin(true);
    }, PRELOAD_LOGIN_MS);

    const fadeTimer = window.setTimeout(() => {
      setSplashFading(true);
    }, SPLASH_MS);

    const doneTimer = window.setTimeout(() => {
      setSplashVisible(false);
      setMode("ready");
    }, SPLASH_MS + FADE_MS);

    return () => {
      window.clearTimeout(preloadTimer);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  if (mode === "pending") {
    return <div className={styles.gate} aria-busy="true" />;
  }

  return (
    <div className={styles.gate}>
      <div
        className={`${styles.loginLayer} ${showLogin ? styles.loginVisible : ""}`}
        aria-hidden={!showLogin || splashVisible}
      >
        {showLogin ? <LoginForm /> : null}
      </div>

      {splashVisible ? (
        <div
          className={`${styles.splashOverlay} ${splashFading ? styles.fading : ""}`}
          role="status"
          aria-live="polite"
          aria-label="Loading MapleRx"
          aria-hidden={splashFading}
        >
          <div className={`${styles.mascotWrap} ${splashFading ? styles.paused : ""}`}>
            <CapsyShow />
            <div className={styles.brand}>
              <Image
                src="/brand/maplerx-logo.png"
                alt="MapleRx"
                width={160}
                height={98}
                unoptimized
                priority
                className={styles.brandMark}
              />
              <p className={styles.brandTag}>Canadian Pharmacy Operating System</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
