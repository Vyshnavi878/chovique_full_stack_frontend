import ReactDOM from "react-dom/client";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";

import App from "./App";
import { AppProvider } from "./providers";

const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();

if (!clientId || clientId.includes("your_google_client_id")) {
  console.error("[Chovique] VITE_GOOGLE_CLIENT_ID is missing or invalid. Google Sign-In will not work.");
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    {clientId && !clientId.includes("your_google_client_id") ? (
      <GoogleOAuthProvider clientId={clientId}>
        <AppProvider>
          <App />
        </AppProvider>
      </GoogleOAuthProvider>
    ) : (
      <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h2>System Configuration Error</h2>
        <p>The application is missing the required Google Client ID configuration.</p>
        <p>Please check your environment variables.</p>
      </div>
    )}
  </StrictMode>
);