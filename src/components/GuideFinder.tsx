import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BookOpen, Search } from "lucide-react";
import { GUIDE_CARDS } from "../content/data/hub-learn";

export default function GuideFinder() {
  const { search } = useLocation();
  const [query, setQuery] = useState(() => new URLSearchParams(search).get("q") ?? "");
  const terms = query.trim().toLowerCase().split(/\s+/);
  const guides = GUIDE_CARDS.filter(card => terms.every(term =>
    (card.title + " " + card.desc + " " + card.path).toLowerCase().includes(term)
  ));
  return <div className="guide-finder">
    <label htmlFor="guide-search">Find a guide</label>
    <div className="guide-search"><Search size={18} aria-hidden="true" />
      <input id="guide-search" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Try WebP, quality or responsive images" />
    </div>
    <p role="status">{guides.length} {guides.length === 1 ? "guide" : "guides"}{query.trim() ? " found" : ""}</p>
    {guides.length > 0 ? <ul>{guides.map(card => <li key={card.path}>
      <Link to={card.path}><BookOpen size={18} aria-hidden="true" /><span><strong>{card.title}</strong><small>{card.desc}</small></span></Link>
    </li>)}</ul> : <button type="button" onClick={() => setQuery("")}>Show all guides</button>}
  </div>;
}
