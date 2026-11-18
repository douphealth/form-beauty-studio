import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ALL_ROUTES } from "@/seo/routes";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Pro = lazy(() => import("./pages/Pro"));
const ContentPage = lazy(() => import("./content/ContentPage"));

function SiteRoutes() {
  const { pathname, search, hash } = useLocation();
  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return; }
    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
    document.getElementById(id)?.scrollIntoView();
  }, [pathname, hash]);
  const alias = pathname === "/index.html" ? "/" : pathname.replace(/(?:\/index)?\.html$/, "");
  if (alias !== pathname && ALL_ROUTES.some(route => route.path === alias)) {
    return <Navigate replace to={alias + search + hash} />;
  }
  return <Routes>
    <Route path="/" element={<Index />} />
    {ALL_ROUTES.filter(route => route.standalone).map(route => (
      <Route key={route.path} path={route.path} element={<Pro />} />
    ))}
    {ALL_ROUTES.filter(route => route.path !== "/" && !route.standalone).map(route => (
      <Route key={route.path} path={route.path} element={<ContentPage path={route.path} />} />
    ))}
    <Route path="*" element={<NotFound />} />
  </Routes>;
}

export default function App() {
  return <ErrorBoundary><Toaster /><BrowserRouter>
    <Suspense fallback={<div className="p-8" role="status">Opening ImageAlchemy…</div>}><SiteRoutes /></Suspense>
  </BrowserRouter></ErrorBoundary>;
}
