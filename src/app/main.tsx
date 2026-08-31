import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";

import App from "./App";

const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();

if (!clientId) {
  console.error(
    "[Chovique] VITE_GOOGLE_CLIENT_ID is missing."
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={clientId}>
    <App />
  </GoogleOAuthProvider>
);