import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";

import App from "./App";

const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();

if (!clientId) {
  console.warn(
    "[Chovique] Missing VITE_GOOGLE_CLIENT_ID in .env file. Google Sign-In will require VITE_GOOGLE_CLIENT_ID to function."
  );
}

// Fallback to a placeholder client ID if not provided, allowing the app to render smoothly without crashing
const effectiveClientId = clientId || "000000000000-placeholder.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={effectiveClientId}>
    <App />
  </GoogleOAuthProvider>
);