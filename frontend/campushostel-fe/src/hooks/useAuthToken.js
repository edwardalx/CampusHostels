import { useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";

export const AUTH_CHANGED_EVENT = "auth-changed";

function subscribe(onChange) {
  window.addEventListener("storage", onChange);
  window.addEventListener(AUTH_CHANGED_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(AUTH_CHANGED_EVENT, onChange);
  };
}

const getSnapshot = () => localStorage.getItem("token");

/**
 * The current login token, kept in sync with other tabs (storage event), in-app logouts
 * (AUTH_CHANGED_EVENT) and navigation (useLocation re-renders us, so a login on another route
 * is picked up as soon as the user comes back).
 */
export default function useAuthToken() {
  useLocation();
  return useSyncExternalStore(subscribe, getSnapshot);
}
