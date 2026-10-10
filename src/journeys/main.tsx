import "@fontsource-variable/newsreader/opsz.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-500.css";
import "@fontsource/public-sans/latin-400.css";
import "@fontsource/public-sans/latin-500.css";
import "@fontsource/public-sans/latin-600.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { JourneysApp } from "./JourneysApp";
import "./journeys.css";

const root = document.getElementById("root");
if (!root) throw new Error("The page has no #root element");

createRoot(root).render(
  <StrictMode>
    <JourneysApp />
  </StrictMode>,
);
