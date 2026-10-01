import { useEffect, useRef, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import SocialButton from "./SocialButton";

const isGoogleSignInConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

/**
 * Google's own sign-in button (Google Identity Services). On success it hands back the Google
 * ID token, which the API verifies; the browser never sees a usable Google access token.
 *
 * Props:
 * - onSuccess: (idToken: string) => void
 * - onError: () => void
 * - text: "continue_with" | "signin_with" | "signup_with"
 * - className: classes for the wrapper (the button fills its width, up to Google's 400px limit)
 */
export default function GoogleLoginButton({
  onSuccess,
  onError,
  text = "continue_with",
  className = "flex w-full justify-center",
}) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;
    const update = () => setWidth(Math.min(400, Math.max(200, Math.floor(element.clientWidth))));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  if (!isGoogleSignInConfigured) {
    return (
      <SocialButton disabled title="Google sign-in is unavailable right now" icon={<FcGoogle className="h-5 w-5" />}>
        Google sign-in unavailable
      </SocialButton>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      <GoogleLogin
        onSuccess={(response) => {
          if (response.credential) onSuccess(response.credential);
          else onError?.();
        }}
        onError={() => onError?.()}
        theme="filled_black"
        shape="pill"
        size="large"
        text={text}
        width={String(width)}
      />
    </div>
  );
}
