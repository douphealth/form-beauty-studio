import { CREATOR_SITES } from "@/content/creator-sites";
import { Link } from "react-router-dom";
import { NAV_GROUPS } from "../seo/site";

export default function SiteFooter() {
  return (
    <footer className="studio-footer">
      <div className="studio-footer-inner">
        <div className="footer-grid">
          <div>
            <Link className="studio-brand" to="/">
              <img src="/brand-mark.svg" width={30} height={30} alt="" />
              ImageAlchemy
            </Link>
            <p>Private image compression in your browser.</p>
            <Link to="/pro">Website image audit</Link>
          </div>
          {NAV_GROUPS.map((group) => (
            <nav aria-label={group.label} key={group.label}>
              <h3>{group.label}</h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item.path}>
                    <Link to={item.path}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <details className="publisher-links">
          <summary>Publisher portfolio</summary>
          <ul>
            {CREATOR_SITES.map((site) => (
              <li key={site.url}>
                <a href={site.url}>{site.name}</a>
              </li>
            ))}
          </ul>
        </details>
        <p className="footer-colophon">
          © {new Date().getFullYear()} ImageAlchemy ·{" "}
          <a href="#root">Back to top</a>
        </p>
      </div>
    </footer>
  );
}
