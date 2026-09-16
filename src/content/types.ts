import { type ReactNode } from "react";

export interface ContentSection {
  id: string;
  heading: string;
  body: ReactNode[];
}

export interface ContentEntry {
  path: string;
  h1: string;
  lede: ReactNode;
  keywords: string[];
  sections: ContentSection[];
  faqs: { question: string; answer: string }[];
  related: { path: string; label: string }[];
}
