import { NavLink } from "react-router-dom";
import { ROUTES, GROUP_ORDER } from "../../routes.jsx";
import Icon from "../ui/Icon.jsx";

export default function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="brand">
        <div className="brand-mark">ON</div>
        <div>
          <div className="brand-name">One Nation Doc</div>
          <div className="brand-sub">Intelligence Hub</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {GROUP_ORDER.map((group) => (
          <div key={group} className="nav-group">
            <div className="nav-group-label">{group}</div>
            {ROUTES.filter((r) => r.group === group).map((r) => (
              <NavLink
                key={r.path}
                to={r.path}
                end={r.path === "/"}
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
              >
                <Icon name={r.icon} size={20} />
                <span>{r.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
