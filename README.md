# Wallyball League Dashboard

A web application for tracking, analyzing, and visualizing player and team performance in wallyball matches.

## Features

- Record match results with team compositions and scores
- Visualize player performance trends with adjustments for inactivity periods
- Track player achievements and milestones
- Analyze head-to-head statistics and team effectiveness
- Review game history with filtering capabilities
- Player rankings based on win rates and other metrics

## Tech Stack

- **Frontend**: React, Tailwind CSS, shadcn/ui, React Query
- **Backend**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Hosting**: Vercel with Neon PostgreSQL

## Development Setup

1. Clone the repository
   ```
   git clone https://github.com/kjschaef/wallyball-league-dashboard.git
   cd wallyball-league-dashboard
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables
   - Copy `.env.example` to `.env`
   - Update the database connection string

4. Run the development server
   ```
   npm run dev
   ```

## Vercel Deployment with Neon PostgreSQL

This project is configured for deployment on Vercel with Neon PostgreSQL integration.

### Setup Steps

1. Create a Neon PostgreSQL database at [neon.tech](https://neon.tech)
2. Get your database connection string from Neon dashboard
3. Add the following environment variables in Vercel:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string
   - `NODE_ENV`: Set to `production` for production deployments

### Deployment

The project includes a `vercel.json` configuration file that sets up the build and deployment process. When you push to your repository, Vercel will:

1. Install dependencies
2. Run database migrations using Drizzle
3. Build the frontend and backend
4. Deploy the application

## License

MIT
