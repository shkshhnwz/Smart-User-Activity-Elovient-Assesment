import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import SimulatorPage from "./pages/SimulatorPage";
import StatsPage from "./pages/StatsPage";
import SuspiciousPage from "./pages/SuspiciousPage";
import "./App.css";

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/simulator" element={<SimulatorPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/suspicious" element={<SuspiciousPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
