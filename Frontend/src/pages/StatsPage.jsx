import { useState, useEffect, useRef } from "react";
import { getActivityStatsApi } from "../api";
import {
  BarChart3,
  RefreshCw,
  Activity,
  Flame,
  UserCheck,
  Clock,
  AlertCircle,
} from "lucide-react";

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(5);

  const timerRef = useRef(null);

  const fetchStats = async () => {
    try {
      setError("");
      const data = await getActivityStatsApi();
      setStats(data);
      setLastUpdated(new Date().toLocaleTimeString());
      setCountdown(5);
    } catch (err) {
      setError(err.message || "Failed to load activity statistics");
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh interval (every 5 seconds)
  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (!autoRefresh) {
      clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchStats();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [autoRefresh]);

  // Max value for bar chart height scaling
  const maxMinuteCount = Math.max(
    1,
    ...(stats?.actionsPerMinute?.map((m) => m.count) || [1])
  );

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1>Activity Analytics</h1>
          <p className="subtitle">
            Live analytics aggregated directly via native MongoDB queries
          </p>
        </div>

        <div className="refresh-controls">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>
              Auto-refresh (5s):{" "}
              {autoRefresh ? (
                <strong>{countdown}s</strong>
              ) : (
                <span className="text-muted">Paused</span>
              )}
            </span>
          </label>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={fetchStats}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            <span>Refresh Now</span>
          </button>
        </div>
      </div>

      {lastUpdated && (
        <div className="last-updated-row">
          <Clock size={14} />
          <span>Last updated at: {lastUpdated}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error mt-3">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading && !stats ? (
        <div className="loading-card mt-4">
          <RefreshCw size={24} className="spin" />
          <p>Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* Top 3 KPI Cards */}
          <div className="grid-3 mt-4">
            <div className="stat-card">
              <div className="stat-icon blue">
                <Activity size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Total Actions</span>
                <span className="stat-value">{stats?.totalActions ?? 0}</span>
                <span className="stat-sub">Lifetime logged events</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">
                <Flame size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Most Common Action</span>
                <span className="stat-value action-tag">
                  {stats?.mostCommonAction || "None"}
                </span>
                <span className="stat-sub">Highest frequency action</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon amber">
                <UserCheck size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Most Active User</span>
                <span className="stat-value user-id-small">
                  {stats?.mostActiveUser
                    ? `${stats.mostActiveUser.count} actions`
                    : "None"}
                </span>
                <span className="stat-sub">
                  {stats?.mostActiveUser
                    ? `User ID: ${stats.mostActiveUser.userId}`
                    : "No user activity"}
                </span>
              </div>
            </div>
          </div>

          {/* Actions Per Minute Chart (Last 10 Minutes) */}
          <div className="card mt-4">
            <div className="card-title-row">
              <BarChart3 size={20} className="icon-blue" />
              <h3>Actions Per Minute (Last 10 Minutes)</h3>
            </div>
            <p className="hint">
              Aggregated in real time using MongoDB <code>$dateTrunc</code> and
              zero-filled across the full 10-minute sliding window.
            </p>

            <div className="chart-container mt-4">
              <div className="bar-chart">
                {stats?.actionsPerMinute?.map((item) => {
                  const heightPercent = Math.max(
                    6,
                    Math.round((item.count / maxMinuteCount) * 100)
                  );
                  const timeLabel = new Date(item.minute).toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  );

                  return (
                    <div key={item.minute} className="bar-col">
                      <div className="bar-count">{item.count}</div>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ height: `${heightPercent}%` }}
                          title={`${item.count} actions at ${timeLabel}`}
                        />
                      </div>
                      <div className="bar-label">{timeLabel}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
