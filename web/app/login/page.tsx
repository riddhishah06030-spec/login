import { Suspense } from "react";
import LoginGate from "./LoginGate";

function LoginFallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
      }}
      aria-busy="true"
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginGate />
    </Suspense>
  );
}
