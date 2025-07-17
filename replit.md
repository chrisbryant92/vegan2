# Animal Impact Tracker

## Overview

The Animal Impact Tracker is a full-stack web application built to help animal welfare advocates track and measure their impact across four key categories: charitable donations, vegan conversions, media sharing, and online campaigns. The application provides comprehensive analytics, leaderboards, and impact visualization to motivate users and showcase collective progress in animal welfare efforts.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Framework**: Tailwind CSS with shadcn/ui components for modern, accessible interface
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Charts**: Recharts for data visualization and impact analytics
- **Authentication**: Context-based authentication with protected routes

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API endpoints
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (via Neon serverless)
- **Authentication**: Passport.js with local strategy and express-session
- **Session Storage**: PostgreSQL-based session store for production scalability

### Build System
- **Bundler**: Vite for fast development and optimized production builds
- **Package Manager**: npm with lockfile for dependency consistency
- **TypeScript**: Strict type checking across frontend, backend, and shared schemas

## Key Components

### Database Schema
The application uses four main data tables:
- **Users**: Authentication and profile information
- **Donations**: Charitable donation tracking with impact calculations
- **Vegan Conversions**: Personal influence tracking for dietary changes
- **Media Shared**: Content creation and sharing impact measurement
- **Campaigns**: Online activism and campaign participation tracking

### Authentication System
- Username/password authentication with secure password hashing using scrypt
- Session-based authentication with PostgreSQL session store
- Protected route components for client-side authorization
- Context-based auth state management throughout the application

### Impact Calculation Engine
Sophisticated algorithms for calculating animal impact across categories:
- **Donations**: Variable impact factors based on organization effectiveness (0.5x to 4.89x animals per dollar)
- **Vegan Conversions**: Time-based calculations considering influence percentage and dietary changes
- **Media Sharing**: Reach and persuasiveness-based calculations for content impact
- **Campaigns**: Action-weighted scoring for different types of participation

### Data Visualization
- Interactive charts and graphs using Recharts
- Dashboard with summary cards showing category breakdowns
- Progress tracking against user-defined goals
- Leaderboard system for community engagement

## Data Flow

1. **User Registration/Login**: Credentials validated against PostgreSQL user table
2. **Data Entry**: Users input activities through validated forms
3. **Impact Calculation**: Server-side algorithms calculate animal impact using predefined factors
4. **Data Storage**: Impact data stored in PostgreSQL with foreign key relationships
5. **Analytics Generation**: Aggregated statistics calculated for dashboard and leaderboards
6. **Real-time Updates**: TanStack Query manages cache invalidation and data synchronization

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless database connection
- **drizzle-orm**: Type-safe ORM for database operations
- **passport**: Authentication middleware
- **express-session**: Session management
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling and validation
- **zod**: Runtime type validation
- **recharts**: Data visualization components

### UI Dependencies
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component library
- **lucide-react**: Icon library

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite dev server with HMR for rapid development
- **Type Checking**: Real-time TypeScript compilation and error checking
- **Database**: Direct connection to Neon PostgreSQL instance

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: esbuild bundles Node.js server code
- **Database Migrations**: Drizzle Kit handles schema migrations
- **Environment Variables**: DATABASE_URL and SESSION_SECRET required

### Database Management
- Schema defined in shared TypeScript files
- Migration scripts for database updates
- Connection pooling for production scalability
- Backup and recovery through Neon platform

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### July 17, 2025 - Beta Launch Preparation
- **Rebranding**: Updated app title to "Vegan 2.0" with new logo and favicon
- **Feedback System**: Complete feedback collection system with database storage and weekly email compilation
- **Pro Bono Consistency**: Updated pro bono page terminology and impact factors to match donations page (4.6 animals per dollar for highest impact)
- **Campaign Research Notice**: Added transparency notice acknowledging campaigns as least researched model component, with invitation for user feedback
- **Navigation Improvements**: Repositioned feedback link to bottom menu section with clear visual separation
- **System Validation**: Comprehensive beta validation testing of all core functionality

### Key Features Ready for Beta:
- ✅ Multi-category impact tracking (donations, vegan conversions, media, campaigns, pro bono)
- ✅ Sophisticated calculation engines with research-backed impact factors
- ✅ User authentication and session management
- ✅ Data visualization and progress tracking
- ✅ Responsive design for mobile and desktop
- ✅ Feedback collection system for continuous improvement
- ✅ Database integrity and foreign key relationships
- ✅ Consistent terminology and calculations across all pages

## Changelog

- July 17, 2025: Beta launch preparation completed
- July 16, 2025: Campaign leaflets and rallies implementation
- July 07, 2025: Core database structure and calculations
- July 06, 2025: Initial setup