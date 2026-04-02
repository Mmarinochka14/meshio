import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./app/router.jsx"; // или как у тебя называется путь
import { AuthModalProvider } from "./components/AuthModalContext.jsx";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthModalProvider>
      <AppRouter />
    </AuthModalProvider>
  </React.StrictMode>,
);
