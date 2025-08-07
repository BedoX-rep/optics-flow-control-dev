
# Visual Design Guide - Teal Brand Card System

## Brand Colors
- **Primary Teal**: `#0d9488` (teal-600)
- **Light Teal**: `#5eead4` (teal-300)
- **Dark Teal**: `#134e4a` (teal-900)
- **Teal Accent**: `#14b8a6` (teal-500)
- **Background Teal**: `#f0fdfa` (teal-50)
- **Border Teal**: `#99f6e4` (teal-200)

## Card Design Principles

### 1. Visual Hierarchy
- **Primary Information**: Large, bold text in dark teal
- **Secondary Information**: Medium text in regular teal
- **Tertiary Information**: Small text in gray-600
- **Status Indicators**: Colored badges with appropriate contrast

### 2. Layout Structure
```
┌─────────────────────────────────────┐
│ [Icon/Image] [Title & Price]   [•••]│
│              [Subtitle]             │
│ ─────────────────────────────────── │
│ [Field 1] [Field 2] [Field 3]      │
│ [Field 4] [Field 5] [Field 6]      │
│ ─────────────────────────────────── │
│ [Status] [Actions] [Secondary Info] │
└─────────────────────────────────────┘
```

### 3. Interactive States
- **Default**: Clean white background with teal-200 border
- **Hover**: Subtle shadow increase, teal-300 border
- **Edited**: Amber-100 background with amber-400 left border
- **Focus**: Teal-500 border with focus ring

### 4. Typography Scale
- **Card Title**: `text-lg font-semibold text-teal-900`
- **Primary Data**: `text-base font-medium text-teal-700`
- **Secondary Data**: `text-sm text-gray-600`
- **Labels**: `text-xs font-medium text-gray-500 uppercase tracking-wide`

### 5. Spacing & Sizing
- **Card Padding**: `p-6`
- **Element Spacing**: `gap-4` for major sections, `gap-2` for related items
- **Border Radius**: `rounded-xl` for cards, `rounded-lg` for internal elements
- **Border Width**: `border-2` for emphasis, `border` for subtle division

### 6. Status Indicators
- **Success**: `bg-emerald-100 text-emerald-800 border-emerald-200`
- **Warning**: `bg-amber-100 text-amber-800 border-amber-200`
- **Error**: `bg-red-100 text-red-800 border-red-200`
- **Info**: `bg-teal-100 text-teal-800 border-teal-200`

### 7. Action Buttons
- **Primary Action**: `bg-teal-600 hover:bg-teal-700 text-white`
- **Secondary Action**: `bg-white hover:bg-teal-50 text-teal-600 border-teal-200`
- **Destructive Action**: `bg-red-50 hover:bg-red-100 text-red-600`

## Implementation Guidelines

1. **Consistency**: All cards should follow the same layout grid and spacing
2. **Accessibility**: Maintain WCAG contrast ratios (4.5:1 minimum)
3. **Responsiveness**: Cards should adapt gracefully to different screen sizes
4. **Performance**: Use CSS-in-JS sparingly, prefer Tailwind classes
5. **Animation**: Subtle transitions (200-300ms) for state changes

## Card Types to Standardize
- [ ] Product Cards ✓ (Starting with this)
- [ ] Client Cards
- [ ] Receipt Cards  
- [ ] Invoice Cards
- [ ] Purchase Cards

Each card type will maintain this visual language while adapting to their specific data requirements.
