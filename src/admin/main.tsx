import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Admin } from "./Admin";
import "../index.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <Admin />
  </StrictMode>,
);
