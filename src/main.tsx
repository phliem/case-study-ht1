import "@fontsource/hanken-grotesk/latin-500.css";
import "@fontsource/hanken-grotesk/latin-700.css";
import "@fontsource/hanken-grotesk/latin-800.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("The page has no #root element");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
