import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";

// Lazy load route components
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Players = lazy(() => import("@/pages/Players"));
const RecordMatch = lazy(() => import("@/pages/RecordMatch"));

// Loading fallback component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

// Route-level error boundary component
function RouteErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <ErrorBoundary>
        <Navbar />
      </ErrorBoundary>

      <main className="container mx-auto px-4 py-8">
        <Switch>
          <Route path="/">
            <RouteErrorBoundary>
              <Dashboard />
            </RouteErrorBoundary>
          </Route>
          <Route path="/players">
            <RouteErrorBoundary>
              <Players />
            </RouteErrorBoundary>
          </Route>
          <Route path="/record">
            <RouteErrorBoundary>
              <RecordMatch />
            </RouteErrorBoundary>
          </Route>
        </Switch>
      </main>
    </div>
  );
}