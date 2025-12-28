import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Analyze from "@/pages/analyze";
import About from "@/pages/about";
import { SheetProvider } from "@/lib/sheet-context";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/analyze" component={Analyze} />
      <Route path="/about" component={About} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SheetProvider>
          <Toaster />
          <Router />
        </SheetProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
