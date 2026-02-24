import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const IDLE_TIME = 2 * 60 * 1000; // 15 minutes
const WARNING_TIME = 30 * 1000; // 1 min before logout
let token = localStorage.getItem("token");

export const useIdleTimeout = (onLogout) => {
  const logoutTimer = useRef(null);
  const warningTimer = useRef(null);

  const resetTimers = () => {
    clearTimeout(logoutTimer.current);
    clearTimeout(warningTimer.current);

    if (!localStorage.getItem("token")) return;

    // 🔔 Show warning popup
    warningTimer.current = setTimeout(() => {
      let timerInterval;

      Swal.fire({
        title: "Session Expiring Soon",
        html: `You will be logged out in <b>30</b> seconds.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Stay Logged In",
        cancelButtonText: "Logout",
        didOpen: () => {
          const b = Swal.getHtmlContainer().querySelector("b");
          let timeLeft = WARNING_TIME / 1000;

          timerInterval = setInterval(() => {
            timeLeft--;
            if (b) b.textContent = timeLeft;

            if (timeLeft <= 0) {
              clearInterval(timerInterval);
              Swal.close(); // ensures modal closes
              onLogout();
            }
          }, 1000);
        },
        willClose: () => {
          clearInterval(timerInterval);
        },
      }).then((result) => {
        if (result.isConfirmed) {
          resetTimers(); // restart session
        } else {
          Swal.close(); // close modal immediately on manual logout
          onLogout();
        }
      });
    }, IDLE_TIME - WARNING_TIME);

    //  Final logout
    logoutTimer.current = setTimeout(() => {
      onLogout();
      Swal.close();
    }, IDLE_TIME);
  };

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll"];

    events.forEach((event) => window.addEventListener(event, resetTimers));

    resetTimers();

    return () => {
      clearTimeout(logoutTimer.current);
      clearTimeout(warningTimer.current);
      events.forEach((event) => window.removeEventListener(event, resetTimers));
    };
  }, []);
};

export const setTokenExpiryTimeout = (onLogout) => {
  const expiryTime = JSON.parse(localStorage.getItem("expires"));
  if (!expiryTime) return;
  const currentTime = Date.now();
  const expireTimeMs = new Date(expiryTime).getTime();
  const timeoutDuration =
  (expireTimeMs - currentTime) / 2; // Subtract 3hours for warning
  console.log("Token expires in (ms):", timeoutDuration);

  if (timeoutDuration > 0) {
    setTimeout(() => {
      onLogout();
    }, timeoutDuration);
  } else {
    onLogout(); // If already expired
  }
};

export const isTokenExpired = () => {
  const expiryTime = JSON.parse(localStorage.getItem("expires"));
  if (expiryTime) {
    const currentTime = Date.now();
    const expireTimeMs = new Date(expiryTime).getTime();
    return currentTime >= expireTimeMs;
  }
  return true;
};

export const showSessionExpiredAlert = (message, onConfirm) => {
  Swal.fire({
    title: "Logged Out",
    text: message || "You are logged out. Please log in again.",
    icon: "info",
    confirmButtonText: "OK",
    allowOutsideClick: false,
  }).then((result) => {
    if(result.isConfirmed && onConfirm) {
      onConfirm();
    }
  });
};
