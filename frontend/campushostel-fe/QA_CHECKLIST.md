# CampusHostels Frontend - Setup & Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Installation & Running Locally

```bash
# 1. Navigate to frontend directory
cd frontend/campushostel-fe

# 2. Install dependencies (already done, but for reference)
npm install
npm install -D tailwindcss postcss autoprefixer
npm install lucide-react

# 3. Start development server
npm run dev

# 4. Open browser
# Visit: http://localhost:5173/
```

### Build for Production

```bash
# Create optimized build
npm run build

# Preview production build locally
npm run preview
```

---

## 📋 QA Checklist — Responsiveness

### Desktop (1440px width)
- [ ] Page loads without errors
- [ ] Hero section spans full width with gradient
- [ ] Search bar displays horizontally (4 inputs + filter + search button)
- [ ] Hostel grid shows **4 columns**
- [ ] Header navigation all visible (HOME, EXPLORE, MY TRIPS)
- [ ] No horizontal scrolling
- [ ] Footer displays in horizontal layout

### Tablet (768px width)
```
Set DevTools to Tablet (iPad) size
```
- [ ] Hostel grid shows **2 columns**
- [ ] Search bar inputs are readable (may wrap slightly)
- [ ] Header navigation appears normal or as hamburger (depends on breakpoint)
- [ ] Cards maintain proper proportions
- [ ] No content cutoff

### Mobile (390px width)
```
Set DevTools to Mobile (iPhone 14 / iPhone SE) size
```
- [ ] Hamburger menu icon visible in header
- [ ] Hostel grid shows **1 column**
- [ ] Search bar inputs stack vertically
- [ ] Touch targets are ≥44px (minimum recommended)
- [ ] Text remains readable (no tiny fonts)
- [ ] All buttons clickable without zooming
- [ ] Horizontal scrolling does not occur

---

## ♿ QA Checklist — Accessibility (a11y)

### Keyboard Navigation
- [ ] Tab key cycles through all interactive elements in logical order
- [ ] Enter key activates buttons/links
- [ ] Space bar toggles favorite hearts
- [ ] Shift+Tab navigates backwards
- [ ] Focus states are visible (outline/highlight)

### Screen Reader (NVDA / JAWS / VoiceOver)
- [ ] Page title reads correctly ("CampusHostels")
- [ ] Navigation links are announced
- [ ] Buttons have descriptive labels
- [ ] Images have alt text (hostel names)
- [ ] Form inputs (search) have labels
- [ ] ARIA labels present on icon-only buttons (heart, menu, filter)
- [ ] Decorative icons properly marked as `aria-hidden`

### Color & Contrast
- [ ] Text contrast ratio ≥4.5:1 (WCAG AA standard)
- [ ] Color not the only means of conveying information
- [ ] Teal/coral gradient readable with overlaid text
- [ ] Dark text on light backgrounds (and vice versa)

### Semantic HTML
- [ ] `<header>` wraps navigation
- [ ] `<main>` wraps content
- [ ] `<footer>` wraps footer
- [ ] `<nav>` wraps navigation links
- [ ] `<button>` used for interactive elements (not `<div>`)
- [ ] `<img>` tags have alt attributes
- [ ] Proper heading hierarchy (h1, h2, h3)

---

## ⚡ QA Checklist — Performance

### Page Load
- [ ] Initial page load < 2 seconds (on 3G throttling)
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] First Input Delay (FID) < 100ms
- [ ] Cumulative Layout Shift (CLS) < 0.1

### Network
- [ ] No broken image 404s
- [ ] CSS bundle size < 50KB (Tailwind optimized)
- [ ] JavaScript bundle size < 100KB
- [ ] Images load lazily (check Network tab)

### React Performance
- [ ] No unnecessary re-renders (React DevTools Profiler)
- [ ] State updates don't cause parent component re-renders
- [ ] useCallback memoizes event handlers
- [ ] List items have proper `key` props

### Browser DevTools Console
- [ ] No red errors
- [ ] No yellow warnings
- [ ] No CORS issues
- [ ] No missing assets warnings

---

## 🎨 QA Checklist — Visual Design

### Color Accuracy
| Element | Expected Hex | Status |
|---------|-------------|--------|
| Primary Teal | #26D0CE | ☐ |
| Primary Coral | #F78F84 | ☐ |
| Button Orange | #F39C12 | ☐ |
| Tag Purple (Party) | #8E44AD | ☐ |
| Tag Teal (Student) | #1ABC9C | ☐ |
| Text Dark | #2C3E50 | ☐ |
| Text Gray | #7F8C8D | ☐ |
| Background Light | #F5F5F5 | ☐ |

### Components
- [ ] Header sticky when scrolling
- [ ] Logo colors correct (Teal "Campus" + Coral "Hostels")
- [ ] Navigation links underline on active
- [ ] Search bar rounded corners, proper shadow
- [ ] Hostel cards have rounded corners (16px)
- [ ] Hostel images fill card area (object-cover)
- [ ] Tag badges positioned top-left of image
- [ ] Heart icons toggle red/outline
- [ ] Star ratings show correct number (1-5 stars)
- [ ] Price format: "$15/night" (correct spacing)
- [ ] Footer has top border separator

### Animations & Transitions
- [ ] Hover on cards → slight shadow increase
- [ ] Hover on buttons → color change
- [ ] Heart toggle → smooth fill/outline transition
- [ ] Mobile menu → slides in smoothly
- [ ] No janky or stuttering animations

---

## 🧪 QA Checklist — Functionality

### Header
- [ ] "CampusHostels" logo displays correctly
- [ ] Navigation links clickable (HOME, EXPLORE, MY TRIPS)
- [ ] Active nav link underlined
- [ ] LOGIN button opens login flow (console log visible)
- [ ] SIGN UP button opens signup flow (console log visible)
- [ ] Mobile hamburger menu toggles on/off
- [ ] Mobile menu items functional

### Hero Section
- [ ] Gradient background displays correctly
- [ ] Title "EXPLORE HOSTELS & CO-LIVING" visible
- [ ] Subtitle (optional) visible
- [ ] Search bar positioned below

### Search Bar
- [ ] Location input accepts text
- [ ] Dates input accepts text (ready for date picker)
- [ ] Guests input accepts text (ready for selector)
- [ ] Filters button clicks (console logs "Open filter modal")
- [ ] Search button clicks and triggers filtering
- [ ] Filtered results update grid immediately
- [ ] Loading state shows while filtering (600ms delay)

### Hostel Cards
- [ ] Image loads for each hostel
- [ ] Card shadows visible
- [ ] Hostel name displays
- [ ] Location displays with icon
- [ ] Price displays correctly ($15/night, $20/night, etc.)
- [ ] Star rating shows (gold stars)
- [ ] Tag badge displays (Student Favorite=Teal, Party Friendly=Purple)
- [ ] Heart icon toggles between outline and filled red
- [ ] "View Details" button clickable (console logs hostel data)

### Hostel Grid
- [ ] Correct number of cards displayed
- [ ] Grid responsive at different widths
- [ ] Empty state shows if no hostels found
- [ ] Loading skeleton cards show during search

### Footer
- [ ] All footer links clickable
- [ ] Social media icons present (Facebook, Instagram, YouTube)
- [ ] Social links open in new tab
- [ ] Copyright notice visible
- [ ] Footer sticky at bottom

---

## 🔍 QA Checklist — Browser Compatibility

Test in multiple browsers:

| Browser | Mobile | Tablet | Desktop | Status |
|---------|--------|--------|---------|--------|
| Chrome | ☐ | ☐ | ☐ | |
| Firefox | ☐ | ☐ | ☐ | |
| Safari | ☐ | ☐ | ☐ | |
| Edge | ☐ | ☐ | ☐ | |

---

## 📸 QA Checklist — Screenshots

Take and attach screenshots for approval:

1. **Mobile (390px)** — Hamburger menu closed
2. **Mobile (390px)** — Hamburger menu open
3. **Tablet (768px)** — Full width view
4. **Desktop (1440px)** — Full page scroll
5. **Hover States** — Card hover effect
6. **Loading State** — During search filtering

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Styles not applying | Clear cache: `Ctrl+Shift+Delete`, hard refresh: `Ctrl+Shift+R` |
| Images not loading | Check Unsplash URLs, verify no CORS issues in Console |
| Hamburger menu not showing | Verify breakpoint (md = 768px), check media query |
| Tailwind classes not compiled | Restart dev server: `npm run dev` |
| Port 5173 already in use | Kill process or use: `npm run dev -- --port 3000` |

---

## 📝 Deployment Checklist

Before deploying to production:

- [ ] All console errors fixed
- [ ] Environment variables configured
- [ ] Build process succeeds: `npm run build`
- [ ] No console warnings
- [ ] Lighthouse score > 90 (Performance, Accessibility, Best Practices)
- [ ] All links point to correct routes
- [ ] API endpoints configured for production
- [ ] Images optimized (use next/image or similar)
- [ ] Analytics integrated (if needed)

---

## 📚 Project Structure

```
campushostel-fe/
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── HeroSection.jsx
│   │   ├── SearchBar.jsx
│   │   ├── HostelCard.jsx
│   │   ├── HostelGrid.jsx
│   │   ├── Footer.jsx
│   │   ├── index.js (re-exports)
│   │   └── README.md (documentation)
│   ├── pages/
│   │   ├── HomePage.jsx (full page composition)
│   │   └── index.js (re-exports)
│   ├── App.jsx (main app wrapper)
│   ├── App.css (custom styles)
│   ├── index.css (Tailwind directives)
│   └── main.jsx (entry point)
├── public/
│   └── favicon.svg
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
├── package.json
└── index.html
```

---

## 🎯 Next Steps

1. ✅ Run dev server
2. ✅ Test on multiple screen sizes
3. ✅ Run through QA checklists above
4. ✅ Fix any issues found
5. ⏳ Integrate with .NET backend API
6. ⏳ Implement React Router for multi-page navigation
7. ⏳ Add error boundaries and fallback UI
8. ⏳ Deploy to production

---

## 📞 Support

For issues or questions:
1. Check browser console for error messages
2. Review component `README.md` for prop documentation
3. Verify responsive breakpoints in `tailwind.config.js`
4. Check `RESPONSIVE_PREVIEW.md` for testing guide
