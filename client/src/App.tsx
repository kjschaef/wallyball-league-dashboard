
import { Switch, Route, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Overview from "./pages/Overview";
import GameHistory from "./pages/GameHistory";
import Statistics from "./pages/Statistics";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function Navigation() {
  return (
    <header className="border-b">
      <nav className="container mx-auto px-4 py-4">
        <ul className="flex gap-4">
          <li>
            <Link href="/">
              <Button variant="ghost">Overview</Button>
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Switch>
            <Route path="/" component={Overview} />
            <Route path="/history" component={GameHistory} />
            <Route path="/statistics" component={Statistics} />
          </Switch>
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}
