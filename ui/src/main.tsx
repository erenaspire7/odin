import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import WebFont from "webfontloader";
import App from "./app";
import "./index.css";

WebFont.load({
  google: {
    families: ["Poppins:300,400,500,600,700", "Inter:300,400,500,700"], // Example fonts
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
