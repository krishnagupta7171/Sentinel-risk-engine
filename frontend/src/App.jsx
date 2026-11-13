
import { useEffect, useState } from "react";

import {
  checkApiHealth,
  getOverviewAnalytics,
} from "./services/api.js";

import FraudPrediction from "./components/FraudPrediction";
import Transactions from "./components/Transactions";

import {
  LayoutDashboard,
  ShieldAlert,
  Activity,
  History,
  BrainCircuit,
  Settings,
  Bell,
  Search,
  ShieldCheck,
  TrendingUp,
  Menu,
  IndianRupee,
  Calculator,
} from "lucide-react";

const navigation = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Fraud Prediction", icon: ShieldAlert },
  { name: "Transactions", icon: History },
  { name: "Model Performance", icon: BrainCircuit },
  { name: "API Monitoring", icon: Activity },
];

function App() {
  const [activePage, setActivePage] = useState("Overview");

  const [apiStatus, setApiStatus] = useState("Checking...");
  const [apiVersion, setApiVersion] = useState("");

  const [analytics, setAnalytics] = useState({
    total_transactions: 0,
    total_amount: 0,
    average_amount: 0,
  });

  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await checkApiHealth();

        setApiStatus(
          data.status === "healthy" ? "Healthy" : "Unhealthy"
        );

        setApiVersion(data.version || "");
      } catch {
        setApiStatus("Offline");
        setApiVersion("");
      }
    };

    fetchHealth();
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setAnalyticsLoading(true);
        setAnalyticsError("");

        const data = await getOverviewAnalytics();

        setAnalytics(data);
      } catch (error) {
        setAnalyticsError(
          error.message || "Unable to load analytics."
        );
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount || 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">

      <aside className="hidden md:flex w-64 flex-col border-r border-slate-800 bg-slate-900/70 p-5">

        <div className="flex items-center gap-3 mb-10">
          <div className="rounded-xl bg-blue-600 p-2">
            <ShieldCheck size={25} />
          </div>

          <div>
            <h1 className="font-bold text-lg">Sentinel</h1>
            <p className="text-xs text-slate-400">
              Risk Engine
            </p>
          </div>
        </div>

        <p className="text-xs uppercase tracking-wider text-slate-500 mb-4">
          Main Menu
        </p>

        <nav className="space-y-2">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => setActivePage(item.name)}
              className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${activePage === item.name
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
            >
              <item.icon size={19} />
              {item.name}
            </button>
          ))}
        </nav>

        <div className="mt-auto">
          <button className="flex items-center gap-3 px-4 py-3 text-sm text-slate-400 hover:text-white">
            <Settings size={19} />
            Settings
          </button>

          <div className="border-t border-slate-800 mt-4 pt-4 text-xs text-slate-500">
            Sentinel Risk Engine v1.0
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">

        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-5 md:px-8">

          <div className="flex items-center gap-3">
            <Menu className="md:hidden" size={21} />

            <div>
              <h2 className="font-semibold">
                {activePage === "Overview"
                  ? "Overview Dashboard"
                  : activePage}
              </h2>

              <p className="text-xs text-slate-500">
                Fraud detection and risk analytics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-white">
              <Search size={19} />
            </button>

            <button className="text-slate-400 hover:text-white">
              <Bell size={19} />
            </button>

            <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center font-semibold">
              S
            </div>
          </div>
        </header>

        <section className="p-5 md:p-8">

          {activePage === "Fraud Prediction" ? (
            <FraudPrediction />

          ) : activePage === "Transactions" ? (
            <Transactions />

          ) : activePage === "Overview" ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold">
                  Welcome to Sentinel
                </h2>

                <p className="text-slate-400 text-sm mt-2">
                  Monitor transactions, detect suspicious activity, and
                  analyze model performance.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

                <MetricCard
                  title="Total Transactions"
                  value={
                    analyticsLoading
                      ? "..."
                      : analytics.total_transactions.toLocaleString("en-IN")
                  }
                  subtitle="Records stored in SQLite"
                  icon={History}
                  color="blue"
                />

                <MetricCard
                  title="Total Transaction Amount"
                  value={
                    analyticsLoading
                      ? "..."
                      : formatCurrency(analytics.total_amount)
                  }
                  subtitle="Combined transaction value"
                  icon={IndianRupee}
                  color="green"
                />

                <MetricCard
                  title="Average Transaction Amount"
                  value={
                    analyticsLoading
                      ? "..."
                      : formatCurrency(analytics.average_amount)
                  }
                  subtitle="Average value per transaction"
                  icon={Calculator}
                  color="purple"
                />

                <MetricCard
                  title="API Status"
                  value={apiStatus}
                  subtitle={
                    apiVersion
                      ? `Backend version ${apiVersion}`
                      : apiStatus === "Offline"
                        ? "Unable to connect to backend"
                        : "Checking backend connection"
                  }
                  icon={Activity}
                  color="blue"
                />

              </div>

              {analyticsError && (
                <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                  Analytics error: {analyticsError}
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-8">

                <div className="xl:col-span-2 rounded-xl border border-slate-800 bg-slate-900 p-6">

                  <h3 className="font-semibold text-lg">
                    Fraud Analytics
                  </h3>

                  <p className="text-sm text-slate-400 mt-1">
                    Transaction analytics will appear here once
                    prediction results are stored in the database.
                  </p>

                  <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                    <Activity size={38} className="mb-3" />

                    <p className="text-sm">
                      Fraud analytics not yet available
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

                  <h3 className="font-semibold text-lg">
                    Model Information
                  </h3>

                  <div className="mt-6 space-y-5">
                    <InfoRow label="Algorithm" value="LightGBM" />
                    <InfoRow label="Decision Threshold" value="0.96" />
                    <InfoRow label="Test PR-AUC" value="0.882989" />
                    <InfoRow label="Test ROC-AUC" value="0.997122" />
                    <InfoRow label="Test F1 Score" value="0.802265" />
                  </div>

                  <div className="mt-7 rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">

                    <p className="text-sm text-blue-400 font-medium">
                      Model Configuration
                    </p>

                    <p className="text-xs text-slate-400 mt-2">
                      LightGBM fraud classification model with a
                      0.96 operating threshold.
                    </p>
                  </div>
                </div>

              </div>
            </>

          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-8">

              <h2 className="text-xl font-semibold">
                {activePage}
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                This section is under development.
              </p>

            </div>
          )}

        </section>
      </main>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}) {
  const colors = {
    blue: "text-blue-400 bg-blue-500/10",
    red: "text-red-400 bg-red-500/10",
    green: "text-green-400 bg-green-500/10",
    purple: "text-purple-400 bg-purple-500/10",
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">

      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-400">
          {title}
        </p>

        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon size={20} />
        </div>
      </div>

      <h3 className="text-2xl font-bold mt-5">
        {value}
      </h3>

      <p className="text-xs text-slate-500 mt-2">
        {subtitle}
      </p>

    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-200">{value}</span>
    </div>
  );
}

export default App;
