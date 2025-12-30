/**
 * HeroSection Component
 * 
 * Full-width gradient hero section with title and subtitle.
 * 
 * Props:
 * - title: string - Main heading text
 * - subtitle: string - Optional subheading text
 * - children: ReactNode - Optional content (e.g., SearchBar)
 */

export default function HeroSection({ 
  title = 'EXPLORE HOSTELS & CO-LIVING',
  subtitle = ``,
  children = null
}) {
  return (
    <section className="w-full bg-hero-gradient rounded-b-3xl sm:rounded-b-4xl py-12 sm:py-16 px-4 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 w-20 h-20 sm:w-32 sm:h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-24 h-24 sm:w-40 sm:h-40 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Title */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white text-center mb-2 sm:mb-4">
          {title}
        </h2>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-base sm:text-lg text-white/90 text-center mb-8 sm:mb-12">
            {subtitle}
          </p>
        )}

        {/* Children (SearchBar or other content) */}
        {children && (
          <div className="mt-8 sm:mt-12">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
