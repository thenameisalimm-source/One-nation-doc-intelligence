import { Suspense, lazy } from "react";
import { Routes, Route, Link } from "react-router-dom";
import AppShell from "./components/layout/AppShell.jsx";
import PagePlaceholder from "./components/shared/PagePlaceholder.jsx";
import { ROUTES } from "./routes.jsx";

// Loads any page file that exists in src/pages/. Missing pages show a placeholder.
const pageModules = import.meta.glob("./pages/*.jsx");

const pageElements = ROUTES.map((route) => {
  const loader = pageModules[`./pages/${route.file}.jsx`];
  if (!loader) {
    return { route, element: <PagePlaceholder route={route} /> };
  }
  const Page = lazy(loader);
  return { route, element: <Page /> };
});

function NotFound() {
  return (
    <div className="empty-block">
      <h1>Page not found</h1>
      <p className="muted">That address does not match any module.</p>
      <Link to="/" className="btn-link">Back to Overview</Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        {pageElements.map(({ route, element }) => (
          <Route key={route.path} path={route.path} element={element} />
        ))}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
