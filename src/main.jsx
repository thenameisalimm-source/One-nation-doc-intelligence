import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { StatusProvider } from "./hooks/useStatus.jsx";
import { ToastProvider } from "./components/ui/Toast.jsx";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/animations.css";
import "./styles/layout.css";
import "./styles/ui.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <StatusProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </StatusProvider>
    </BrowserRouter>
  </React.StrictMode>
);
