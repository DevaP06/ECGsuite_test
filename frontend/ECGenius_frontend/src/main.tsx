import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PostHogProvider } from "posthog-js/react";
import "./index.css";
import App from "./App";

const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined;
const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined;

const root = createRoot(document.getElementById("root")!);

// PostHog is optional — if the key is not configured the app renders normally
// without analytics. This prevents a silent no-op that masks missing env vars.
if (posthogKey && posthogHost) {
  root.render(
    <StrictMode>
      <PostHogProvider
        apiKey={posthogKey}
        options={{
          api_host: posthogHost,
          capture_exceptions: true,
          debug: import.meta.env.MODE === "development",
        }}
      >
        <App />
      </PostHogProvider>
    </StrictMode>
  );
} else {
  if (import.meta.env.MODE === "development" && !posthogKey) {
    console.info("[ECGenius] PostHog not configured — set VITE_PUBLIC_POSTHOG_KEY to enable analytics");
  }
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
