import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ROUTES, PRIMARY_PATHS, GROUP_ORDER } from "../../routes.jsx";
import Icon from "../ui/Icon.jsx";

export default function BottomNav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const primary = PRIMARY_PATHS.map((p) => ROUTES.find((r) => r.path === p)).filter(Boolean);
  const moreActive = !PRIMARY_PATHS.includes(pathname);

  // Close the sheet whenever the page changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close with the Escape key.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <nav className="bottomnav" aria-label="Primary">
        {primary.map((r) => (
          <NavLink
            key={r.path}
            to={r.path}
            end={r.path === "/"}
            className={({ isActive }) => "bn-item" + (isActive ? " active" : "")}
          >
            <Icon name={r.icon} size={22} />
            <span>{r.short}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className={"bn-item" + (moreActive ? " active" : "")}
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <Icon name="more" size={22} strokeWidth={3} />
          <span>More</span>
        </button>
      </nav>

      {open && (
        <div className="sheet-backdrop" onClick={() => setOpen(false)}>
          <div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-label="All modules"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-handle" />
            <div className="row-between sheet-head">
              <h2>All modules</h2>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            {GROUP_ORDER.map((group) => (
              <div key={group} className="sheet-group">
                <div className="nav-group-label">{group}</div>
                <div className="sheet-grid">
                  {ROUTES.filter((r) => r.group === group).map((r) => (
                    <NavLink
                      key={r.path}
                      to={r.path}
                      end={r.path === "/"}
                      className={({ isActive }) => "sheet-item" + (isActive ? " active" : "")}
                    >
                      <Icon name={r.icon} size={22} />
                      <span>{r.short}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
