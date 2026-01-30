# Tailwind v4 Implementation Guidelines

This document provides Tailwind v4 specific guidelines for implementing .pen designs in code, focusing on the idiomatic **Theme-First Strategy**.

**NOTE**: These guidelines are specific to Tailwind v4. They leverage the new `@theme` directive for a cleaner, zero-configuration developer experience.

## Core Principle

**Use semantic utility classes (`bg-primary`, `font-display`) defined in your theme. Avoid messy arbitrary values (`bg-[var(--color-primary)]`) unless absolutely necessary.**

## CSS Variables & Theme Setup

### Structure of globals.css

Your `globals.css` should follow this structure. Note that in v4, we use `@theme` to map CSS variables directly to utilities.

```css
@import "tailwindcss";

@theme {
  /* COLORS: specific to this project */
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;
  
  /* SPACING: override or extend defaults */
  --spacing-4_5: 1.125rem;
  
  /* BREAKPOINTS */
  --breakpoint-3xl: 1920px;

  /* FONTS: referencing CSS variables defined below or imported */
  --font-display: "Space Grotesk", "sans-serif";
  --font-body: "Inter", "sans-serif";
  --font-mono: "JetBrains Mono", "monospace";
}

/* Base styles and Font Variables */
@layer base {
  html, body {
    height: 100%;
  }
}
```

### Guidelines

- **Define Tokens in `@theme`**: All design tokens (colors, fonts, spacing) goes into the `@theme` block.
- **Automatic Utilities**: Defining `--color-primary` inside `@theme` *automatically* creates:
    - `bg-primary`
    - `text-primary`
    - `border-primary`
    - `ring-primary`
- **Prefixing**: No need to manually prefix logic. Tailwind handles semantic class generation.

## Font Implementation

### Next.js Font Loaders (The Right Way)

Next.js font loaders return objects with className or variable properties. In Tailwind v4, we link these to the theme variables.

**1. Setup in `layout.tsx`**:
```tsx
import { Inter, Space_Grotesk } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter", // Define the CSS variable name here
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

**2. Configure inside `globals.css`**:
```css
@import "tailwindcss";

@theme {
  /* Reference the CSS variables injected by Next.js */
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-display: var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif;
}
```

**3. Usage in Components**:
```tsx
/* Use the semantic utility class */
<h1 className="font-display text-4xl font-bold">Headline</h1>
<p className="font-sans text-gray-600">Body text here...</p>
```

### Manual Font Loading (Google Fonts CDN)

If not using Next.js loaders:

```css
/* At the top of globals.css */
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap");
@import "tailwindcss";

@theme {
  --font-sans: "Inter", sans-serif;
}
```

## Component Implementation

### 1. Layout & Container

- Use `flex` and `grid` for layouts.
- Use `w-full h-full` over explicit pixels where possible.
- **Sizing**: `w-full`, `h-screen`, `min-h-0`.

### 2. Spacing

- Use standard Tailwind scale where possible: `p-4` (1rem), `m-6` (1.5rem).
- If design has unique spacing, defined it in `@theme` as `--spacing-custom: 123px`, then use `p-custom`.

### 3. Colors and Borders

- **Background**: `bg-primary`, `bg-secondary/10` (opacity modifier works automatically!).
- **Border**: `border`, `border-2`, `border-primary`.
- **Text**: `text-primary`, `text-white`.

**Why this is better than arbitrary values:**
- `bg-[var(--color-primary)]` -> **Cannot** use opacity modifiers easily.
- `bg-primary` -> **Can** use `bg-primary/50` instantly.

### 4. Typography

- **Font Family**: `font-display`, `font-sans`, `font-mono`.
- **Size**: `text-sm`, `text-xl`, `text-[14px]` (arbitrary if one-off).
- **Weight**: `font-medium`, `font-bold`.

## Tailwind v4 Migration Notes

### Import Syntax
✅ **Correct**:
```css
@import "tailwindcss";
```

❌ **Old (Do Not Use)**:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Preflight
Preflight is included automatically. Do not add manual resets like `* { box-sizing: border-box }`.

## Layout Translation Cheat Sheet

| Design Concept | Tailwind Class |
| :--- | :--- |
| `fill_container` | `flex-1` (inside flex) or `w-full h-full` |
| `fit_content` | `w-fit h-fit` |
| `scrollable` | `overflow-auto` |
| Fixed Width | `w-[240px]` |

## Verification Checklist

1. [ ] **No Inline Styles**: Are all styles using Tailwind classes?
2. [ ] **Theme Used**: Are colors and fonts defined in `@theme` block?
3. [ ] **Semantic Classes**: Are you using `text-primary` instead of `text-[#...]`?
4. [ ] **Responsive**: Are you using variants like `md:flex` correctly?
