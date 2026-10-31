import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { StatusProvider } from "./hooks/useStatus.jsx";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/animations.css";
import "./styles/layout.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <StatusProvider>
        <App />
      </StatusProvider>
    </BrowserRouter>
  </React.StrictMode>
);
