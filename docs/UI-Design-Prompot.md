You are a senior product designer and frontend engineer.

Implement a modern Apple-inspired light-mode service category card section for “ProdOps Network”, a productization platform that connects product owners with verified specialist teams.

The section should look like a polished enterprise SaaS interface designed with Apple-like principles: calm, spacious, minimal, refined, soft, and highly legible.

Build the UI as production-ready frontend code.

Preferred stack:
- React + TypeScript
- Tailwind CSS
- lucide-react or inline SVG icons
- Fully responsive
- Accessible semantic HTML

Do not use dark mode for this version. This is a light-mode design.

Overall visual direction:
- Clean white canvas
- Subtle pastel card backgrounds
- Soft shadows, not heavy drop shadows
- Rounded Apple-style cards
- Thin hairline borders
- Generous whitespace
- Large, confident typography
- Minimal navigation and footer
- Product UI should feel premium, calm, and enterprise-ready
- Avoid noisy gradients, abstract AI art, stock imagery, or decorative clutter

Use these design principles:
1. Apple-style minimalism
   - Reduce visual noise
   - Prioritize clarity and calm spacing
   - Let the content and hierarchy breathe

2. Soft pastel system
   - Each service category has its own light pastel identity
   - Use matching icon color, top border, tag tint, and demand pill tint
   - Keep colors soft, never neon or oversaturated

3. Progressive information density
   - Cards should show the category, outcome, tags, and demand level
   - No long paragraphs
   - No dense tables
   - Information should be scannable in 5 seconds

4. Responsive card grid
   - Desktop: 4 columns
   - Tablet: 2 columns
   - Mobile: 1 column
   - Cards should keep consistent height where possible
   - Tap targets should be at least 44px on mobile

5. Distinct geometric icons
   - Every category needs a simple, recognizable geometric icon
   - Icons must be distinguishable at small sizes
   - Do not use generic sparkle or AI icons for everything

Layout requirements:
- Page background: #ffffff
- Main container max-width: 1440px
- Horizontal page padding:
  - Desktop: 48px
  - Tablet: 32px
  - Mobile: 20px
- Top navigation:
  - Left: ProdOps Network logo
  - Center nav links: How it works, Services, For Owners, For Teams, Pricing, Resources
  - Right buttons: Log in, Request Access
  - Active nav item: Services
- Header section:
  - Title: “Service categories”
  - Subtitle: “Specialist workstreams for production-ready products.”
- Card grid:
  - 8 cards
  - 4 columns desktop
  - 2 columns tablet
  - 1 column mobile
  - Gap: 32px desktop, 24px tablet, 16px mobile
- Bottom responsive note:
  - “Responsive by design”
  - Small icons or labels for desktop/tablet/mobile
- Minimal footer:
  - ProdOps Network logo
  - Copyright
  - Privacy, Terms, Cookies
  - Small social icons

Card styling:
- Background: mostly white with very subtle category-tinted gradient
- Border: 1px solid #E5E9F2
- Border radius: 20px to 24px
- Shadow: soft, subtle, Apple-like
- Top border: 3px solid category accent color
- Padding: 28px desktop, 22px mobile
- Icon container:
  - 64px square
  - Rounded 16px
  - Soft tinted background
  - Icon color matches category accent
- Category name:
  - Font size: 22px to 26px desktop
  - Font weight: 700
  - Color: #111827
- Description:
  - One-line or two-line outcome-focused description
  - Font size: 15px to 17px
  - Color: #5F6470
  - Avoid describing tasks only; describe the outcome
- Capability tags:
  - Small rounded pills
  - Soft tinted background
  - Matching text color
  - Font size: 13px
  - 3 to 4 tags per card
- Demand indicator:
  - Rounded pill at bottom
  - Small colored dot
  - Text: High demand, Medium demand, or New demand
  - Match demand color to category/accent where appropriate

Typography:
- Use Inter or system Apple font stack:
  font-family: Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif;
- Page title:
  - 48px desktop
  - 36px tablet
  - 30px mobile
  - Font weight 750 or 800
  - Letter spacing: -0.03em
- Body text:
  - 16px
  - Comfortable line height around 1.5

Color system:
Use this light-mode palette inspired by the reference design:

Base:
- Page background: #FFFFFF
- Primary text: #111827
- Secondary text: #5F6470
- Muted text: #7B8190
- Border: #E5E9F2
- Soft border: #EEF1F6
- Card shadow: rgba(15, 23, 42, 0.06)
- Primary action indigo: #6D63F6
- Primary action hover: #5B52E8

Category colors:

1. Validation
- Accent: #6D63F6
- Soft background: #F1EFFF
- Icon background: #ECE9FF
- Tags background: #F0EDFF
- Tags text: #5B50D6
- Demand: High demand
- Icon concept: checklist document with magnifying glass or verification checklist
- Description: “Clear product readiness and confident next steps.”
- Tags: Requirements, Code Review, Readiness, Scope

2. Code Rewrite
- Accent: #2F80ED
- Soft background: #EEF6FF
- Icon background: #E6F1FF
- Tags background: #EAF4FF
- Tags text: #1767C2
- Demand: High demand
- Icon concept: code brackets inside circular refresh arrows
- Description: “A modern codebase that is easier to evolve.”
- Tags: Backend, Frontend, Migration, Refactor

3. Scaling
- Accent: #F59E0B
- Soft background: #FFF7E8
- Icon background: #FFF1D8
- Tags background: #FFF3DF
- Tags text: #B86A00
- Demand: High demand
- Icon concept: rising bar chart with arrow and motion lines
- Description: “Faster systems that stay efficient as usage grows.”
- Tags: Performance, Load Test, Cost, Resilience

4. Cloud / DevOps
- Accent: #0891B2
- Soft background: #EAFBFF
- Icon background: #DFF7FB
- Tags background: #E3F7FA
- Tags text: #087D98
- Demand: High demand
- Icon concept: cloud connected to pipeline nodes
- Description: “Reliable delivery pipelines and production stability.”
- Tags: CI/CD, Deploy, Staging, Monitoring

5. Database
- Accent: #0EA5B7
- Soft background: #EAFBFC
- Icon background: #DFF7F8
- Tags background: #E1F7F8
- Tags text: #087A86
- Demand: Medium demand
- Icon concept: database cylinder with up/down migration arrows
- Description: “A safer data foundation with faster query performance.”
- Tags: Schema, Migration, Backup, Queries

6. Security
- Accent: #EF4444
- Soft background: #FFF0F0
- Icon background: #FFE4E4
- Tags background: #FFE9E9
- Tags text: #DC2626
- Demand: High demand
- Icon concept: shield with lock and dotted threat grid
- Description: “Reduced risk and stronger trust across the product.”
- Tags: Auth, API Security, Secrets, Remediation

7. Launch Readiness
- Accent: #22A447
- Soft background: #F0FBF2
- Icon background: #E2F8E7
- Tags background: #E7F8EA
- Tags text: #168038
- Demand: New demand
- Icon concept: rocket with orbit ring or launch trajectory
- Description: “Core business flows are ready for a confident go-live.”
- Tags: Analytics, Payments, Onboarding, Admin

8. Operations / Support
- Accent: #7C3AED
- Soft background: #F5F0FF
- Icon background: #EEE5FF
- Tags background: #F0E9FF
- Tags text: #6D28D9
- Demand: Medium demand
- Icon concept: headset inside gear or pulse monitor gear
- Description: “Stable product operations and quick issue recovery.”
- Tags: Maintenance, Bug Fixes, Monitoring, Incidents

Interaction details:
- Cards should have subtle hover states:
  - Slight lift: translateY(-4px)
  - Border becomes slightly stronger in category accent
  - Shadow increases slightly
- Hover transition: 180ms to 220ms ease
- Buttons should have smooth hover states
- Navigation active item should use a soft indigo pill background
- Mobile cards should remain clean and easy to tap

Accessibility:
- Use proper headings
- Ensure text contrast is readable
- Icons should have aria-hidden if decorative
- Demand indicators should not rely on color alone; include text
- Use semantic sections, nav, main, footer
- Buttons and links should be keyboard accessible

Content structure:
Use an array of service categories and map over it to render the cards.

Return:
1. Complete React component code
2. Tailwind classes
3. Category data array
4. Simple inline SVG icons or lucide-react icon imports
5. Responsive implementation
6. No placeholder lorem ipsum
7. No dark theme
8. No stock images
9. No generic AI illustrations

The final result should visually match a premium Apple-inspired SaaS service catalog page for ProdOps Network in light mode.