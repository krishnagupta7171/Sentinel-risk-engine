
import { useCallback, useEffect, useState } from "react";
import { Activity, Clock, CheckCircle2, XCircle, BrainCircuit, RefreshCw, Loader2, AlertCircle, Server, Gauge, } from "lucide-react";

import { getMonitoringMetrics } from "../services/api";

function APIMonitoring() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchMetrics = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getMonitoringMetrics();
            setMetrics(data);
        } catch (err) {
            setError(err.message || "Unable to load monitoring metrics.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMetrics();

        const interval = setInterval(fetchMetrics, 5000);

        return () => clearInterval(interval);
    }, [fetchMetrics]);

    const formatUptime = (seconds = 0) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
    };

    const formatNumber = (value) =>
        Number(value || 0).toLocaleString("en-IN");

    const successRate =
        metrics?.total_requests > 0
            ? (metrics.successful_requests / metrics.total_requests) * 100
            : 0;

    const endpointEntries = Object.entries(metrics?.endpoints || {});

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">
                        API Monitoring
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                        Monitor API health, traffic, latency and endpoint activity.
                    </p>
                </div>

                <button
                    onClick={fetchMetrics}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* Loading */}
            {loading && !metrics ? (
                <div className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 p-16 text-slate-400">
                    <Loader2 size={24} className="mr-3 animate-spin text-blue-400" />
                    Loading API metrics...
                </div>
            ) : metrics ? (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

                        <MetricCard
                            title="Total Requests"
                            value={formatNumber(metrics.total_requests)}
                            subtitle="Requests received by API"
                            icon={Activity}
                            color="blue"
                        />

                        <MetricCard
                            title="Successful Requests"
                            value={formatNumber(metrics.successful_requests)}
                            subtitle={`${successRate.toFixed(2)}% success rate`}
                            icon={CheckCircle2}
                            color="green"
                        />

                        <MetricCard
                            title="Failed Requests"
                            value={formatNumber(metrics.failed_requests)}
                            subtitle="Requests with 4xx or 5xx status"
                            icon={XCircle}
                            color="red"
                        />

                        <MetricCard
                            title="Prediction Requests"
                            value={formatNumber(metrics.prediction_requests)}
                            subtitle="Fraud prediction endpoint calls"
                            icon={BrainCircuit}
                            color="purple"
                        />

                    </div>

                    {/* Performance and Uptime */}
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

                        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                            <div className="flex items-center gap-3">
                                <Gauge size={22} className="text-blue-400" />
                                <h3 className="font-semibold text-white">
                                    API Performance
                                </h3>
                            </div>

                            <p className="mt-6 text-4xl font-bold text-white">
                                {Number(metrics.average_response_time_ms || 0).toFixed(2)}
                                <span className="ml-2 text-base font-normal text-slate-400">
                                    ms
                                </span>
                            </p>

                            <p className="mt-2 text-sm text-slate-400">
                                Average response time across all requests
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                            <div className="flex items-center gap-3">
                                <Clock size={22} className="text-purple-400" />
                                <h3 className="font-semibold text-white">
                                    API Uptime
                                </h3>
                            </div>

                            <p className="mt-6 text-3xl font-bold text-white">
                                {formatUptime(metrics.uptime_seconds)}
                            </p>

                            <p className="mt-2 text-sm text-slate-400">
                                Time since the backend started
                            </p>
                        </div>

                    </div>

                    {/* Endpoint Monitoring */}
                    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">

                        <div className="flex items-center gap-3 border-b border-slate-800 p-5">
                            <Server size={21} className="text-blue-400" />
                            <div>
                                <h3 className="font-semibold text-white">
                                    Endpoint Monitoring
                                </h3>
                                <p className="mt-1 text-xs text-slate-400">
                                    Request activity grouped by HTTP method and path
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[650px] text-left text-sm">

                                <thead className="bg-slate-950 text-slate-400">
                                    <tr>
                                        <th className="p-4">Endpoint</th>
                                        <th className="p-4">Requests</th>
                                        <th className="p-4">Errors</th>
                                        <th className="p-4">Avg Response</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-800 text-slate-300">

                                    {endpointEntries.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-slate-500">
                                                No endpoint activity recorded yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        endpointEntries.map(([name, endpoint]) => (
                                            <tr key={name} className="hover:bg-slate-800/50">
                                                <td className="p-4 font-medium text-white">
                                                    {name}
                                                </td>

                                                <td className="p-4">
                                                    {formatNumber(endpoint.requests)}
                                                </td>

                                                <td className="p-4">
                                                    <span className={
                                                        endpoint.errors > 0
                                                            ? "text-red-400"
                                                            : "text-emerald-400"
                                                    }>
                                                        {formatNumber(endpoint.errors)}
                                                    </span>
                                                </td>

                                                <td className="p-4">
                                                    {Number(endpoint.average_response_time_ms || 0).toFixed(2)} ms
                                                </td>
                                            </tr>
                                        ))
                                    )}

                                </tbody>
                            </table>
                        </div>
                    </div>

                    <p className="text-xs text-slate-500">
                        Metrics refresh every 5 seconds. Counts are in-memory
                        and reset when the FastAPI process restarts.
                    </p>
                </>
            ) : null}

        </div>
    );
}

function MetricCard({ title, value, subtitle, icon: Icon, color }) {
    const colors = {
        blue: "text-blue-400 bg-blue-500/10",
        green: "text-emerald-400 bg-emerald-500/10",
        red: "text-red-400 bg-red-500/10",
        purple: "text-purple-400 bg-purple-500/10",
    };

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{title}</p>
                <div className={`rounded-lg p-2 ${colors[color]}`}>
                    <Icon size={20} />
                </div>
            </div>

            <h3 className="mt-5 break-words text-2xl font-bold text-white">
                {value}
            </h3>

            <p className="mt-2 text-xs text-slate-500">
                {subtitle}
            </p>
        </div>
    );
}

export default APIMonitoring;
