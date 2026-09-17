import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <title>Page Not Found — ImageAlchemy</title>
        <meta name="description" content="The page you're looking for doesn't exist. Head back to ImageAlchemy to compress, convert, and optimize images privately in your browser." />
        <meta name="robots" content="noindex,follow" />
        <link rel="canonical" href="https://imagealchemy.app/404" />
        <meta property="og:title" content="Page Not Found — ImageAlchemy" />
        <meta property="og:description" content="The page you're looking for doesn't exist." />
        <meta property="og:url" content="https://imagealchemy.app/404" />
      </Helmet>
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
