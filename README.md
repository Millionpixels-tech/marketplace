
# Marketplace Web Application

An online marketplace for unique Sri Lankan creations, built with React, TypeScript, Vite, Firebase, and Tailwind CSS.

---

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Setup & Installation](#setup--installation)
6. [UI Design System](#ui-design-system)
7. [Contributing](#contributing)
8. [License](#license)

---

## Overview
This project is a modern, full-featured online marketplace where users can buy and sell unique Sri Lankan products. It supports user authentication, shop and product management, wishlists, reviews, and more.

## Features
- User authentication (sign up, login, password reset)
- Shop creation and management
- Product listing and search
- Shopping cart and checkout
- Wishlist functionality
- Product and shop reviews
- Order management (buyer & seller views)
- Responsive, mobile-friendly UI

## Tech Stack
- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS
- **Backend/Database:** Firebase (Auth, Firestore, Storage)
- **Icons:** react-icons

## Project Structure
```
src/
  components/UI/         # Reusable UI components (Header, WishlistButton, etc.)
  context/               # React context (AuthContext)
  pages/                 # Main app pages (Home, Shop, Dashboard, etc.)
  routes/                # App route definitions
  utils/                 # Utility functions (firebase, categories, wishlist, etc.)
public/                  # Static assets
```

## Setup & Installation
1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd marketplace
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Configure environment variables:**
   ```sh
   cp .env.example .env
   # Edit .env with your actual configuration values
   ```
4. **Start the development server:**
   ```sh
   npm run dev
   ```
5. **Build for production:**
   ```sh
   npm run build
   ```

## Environment Configuration

### Environment Mode
The application supports different environment modes controlled by the `VITE_ENV_MODE` environment variable:

- **DEV** (default): Normal application behavior with all pages accessible
- **PROD**: Redirects all pages to a "Coming Soon" page

#### Usage
1. Set `VITE_ENV_MODE=PROD` in your `.env` file or environment variables
2. All routes will automatically redirect to `/coming-soon` except the coming soon page itself
3. Internal navigation (logo, menu, footer links) includes state flags to properly handle user flows

#### Implementation Details
- The `EnvModeGuard` component wraps all routes in `AppRoutes.tsx`
- When in PROD mode, users are redirected to `/coming-soon` regardless of the URL they access
- The coming soon page displays a professional announcement with feature previews
- Navigation links include `state={{ fromInternal: true }}` for proper user experience

This feature is useful for:
- Pre-launch maintenance mode
- Staged deployments
- Feature flag-based access control

## UI Design System

### Color Palette
| Name            | Color Code         | Usage                                 |
|-----------------|-------------------|---------------------------------------|
| Primary Green   | `#72b01d`         | Highlights, buttons, links            |
| Dark Green      | `#3f7d20`         | Hover states, accents                 |
| Primary Text    | `#0d0a0b`         | Main headings, important text         |
| Secondary Text  | `#454955`         | Body, less prominent text             |
| Background      | `#ffffff`         | Main background, cards                |
| Accent Blue     | `#3b82f6`/`bg-blue-500` | Badges, icons                  |
| Border Light    | `#45495522`       | Light border                          |
| Border Green    | `rgba(114,176,29,0.3/0.6)` | Green border accents           |
| Error           | `#ef4444`/`text-red-500` | Error messages                  |

### Typography
- **Font Family:** Tailwind CSS default (`Inter`, `sans-serif`)
- **Font Weights:** `font-bold`, `font-semibold`, `font-medium`, `font-black`
- **Font Sizes:** `text-sm`, `text-lg`, `text-2xl`, `text-4xl`, etc.

### UI Elements & Components
- **Rounded Corners:** `rounded-2xl`, `rounded-3xl`, `rounded-full`
- **Shadows:** `shadow`, `shadow-sm`, `shadow-lg`
- **Transitions:** `transition` for hover/focus effects
- **Spacing:** `p-5`, `p-8`, `mb-2`, `gap-1`, `gap-2`, etc.
- **Flexbox/Grid:** `flex`, `items-center`, `justify-center`, `gap-*`

### Example UI Snippets
#### Button Example
```jsx
<button className="bg-[#72b01d] text-white rounded-2xl py-3 text-lg font-bold uppercase tracking-wide shadow-sm hover:bg-[#3f7d20] transition">
  Buy Now
</button>
```
#### Card Example
```jsx
<div className="bg-white border border-[#45495522] rounded-2xl p-5 shadow-sm">
  <h2 className="text-2xl font-bold text-[#0d0a0b] mb-2">Product Title</h2>
  <p className="text-[#454955]">Product description goes here.</p>
</div>
```

## Contributing
Contributions are welcome! Please open issues or submit pull requests for improvements and bug fixes.

## License
This project is licensed under the MIT License.
