
# Card Uniformity Design System Implementation Guide

## Overview
This guide outlines the design system for creating uniform cards across the application (Products, Clients, Receipts, Invoices, and Purchases). The goal is to establish consistency in size, styling, and brand identity using teal-inspired colors.

## Design Principles

### 1. **Fixed Card Dimensions**
- **Height**: `h-[420px]` - Fixed height for all cards to ensure uniform grid layout
- **Width**: `w-full` - Full width to respect container constraints
- **Layout**: `flex flex-col` - Column layout with sections properly distributed

### 2. **Brand Color Palette (Teal-Inspired)**
- **Primary**: `teal-500` to `teal-700` for main elements
- **Secondary**: `seafoam-50` to `seafoam-100` for backgrounds
- **Accents**: `teal-50/30` to `teal-100/50` for subtle backgrounds
- **Borders**: `teal-200` to `teal-500` for form elements and dividers

### 3. **Typography System**
- **Headers**: `font-poppins font-semibold` for titles and important text
- **Body**: `font-inter` for general content and form fields
- **Labels**: `font-poppins font-medium` for form labels
- **Sizes**: Consistent sizing from `text-xs` to `text-base`

### 4. **Visual Hierarchy**
- **Border**: Left border `border-l-4 border-l-teal-500` for brand identity
- **Gradients**: Subtle `bg-gradient-to-br from-teal-50/30 to-seafoam-50/20`
- **Shadows**: Progressive shadows on hover for interactivity
- **Rounded corners**: `rounded-lg` to `rounded-xl` for modern appearance

## Card Structure Template

### Layout Sections (in order):
1. **Header Section** (Fixed height: ~80px)
   - Image/Avatar (14x14 with decorative indicator)
   - Title/Name input with teal focus states
   - Primary value/price with teal styling
   - Meta information (date, status badges)

2. **Content Section** (Flexible: flex-1)
   - Form fields in 2-column grid with 3px gaps
   - Consistent label styling with teal-700 color
   - Input/select fields with teal-200 borders and teal-50/30 backgrounds
   - Hover and focus states with teal-400/500 colors

3. **Footer Section** (Fixed height: ~100px)
   - Separator with `border-t-2 border-teal-100`
   - Action buttons with teal primary and outlined variants
   - Secondary controls (switches, quick actions)

## Implementation Checklist for Each Card Type

### For Products ✅ (Completed)
- [x] Fixed height and responsive width
- [x] Teal color scheme implementation
- [x] Poppins/Inter font system
- [x] Structured header/content/footer layout
- [x] Consistent form field styling

### For Clients (To Implement)
- [ ] Apply fixed height `h-[420px]`
- [ ] Update color scheme to teal palette
- [ ] Implement font system (Poppins for headers, Inter for content)
- [ ] Restructure layout to match template
- [ ] Update form fields with teal styling
- [ ] Add left border brand indicator

### For Receipts (To Implement)
- [ ] Apply fixed height `h-[420px]`
- [ ] Update color scheme to teal palette
- [ ] Implement font system
- [ ] Restructure layout to match template
- [ ] Update action buttons with teal styling
- [ ] Add status indicators with teal variants

### For Invoices (To Implement)
- [ ] Apply fixed height `h-[420px]`
- [ ] Update color scheme to teal palette
- [ ] Implement font system
- [ ] Restructure layout to match template
- [ ] Update form fields and buttons
- [ ] Add consistent visual hierarchy

### For Purchases (To Implement)
- [ ] Apply fixed height `h-[420px]`
- [ ] Update color scheme to teal palette
- [ ] Implement font system
- [ ] Restructure layout to match template
- [ ] Update supplier/vendor information display
- [ ] Align with other card patterns

## Key CSS Classes to Reuse

### Background & Borders
```css
border-l-4 border-l-teal-500
bg-gradient-to-br from-teal-50/30 to-seafoam-50/20
hover:border-l-teal-600 hover:shadow-lg
```

### Form Elements
```css
border-teal-200 bg-teal-50/30 hover:border-teal-400 focus:border-teal-500
```

### Typography
```css
font-poppins font-semibold  /* Headers */
font-inter                  /* Body text */
text-teal-700 font-poppins font-medium  /* Labels */
```

### Buttons
```css
bg-teal-600 hover:bg-teal-700 text-white        /* Primary */
border-teal-200 text-teal-700 hover:bg-teal-50  /* Secondary */
```

## Notes for Implementation
1. **Maintain functionality**: Ensure all existing props and event handlers remain intact
2. **Progressive enhancement**: Update styling without breaking existing features
3. **Responsive behavior**: Cards should adapt to different screen sizes while maintaining proportions
4. **Accessibility**: Ensure color contrasts meet WCAG guidelines
5. **Performance**: Use CSS custom properties for theme colors when possible

## Brand Colors Reference
- Primary Teal: `#0B6E63` (--primary)
- Secondary Seafoam: `#38B2AC` (--secondary)
- Various teal shades from 50-900 available in Tailwind config
- Consistent with existing CSS custom properties in index.css
