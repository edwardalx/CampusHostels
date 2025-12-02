# CampusHostels Component Library

A responsive, reusable React component library built with Tailwind CSS for the CampusHostels hostel discovery platform.

## Components Overview

### 1. **Header**
Navigation bar with logo, nav links, and authentication buttons.

**Props:**
- `onLogin`: () => void - Login button callback
- `onSignUp`: () => void - Sign up button callback
- `activeLink`: string - Active navigation link ('HOME' | 'EXPLORE' | 'MY_TRIPS')
- `onNavClick`: (link: string) => void - Navigation click callback

**Features:**
- Responsive (hamburger menu on mobile)
- Sticky positioning
- Active link indicator

### 2. **HeroSection**
Full-width gradient hero banner with title and content area.

**Props:**
- `title`: string - Main heading
- `subtitle`: string - Optional subheading
- `children`: ReactNode - Content to render below (e.g., SearchBar)

**Features:**
- Animated gradient background
- Decorative shapes
- Responsive padding
- Bottom border radius

### 3. **SearchBar**
Multi-field search input with Location, Dates, Guests, Filters, and Search button.

**Props:**
- `onSearch`: (filters) => void - Search button callback
- `onFilterClick`: () => void - Filters button callback
- `placeholder`: { location, dates, guests } - Input placeholders

**Features:**
- Icon-based inputs (using lucide-react)
- Mobile-responsive (vertical on small screens)
- Debounce ready for API integration

### 4. **HostelCard**
Individual hostel card displaying image, info, rating, and action buttons.

**Props:**
- `hostel`: object - Hostel data (id, name, location, price, rating, image, tag, isFavorite)
- `onLike`: (id, isFavorite) => void - Like/favorite callback
- `onViewDetails`: (id) => void - View details callback

**Features:**
- Lazy image loading
- Tag badges (Student Favorite/Party Friendly)
- Star rating display
- Favorite/like toggle
- Hover animations

### 5. **HostelGrid**
Responsive grid layout for hostel cards with loading and empty states.

**Props:**
- `hostels`: object[] - Array of hostel objects
- `isLoading`: boolean - Show loading skeletons
- `isEmpty`: boolean - Show empty state
- `onCardAction`: { onLike, onViewDetails } - Action callbacks

**Features:**
- Responsive breakpoints (1 col mobile, 2 tablet, 4 desktop)
- Skeleton loaders while fetching
- Empty state message
- Gap spacing adjustments

### 6. **Footer**
Footer with navigation links and social media icons.

**Props:**
- `links`: string[] - Footer link labels
- `onLinkClick`: (link: string) => void - Link click callback
- `socials`: array - Social media objects { id, icon, url }

**Features:**
- Responsive layout (stacked on mobile)
- Social media icon links
- Copyright notice

---

## Tailwind Configuration

Custom colors and utilities defined in `tailwind.config.js`:

```javascript
colors: {
  primary: {
    teal: '#26D0CE',
    'teal-dark': '#16A085',
    coral: '#F78F84',
    orange: '#F39C12',
    purple: '#8E44AD',
  },
  secondary: {
    gray: '#7F8C8D',
    'dark-gray': '#2C3E50',
    'light-gray': '#F5F5F5',
  },
}
```

---

## Responsive Breakpoints

- **Mobile**: 320px – 640px (1 column)
- **Tablet**: 641px – 1024px (2 columns)
- **Desktop**: 1025px+ (4 columns)

---

## Accessibility Features

✅ Semantic HTML  
✅ ARIA labels on interactive elements  
✅ Focus states on buttons  
✅ Color contrast (WCAG AA)  
✅ Lazy image loading  
✅ Alt text support  

---

## Usage Example

```jsx
import { Header, HeroSection, SearchBar, HostelGrid, Footer } from './components';

function HomePage() {
  const [hostels, setHostels] = useState([]);

  return (
    <>
      <Header 
        activeLink="EXPLORE"
        onNavClick={(link) => console.log(link)}
      />
      
      <HeroSection title="EXPLORE HOSTELS & CO-LIVING">
        <SearchBar onSearch={(filters) => fetchHostels(filters)} />
      </HeroSection>
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        <HostelGrid 
          hostels={hostels}
          onCardAction={{
            onLike: (id, favorite) => console.log(id, favorite),
            onViewDetails: (id) => navigate(`/hostel/${id}`)
          }}
        />
      </div>

      <Footer />
    </>
  );
}
```

---

## Performance Considerations

- Images use `loading="lazy"` for lazy loading
- HostelGrid includes skeleton loaders
- Tailwind CSS provides optimized CSS delivery
- Consider adding React.memo() for HostelCard if rendering large lists

---

## Next Steps

1. ✅ Components built and documented
2. ⏳ Compose full homepage using components
3. ⏳ Integrate mock/API data
4. ⏳ Add routing (React Router)
5. ⏳ Connect to .NET backend API
