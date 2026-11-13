
import { useState, useEffect } from "react";
import {
    ShieldAlert,
    RotateCcw,
    MapPin,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ShieldCheck,
} from "lucide-react";

import LocationMapModal from "./LocationMapModal";
import { predictTransaction } from "../services/api";

const initialForm = {
    trans_num: "",
    trans_date_trans_time: "",
    cc_num: "",
    merchant: "",
    category: "",
    amt: "",
    city: "",
    state: "",
    country: "",
    zip: "",
    lat: "",
    long: "",
    city_pop: "",
    unix_time: "",
    merch_lat: "",
    merch_long: "",
    merchant_city: "",
    merchant_state: "",
    merchant_country: "",
};

function FraudPrediction() {
    const [form, setForm] = useState(initialForm);

    const [isMapOpen, setIsMapOpen] = useState(false);
    const [locationType, setLocationType] = useState(null);

    // Population lookup
    const [populationStatus, setPopulationStatus] = useState("idle");
    const [populationError, setPopulationError] = useState("");

    // Prediction states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [prediction, setPrediction] = useState(null);
    const [submitError, setSubmitError] = useState("");

    // Automatically retrieve city population from FastAPI
    useEffect(() => {
        const { city, state, country } = form;

        if (!city.trim() || !state.trim() || !country.trim()) {
            setPopulationStatus("idle");
            setPopulationError("");
            return;
        }

        const controller = new AbortController();

        const timer = setTimeout(async () => {
            try {
                setPopulationStatus("loading");
                setPopulationError("");

                const params = new URLSearchParams({
                    city: city.trim(),
                    state: state.trim(),
                    country: country.trim(),
                });

                const response = await fetch(
                    `http://127.0.0.1:8000/location/population?${params}`,
                    {
                        signal: controller.signal,
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.detail || "Population lookup failed."
                    );
                }

                setForm((previous) => ({
                    ...previous,
                    city_pop: String(data.city_pop),
                }));

                setPopulationStatus("success");

            } catch (error) {
                if (error.name === "AbortError") return;

                setForm((previous) => ({
                    ...previous,
                    city_pop: "",
                }));

                setPopulationStatus("error");
                setPopulationError(error.message);
            }
        }, 600);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };

    }, [form.city, form.state, form.country]);

    // Handle form input changes
    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => {
            const updated = {
                ...previous,
                [name]: value,
            };

            // Clear old cardholder coordinates and population
            if (["city", "state", "country", "zip"].includes(name)) {
                updated.lat = "";
                updated.long = "";

                if (["city", "state", "country"].includes(name)) {
                    updated.city_pop = "";
                }
            }

            // Clear old merchant coordinates if address changes
            if (
                [
                    "merchant_city",
                    "merchant_state",
                    "merchant_country",
                ].includes(name)
            ) {
                updated.merch_lat = "";
                updated.merch_long = "";
            }

            return updated;
        });

        // Clear previous prediction when form changes
        setPrediction(null);
        setSubmitError("");
    };

    // Open map for cardholder or merchant
    const openMap = (type) => {
        const city =
            type === "cardholder"
                ? form.city
                : form.merchant_city;

        const state =
            type === "cardholder"
                ? form.state
                : form.merchant_state;

        const country =
            type === "cardholder"
                ? form.country
                : form.merchant_country;

        if (!city.trim() || !state.trim() || !country.trim()) {
            alert("Please enter city, state and country first.");
            return;
        }

        setLocationType(type);
        setIsMapOpen(true);
    };

    // Save selected map coordinates
    const handleLocationConfirm = ({ lat, long }) => {
        if (locationType === "cardholder") {
            setForm((previous) => ({
                ...previous,
                lat: String(lat),
                long: String(long),
            }));
        }

        if (locationType === "merchant") {
            setForm((previous) => ({
                ...previous,
                merch_lat: String(lat),
                merch_long: String(long),
            }));
        }

        setIsMapOpen(false);
        setPrediction(null);
        setSubmitError("");
    };

    // Reset form and prediction
    const handleReset = () => {
        setForm({ ...initialForm });

        setIsMapOpen(false);
        setLocationType(null);

        setPopulationStatus("idle");
        setPopulationError("");

        setIsSubmitting(false);
        setPrediction(null);
        setSubmitError("");
    };

    // Submit transaction to FastAPI
    const handleSubmit = async (event) => {
        event.preventDefault();

        setSubmitError("");
        setPrediction(null);

        // Validate population lookup
        if (
            populationStatus !== "success" ||
            !form.city_pop
        ) {
            setSubmitError(
                "Please wait for the city population lookup to complete."
            );
            return;
        }

        // Validate map locations
        if (
            !form.lat ||
            !form.long ||
            !form.merch_lat ||
            !form.merch_long
        ) {
            setSubmitError(
                "Please select both cardholder and merchant locations on the map."
            );
            return;
        }

        // Validate transaction date
        const transactionDate = new Date(
            form.trans_date_trans_time
        );

        if (
            !form.trans_date_trans_time ||
            Number.isNaN(transactionDate.getTime())
        ) {
            setSubmitError(
                "Please enter a valid transaction date and time."
            );
            return;
        }

        // Validate numeric inputs
        if (
            !form.cc_num.trim() ||
            !Number.isFinite(Number(form.amt)) ||
            Number(form.amt) < 0 ||
            !Number.isFinite(Number(form.zip))
        ) {
            setSubmitError(
                "Please enter valid card number, transaction amount and ZIP code."
            );
            return;
        }

        try {
            setIsSubmitting(true);

            // Generate Unix timestamp automatically
            const unixTimestamp = Math.floor(
                transactionDate.getTime() / 1000
            );

            // Prepare API payload
            const transaction = {
                trans_num: form.trans_num,
                trans_date_trans_time: form.trans_date_trans_time,

                // Keep card number as a string to avoid JS precision loss.
                // FastAPI/Pydantic converts it to the required integer.
                cc_num: form.cc_num,

                merchant: form.merchant,
                category: form.category,
                amt: Number(form.amt),

                city: form.city,
                state: form.state,
                zip: Number(form.zip),

                lat: Number(form.lat),
                long: Number(form.long),

                city_pop: Number(form.city_pop),
                unix_time: unixTimestamp,

                merch_lat: Number(form.merch_lat),
                merch_long: Number(form.merch_long),
            };

            console.log("Sending transaction:", transaction);

            // Call FastAPI prediction endpoint
            const result = await predictTransaction(transaction);

            setPrediction(result);

            console.log("Prediction result:", result);

        } catch (error) {
            console.error("Prediction error:", error);

            setSubmitError(
                error.message || "Unable to analyze transaction."
            );

        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass =
        "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500";

    const labelClass =
        "mb-2 block text-sm text-slate-400";

    // Reusable input component
    const renderInput = (name, label, type = "text") => (
        <div key={name}>
            <label htmlFor={name} className={labelClass}>
                {label}
            </label>

            <input
                id={name}
                name={name}
                type={type}
                inputMode={
                    name === "cc_num" ? "numeric" : undefined
                }
                value={form[name]}
                onChange={handleChange}
                className={inputClass}
                placeholder={`Enter ${label.toLowerCase()}`}
                required
                step={type === "number" ? "any" : undefined}
            />
        </div>
    );

    // Reusable map selection button
    const renderLocationButton = (
        type,
        title,
        latitude,
        longitude
    ) => {
        const selected =
            form[latitude] !== "" &&
            form[longitude] !== "";

        return (
            <div className="space-y-3">
                <button
                    type="button"
                    onClick={() => openMap(type)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-500/40 bg-blue-600/10 px-4 py-3 text-sm font-semibold text-blue-400 hover:bg-blue-600/20"
                >
                    <MapPin size={18} />
                    {selected
                        ? "Change Location on Map"
                        : title}
                </button>

                {selected && (
                    <div className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                        <CheckCircle2
                            size={17}
                            className="mt-0.5 text-emerald-400"
                        />

                        <div className="text-xs text-slate-300">
                            <p className="font-medium text-emerald-400">
                                Location selected
                            </p>

                            <p>
                                Latitude:{" "}
                                {Number(form[latitude]).toFixed(6)}
                            </p>

                            <p>
                                Longitude:{" "}
                                {Number(form[longitude]).toFixed(6)}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Current map search location
    const locationQuery =
        locationType === "cardholder"
            ? [form.city, form.state, form.country]
                .filter(Boolean)
                .join(", ")
            : [
                form.merchant_city,
                form.merchant_state,
                form.merchant_country,
            ]
                .filter(Boolean)
                .join(", ");

    // Format prediction probability
    const fraudProbability =
        prediction &&
            Number.isFinite(Number(prediction.fraud_probability))
            ? (Number(prediction.fraud_probability) * 100).toFixed(2)
            : null;

    const isFraud = prediction?.is_fraud_prediction;

    return (
        <div className="space-y-6">

            {/* Page Header */}
            <div>
                <h2 className="text-2xl font-bold">
                    Fraud Prediction
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                    Enter transaction information to evaluate its fraud risk
                    using the LightGBM model.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="space-y-6"
            >

                {/* Transaction Details */}
                <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                    <h3 className="mb-5 text-lg font-semibold">
                        Transaction Details
                    </h3>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {renderInput("trans_num", "Transaction ID")}

                        {renderInput(
                            "trans_date_trans_time",
                            "Transaction Date & Time",
                            "datetime-local"
                        )}

                        {renderInput("cc_num", "Card Number")}

                        {renderInput("merchant", "Merchant")}

                        {renderInput("category", "Merchant Category")}

                        {renderInput(
                            "amt",
                            "Transaction Amount",
                            "number"
                        )}
                    </div>
                </section>

                {/* Cardholder Location */}
                <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                    <h3 className="mb-2 text-lg font-semibold">
                        Cardholder Location
                    </h3>

                    <p className="mb-5 text-sm text-slate-400">
                        Enter the cardholder's city, state and country.
                        Then select the location on the map.
                    </p>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {renderInput("city", "City")}

                        {renderInput("state", "State / Region")}

                        {renderInput("country", "Country")}

                        {renderInput("zip", "ZIP / Postal Code")}
                    </div>

                    {/* Population Lookup Status */}
                    <div className="mt-4 text-sm">
                        {populationStatus === "loading" && (
                            <p className="text-blue-400">
                                Retrieving city population...
                            </p>
                        )}

                        {populationStatus === "success" && (
                            <p className="text-emerald-400">
                                <CheckCircle2
                                    size={16}
                                    className="mr-2 inline"
                                />

                                City population retrieved:{" "}
                                {Number(form.city_pop).toLocaleString("en-IN")}
                            </p>
                        )}

                        {populationStatus === "error" && (
                            <p className="text-red-400">
                                Population lookup failed:{" "}
                                {populationError}
                            </p>
                        )}
                    </div>

                    <div className="mt-5">
                        {renderLocationButton(
                            "cardholder",
                            "Select Cardholder Location",
                            "lat",
                            "long"
                        )}
                    </div>
                </section>

                {/* Merchant Location */}
                <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                    <h3 className="mb-2 text-lg font-semibold">
                        Merchant Location
                    </h3>

                    <p className="mb-5 text-sm text-slate-400">
                        Enter the merchant's city, state and country.
                        Then select the merchant's actual location on the map.
                    </p>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {renderInput("merchant_city", "Merchant City")}

                        {renderInput(
                            "merchant_state",
                            "Merchant State / Region"
                        )}

                        {renderInput(
                            "merchant_country",
                            "Merchant Country"
                        )}
                    </div>

                    <div className="mt-5">
                        {renderLocationButton(
                            "merchant",
                            "Select Merchant Location",
                            "merch_lat",
                            "merch_long"
                        )}
                    </div>
                </section>

                {/* Submission Error */}
                {submitError && (
                    <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                        <AlertCircle
                            size={20}
                            className="mt-0.5 shrink-0"
                        />

                        <p>{submitError}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2
                                    size={18}
                                    className="animate-spin"
                                />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <ShieldAlert size={18} />
                                Analyze Transaction
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 rounded-lg border border-slate-700 px-6 py-3 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                    >
                        <RotateCcw size={18} />
                        Reset
                    </button>
                </div>

            </form>

            {/* Prediction Result */}
            {prediction && (
                <section className="rounded-xl border border-slate-700 bg-slate-900 p-6">
                    <div className="mb-5 flex items-center gap-3">
                        {isFraud ? (
                            <ShieldAlert
                                size={25}
                                className="text-red-400"
                            />
                        ) : (
                            <ShieldCheck
                                size={25}
                                className="text-emerald-400"
                            />
                        )}

                        <div>
                            <h3 className="text-lg font-semibold">
                                Prediction Result
                            </h3>

                            <p className="text-sm text-slate-400">
                                LightGBM transaction risk assessment
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                        {/* Fraud Probability */}
                        <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
                            <p className="text-sm text-slate-400">
                                Fraud Probability
                            </p>

                            <p className="mt-2 text-2xl font-bold text-white">
                                {fraudProbability !== null
                                    ? `${fraudProbability}%`
                                    : "N/A"}
                            </p>
                        </div>

                        {/* Risk Label */}
                        <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
                            <p className="text-sm text-slate-400">
                                Risk Level
                            </p>

                            <p
                                className={`mt-2 text-2xl font-bold ${isFraud
                                        ? "text-red-400"
                                        : "text-emerald-400"
                                    }`}
                            >
                                {prediction.risk_label || "N/A"}
                            </p>
                        </div>

                        {/* Final Prediction */}
                        <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
                            <p className="text-sm text-slate-400">
                                Model Decision
                            </p>

                            <p
                                className={`mt-2 text-2xl font-bold ${isFraud
                                        ? "text-red-400"
                                        : "text-emerald-400"
                                    }`}
                            >
                                {isFraud ? "Fraud Detected" : "Legitimate"}
                            </p>
                        </div>

                    </div>

                    <p className="mt-4 text-xs text-slate-500">
                        This result is generated by the configured LightGBM
                        model and its decision threshold.
                    </p>
                </section>
            )}

            {/* Location Map Modal */}
            <LocationMapModal
                isOpen={isMapOpen}
                title={
                    locationType === "cardholder"
                        ? "Select Cardholder Location"
                        : "Select Merchant Location"
                }
                locationQuery={locationQuery}
                onClose={() => setIsMapOpen(false)}
                onConfirm={handleLocationConfirm}
            />

        </div>
    );
}

export default FraudPrediction;
