import { Switch, Route } from "wouter";
import Dashboard from "./pages/Dashboard";
import GameHistory from "./pages/GameHistory";
import Results from "./pages/Results";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

function App() {
  return (
    <div className="min-h-screen bg-background">
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
              <Link href="/results">
                <Button variant="ghost">Results & Stats</Button>
              </Link>
            </li>
          </ul>
        </nav>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/history" component={GameHistory} />
          <Route path="/results" component={Results} />
        </Switch>
      </main>
    </div>
  );
}

export default App;

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import App from './App';
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <App />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  </StrictMode>,
);