# Architecture Overview

## System Architecture

The Volleyball League Management Platform follows a modern full-stack JavaScript architecture with the following components:

### Frontend Architecture

- **Framework**: React.js with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query for server state management
- **UI Components**: Custom components built with shadcn/ui and Tailwind CSS
- **Data Visualization**: Recharts for performance visualization

### Backend Architecture

- **Framework**: Next.js API Routes
- **API Layer**: RESTful API endpoints with Next.js Route Handlers
- **Database Access**: Drizzle ORM for database operations

### Database Architecture

- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Schema Management**: Drizzle Kit for schema migrations
- **Data Validation**: Zod for schema validation

## Application Flow

1. User interacts with the React frontend
2. Frontend makes API calls to the Express backend
3. Backend communicates with the PostgreSQL database using Drizzle ORM
4. Data is returned through the API to the frontend
5. Frontend updates its state using React Query
6. UI is rendered based on the updated state

## Directory Structure

- `/client` - Frontend React application
  - `/src` - Source code
    - `/components` - Reusable UI components
    - `/pages` - Page components
    - `/hooks` - Custom React hooks
    - `/lib` - Utility functions and configuration
- `/server` - Express.js backend
  - `routes.ts` - API route definitions
  - `index.ts` - Server setup
  - `vite.ts` - Development server configuration
- `/db` - Database related code
  - `schema.ts` - Database schema definitions
  - `config.ts` - Database configuration
  - `index.ts` - Database connection setup
- `/Docs` - Documentation files

## Technology Stack

### Frontend Technologies

- React 18+
- TypeScript
- Tailwind CSS
- Recharts
- React Query
- React Hook Form
- Shadcn/UI components
- Wouter for routing

### Backend Technologies

- Express.js
- Node.js
- Drizzle ORM
- PostgreSQL
- TypeScript

### Development Tools

- Vite for frontend development
- TypeScript for type checking
- ESLint for code linting
- npm for package management