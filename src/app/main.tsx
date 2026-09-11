import ReactDOM from "react-dom/client";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";

import App from "./App";
import { AppProvider } from "./providers";

const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();

const isGoogleAuthEnabled = Boolean(clientId && !clientId.includes("your_google_client_id"));

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(rootElement);

const appTree = (
  <AppProvider>
    <App />
  </AppProvider>
);

root.render(
  <StrictMode>
    {isGoogleAuthEnabled ? (
      <GoogleOAuthProvider clientId={clientId}>
        {appTree}
      </GoogleOAuthProvider>
    ) : (
      appTree
    )}
  </StrictMode>
);