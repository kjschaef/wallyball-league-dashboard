
# Getting Started Guide

## Overview

This guide provides instructions for setting up, running, and developing the Wallyball League Management Platform.

## Prerequisites

Before you begin, ensure you have the following:

- Node.js (version 20.x recommended)
- npm (version 10.x or higher)
- PostgreSQL database (version 16.x)
- Git for version control

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd wallyball-league-platform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure the Database

Create a PostgreSQL database and set the connection string in a `.env` file:

```
DATABASE_URL=postgres://username:password@localhost:5432/wallyball_db
```

### 4. Initialize the Database

Run the Drizzle migration to set up the database schema:

```bash
npm run db:push
```

This will create the necessary tables and relationships in your database.

## Running the Application

### Development Mode

Start the application in development mode:

```bash
npm run dev
```

This command starts both the Express backend server and the Vite development server with hot-reloading.

### Production Build

Build the application for production:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

## Project Structure

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

## Development Workflow

### Adding New Features

1. **Create necessary database schema changes:**
   - Update the schema in `db/schema.ts`
   - Run `npm run db:push` to apply changes

2. **Implement backend API endpoints:**
   - Add routes in `server/routes.ts`
   - Implement data access using Drizzle ORM

3. **Develop frontend components:**
   - Create or update components in `client/src/components`
   - Add pages in `client/src/pages` if needed
   - Update routing in `client/src/App.tsx`

4. **Test the feature:**
   - Ensure API endpoints work as expected
   - Verify UI components render correctly
   - Test feature functionality end-to-end

### Database Operations

- **Schema Updates:**
  - Modify `db/schema.ts`
  - Run `npm run db:push` to update the database

- **Data Migration:**
  - Create migration scripts as needed
  - Test migrations in a development environment before applying to production

### Component Development

- **UI Components:**
  - Leverage the existing UI component library
  - Follow the shadcn + Tailwind CSS patterns
  - Maintain accessibility and responsive design

- **Data Fetching:**
  - Use React Query for API requests
  - Implement proper error handling and loading states
  - Manage caching and invalidation appropriately

## Key Technologies

- **Frontend:**
  - React 18+
  - TypeScript
  - Tailwind CSS
  - Shadcn UI components
  - React Query
  - Recharts for data visualization

- **Backend:**
  - Express.js
  - Drizzle ORM
  - PostgreSQL

- **Development Tools:**
  - Vite
  - TypeScript
  - ESLint
  - npm

## Common Tasks

### Adding a New Player

1. Navigate to the Players page
2. Click the "Add Player" button
3. Enter player details in the form
4. Submit the form to create the player

### Recording a Match

1. Click the floating action button or navigate to the record match page
2. Select the date of the match
3. Choose players for each team
4. Enter the number of games won by each team
5. Submit the form to record the match

### Viewing Performance Trends

1. Navigate to the Dashboard
2. The performance trend chart is displayed at the top
3. Use the toggle controls to switch between metrics and time ranges
4. Hover over data points to see detailed information

### Exporting Analytics

1. Navigate to the Dashboard
2. Click "Share as Image" button
3. The dashboard will be converted to an image and downloaded

## Troubleshooting

### Database Connection Issues

- Verify the DATABASE_URL environment variable is correct
- Ensure PostgreSQL is running
- Check network connectivity to the database server

### API Errors

- Examine the server logs for error details
- Verify API request parameters
- Ensure database schema is up to date

### Frontend Development

- Clear browser cache if changes aren't reflected
- Check browser console for JavaScript errors
- Verify that API requests are returning expected data

## Further Resources

- [Architecture Overview](./architecture.md)
- [Database Schema](./database-schema.md)
- [API References](./api-references.md)
- [Component Library](./component-library.md)
- [Feature Specifications](./feature-specs.md)
