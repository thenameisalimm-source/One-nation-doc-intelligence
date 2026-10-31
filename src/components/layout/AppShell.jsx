import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import TopBar from "./TopBar.jsx";
import BottomNav from "./BottomNav.jsx";
import DemoBanner from "../shared/DemoBanner.jsx";
import ErrorBoundary from "../shared/ErrorBoundary.jsx";

function PageLoading() {
  return (
    <div className="stack" aria-busy="true" aria-label="Loading page">
      <div className="skeleton" style={{ height: 32, width: "55%" }} />
      <div className="skeleton" style={{ height: 120 }} />
      <div className="skeleton" style={{ height: 120 }} />
    </div>
  );
}

export default function AppShell() {
  const { pathname } = useLocation();

  return (
    <div className="app">
      <Sidebar />
      <div className="app-main">
        <TopBar />
        <DemoBanner />
        <main className="app-content" id="main">
          <div className="page fade-up" key={pathname}>
            <ErrorBoundary key={pathname}>
              <Suspense fallback={<PageLoading />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
