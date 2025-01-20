
import { Switch, Route } from "wouter";
import Overview from "./pages/Overview";
import GameHistory from "./pages/GameHistory";
import Statistics from "./pages/Statistics";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

const queryClient = new QueryClient();

function Navigation() {
  return (
    <header className="border-b">
      <nav className="container mx-auto px-4 py-4">
        <ul className="flex gap-4">
          <li>
            <Link href="/">
              <Button variant="ghost">Wallyball Standings</Button>
            </Link>
          </li>
          <li>
            <Link href="/history">
              <Button variant="ghost">Game History</Button>
            </Link>
          </li>
          <li>
            <Link href="/statistics">
              <Button variant="ghost">Statistics</Button>
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Overview} />
      <Route path="/history" component={GameHistory} />
      <Route path="/statistics" component={Statistics} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <AppRoutes />
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}
