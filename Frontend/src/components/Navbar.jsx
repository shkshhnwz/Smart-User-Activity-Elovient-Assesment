import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Activity, BarChart3, ShieldAlert, Play, LogOut, User } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { to: "/", label: "Dashboard", icon: Activity },
    { to: "/simulator", label: "Simulator", icon: Play },
    { to: "/stats", label: "Analytics (5s)", icon: BarChart3 },
    { to: "/suspicious", label: "Suspicious Users", icon: ShieldAlert },
  ];

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="brand">
          <Activity size={22} className="brand-icon" />
          <span className="brand-text">Activity Tracker</span>
        </Link>

        <div className="nav-menu">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`nav-item ${isActive ? "active" : ""}`}
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="nav-user">
          <div className="user-badge">
            <User size={16} />
            <span>{user?.name || user?.email || "User"}</span>
          </div>
          <button onClick={logout} className="btn-logout" title="Logout">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
