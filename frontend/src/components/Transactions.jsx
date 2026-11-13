
import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { getTransactions } from "../services/api";

function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [offset, setOffset] = useState(0);

    const limit = 5;

    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getTransactions(limit, offset);
            setTransactions(data.transactions);

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
        }).format(amount);

    return (
        <div className="space-y-6">

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">
                        Transactions
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                        Transactions retrieved from the SQLite database.
                    </p>
                </div>

                <button
                    onClick={fetchTransactions}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-800 bg-slate-950 text-slate-400">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">Transaction ID</th>
                            <th className="p-4">Card Number</th>
                            <th className="p-4">Date & Time</th>
                            <th className="p-4">Amount</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-800 text-slate-300">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="p-8 text-center">
                                    <Loader2
                                        className="mx-auto animate-spin text-blue-400"
                                        size={24}
                                    />
                                    <p className="mt-2 text-slate-400">
                                        Loading transactions...
                                    </p>
                                </td>
                            </tr>
                        ) : transactions.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-slate-400">
                                    No transactions found.
                                </td>
                            </tr>
                        ) : (
                            transactions.map((transaction) => (
                                <tr key={transaction.id} className="hover:bg-slate-800/50">
                                    <td className="p-4">
                                        {transaction.id}
                                    </td>

                                    <td className="p-4 font-medium text-white">
                                        {transaction.trans_num || "N/A"}
                                    </td>

                                    <td className="p-4">
                                        {`****${String(transaction.cc_num).slice(-4)}`}
                                    </td>

                                    <td className="p-4">
                                        {transaction.datetime}
                                    </td>

                                    <td className="p-4 font-medium">
                                        {formatAmount(transaction.amt)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between">
                <button
                    disabled={offset === 0 || loading}
                    onClick={() => setOffset((previous) => Math.max(0, previous - limit))}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 disabled:opacity-40"
                >
                    Previous
                </button>

                <span className="text-sm text-slate-400">
                    Page {Math.floor(offset / limit) + 1}
                </span>

                <button
                    disabled={loading || transactions.length < limit}
                    onClick={() => setOffset((previous) => previous + limit)}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 disabled:opacity-40"
                >
                    Next
                </button>
            </div>

        </div>
    );
}

export default Transactions;
