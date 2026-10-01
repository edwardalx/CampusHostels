/**
 * Header Component
 *
 * Top bar. On phones it is a slim brand bar (navigation lives in the bottom tab bar, see
 * BottomNav); from the `md` breakpoint it shows the full nav and auth buttons.
 */

import { useContext } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import useAuthToken from "../hooks/useAuthToken";
import useLogout from "../hooks/useLogout";
import { AuthContext } from "../zu-store/AuthContextInstance";

const SIGNED_IN_LINKS = [
  { label: "HOME", to: "/", end: true },
  { label: "HISTORY", to: "/payment-history" },
  { label: "TENANCY", to: "/tenancy" },
  { label: "MAINTENANCE", to: "/maintenance" },
];

const GUEST_LINKS = [
  { label: "HOME", to: "/", end: true },
  { label: "ABOUT", to: "/about" },
  { label: "CONTACT", to: "/contact" },
];

export default function Header() {
  const navigate = useNavigate();
  const token = useAuthToken();
  const handleLogout = useLogout();
  const { storeUser } = useContext(AuthContext);
  const links = token ? SIGNED_IN_LINKS : GUEST_LINKS;
  const initial = (storeUser?.fname ?? "").trim().charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-ink text-white pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 md:h-16 lg:px-8">
        <Link to="/" aria-label="Rentin home" className="shrink-0">
          <span className="text-2xl font-extrabold tracking-tight">
            Rent<span className="text-primary-orange">in</span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-white text-ink"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Auth actions */}
        <div className="flex items-center gap-2">
          {token ? (
            <>
              {initial && (
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 place-items-center rounded-full bg-primary-teal text-sm font-bold md:hidden"
                >
                  {initial}
                </span>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="hidden rounded-full px-5 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 md:block"
              >
                LOGOUT
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="rounded-full px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-100"
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
