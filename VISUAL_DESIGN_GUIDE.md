
# Visual Design Guide - Teal Brand Card System

## Brand Colors
- **Primary Teal**: `#0d9488` (teal-600) - Main brand color for titles and primary actions
- **Light Teal**: `#5eead4` (teal-300) - Hover states and accents
- **Dark Teal**: `#134e4a` (teal-900) - High contrast text
- **Teal Accent**: `#14b8a6` (teal-500) - Interactive elements
- **Background Teal**: `#f0fdfa` (teal-50) - Subtle background tints
- **Border Teal**: `#99f6e4` (teal-200) - Default borders

## Card Design Philosophy

### Compact & Scannable
Cards should be information-dense but easy to scan. Users should be able to quickly identify key information without scrolling or expanding sections.

### Visual Hierarchy
1. **Primary Info** (Name/Title + Price): Most prominent, top-left
2. **Status Indicator**: Color-coded badge, top-right
3. **Core Fields**: Grid layout, 2-3 most important fields visible
4. **Actions**: Minimal, icon-based, bottom-right

### Layout Structure (Compact)
```
┌─────────────────────────────────────┐
│ [Title] [Price]           [Status]  │ ← Header (h=12)
│ ─────────────────────────────────── │
│ [Field1: Value] [Field2: Value]     │ ← Core Info (h=8)
│ [Field3: Value] [Field4: Value]     │
│ ─────────────────────────────────── │
│ [Secondary Info]    [Edit] [Delete] │ ← Footer (h=10)
└─────────────────────────────────────┘
Total Height: ~120px (vs current ~400px)
```

## Typography Scale (Compact)
- **Card Title**: `text-base font-semibold text-teal-900` (16px)
- **Price/Primary**: `text-lg font-bold text-teal-700` (18px)
- **Field Labels**: `text-xs text-gray-500 uppercase tracking-wide` (12px)
- **Field Values**: `text-sm text-gray-900` (14px)
- **Secondary Info**: `text-xs text-gray-400` (12px)

## Spacing System (Tight)
- **Card Padding**: `p-4` (16px) - Reduced from p-6
- **Header Height**: `h-12` (48px)
- **Content Sections**: `space-y-3` (12px between sections)
- **Field Spacing**: `gap-4` horizontal, `gap-2` vertical
- **Border Radius**: `rounded-lg` for cards

## Interactive Elements

### Status Badges (Compact)
- **Height**: `h-6` (24px)
- **Padding**: `px-2 py-1`
- **Font**: `text-xs font-medium`
- **Colors**: Same as before but smaller

### Action Buttons (Minimal)
- **Primary Action**: `h-8 px-3 text-sm` - Teal background
- **Icon Buttons**: `h-8 w-8` - Ghost style
- **Spacing**: `gap-1` between buttons

### Form Elements (Inline)
- **Select Height**: `h-7` (28px) - Reduced from h-9
- **Input Height**: `h-7` (28px)
- **Font Size**: `text-sm`
- **Focus**: Subtle teal ring, no shadow

## Grid System
Cards should display in responsive grids:
- **Desktop**: 4-5 cards per row (min-width: 280px)
- **Tablet**: 2-3 cards per row
- **Mobile**: 1-2 cards per row

## Data Prioritization

### Always Visible (Core Fields)
1. **Name/Title** - Editable inline
2. **Price** - Prominent display
3. **Category** - Select dropdown
4. **Stock Status** - Color badge

### Secondary Fields (Compact Display)
5. **Company/Supplier**
6. **Index/Treatment** (for lenses)
7. **Cost** - For margin calculation

### Hidden/Expandable
- Creation dates
- Detailed specifications
- Less common fields

## States & Feedback

### Default State
- Clean white background
- Subtle teal-200 border
- Minimal shadow

### Hover State
- Slight shadow increase
- Border color shift to teal-300
- Smooth 150ms transition

### Edited State
- Left amber accent bar (w-1)
- Subtle amber background tint
- Save button appears

### Loading State
- Subtle opacity reduction
- Disabled form elements

## Accessibility Standards
- **Contrast**: Minimum 4.5:1 for all text
- **Focus**: Clear teal focus rings
- **Touch Targets**: Minimum 44px for mobile
- **Keyboard Nav**: Logical tab order

## Implementation Guidelines

### Performance
- Virtualized lists for 100+ items
- Memoized components with shallow comparison
- Optimistic updates for better UX

### Consistency Rules
1. All cards follow identical layout structure
2. Same field types use same components
3. Consistent spacing and typography
4. Unified color usage across card types

### Responsive Behavior
- Text truncation with tooltips
- Collapsible sections on mobile
- Touch-friendly controls
- Readable text at all sizes

## Card Type Adaptations

### Product Cards
- **Focus**: Name, Price, Category, Stock
- **Special**: Automated name toggle
- **Image**: Small thumbnail (40x40px)

### Client Cards  
- **Focus**: Name, Contact, Last Visit, Balance
- **Special**: Quick contact actions
- **Avatar**: Initials or photo

### Receipt Cards
- **Focus**: Client, Date, Total, Status
- **Special**: Quick print/view actions
- **Preview**: Item count indicator

### Invoice Cards
- **Focus**: Client, Due Date, Amount, Status
- **Special**: Payment status indicator
- **Actions**: Send, Mark paid shortcuts

### Purchase Cards
- **Focus**: Supplier, Date, Amount, Status
- **Special**: Recurring indicator
- **Balance**: Outstanding amount highlight

This system prioritizes information density and scanning speed while maintaining visual polish and brand consistency.
