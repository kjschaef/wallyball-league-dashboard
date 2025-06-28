# Wallyball League Dashboard

## Overview

The Wallyball League Dashboard is a comprehensive web application designed for tracking, analyzing, and visualizing player and team performance in wallyball matches. The platform provides advanced performance analytics, achievement tracking, and AI-powered team suggestions to enhance the competitive experience.

## System Architecture

The application follows a modern full-stack architecture built with Next.js, utilizing:

- **Frontend Framework**: Next.js 15 with React 18, using the App Router architecture
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent UI
- **Database**: PostgreSQL hosted on Neon, accessed through Drizzle ORM for type-safe database operations
- **State Management**: React Query (TanStack Query) for server state management and caching
- **Deployment**: Vercel platform with integrated Neon PostgreSQL database

## Key Components

### Database Layer
- **Players Table**: Stores player information including name, start year, and creation date
- **Matches Table**: Records match results with team compositions (up to 3 players per team) and scores
- **Achievements System**: Tracks player accomplishments through achievements and player_achievements junction tables
- **Indexing Strategy**: Optimized with indexes on player references for performance

### API Architecture
- RESTful API endpoints built with Next.js API Routes
- Endpoints for players, matches, achievements, and analytics
- Type-safe database queries using Drizzle ORM
- Automatic statistical calculations for player performance metrics

### Frontend Components
- **Modular Component Architecture**: Reusable UI components built with shadcn/ui
- **Performance Visualization**: Interactive charts using Recharts library
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Data**: React Query for efficient data fetching and caching

### Analytics Engine
- **Performance Metrics**: Win percentage calculations with inactivity penalties
- **Trend Analysis**: Time-series data visualization for player performance
- **Team Analytics**: Head-to-head comparisons and team effectiveness metrics
- **Achievement System**: Automated badge unlocking based on performance milestones

## Data Flow

1. **Match Recording**: Users input match results through forms, data is validated and stored in PostgreSQL
2. **Statistical Processing**: Server-side calculations generate player statistics from raw match data
3. **Performance Analytics**: Complex algorithms apply inactivity penalties and calculate adjusted metrics
4. **Visualization**: Processed data is rendered through interactive charts and components
5. **Caching**: React Query manages client-side data caching for optimal performance

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL driver for serverless environments
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management and caching
- **recharts**: Chart library for data visualization
- **date-fns**: Date manipulation utilities
- **lucide-react**: Icon library

### Development Tools
- **TypeScript**: Type safety throughout the application
- **ESLint**: Code linting with TypeScript-aware rules
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS processing with Autoprefixer

### Optional Features
- **Model Context Protocol (MCP)**: Integration for AI-powered features
- **PDF Processing**: pdf-parse for document handling
- **WebSocket Support**: For real-time features (configured but not actively used)

## Deployment Strategy

### Vercel Platform Integration
- **Automatic Deployments**: Git-based deployments from main branch
- **Edge Functions**: Optimized API routes running on Vercel Edge Runtime
- **Static Site Generation**: Pre-rendered pages for optimal performance
- **Environment Management**: Secure environment variable handling

### Database Strategy
- **Neon PostgreSQL**: Serverless PostgreSQL with automatic scaling
- **Connection Pooling**: Efficient database connections in serverless environment
- **Migration Management**: Drizzle migrations for schema versioning
- **Backup Strategy**: Automated backups through Neon platform

### Performance Optimizations
- **Static Generation**: Pre-built pages for faster loading
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic bundle optimization
- **Caching Strategy**: Multi-layer caching with React Query and Vercel edge cache

## Changelog

- June 28, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.