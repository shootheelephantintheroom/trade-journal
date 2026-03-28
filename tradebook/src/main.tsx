import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import LoginPage from "./components/LoginPage";
import LandingPage from "./components/LandingPage";
import PrivacyPage from "./components/PrivacyPage";
import TermsPage from "./components/TermsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { ToastProvider } from "./components/Toast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-0 text-primary">
      <h1 className="text-4xl font-semibold mb-4">Page not found</h1>
      <Link to="/" className="text-brand hover:text-brand/80 transition-colors">
        Go back home
      </Link>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/app/*"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <SubscriptionProvider>
                      <App />
                    </SubscriptionProvider>
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
