import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Play, BarChart3, ShieldAlert, CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Welcome, {user?.name || "User"}</h1>
        <p className="subtitle">
          Smart User Activity Tracker System Dashboard & Rule Monitor
        </p>
      </div>

      <div className="grid-3">
        <div className="card">
          <div className="card-icon blue">
            <Play size={24} />
          </div>
          <h3>Activity Simulator</h3>
          <p>
            Simulate user actions (click, view, custom), test custom 10s rate
            limiting, and verify replay protection.
          </p>
          <Link to="/simulator" className="btn btn-outline mt-3">
            Open Simulator
          </Link>
        </div>

        <div className="card">
          <div className="card-icon green">
            <BarChart3 size={24} />
          </div>
          <h3>Live Analytics</h3>
          <p>
            View real-time statistics auto-refreshing every 5 seconds, including
            total actions, most common actions, and minute-by-minute breakdown.
          </p>
          <Link to="/stats" className="btn btn-outline mt-3">
            View Analytics
          </Link>
        </div>

        <div className="card">
          <div className="card-icon amber">
            <ShieldAlert size={24} />
          </div>
          <h3>Suspicious Users</h3>
          <p>
            Inspect users flagged for high frequency (&gt; 20 actions/min) or
            multiple IPs (&gt; 2 IPs in 5 mins).
          </p>
          <Link to="/suspicious" className="btn btn-outline mt-3">
            View Flagged Users
          </Link>
        </div>
      </div>

      <div className="card mt-4">
        <h3>System Rules & Enforcement</h3>
        <div className="rules-list mt-3">
          <div className="rule-item">
            <Zap size={20} className="rule-icon" />
            <div>
              <strong>Rate Limit Rule:</strong> Max 5 actions per 10 seconds per
              user. Returns HTTP 429 when exceeded.
            </div>
          </div>
          <div className="rule-item">
            <ShieldCheck size={20} className="rule-icon" />
            <div>
              <strong>Replay Protection Rule 1:</strong> Rejects identical actions
              submitted within 3 seconds.
            </div>
          </div>
          <div className="rule-item">
            <ShieldCheck size={20} className="rule-icon" />
            <div>
              <strong>Replay Protection Rule 2:</strong> Rejects actions if client
              timestamp drifts &gt; 30 seconds from server time.
            </div>
          </div>
          <div className="rule-item">
            <CheckCircle2 size={20} className="rule-icon" />
            <div>
              <strong>Zero External Libraries:</strong> All rate limiting and
              analytics calculations are custom built on native MongoDB
              aggregations.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
