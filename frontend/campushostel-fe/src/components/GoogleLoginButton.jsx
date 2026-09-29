import React from "react";
import { useGoogleLogin } from "@react-oauth/google";

/**
 * Isolates the useGoogleLogin() hook in its own component so a broken/missing
 * VITE_GOOGLE_CLIENT_ID (which makes Google's own gsi script throw on init)
 * can be caught by an ErrorBoundary without taking down the whole page.
 */
export default function GoogleLoginButton({ onSuccess, onError, className, children }) {
  const login = useGoogleLogin({
    flow: "implicit",
    scope: "openid email profile",
    onSuccess,
    onError,
  });

  return (
    <button type="button" onClick={() => login()} className={className}>
      {children}
    </button>
  );
}
