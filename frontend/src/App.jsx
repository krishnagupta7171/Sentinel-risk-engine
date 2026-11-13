
import { useEffect, useState } from "react";

import {
  checkApiHealth,
  getOverviewAnalytics,
  getFraudAnalytics,
} from "./services/api.js";

import FraudPrediction from "./components/FraudPrediction";
import Transactions from "./components/Transactions";
import ModelPerformance from "./components/ModelPerformance";
import APIMonitoring from "./components/APIMonitoring";

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
  Menu,
  IndianRupee,
  Calculator,
  TrendingUp,
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

  const [fraudAnalytics, setFraudAnalytics] = useState({
    total_predictions: 0,
    fraud_transactions: 0,
    legitimate_transactions: 0,
    fraud_amount: 0,
    average_fraud_probability: 0,
    fraud_rate: 0,
    legitimate_rate: 0,
  });

  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");

  const [fraudLoading, setFraudLoading] = useState(true);
  const [fraudError, setFraudError] = useState("");

  // Check API health
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

  // Fetch transaction analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setAnalyticsLoading(true);
        setAnalyticsError("");

        const data = await getOverviewAnalytics();
        setAnalytics(data);
      } catch (error) {
        setAnalyticsError(
          error.message || "Unable to load transaction analytics."
        );
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Fetch fraud analytics
  useEffect(() => {
    const fetchFraudAnalytics = async () => {
      try {
        setFraudLoading(true);
        setFraudError("");

        const data = await getFraudAnalytics();
        setFraudAnalytics(data);
      } catch (error) {
        setFraudError(
          error.message || "Unable to load fraud analytics."
        );
      } finally {
        setFraudLoading(false);
      }
    };

    fetchFraudAnalytics();
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount || 0);

  const formatPercentage = (value) =>
    `${Number(value || 0).toFixed(2)}%`;

  const fraudShare =
    fraudAnalytics.total_predictions > 0
      ? (fraudAnalytics.fraud_transactions /
        fraudAnalytics.total_predictions) *
      100
      : 0;

  const legitimateShare =
    fraudAnalytics.total_predictions > 0
      ? (fraudAnalytics.legitimate_transactions /
        fraudAnalytics.total_predictions) *
      100
      : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">

      {/* Sidebar */}
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

      {/* Main Content */}
      <main className="flex-1 min-w-0">

        {/* Header */}
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

        {/* Page Rendering */}
        <section className="p-5 md:p-8">

          {activePage === "Fraud Prediction" ? (
            <FraudPrediction />

          ) : activePage === "Transactions" ? (
            <Transactions />

          ) : activePage === "Model Performance" ? (
            <ModelPerformance />

          ) : activePage === "API Monitoring" ? (
            <APIMonitoring />

          ) : activePage === "Overview" ? (
            <>

              {/* Welcome */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold">
                  Welcome to Sentinel
                </h2>

                <p className="text-slate-400 text-sm mt-2">
                  Monitor transactions, detect suspicious activity, and
                  analyze model performance.
                </p>
              </div>

              {/* Transaction Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

                <MetricCard
                  title="Total Transactions"
                  value={
                    analyticsLoading
                      ? "..."
                      : Number(analytics.total_transactions || 0).toLocaleString("en-IN")
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
                <ErrorMessage message={analyticsError} />
              )}

              {/* Fraud Analytics Heading */}
              <div className="mt-10 mb-5">
                <h3 className="text-xl font-bold">
                  Fraud Detection Overview
                </h3>

                <p className="text-sm text-slate-400 mt-1">
                  Analytics based on stored model predictions
                </p>
              </div>

              {fraudError && (
                <ErrorMessage message={fraudError} />
              )}

              {/* Fraud Analytics KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

                <MetricCard
                  title="Total Predictions"
                  value={
                    fraudLoading
                      ? "..."
                      : Number(fraudAnalytics.total_predictions || 0).toLocaleString("en-IN")
                  }
                  subtitle="Transactions with saved predictions"
                  icon={TrendingUp}
                  color="blue"
                />

                <MetricCard
                  title="Fraud Transactions"
                  value={
                    fraudLoading
                      ? "..."
                      : Number(fraudAnalytics.fraud_transactions || 0).toLocaleString("en-IN")
                  }
                  subtitle="Classified as fraudulent"
                  icon={ShieldAlert}
                  color="red"
                />

                <MetricCard
                  title="Legitimate Transactions"
                  value={
                    fraudLoading
                      ? "..."
                      : Number(fraudAnalytics.legitimate_transactions || 0).toLocaleString("en-IN")
                  }
                  subtitle="Classified as legitimate"
                  icon={ShieldCheck}
                  color="green"
                />

                <MetricCard
                  title="Fraud Detection Rate"
                  value={
                    fraudLoading
                      ? "..."
                      : formatPercentage(fraudAnalytics.fraud_rate)
                  }
                  subtitle="Share classified as fraud"
                  icon={Activity}
                  color="purple"
                />

              </div>

              {/* Fraud Analytics Chart and Model Information */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-8">

                <div className="xl:col-span-2 rounded-xl border border-slate-800 bg-slate-900 p-6">

                  <h3 className="font-semibold text-lg">
                    Fraud Analytics
                  </h3>

                  <p className="text-sm text-slate-400 mt-1">
                    Fraud and legitimate prediction distribution
                  </p>

                  {fraudLoading ? (
                    <div className="h-64 flex items-center justify-center text-slate-400">
                      Loading fraud analytics...
                    </div>
                  ) : fraudError ? (
                    <div className="h-64 flex items-center justify-center text-sm text-red-400">
                      Unable to load fraud analytics
                    </div>
                  ) : fraudAnalytics.total_predictions === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                      <Activity size={38} className="mb-3" />
                      <p className="text-sm">
                        No prediction data available yet
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center py-8">

                      {/* Donut Chart */}
                      <div className="flex justify-center">
                        <div
                          className="relative h-48 w-48 rounded-full flex items-center justify-center"
                          style={{
                            background: `conic-gradient(
                              #ef4444 0% ${fraudShare}%,
                              #22c55e ${fraudShare}% 100%
                            )`,
                          }}
                        >
                          <div className="h-32 w-32 rounded-full bg-slate-900 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold">
                              {formatPercentage(fraudShare)}
                            </span>

                            <span className="text-xs text-slate-400">
                              Fraud rate
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Fraud and Legitimate Distribution */}
                      <div className="space-y-6">

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <span className="h-3 w-3 rounded-full bg-red-500" />
                              <span className="text-sm text-slate-300">
                                Fraud
                              </span>
                            </div>

                            <span className="font-semibold">
                              {fraudAnalytics.fraud_transactions}
                            </span>
                          </div>

                          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-red-500 rounded-full"
                              style={{ width: `${fraudShare}%` }}
                            />
                          </div>

                          <p className="text-xs text-slate-500 mt-1">
                            {formatPercentage(fraudShare)}
                          </p>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <span className="h-3 w-3 rounded-full bg-green-500" />
                              <span className="text-sm text-slate-300">
                                Legitimate
                              </span>
                            </div>

                            <span className="font-semibold">
                              {fraudAnalytics.legitimate_transactions}
                            </span>
                          </div>

                          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${legitimateShare}%` }}
                            />
                          </div>

                          <p className="text-xs text-slate-500 mt-1">
                            {formatPercentage(legitimateShare)}
                          </p>
                        </div>

                        <div className="border-t border-slate-800 pt-4">
                          <p className="text-xs text-slate-500">
                            Total predictions analyzed
                          </p>

                          <p className="text-xl font-bold mt-1">
                            {fraudAnalytics.total_predictions}
                          </p>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* Fraud Analytics Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800 pt-5">

                    <div>
                      <p className="text-xs text-slate-500">
                        Fraud Transaction Amount
                      </p>

                      <p className="text-lg font-semibold text-red-400 mt-1">
                        {fraudLoading
                          ? "..."
                          : formatCurrency(fraudAnalytics.fraud_amount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Average Fraud Probability
                      </p>

                      <p className="text-lg font-semibold text-blue-400 mt-1">
                        {fraudLoading
                          ? "..."
                          : `${(
                            Number(fraudAnalytics.average_fraud_probability || 0) * 100
                          ).toFixed(2)}%`}
                      </p>
                    </div>

                  </div>
                </div>

                {/* Model Information */}
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

// Reusable Metric Card
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

      <h3 className="text-2xl font-bold mt-5 break-words">
        {value}
      </h3>

      <p className="text-xs text-slate-500 mt-2">
        {subtitle}
      </p>

    </div>
  );
}

// Reusable Information Row
function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-200">{value}</span>
    </div>
  );
}

// Reusable Error Message
function ErrorMessage({ message }) {
  return (
    <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
      {message}
    </div>
  );
}

export default App;
