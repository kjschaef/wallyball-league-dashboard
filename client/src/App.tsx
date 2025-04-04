import { Switch, Route } from "wouter";
import { Navbar } from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import GameHistory from "./pages/GameHistory";
import Results from "./pages/Results";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
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

