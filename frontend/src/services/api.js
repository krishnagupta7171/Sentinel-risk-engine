
const API_BASE_URL = "http://127.0.0.1:8000";

export async function checkApiHealth() {
    const response = await fetch(`${API_BASE_URL}/health`);

    if (!response.ok) {
        throw new Error("Unable to connect to Sentinel API");
    }

    return response.json();
}

export async function predictTransaction(transaction) {
    const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(transaction),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Prediction failed");
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
