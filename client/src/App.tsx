import { Switch, Route } from "wouter";
import { Navbar } from "@/components/Navbar";
import Dashboard from "@/pages/Dashboard";
import Players from "@/pages/Players";
import RecordMatch from "@/pages/RecordMatch";

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/players" component={Players} />
          <Route path="/record" component={RecordMatch} />
        </Switch>
      </main>
    </div>
  );
}

export default App;
