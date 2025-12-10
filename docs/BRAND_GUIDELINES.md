# CodLabStudio Brand Guidelines

## Logo Design

### Logo Concept

The CodLabStudio logo combines three key elements:

1. **Code Brackets** (`{ }`) - Representing programming and code
2. **Collaboration Dots** - Three connected dots symbolizing multiple users working together
3. **Connection Lines** - Visual representation of real-time collaboration and synchronization

### Design Philosophy

The logo embodies the phonetic wordplay of "CodLab" sounding like "Colab" (collaboration):
- **Cod** = Code (programming)
- **Lab** = Laboratory (experimentation)
- **Studio** = Collaborative workspace

The gradient from blue to purple represents:
- **Blue** (#3B82F6): Trust, technology, professionalism
- **Purple** (#8B5CF6): Innovation, creativity, collaboration

### Logo Files

#### Full Logo (`logo.svg`)
- **Dimensions**: 200x60px
- **Usage**: Headers, login pages, marketing materials
- **Format**: SVG (scalable vector graphics)
- **Location**: `/frontend/public/logo.svg`

#### Icon Logo (`logo-icon.svg`)
- **Dimensions**: 40x40px
- **Usage**: Navigation bars, favicons, small spaces
- **Format**: SVG
- **Location**: `/frontend/public/logo-icon.svg`

#### Favicon (`favicon.svg`)
- **Dimensions**: 32x32px
- **Usage**: Browser tabs, bookmarks
- **Format**: SVG
- **Location**: `/frontend/public/favicon.svg`

### Logo Usage

#### React Component

```tsx
import Logo from "@/components/Brand/Logo";

// Full logo with tagline
<Logo variant="full" size="lg" showTagline />

// Icon only
<Logo variant="icon" size="md" />

// Text only
<Logo variant="text" showTagline />
```

#### Variants

- **`full`**: Complete logo with icon and text (default)
- **`icon`**: Icon-only version
- **`text`**: Text-only version with gradient

#### Sizes

- **`sm`**: Small (32px height)
- **`md`**: Medium (48px height) - default
- **`lg`**: Large (64px height)

### Color Palette

#### Primary Colors
- **Blue**: `#3B82F6` (blue-500)
- **Purple**: `#8B5CF6` (purple-500)
- **Gradient**: Linear gradient from blue to purple

#### Text Colors
- **Primary Text**: `#1F2937` (gray-800)
- **Secondary Text**: `#6B7280` (gray-500)
- **Tagline**: `#6B7280` (gray-500)

### Typography

- **Logo Text**: System font stack, bold (700 weight)
- **Tagline**: System font stack, medium (500 weight)
- **Font Size**: Responsive, scales with logo size

### Usage Guidelines

#### Do's ✅
- Use the full logo on login pages and headers
- Use the icon logo in navigation bars and compact spaces
- Maintain aspect ratio when scaling
- Use SVG format for best quality
- Include tagline on main pages for brand recognition

#### Don'ts ❌
- Don't distort or stretch the logo
- Don't change the colors (except for monochrome versions)
- Don't rotate the logo
- Don't place logo on busy backgrounds without proper contrast
- Don't use raster formats (PNG/JPG) unless SVG is unavailable

### Integration

The logo is integrated into:
- **Login Page**: Full logo, large size
- **Dashboard**: Icon + text, medium size
- **Favicon**: Icon version in browser tab
- **Layout**: Favicon configured in metadata

### Future Enhancements

Potential logo variations:
- Dark mode version
- Monochrome version (for single-color printing)
- Animated version (for loading states)
- Horizontal and vertical layouts

---

**Brand Tagline**: "Code. Lab. Collaborate."

**Pronunciation**: "Colab Studio" (phonetic wordplay)

