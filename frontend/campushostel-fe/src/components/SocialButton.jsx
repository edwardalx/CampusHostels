/**
 * SocialButton Component
 *
 * Pill button for "continue with <provider>" options. It copies the look of Google's own
 * dark sign-in button (which Google does not let us restyle) so every provider matches:
 * 40px tall, dark pill, logo in a white circle on the left, centred label.
 *
 * Props:
 * - icon: ReactNode - the provider logo, shown in the white circle
 * - children: label
 * - onClick, disabled, title: as for a normal button
 */
export default function SocialButton({ icon, children, onClick, disabled = false, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="relative mx-auto flex h-10 w-full max-w-[400px] items-center justify-center rounded-full border border-transparent bg-[#1f1f1f] px-12! text-sm! font-normal! text-[#e3e3e3] transition-colors hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="absolute left-1 grid h-8 w-8 place-items-center rounded-full bg-white">
        {icon}
      </span>
      <span className="truncate">{children}</span>
    </button>
  );
}

/** Facebook "f" logo in Facebook blue, sized for SocialButton. */
export function FacebookIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
      <path d="M14 13.5H16.5L17.5 9.5H14V7.5C14 6.47 14 5.5 16 5.5H17.5V2.14C17.174 2.097 15.943 2 14.643 2C11.928 2 10 3.657 10 6.7V9.5H7V13.5H10V22H14V13.5Z" />
    </svg>
  );
}
