import { useState, useEffect, useRef } from "react";
import { logActivityApi, checkReplayApi } from "../api";
import {
  Play,
  Clock,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Send,
  Terminal,
} from "lucide-react";

export default function SimulatorPage() {
  // Activity Logging state
  const [selectedAction, setSelectedAction] = useState("click");
  const [customAction, setCustomAction] = useState("");
  const [metaJson, setMetaJson] = useState('{"page": "/dashboard"}');
  const [simulatedIp, setSimulatedIp] = useState("");

  // Rate Limiting state
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0);
  const [rateLimitMessage, setRateLimitMessage] = useState("");
  const cooldownTimerRef = useRef(null);

  // Replay Protection state
  const [replayAction, setReplayAction] = useState("click");
  const [clockOffsetSeconds, setClockOffsetSeconds] = useState(0);
  const [timeDifferenceMs, setTimeDifferenceMs] = useState(null);
  const [replayMessage, setReplayMessage] = useState(null);

  // General UI states
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  // Handle Rate Limit Countdown timer
  useEffect(() => {
    if (rateLimitCooldown > 0) {
      cooldownTimerRef.current = setInterval(() => {
        setRateLimitCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownTimerRef.current);
            setRateLimitMessage("");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(cooldownTimerRef.current);
  }, [rateLimitCooldown]);

  const addLog = (entry) => {
    setLogs((prev) => [
      {
        id: Date.now() + Math.random(),
        time: new Date().toLocaleTimeString(),
        ...entry,
      },
      ...prev.slice(0, 19),
    ]);
  };

  // Trigger Standard Activity Log
  const handleLogActivity = async (actionToLog) => {
    const action = actionToLog || (selectedAction === "custom" ? customAction : selectedAction);

    if (!action) {
      alert("Please provide an action name");
      return;
    }

    let parsedMeta = {};
    try {
      if (metaJson.trim()) {
        parsedMeta = JSON.parse(metaJson);
      }
    } catch {
      alert("Meta must be valid JSON");
      return;
    }

    setLoading(true);
    const startTime = performance.now();

    try {
      const payload = {
        action,
        meta: parsedMeta,
        ipAddress: simulatedIp.trim() || undefined,
      };

      const res = await logActivityApi(payload);
      const latency = Math.round(performance.now() - startTime);

      addLog({
        type: "LOG",
        action,
        status: 200,
        latency,
        data: res,
      });
    } catch (err) {
      const latency = Math.round(performance.now() - startTime);

      if (err.status === 429) {
        setRateLimitCooldown(10);
        setRateLimitMessage(
          "Rate limit exceeded (5 actions / 10s). Buttons locked for 10 seconds."
        );
      }

      addLog({
        type: "LOG",
        action,
        status: err.status || 500,
        latency,
        error: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Trigger Replay Check
  const handleReplayCheck = async (simulateDuplicate = false) => {
    setLoading(true);
    setReplayMessage(null);
    setTimeDifferenceMs(null);

    const clientDate = new Date(Date.now() + clockOffsetSeconds * 1000);
    const clientTimeIso = clientDate.toISOString();

    const sendRequest = async () => {
      const startTime = performance.now();
      try {
        const payload = {
          action: replayAction,
          clientTime: clientTimeIso,
          ipAddress: simulatedIp.trim() || undefined,
        };

        const res = await checkReplayApi(payload);
        const latency = Math.round(performance.now() - startTime);

        if (res.serverTime) {
          const diff = Math.abs(
            new Date(res.serverTime).getTime() - clientDate.getTime()
          );
          setTimeDifferenceMs(diff);
        }

        setReplayMessage({
          success: true,
          text: `Action accepted! Server time: ${new Date(
            res.serverTime
          ).toLocaleTimeString()}`,
        });

        addLog({
          type: "REPLAY",
          action: replayAction,
          status: 200,
          latency,
          data: res,
        });

        return res;
      } catch (err) {
        const latency = Math.round(performance.now() - startTime);

        setReplayMessage({
          success: false,
          text: err.message,
        });

        addLog({
          type: "REPLAY",
          action: replayAction,
          status: err.status || 400,
          latency,
          error: err.message,
        });
      }
    };

    if (simulateDuplicate) {
      // Send first request then immediately send second request to test 3s duplicate rule
      await sendRequest();
      await new Promise((r) => setTimeout(r, 100)); // 100ms apart
      await sendRequest();
    } else {
      await sendRequest();
    }

    setLoading(false);
  };

  const isButtonsDisabled = loading || rateLimitCooldown > 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Activity Simulator & Rule Tester</h1>
        <p className="subtitle">
          Test custom rate limiting (5 actions/10s), IP tracking, and replay
          protection rules.
        </p>
      </div>

      {rateLimitCooldown > 0 && (
        <div className="alert alert-warning">
          <AlertTriangle size={20} />
          <div>
            <strong>Rate Limit Enforced:</strong> {rateLimitMessage}
            <div className="cooldown-timer">
              Cooldown remaining: <strong>{rateLimitCooldown}s</strong>
            </div>
          </div>
        </div>
      )}

      <div className="simulator-grid">
        {/* Left Column: Activity Logging */}
        <div className="card">
          <div className="card-title-row">
            <Play size={20} className="icon-blue" />
            <h3>1. Log Activity (Rate Limit Tester)</h3>
          </div>
          <p className="hint">
            Allowed actions: <code>login</code>, <code>logout</code>,{" "}
            <code>view</code>, <code>click</code>, <code>custom</code>. Max 5
            actions in 10s.
          </p>

          <div className="action-buttons-group mt-3">
            {["click", "view", "login", "logout", "custom"].map((act) => (
              <button
                key={act}
                type="button"
                className={`btn ${
                  selectedAction === act ? "btn-primary" : "btn-outline"
                }`}
                disabled={isButtonsDisabled}
                onClick={() => {
                  setSelectedAction(act);
                  if (act !== "custom") handleLogActivity(act);
                }}
              >
                {act.toUpperCase()}
              </button>
            ))}
          </div>

          {selectedAction === "custom" && (
            <div className="form-group mt-3">
              <label>Custom Action Name</label>
              <div className="input-with-button">
                <input
                  type="text"
                  placeholder="e.g. download_report"
                  value={customAction}
                  onChange={(e) => setCustomAction(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isButtonsDisabled || !customAction}
                  onClick={() => handleLogActivity(customAction)}
                >
                  <Send size={16} />
                  <span>Send</span>
                </button>
              </div>
            </div>
          )}

          <div className="form-group mt-3">
            <label>Meta Object (JSON, optional)</label>
            <textarea
              rows={2}
              value={metaJson}
              onChange={(e) => setMetaJson(e.target.value)}
              placeholder='{"page": "/dashboard"}'
            />
          </div>

          <div className="form-group mt-3">
            <label>
              Simulate Custom IP Address (to test &gt; 2 IPs rule)
            </label>
            <input
              type="text"
              placeholder="e.g. 192.168.1.100 (leave blank for local IP)"
              value={simulatedIp}
              onChange={(e) => setSimulatedIp(e.target.value)}
            />
          </div>

          <div className="mt-3">
            <button
              type="button"
              className="btn btn-secondary btn-block"
              disabled={isButtonsDisabled}
              onClick={() => handleLogActivity()}
            >
              <Send size={16} />
              <span>
                {rateLimitCooldown > 0
                  ? `Locked (${rateLimitCooldown}s)`
                  : `Send "${selectedAction === "custom" ? customAction || "custom" : selectedAction}" Action`}
              </span>
            </button>
          </div>
        </div>

        {/* Right Column: Replay Protection */}
        <div className="card">
          <div className="card-title-row">
            <Clock size={20} className="icon-amber" />
            <h3>2. Replay Protection Tester</h3>
          </div>
          <p className="hint">
            Rejects identical actions within 3 seconds OR client timestamps
            differing by &gt; 30 seconds from server time.
          </p>

          <div className="form-group mt-3">
            <label>Action for Replay Check</label>
            <select
              value={replayAction}
              onChange={(e) => setReplayAction(e.target.value)}
            >
              <option value="click">click</option>
              <option value="view">view</option>
              <option value="login">login</option>
              <option value="custom">custom</option>
            </select>
          </div>

          <div className="form-group mt-3">
            <label>Simulate Clock Skew (Current offset: {clockOffsetSeconds}s)</label>
            <div className="btn-group-row">
              <button
                type="button"
                className={`btn btn-sm ${
                  clockOffsetSeconds === 0 ? "btn-primary" : "btn-outline"
                }`}
                onClick={() => setClockOffsetSeconds(0)}
              >
                0s (Normal)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${
                  clockOffsetSeconds === 45 ? "btn-warning" : "btn-outline"
                }`}
                onClick={() => setClockOffsetSeconds(45)}
              >
                +45s (Rejection &gt; 30s)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${
                  clockOffsetSeconds === -45 ? "btn-warning" : "btn-outline"
                }`}
                onClick={() => setClockOffsetSeconds(-45)}
              >
                -45s (Rejection &gt; 30s)
              </button>
            </div>
          </div>

          <div className="replay-actions mt-4">
            <button
              type="button"
              className="btn btn-outline btn-block mb-2"
              disabled={loading}
              onClick={() => handleReplayCheck(false)}
            >
              <Send size={16} />
              <span>Test Single Replay Check</span>
            </button>

            <button
              type="button"
              className="btn btn-warning btn-block"
              disabled={loading}
              onClick={() => handleReplayCheck(true)}
            >
              <RotateCcw size={16} />
              <span>Test Duplicate Spam (Triggers 3s Rejection)</span>
            </button>
          </div>

          {/* Replay status result */}
          {replayMessage && (
            <div
              className={`alert mt-3 ${
                replayMessage.success ? "alert-success" : "alert-error"
              }`}
            >
              {replayMessage.success ? (
                <CheckCircle size={18} />
              ) : (
                <ShieldAlert size={18} />
              )}
              <span>{replayMessage.text}</span>
            </div>
          )}

          {timeDifferenceMs !== null && (
            <div className="time-skew-badge mt-2">
              <strong>Clock Drift:</strong> {timeDifferenceMs} ms difference
              between clientTime and serverTime
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Console / Live Logs */}
      <div className="card mt-4">
        <div className="card-title-row">
          <Terminal size={20} />
          <h3>Recent Simulator Logs ({logs.length})</h3>
          {logs.length > 0 && (
            <button
              type="button"
              className="btn btn-sm btn-outline ml-auto"
              onClick={() => setLogs([])}
            >
              Clear Logs
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <p className="text-muted mt-2">
            No actions simulated yet. Click any button above to generate activity.
          </p>
        ) : (
          <div className="table-responsive mt-3">
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Action</th>
                  <th>Status</th>
                  <th>Latency</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.time}</td>
                    <td>
                      <span className="badge badge-gray">{log.type}</span>
                    </td>
                    <td>
                      <strong>{log.action}</strong>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          log.status === 200
                            ? "badge-success"
                            : log.status === 429
                            ? "badge-warning"
                            : "badge-error"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td>{log.latency} ms</td>
                    <td className="log-details-cell">
                      {log.error ? (
                        <span className="text-danger">{log.error}</span>
                      ) : (
                        <code>{JSON.stringify(log.data)}</code>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
