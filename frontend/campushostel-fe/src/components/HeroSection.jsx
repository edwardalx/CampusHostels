/**
 * HeroSection Component
 *
 * Full-width gradient hero with a title and subtitle. Left-aligned and compact on phones,
 * centred and roomier from `sm` upwards.
 *
 * Props:
 * - title: string - Main heading text
 * - subtitle: string - Optional subheading text
 * - eyebrow: string - Optional small line above the title (e.g. a greeting)
 * - children: ReactNode - Optional content (e.g., SearchBar)
 */

export default function HeroSection({
  title = "Explore hostels & co-living",
  subtitle = "",
  eyebrow = "",
  children = null,
}) {
  return (
    <section className="relative w-full overflow-hidden rounded-b-[2rem] bg-hero-gradient px-5 pt-8 pb-10 sm:rounded-b-[3rem] sm:px-6 sm:py-16">
      {/* Decorative shapes */}
      <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/10 sm:h-56 sm:w-56" />
      <div className="pointer-events-none absolute -right-12 -bottom-12 h-44 w-44 rounded-full bg-primary-orange/25 blur-2xl sm:h-64 sm:w-64" />

      <div className="relative z-10 mx-auto max-w-7xl text-left sm:text-center">
        {eyebrow && (
          <p className="mb-2 text-sm font-semibold text-teal-100">{eyebrow}</p>
        )}

        <h1 className="text-[1.9rem] leading-[1.1] font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-3 max-w-md text-base text-teal-50/90 sm:mx-auto sm:max-w-2xl sm:text-lg">
            {subtitle}
          </p>
        )}

        {children && <div className="mt-6 sm:mt-10">{children}</div>}
      </div>
    </section>
  );
}
