# RVA Contract Lens — Design System

## Style: Accessible & Ethical
WCAG AAA target. High contrast, large text, keyboard navigable, screen reader friendly.

## Colors
| Token | Hex | Usage |
|-------|-----|-------|
| primary | #2563EB | Interactive elements, links, selected states |
| primary-hover | #1D4ED8 | Hover state for primary |
| secondary | #3B82F6 | Secondary actions, info badges |
| cta | #F97316 | Call-to-action buttons |
| cta-hover | #EA580C | CTA hover |
| background | #F8FAFC | Page background |
| surface | #FFFFFF | Cards, panels |
| text | #1E293B | Primary body text |
| text-secondary | #475569 | Secondary/helper text |
| border | #E2E8F0 | Borders, dividers |
| risk-critical | #DC2626 | ≤30 days expiry |
| risk-warning | #D97706 | 31-60 days expiry |
| risk-attention | #EA580C | 61-90 days expiry |
| risk-ok | #16A34A | 90+ days |
| risk-expired | #6B7280 | Already expired |

## Typography
- **Heading font:** Inter (system fallback: -apple-system, Segoe UI)
- **Body font:** Inter
- **Monospace:** Fira Code (for SQL display, contract numbers)
- **Base size:** 16px minimum
- **Scale:** 14 / 16 / 18 / 20 / 24 / 30 / 36
- **Line height:** 1.5 for body, 1.2 for headings
- **Max line length:** 75 characters

## Spacing
- 4px grid system
- Component padding: 16px
- Section gaps: 24-32px
- Card padding: 24px

## Interactive Elements
- **Touch targets:** 44x44px minimum
- **Focus rings:** 3px solid #2563EB with 2px offset
- **Transitions:** 150-200ms ease-out
- **Cursor:** pointer on all clickable
- **Hover:** subtle background shift, never color-only

## Risk Indicators
Never color alone — always icon + text + color:
- Critical: Red circle icon + "≤30 days" text + red background
- Warning: Yellow triangle icon + "31-60 days" text + yellow background
- Attention: Orange clock icon + "61-90 days" text + orange background
- OK: Green check icon + "90+ days" text + green background
- Expired: Gray dash icon + "Expired" text + gray background

## Accessibility Mandates
- Contrast: 4.5:1 minimum (7:1 for critical text)
- All images: descriptive alt text
- All interactive elements: aria-label
- Skip links: "Skip to main content"
- Heading hierarchy: sequential h1→h6
- prefers-reduced-motion: respect
- Forms: visible labels (never placeholder-only)
- Errors: near the field, with recovery path
- Screen reader: logical reading order

## Anti-Patterns (NEVER)
- Ornate decoration
- Low contrast text
- Motion-dependent information
- AI purple/pink gradients
- Emojis as icons
- Placeholder-only labels
- Color as sole indicator
- Disabled zoom
- Icon-only buttons without labels
