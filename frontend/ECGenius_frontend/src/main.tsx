import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { PostHogProvider } from 'posthog-js/react';

import "./index.css";
import App from "./App";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
      options={{
        api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
        capture_exceptions: true, // This enables capturing exceptions using Error Tracking
        debug: import.meta.env.MODE === "development",
      }}
    >
      <App />
    </PostHogProvider>
  </StrictMode>
);
