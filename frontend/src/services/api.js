
const API_BASE_URL = "http://54.159.70.212:30080";

export async function checkApiHealth() {
    const response = await fetch(`${API_BASE_URL}/health`);

    if (!response.ok) {
        throw new Error("Unable to connect to Sentinel API");
    }

    return response.json();
}


export async function predictTransaction(transaction) {
    const payload = {
        ...transaction,
        cc_num: Number(
            String(transaction.cc_num).replace(/\s+/g, "")
        ),
    };

    const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        const errorMessage = Array.isArray(data.detail)
            ? data.detail.map(err => `${err.loc?.join(".")}: ${err.msg}`).join(", ")
            : data.detail || "Prediction failed";

        throw new Error(errorMessage);
    }

    return data;
}




export async function getTransactions(limit = 100, offset = 0) {
    const response = await fetch(
        `${API_BASE_URL}/transactions?limit=${limit}&offset=${offset}`
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.detail || "Unable to retrieve transactions"
        );
    }

    return data;
}



export async function getOverviewAnalytics() {
    const response = await fetch(
        `${API_BASE_URL}/analytics/overview`
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.detail || "Unable to retrieve analytics"
        );
    }

    return data;
}



export async function getFraudAnalytics() {
    const response = await fetch(
        `${API_BASE_URL}/analytics/fraud`
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.detail || "Unable to retrieve fraud analytics"
        );
    }

    return data;
}



export async function getMonitoringMetrics() {
    const response = await fetch(`${API_BASE_URL}/monitoring/metrics`);

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.detail || "Unable to retrieve API monitoring metrics"
        );
    }

    return data;
}


