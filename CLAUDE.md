# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application
- **Development server**: `npm run dev` (runs on port 5000)
- **Production build**: `npm run build`
- **Production start**: `npm start` (runs on port 5000)

### Database Operations
- **Generate migrations**: `npx drizzle-kit generate`
- **Push schema changes**: `npx drizzle-kit push`
- **Run migrations**: `npx drizzle-kit migrate`

### Testing
- **Run tests**: `npm test` (uses Jest)
- **Test with coverage**: `npm test -- --coverage`

## Project Architecture

### Technology Stack
- **Frontend**: Next.js 13+ (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: PostgreSQL via Neon with Drizzle ORM (newer endpoints) and @neondatabase/serverless (legacy endpoints)
- **State Management**: React Query (@tanstack/react-query)
- **AI Integration**: OpenAI API for chatbot and image analysis
- **Email**: AWS SES and Mailgun for notifications

### Directory Structure
- **`/app`** - Next.js App Router pages and API routes
- **`/app/api`** - API endpoints for all backend functionality  
- **`/app/components`** - React components (both UI and business logic)
- **`/db`** - Database schema and configuration (Drizzle)
- **`/lib`** - Utility functions and shared logic
- **`/Docs`** - Comprehensive project documentation

### Database Architecture

**Core Tables:**
- **`players`** - Player roster with name, start year, creation date
- **`matches`** - Match results with team compositions (3 players max per team) and game scores
- **`achievements`** - Achievement definitions with conditions and metadata
- **`player_achievements`** - Achievement unlock tracking with timestamps

**Key Relationships:**
- Matches reference up to 6 players (3 per team) via foreign keys
- Player achievements are tracked via junction table
- Extensive indexing on player references for performance

### API Layer Structure

**Player Management:**
- `/api/players` - CRUD operations for player roster
- `/api/players/[id]` - Individual player operations

**Match Recording:**
- `/api/matches` - Match creation and listing (legacy endpoint)
- `/api/games` - Match operations using Drizzle ORM (newer endpoint)
- `/api/matches/[id]` - Individual match operations

**Statistics & Analytics:**
- `/api/player-stats` - Comprehensive player statistics with win rates, streaks, inactivity penalties
- `/api/season-stats` - Season-level aggregated statistics
- `/api/team-performance` - Team combination analysis and performance tracking
- `/api/trends` - Performance trend data over time
- `/api/player-trends` - Individual player trend analysis

**Gamification:**
- `/api/achievements/check/[playerId]` - Achievement system with automatic unlocking
- `/api/achievements/player/[playerId]` - Player-specific achievement queries

**AI Features:**
- `/api/chatbot` - Intelligent assistant for performance analysis and team suggestions
- `/api/chatbot/image` - OCR and AI analysis of match result images
- `/api/feedback` - User feedback collection with email notifications

### Business Logic Patterns

**Performance Calculations:**
- **Inactivity Penalty**: 5% reduction per week after 2 weeks inactive (max 50% penalty)
- **Streak Tracking**: Consecutive weeks of activity (not just wins)
- **Playing Time**: Estimated at 90 minutes per unique playing day
- **Win Metrics**: Both match-level and game-level win percentages

**Team Analysis:**
- **Unique Team Combinations**: Identified using sorted player ID arrays
- **Performance Tracking**: Win rates for specific team compositions
- **Balanced Team Suggestions**: AI-powered team balancing based on player statistics

**Achievement System:**
- **Condition-Based**: Various achievement types (games played, win rates, diversity)
- **Automatic Unlocking**: Triggered by match completion
- **Real-time Processing**: Immediate achievement checking after each match

### Component Architecture

**Page Components:**
- Main dashboard (`/app/page.tsx`) with performance charts and match recording
- Player management pages with detailed statistics
- Game history and results tracking

**Reusable Components:**
- `PlayerCard` - Individual player statistics display
- `RecordMatchModal` - Match entry form with team selection
- `ChatBot` - AI-powered assistant with image upload capability
- `PerformanceTrend` - Statistical visualization components
- UI components from shadcn/ui library

### Database Migration Strategy

**Dual ORM Approach:**
- Legacy endpoints use `@neondatabase/serverless` with raw SQL
- Newer endpoints use Drizzle ORM with type safety
- Gradual migration toward Drizzle for all endpoints

**Schema Management:**
- Drizzle configuration in `drizzle.config.ts`
- Schema definitions in `/db/schema.ts`
- Type generation with Zod schemas for validation

### Development Workflow

**Environment Setup:**
- Requires `DATABASE_URL` environment variable for Neon PostgreSQL
- OpenAI API key for chatbot functionality
- AWS SES or Mailgun credentials for email features

**Code Conventions:**
- TypeScript strict mode enabled
- ESLint with Next.js configuration
- Tailwind CSS for styling with consistent design system
- React Query for data fetching and caching

**Key Configuration Files:**
- `next.config.js` - Next.js configuration with server actions enabled
- `tailwind.config.js` - Tailwind styling configuration
- `tsconfig.json` - TypeScript configuration with path aliases
- `drizzle.config.ts` - Database ORM configuration