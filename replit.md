# Key Generator Application

## Overview

This is a full-stack web application for generating and managing cryptographic keys. It's built with a React frontend using shadcn/ui components and an Express.js backend with PostgreSQL database integration. The application allows users to generate various types of keys (UUID, hex, alphanumeric, custom) and store them for future reference.

## System Architecture

The application follows a monorepo structure with a clear separation between client and server code:

- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Framework**: shadcn/ui with Tailwind CSS
- **State Management**: TanStack Query for server state management
- **Deployment**: Configured for Replit with autoscale deployment

## Key Components

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Defined in `shared/schema.ts` with two main tables:
  - `users`: For user authentication (id, username, password)
  - `keys`: For storing generated keys (id, name, key, type, length, timestamp)
- **Validation**: Zod schemas for type-safe data validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Storage**: Hybrid approach using both database and file system (`keys.json`)
- **API Endpoints**: RESTful API for key generation and retrieval
- **Key Generation**: Multiple algorithms (UUID, hex, alphanumeric, custom)
- **Development**: Hot reload with Vite integration for development mode

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Fetch API with TanStack Query for caching and state management

### Build System
- **Development**: Vite dev server with HMR
- **Production**: Vite build for frontend, esbuild for backend
- **TypeScript**: Strict type checking across the entire codebase
- **Path Aliases**: Configured for clean imports (@/, @shared/, @assets/)

## Data Flow

1. **Key Generation Request**: User fills out form with key parameters (name, type, length)
2. **Form Submission**: React Hook Form validates data and submits to backend
3. **Backend Processing**: Express route generates key using appropriate algorithm
4. **Data Persistence**: Key is saved to both database (via Drizzle) and JSON file
5. **Response**: Generated key is returned to frontend
6. **UI Update**: TanStack Query updates cache and re-renders components
7. **Display**: User sees the generated key with copy functionality

## External Dependencies

### Runtime Dependencies
- **Database**: `@neondatabase/serverless` for Neon PostgreSQL connection
- **ORM**: `drizzle-orm` with PostgreSQL support
- **UI Components**: Comprehensive Radix UI component set
- **State Management**: `@tanstack/react-query` for server state
- **Validation**: `zod` for schema validation
- **Forms**: `react-hook-form` with resolvers
- **Routing**: `wouter` for lightweight routing
- **Styling**: `tailwindcss` with utilities

### Development Dependencies
- **Build Tools**: Vite, esbuild, TypeScript compiler
- **Replit Integration**: Custom plugins for development environment
- **Error Handling**: Runtime error overlay for development

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

- **Environment**: Node.js 20 with PostgreSQL 16
- **Build Process**: Automated build using `npm run build`
- **Production Start**: `npm run start` serves the built application
- **Port Configuration**: Internal port 5000 mapped to external port 80
- **Autoscale**: Configured for automatic scaling based on traffic
- **Database**: PostgreSQL database provisioned automatically by Replit

### Environment Configuration
- **DATABASE_URL**: Required environment variable for PostgreSQL connection
- **NODE_ENV**: Automatically set for development/production modes
- **Build Artifacts**: Frontend builds to `dist/public`, backend to `dist/`

## Changelog

```
Changelog:
- June 25, 2025. Initial setup
- June 25, 2025. Added key expiration (24 hours) and Roblox integration
- June 25, 2025. Keys now use FREE_ prefix with lowercase suffix format
- June 25, 2025. Added Roblox Lua script and validation endpoints
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```