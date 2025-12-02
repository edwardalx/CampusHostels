# CampusHostels HomePage - Responsive Preview Guide

## 🚀 How to Test the Homepage

### 1. **Open the App**
Visit: `http://localhost:5173/` in your browser

### 2. **Desktop Preview (1025px+)**
- Full header with all nav links visible
- 4-column hostel card grid
- Search bar in horizontal layout
- Full footer with all links and social icons

**Expected Breakpoints:**
- Desktop (lg): 1025px+ → 4 columns, full width padding

### 3. **Tablet Preview (641px – 1024px)**
Open DevTools (F12) and set viewport to tablet size:

**iPad (768px)**
- 2-column hostel grid
- Search bar partially stacked (dates/guests combined)
- Hamburger menu appears in header
- Responsive padding adjustments

### 4. **Mobile Preview (320px – 640px)**
Set viewport to mobile size in DevTools:

**iPhone SE (375px) / iPhone 14 (390px)**
- Hamburger menu (all nav links in mobile menu)
- 1-column hostel grid
- Vertical search bar (stacked inputs)
- Optimized touch targets (44px minimum)
- Footer links stacked vertically

---

## 📋 Test Checklist

### ✅ Responsive Layout
- [ ] Desktop: 4-column grid, no hamburger menu
- [ ] Tablet (768px): 2-column grid, hamburger visible
- [ ] Mobile (390px): 1-column grid, hamburger active
- [ ] Images scale properly at all sizes
- [ ] Text remains readable on small screens

### ✅ Interactive Elements
- [ ] Header nav links highlight when clicked
- [ ] Login/Sign Up buttons functional
- [ ] Mobile hamburger menu opens/closes
- [ ] Search bar accepts input
- [ ] Hostel card heart icons toggle (outline ↔ filled)
- [ ] "View Details" buttons are clickable
- [ ] Filter button opens/closes (console logs)

### ✅ Visual Design
- [ ] Hero gradient background displays correctly
- [ ] Hostel card tags (Student Favorite/Party Friendly) show correct colors
- [ ] Star ratings display with correct count
- [ ] Price shows with dollar sign and "/night" suffix
- [ ] Cards have proper shadow and hover effects
- [ ] Footer divider line visible

### ✅ Accessibility (a11y)
- [ ] Tab through interactive elements (keyboard navigation)
- [ ] ARIA labels present on icon buttons (heart, filter, menu)
- [ ] Color contrast meets WCAG AA (4.5:1 minimum)
- [ ] Focus outlines visible on buttons
- [ ] Semantic HTML used (nav, main, footer, button, img)
- [ ] Images have alt text (e.g., hostel names)

### ✅ Performance
- [ ] Page loads within 2 seconds
- [ ] No console errors or warnings
- [ ] Images lazy-load (check Network tab)
- [ ] No unnecessary re-renders (React DevTools Profiler)
- [ ] Tailwind CSS is optimized (one bundled CSS file)

---

## 🎨 Design Verification

### Colors (Hex Codes)
| Element | Expected | Result |
|---------|----------|--------|
| Primary Teal | #26D0CE | ✅ |
| Primary Coral | #F78F84 | ✅ |
| Button Orange | #F39C12 | ✅ |
| Tag Purple | #8E44AD | ✅ |
| Text Dark | #2C3E50 | ✅ |

### Responsive Grid
| Screen Size | Columns | Gap |
|------------|---------|-----|
| Mobile < 640px | 1 col | 16px |
| Tablet 641-1024px | 2 cols | 20px |
| Desktop > 1024px | 4 cols | 24px |

---

## 🔍 Console Check

Open browser DevTools → Console tab and verify:
- ✅ No red errors
- ✅ No warnings about missing props
- ✅ Click events log correctly:
  - `Navigate to: HOME / EXPLORE / MY TRIPS`
  - `Navigate to login`
  - `Navigate to sign up`
  - `View details for: [hostel object]`
  - `Open filter modal`

---

## 📸 Screenshot Checklist

Take screenshots at these widths and verify layout:

1. **Mobile (390px)** — Vertical layout, 1-column grid
2. **Tablet (768px)** — 2-column grid, full header visible
3. **Desktop (1440px)** — 4-column grid, full width

---

## 🐛 Known Mock Data

The homepage uses **8 mock hostel objects** with:
- Real Unsplash images
- Varying prices ($10–$20/night)
- Star ratings (4.1–5.0)
- Mixed tags (Student Favorite, Party Friendly, or null)

**Future Integration Points:**
- Replace mock data with API call to `.NET backend`
- Implement filtering modal
- Add React Router for page navigation
- Connect to user authentication system

---

## 📋 Next Steps After Approval

1. ✅ Homepage composed and rendering
2. ⏳ Verify mobile + desktop screenshots
3. ⏳ Request approval for full integration
4. ⏳ Integrate into App.jsx (already done)
5. ⏳ Connect to .NET backend API
6. ⏳ Implement routing (React Router)
7. ⏳ Deploy to production

---

## 💡 Quick Debugging Tips

**If styles don't apply:**
- Clear cache: `Ctrl+Shift+Delete` → Clear browsing data
- Hard refresh: `Ctrl+Shift+R`
- Rebuild Tailwind: Delete `node_modules/.cache`

**If images don't load:**
- Check Network tab for 404 errors
- Verify Unsplash URLs are accessible
- Use local image fallbacks

**If components don't render:**
- Check console for error messages
- Verify all props passed correctly
- Check React DevTools component tree
