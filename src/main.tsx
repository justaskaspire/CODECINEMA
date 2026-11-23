import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css";

if ("serviceWorker" in navigator) {\n  window.addEventListener("load", () => {\n    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((error) => {\n      console.warn("CODECINEMA offline support could not start:", error);\n    });\n  });\n}\n\nReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><App /></React.StrictMode>,
);
