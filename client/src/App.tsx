import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { SheetProvider, useSheet } from "@/lib/sheet-context";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Analyze from "@/pages/analyze";
import Dashboards from "@/pages/dashboards";
import GlobalDashboard from "@/pages/global-dashboard";
import Projects from "@/pages/projects";
import Admin from "@/pages/admin";

function Router() {
  const { user } = useSheet();

  return (
    <Switch>
      <Route path="/">
        {user ? <Redirect to="/projects" /> : <Home />}
      </Route>
      <Route path="/projects" component={Projects} />
      <Route path="/admin" component={Admin} />

      {/* New Routes */}
      <Route path="/projects/:projectId/charts/new" component={Analyze} />
      <Route path="/projects/:projectId/charts/:chartId" component={Analyze} />
      <Route path="/projects/:projectId/dashboards" component={Dashboards} />
      <Route path="/dashboard-global" component={GlobalDashboard} />

      {/* Legacy routes - redirect or keep for now */}
      <Route path="/analyze">
        <Redirect to="/projects" />
      </Route>
      <Route path="/dashboards">
        <Redirect to="/projects" />
      </Route>
      
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
