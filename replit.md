# Overview

A KI PRI SA YÉ is a price comparison platform specifically designed for French Overseas Territories (Territoires d'Outre-Mer). The application allows users to compare prices across different stores and territories, visualize price trends through charts and maps, and discover the best deals in overseas territories like Guadeloupe, Martinique, French Guiana, La Réunion, Mayotte, New Caledonia, and French Polynesia.

The platform features a tropical-themed design with mobile-first responsive layouts, interactive maps for territorial price exploration, comprehensive product comparison tools, and store rankings based on multiple metrics including price competitiveness and territorial coverage.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The application uses a modern React-based Single Page Application (SPA) architecture built with TypeScript and Vite for development and building. The frontend follows a component-based architecture with:

- **React Router** for client-side routing between pages (Home, Products, Compare, Map, Ranking, About)
- **Context API** for global state management through ProductsContext, managing products, stores, territories, filters, and user lists
- **Radix UI** component library with shadcn/ui for consistent, accessible UI components
- **Framer Motion** for animations and micro-interactions
- **Recharts** for data visualizations including price charts and ranking visualizations
- **React Leaflet** for interactive map functionality showing territorial coverage

## Backend Architecture

The backend uses a Node.js Express server with TypeScript in ESM format. The architecture includes:

- **Express.js** HTTP server with middleware for JSON parsing, logging, and error handling
- **Modular route structure** with separate route registration and storage abstraction
- **Storage Interface** pattern with both memory-based and database implementations
- **Vite integration** for development with HMR (Hot Module Replacement)
- **Static file serving** for production builds

## Data Storage Solutions

The application uses a dual-storage approach:

- **PostgreSQL** with Drizzle ORM for production data persistence, configured for Neon Database serverless deployment
- **In-memory storage** with MemStorage class for development and testing
- **JSON data files** for initial product, store, and territory data seeding
- **Local Storage** for user preferences like theme settings, comparison lists, and user-saved product lists

## Design System

The UI follows a tropical/Caribbean-inspired design system:

- **Tailwind CSS** for utility-first styling with custom CSS variables for theming
- **Color palette** featuring ocean blues, tropical teals, warm corals, and sandy beiges
- **Typography** using Inter and Poppins fonts from Google Fonts
- **Component variants** supporting both light and dark modes
- **Mobile-first responsive design** optimized for smartphone usage in overseas territories

## Data Flow and State Management

The application manages data through several layers:

- **ProductsContext** provides centralized state for products, stores, territories, and user interactions
- **Filtering system** with real-time search, category, store, and territory filters
- **Comparison functionality** allowing users to select and compare up to multiple products
- **User lists** for saving favorite products with localStorage persistence
- **Price tracking** with historical data visualization and trend analysis

# External Dependencies

## Database and ORM
- **Neon Database** - Serverless PostgreSQL hosting for production data
- **Drizzle ORM** - Type-safe database operations and schema management
- **connect-pg-simple** - PostgreSQL session storage for Express sessions

## UI and Visualization
- **Radix UI** - Accessible, unstyled UI primitives for components like dialogs, dropdowns, navigation
- **Recharts** - React charting library for price trends and ranking visualizations
- **Leaflet** - Interactive maps for territorial visualization and store location mapping
- **Framer Motion** - Animation library for smooth transitions and micro-interactions

## Development and Tooling
- **Vite** - Build tool and development server with React plugin
- **TanStack Query** - Data fetching, caching, and synchronization for API calls
- **date-fns** - Date manipulation and formatting utilities
- **Zod** - Schema validation for data integrity and API responses

## Styling and Theming
- **Tailwind CSS** - Utility-first CSS framework with custom configuration
- **class-variance-authority** - Component variant management for consistent styling
- **clsx** and **tailwind-merge** - Conditional className utilities

## Fonts and Assets
- **Google Fonts** (Inter, Poppins) - Typography system
- **Lucide React** - Icon library for consistent iconography
- **Custom tropical imagery** - Hero images and territorial visual assets