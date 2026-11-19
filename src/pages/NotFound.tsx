import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Seo from "@/components/seo/Seo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <Seo path="/404" title="Page not found — ImageAlchemy" description="Find the free image compressor or browse the image optimization guides." noindex />
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground">404 — Page not found</h1>
          <p className="mb-4 text-xl text-muted-foreground">This page doesn't exist or has moved.</p>
          <a href="/" className="text-primary underline hover:text-primary/90">
            Return to ImageAlchemy home
          </a>
        </div>
      </main>
    </>
  );
};

export default NotFound;
