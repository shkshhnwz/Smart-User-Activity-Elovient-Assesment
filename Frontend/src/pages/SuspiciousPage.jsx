import { useState, useEffect } from "react";
import { getSuspiciousActivityApi } from "../api";
import { ShieldAlert, RefreshCw, AlertCircle, CheckCircle, Info } from "lucide-react";

export default function SuspiciousPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchSuspiciousUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getSuspiciousActivityApi();
      setUsers(Array.isArray(data) ? data : data?.data || []);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message || "Failed to load suspicious users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuspiciousUsers();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1>Suspicious Activity Detection</h1>
          <p className="subtitle">
            Monitors real-time security breaches and malicious activity patterns
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={fetchSuspiciousUsers}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Detection Criteria Alert */}
      <div className="alert alert-info mt-3">
        <Info size={18} />
        <div>
          <strong>Detection Criteria:</strong>
          <ul className="mb-0 mt-1 pl-3">
            <li>
              <strong>High Frequency:</strong> Sent more than 20 actions within 1
              minute.
            </li>
            <li>
              <strong>Multiple IPs:</strong> Used more than 2 distinct IP
              addresses within 5 minutes.
            </li>
          </ul>
        </div>
      </div>

      {lastRefreshed && (
        <div className="last-updated-row mt-2">
          <span>Checked at: {lastRefreshed}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error mt-3">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading && users.length === 0 ? (
        <div className="loading-card mt-4">
          <RefreshCw size={24} className="spin" />
          <p>Scanning for suspicious patterns...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="card empty-card mt-4">
          <CheckCircle size={36} className="text-success" />
          <h3>All Clear!</h3>
          <p className="text-muted">
            No users have triggered high-frequency or multi-IP security thresholds.
          </p>
          <p className="hint mt-2">
            Tip: You can use the <strong>Simulator</strong> to rapidly trigger
            &gt; 20 actions or enter different simulated IPs to test detection.
          </p>
        </div>
      ) : (
        <div className="card mt-4">
          <div className="card-title-row">
            <ShieldAlert size={20} className="icon-red" />
            <h3>Flagged Users ({users.length})</h3>
          </div>

          <div className="table-responsive mt-3">
            <table className="simple-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Flagged Reason</th>
                  <th>Metric Count</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item, index) => {
                  const isBoth = item.reason?.includes("Multiple IPs") && item.reason?.includes("High frequency");
                  const isHighFreq = item.reason?.includes("High frequency");

                  return (
                    <tr key={item.userId || index}>
                      <td>
                        <code>{item.userId}</code>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            isBoth
                              ? "badge-error"
                              : isHighFreq
                              ? "badge-warning"
                              : "badge-blue"
                          }`}
                        >
                          {item.reason}
                        </span>
                      </td>
                      <td>
                        <strong>{item.count}</strong>{" "}
                        <span className="text-muted">
                          {isHighFreq ? "actions" : "distinct IPs"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`tag ${
                            isBoth
                              ? "tag-danger"
                              : "tag-warning"
                          }`}
                        >
                          {isBoth ? "CRITICAL" : "SUSPICIOUS"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
