
import { useEffect, useState, useCallback, useMemo } from "react";
import {
    RefreshCw,
    Loader2,
    AlertCircle,
    Search,
    Filter,
} from "lucide-react";
import { getTransactions } from "../services/api";

function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [offset, setOffset] = useState(0);

    const [searchTerm, setSearchTerm] = useState("");
    const [riskFilter, setRiskFilter] = useState("all");

    const limit = 5;

    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getTransactions(limit, offset);
            setTransactions(data.transactions || []);

        } catch (err) {
            setError(err.message || "Unable to load transactions.");
        } finally {
            setLoading(false);
        }
    }, [offset]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const formatAmount = (amount) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
        }).format(amount || 0);

    const formatProbability = (probability) => {
        if (probability === null || probability === undefined) {
            return "N/A";
        }

        return `${(Number(probability) * 100).toFixed(2)}%`;
    };

    const getRiskStatus = (transaction) => {
        if (transaction.is_fraud_prediction === 1) {
            return "Fraud";
        }

        if (transaction.is_fraud_prediction === 0) {
            return "Legitimate";
        }

        return "Not Evaluated";
    };

    const getRiskBadge = (status) => {
        const styles = {
            Fraud: "bg-red-500/10 text-red-400 border-red-500/30",
            Legitimate: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
            "Not Evaluated": "bg-slate-700/50 text-slate-400 border-slate-600",
        };

        return (
            <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${styles[status]
                    }`}
            >
                {status}
            </span>
        );
    };

    // Search and filter the transactions on the current page.
    const filteredTransactions = useMemo(() => {
        return transactions.filter((transaction) => {
            const matchesSearch = String(transaction.trans_num || "")
                .toLowerCase()
                .includes(searchTerm.toLowerCase());

            const status = getRiskStatus(transaction);

            const matchesRisk =
                riskFilter === "all" || status === riskFilter;

            return matchesSearch && matchesRisk;
        });
    }, [transactions, searchTerm, riskFilter]);

    return (
        <div className="space-y-6">

            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">
                        Transactions
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                        Monitor transactions and their fraud risk classifications.
                    </p>
                </div>

                <button
                    onClick={fetchTransactions}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col gap-3 sm:flex-row">

                <div className="relative flex-1">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <input
                        type="text"
                        placeholder="Search by transaction ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                    />
                </div>

                <div className="relative sm:w-56">
                    <Filter
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <select
                        value={riskFilter}
                        onChange={(e) => setRiskFilter(e.target.value)}
                        className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-900 py-3 pl-10 pr-4 text-sm text-slate-300 outline-none focus:border-blue-500"
                    >
                        <option value="all">All Risk Statuses</option>
                        <option value="Fraud">Fraud</option>
                        <option value="Legitimate">Legitimate</option>
                        <option value="Not Evaluated">Not Evaluated</option>
                    </select>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* Transactions Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
                <table className="w-full min-w-[1050px] text-left text-sm">

                    <thead className="border-b border-slate-800 bg-slate-950 text-slate-400">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">Transaction ID</th>
                            <th className="p-4">Card Number</th>
                            <th className="p-4">Date & Time</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Fraud Probability</th>
                            <th className="p-4">Risk Status</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-800 text-slate-300">

                        {loading ? (
                            <tr>
                                <td colSpan="7" className="p-8 text-center">
                                    <Loader2
                                        className="mx-auto animate-spin text-blue-400"
                                        size={24}
                                    />
                                    <p className="mt-2 text-slate-400">
                                        Loading transactions...
                                    </p>
                                </td>
                            </tr>
                        ) : filteredTransactions.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="7"
                                    className="p-8 text-center text-slate-400"
                                >
                                    No matching transactions found.
                                </td>
                            </tr>
                        ) : (
                            filteredTransactions.map((transaction) => {
                                const status = getRiskStatus(transaction);

                                return (
                                    <tr
                                        key={transaction.id}
                                        className="transition hover:bg-slate-800/50"
                                    >
                                        <td className="p-4">
                                            {transaction.id}
                                        </td>

                                        <td className="p-4 font-medium text-white">
                                            {transaction.trans_num || "N/A"}
                                        </td>

                                        <td className="p-4">
                                            {transaction.cc_num
                                                ? `****${String(transaction.cc_num).slice(-4)}`
                                                : "N/A"}
                                        </td>

                                        <td className="p-4 whitespace-nowrap">
                                            {transaction.datetime}
                                        </td>

                                        <td className="p-4 font-medium">
                                            {formatAmount(transaction.amt)}
                                        </td>

                                        <td className="p-4">
                                            <span className={
                                                status === "Fraud"
                                                    ? "text-red-400"
                                                    : status === "Legitimate"
                                                        ? "text-emerald-400"
                                                        : "text-slate-500"
                                            }>
                                                {formatProbability(
                                                    transaction.fraud_probability
                                                )}
                                            </span>
                                        </td>

                                        <td className="p-4">
                                            {getRiskBadge(status)}
                                        </td>
                                    </tr>
                                );
                            })
                        )}

                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">

                <button
                    disabled={offset === 0 || loading}
                    onClick={() =>
                        setOffset((previous) =>
                            Math.max(0, previous - limit)
                        )
                    }
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                >
                    Previous
                </button>

                <span className="text-sm text-slate-400">
                    Page {Math.floor(offset / limit) + 1}
                </span>

                <button
                    disabled={loading || transactions.length < limit}
                    onClick={() =>
                        setOffset((previous) => previous + limit)
                    }
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                >
                    Next
                </button>

            </div>

            <p className="text-xs text-slate-500">
                Search and risk filters apply to the currently loaded page.
            </p>

        </div>
    );
}

export default Transactions;
