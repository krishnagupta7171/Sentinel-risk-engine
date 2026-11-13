
import { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    useMapEvents,
    useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons in Vite
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const DEFAULT_CENTER = [20, 0];

function MapClickHandler({ position, setPosition }) {
    useMapEvents({
        click(event) {
            const lat = event.latlng.lat;
            const lng = event.latlng.lng;

            if (
                lat >= -90 && lat <= 90 &&
                lng >= -180 && lng <= 180
            ) {
                setPosition([lat, lng]);
            }
        },
    });

    return position ? <Marker position={position} /> : null;
}

function MapController({ center, zoom }) {
    const map = useMap();

    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);

    return null;
}

export default function LocationMapModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Select Location",
    locationQuery = "",
}) {
    const [position, setPosition] = useState(null);
    const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
    const [zoom, setZoom] = useState(2);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen || !locationQuery.trim()) return;

        const controller = new AbortController();

        const findCity = async () => {
            setLoading(true);
            setError("");
            setPosition(null);
            setMapCenter(DEFAULT_CENTER);
            setZoom(2);

            try {
                const params = new URLSearchParams({
                    q: locationQuery,
                    format: "jsonv2",
                    limit: "1",
                });

                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?${params}`,
                    { signal: controller.signal }
                );

                if (!response.ok) {
                    throw new Error("Unable to search for this location.");
                }

                const results = await response.json();

                if (!results.length) {
                    throw new Error(
                        "Location not found. Please check the city, state and country."
                    );
                }

                const latitude = Number(results[0].lat);
                const longitude = Number(results[0].lon);

                if (
                    !Number.isFinite(latitude) ||
                    !Number.isFinite(longitude) ||
                    latitude < -90 ||
                    latitude > 90 ||
                    longitude < -180 ||
                    longitude > 180
                ) {
                    throw new Error("Invalid coordinates received.");
                }

                setMapCenter([latitude, longitude]);
                setZoom(13);
            } catch (err) {
                if (err.name !== "AbortError") {
                    setError(
                        err.message || "Location search failed."
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        findCity();

        return () => controller.abort();
    }, [isOpen, locationQuery]);

    const handleConfirm = () => {
        if (!position) {
            setError("Please place a pin on the map first.");
            return;
        }

        onConfirm({
            lat: position[0],
            long: position[1],
        });

        setPosition(null);
        setError("");
        onClose();
    };

    const handleClose = () => {
        setPosition(null);
        setError("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-3xl rounded-2xl border border-gray-700 bg-gray-900 p-5 shadow-2xl">

                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">
                        {title}
                    </h2>

                    <button
                        type="button"
                        onClick={handleClose}
                        className="text-gray-400 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                <p className="mb-3 text-sm text-gray-400">
                    Search location: {locationQuery}
                </p>

                {loading && (
                    <p className="mb-3 text-sm text-blue-400">
                        Finding your city...
                    </p>
                )}

                <MapContainer
                    center={mapCenter}
                    zoom={zoom}
                    scrollWheelZoom
                    className="h-[400px] w-full rounded-xl"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapController
                        center={mapCenter}
                        zoom={zoom}
                    />

                    <MapClickHandler
                        position={position}
                        setPosition={setPosition}
                    />
                </MapContainer>

                <div className="mt-4 space-y-3">

                    {position && (
                        <p className="text-sm text-emerald-400">
                            Latitude: {position[0].toFixed(6)}
                            {" | "}
                            Longitude: {position[1].toFixed(6)}
                        </p>
                    )}

                    {error && (
                        <p className="text-sm text-red-400">
                            {error}
                        </p>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="rounded-lg border border-gray-700 px-4 py-2 text-gray-300 hover:bg-gray-800"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={loading}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            Confirm Location
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
