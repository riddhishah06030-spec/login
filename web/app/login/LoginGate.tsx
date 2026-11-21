"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { consumeSkipSplash } from "@/lib/auth";
import CapsyShow from "./CapsyShow";
import LoginForm from "./LoginForm";
import styles from "./splash.module.css";

const SPLASH_MS = 5000;
const PRELOAD_LOGIN_MS = 4200;
const FADE_MS = 650;

export default function LoginGate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const skipFromUrl = searchParams.get("from") === "logout";
  const skipRef = useRef(skipFromUrl);
  const [showLogin, setShowLogin] = useState(skipFromUrl);
  const [splashVisible, setSplashVisible] = useState(!skipFromUrl);
  const [splashFading, setSplashFading] = useState(false);

  const shouldSkipSplash = useMemo(
    () => skipFromUrl || skipRef.current,
    [skipFromUrl],
  );

  useEffect(() => {
    if (!skipRef.current && (skipFromUrl || consumeSkipSplash())) {
      skipRef.current = true;
      setShowLogin(true);
      setSplashVisible(false);
      setSplashFading(false);
    }

    if (skipRef.current || shouldSkipSplash) {
      if (typeof window !== "undefined" && window.location.search.includes("from=logout")) {
        router.replace("/login", { scroll: false });
      }
      return;
    }

    const preloadTimer = window.setTimeout(() => {
      setShowLogin(true);
    }, PRELOAD_LOGIN_MS);

    const fadeTimer = window.setTimeout(() => {
      setSplashFading(true);
    }, SPLASH_MS);

    const doneTimer = window.setTimeout(() => {
      setSplashVisible(false);
    }, SPLASH_MS + FADE_MS);

    return () => {
      window.clearTimeout(preloadTimer);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [router, skipFromUrl, shouldSkipSplash]);

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
