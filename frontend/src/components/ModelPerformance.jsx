
import {
    BrainCircuit,
    Target,
    Activity,
    ShieldCheck,
    TrendingUp,
    Gauge,
} from "lucide-react";

const modelMetrics = [
    {
        label: "PR-AUC",
        value: 0.882989,
        description: "Area under Precision-Recall curve",
        icon: TrendingUp,
        color: "text-blue-400",
    },
    {
        label: "ROC-AUC",
        value: 0.997122,
        description: "Ability to distinguish fraud from legitimate transactions",
        icon: Activity,
        color: "text-purple-400",
    },
    {
        label: "Precision",
        value: 0.791917,
        description: "Share of fraud predictions that were correct",
        icon: Target,
        color: "text-emerald-400",
    },
    {
        label: "Recall",
        value: 0.812886,
        description: "Share of actual fraud cases detected",
        icon: ShieldCheck,
        color: "text-orange-400",
    },
    {
        label: "F1 Score",
        value: 0.802265,
        description: "Balance between precision and recall",
        icon: Gauge,
        color: "text-cyan-400",
    },
];

function ModelPerformance() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white">
                    Model Performance
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                    LightGBM evaluation results on the held-out test dataset.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {modelMetrics.map((metric) => {
                    const Icon = metric.icon;

                    return (
                        <div
                            key={metric.label}
                            className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-slate-400">
                                    {metric.label}
                                </p>
                                <Icon size={20} className={metric.color} />
                            </div>

                            <p className="mt-4 text-3xl font-bold text-white">
                                {metric.value.toFixed(6)}
                            </p>

                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                                <div
                                    className="h-full rounded-full bg-blue-500"
                                    style={{ width: `${metric.value * 100}%` }}
                                />
                            </div>

                            <p className="mt-3 text-xs text-slate-500">
                                {metric.description}
                            </p>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                    <div className="flex items-center gap-3">
                        <BrainCircuit className="text-blue-400" size={22} />
                        <h3 className="text-lg font-semibold text-white">
                            Model Configuration
                        </h3>
                    </div>

                    <div className="mt-6 space-y-4">
                        <InfoRow label="Algorithm" value="LightGBM" />
                        <InfoRow label="Task" value="Binary Classification" />
                        <InfoRow label="Decision Threshold" value="0.96" />
                        <InfoRow label="Evaluation Dataset" value="Test Set" />
                        <InfoRow label="Feature Count" value="13" />
                    </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                    <h3 className="text-lg font-semibold text-white">
                        Evaluation Summary
                    </h3>

                    <p className="mt-4 text-sm leading-7 text-slate-400">
                        The LightGBM model achieved a PR-AUC of 0.882989
                        and ROC-AUC of 0.997122 on the held-out test set.
                        At the selected 0.96 decision threshold,
                        the model achieved 79.19% precision and
                        81.29% recall.
                    </p>

                    <div className="mt-6 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                        <p className="text-sm font-medium text-blue-400">
                            Evaluation Note
                        </p>
                        <p className="mt-2 text-xs leading-6 text-slate-400">
                            These metrics are from offline testing, not live
                            transaction predictions. Production performance
                            requires labeled outcomes and ongoing monitoring.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-sm">
            <span className="text-slate-400">{label}</span>
            <span className="font-medium text-white">{value}</span>
        </div>
    );
}

export default ModelPerformance;
