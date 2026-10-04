import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";

const Home = lazy(() => import("./pages/Home"));
const ClientPortal = lazy(() => import("./pages/ClientPortal"));
const OperationsCenter = lazy(() => import("./pages/OperationsCenter"));
const AccessControl = lazy(() => import("./pages/AccessControl"));

function ConsoleRoute() {
  return <ControlRoute><Suspense fallback={<RouteLoading />}><Home /></Suspense></ControlRoute>;
}

function OperationsRoute() {
  return <ControlRoute><Suspense fallback={<RouteLoading />}><OperationsCenter /></Suspense></ControlRoute>;
}

function ControlRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <DashboardLayout><RouteLoading /></DashboardLayout>;
  if (!user || !["admin", "operator", "supervisor"].includes(user.role)) return <Redirect to="/portal" />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

function ClientPortalRoute() {
  return (
    <DashboardLayout>
      <Suspense fallback={<RouteLoading />}><ClientPortal /></Suspense>
    </DashboardLayout>
  );
}

function AccessControlRoute() {
  return (
    <DashboardLayout>
      <Suspense fallback={<RouteLoading />}><AccessControl /></Suspense>
    </DashboardLayout>
  );
}

function RouteLoading() {
  return <div className="grid min-h-[70vh] place-items-center text-sm text-muted-foreground">Cargando módulo operativo…</div>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={ConsoleRoute} />
      <Route path="/operations" component={OperationsRoute} />
      <Route path="/portal" component={ClientPortalRoute} />
      <Route path="/access" component={AccessControlRoute} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
