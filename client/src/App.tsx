import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { SheetProvider, useSheet } from "@/lib/sheet-context";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Analyze from "@/pages/analyze";
import Dashboards from "@/pages/dashboards";
import Projects from "@/pages/projects";

function Router() {
  const { user } = useSheet();

  return (
    <Switch>
      <Route path="/">
        {user ? <Redirect to="/projects" /> : <Home />}
      </Route>
      <Route path="/projects" component={Projects} />
      <Route path="/analyze" component={Analyze} />
      <Route path="/dashboards" component={Dashboards} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SheetProvider>
        <Router />
        <Toaster />
      </SheetProvider>
    </QueryClientProvider>
  );
}

export default App;
