/**
 * BottomNav Component
 *
 * App-style tab bar fixed to the bottom of the screen on phones (hidden from `md` upwards,
 * where the Header carries the navigation).
 */

import { FileText, Home, Info, LogIn, LogOut, Mail, Receipt, Wrench } from "lucide-react";
import { NavLink } from "react-router-dom";
import useAuthToken from "../hooks/useAuthToken";
import useLogout from "../hooks/useLogout";

const SIGNED_IN_TABS = [
  { label: "Home", to: "/", icon: Home, end: true },
  { label: "History", to: "/payment-history", icon: Receipt },
  { label: "Tenancy", to: "/tenancy", icon: FileText },
  { label: "Repairs", to: "/maintenance", icon: Wrench },
];

const GUEST_TABS = [
  { label: "Home", to: "/", icon: Home, end: true },
  { label: "About", to: "/about", icon: Info },
  { label: "Contact", to: "/contact", icon: Mail },
  { label: "Log in", to: "/login", icon: LogIn },
];

const tabClass = (isActive) =>
  `flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-[11px] font-semibold transition-colors ${
    isActive ? "bg-teal-50 text-primary-teal-dark" : "text-secondary-gray active:bg-slate-100"
  }`;

export default function BottomNav() {
  const token = useAuthToken();
  const handleLogout = useLogout();
  const tabs = token ? SIGNED_IN_TABS : GUEST_TABS;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,0.06)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <li key={tab.label} className="flex flex-1">
              <NavLink to={tab.to} end={tab.end} className={({ isActive }) => tabClass(isActive)}>
                <Icon size={22} strokeWidth={2} aria-hidden="true" />
                <span>{tab.label}</span>
              </NavLink>
            </li>
          );
        })}
        {token && (
          <li className="flex flex-1">
            <button type="button" onClick={handleLogout} className={tabClass(false)}>
              <LogOut size={22} strokeWidth={2} aria-hidden="true" />
              <span>Log out</span>
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}
