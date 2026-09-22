// src/components/InteractiveMap.jsx
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { getImageUrl } from "../services/api";

// Fix standard Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const goldIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function LocationPickerEvents({ onSelectLocation }) {
  useMapEvents({
    click(e) {
      onSelectLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function InteractiveMap({
  mode = "picker", // "picker" or "dashboard"
  center = [28.6139, 77.2090], // Default center (New Delhi / India)
  zoom = 13,
  selectedCoords = null,
  onSelectCoords = null,
  complaints = [],
  height = "320px",
}) {
  const currentCenter = selectedCoords?.lat ? [selectedCoords.lat, selectedCoords.lng] : center;

  return (
    <div style={{ height, width: "100%" }} className="rounded-2xl overflow-hidden border border-gray-200 shadow-inner relative z-0">
      <MapContainer center={currentCenter} zoom={zoom} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Mode 1: Location Picker */}
        {mode === "picker" && (
          <>
            {onSelectCoords && <LocationPickerEvents onSelectLocation={onSelectCoords} />}
            {selectedCoords && (
              <Marker position={[selectedCoords.lat, selectedCoords.lng]}>
                <Popup>
                  <div className="text-xs font-semibold">📍 Selected Complaint Location</div>
                </Popup>
              </Marker>
            )}
          </>
        )}

        {/* Mode 2: Multi-Complaint Dashboard Map */}
        {mode === "dashboard" &&
          complaints.map((c) => {
            if (!c.location?.lat || !c.location?.lng) return null;
            let icon = L.Icon.Default;
            if (c.isSOS) icon = redIcon;
            else if (c.status === "Resolved") icon = greenIcon;
            else if (c.duplicateCount > 1) icon = goldIcon;

            return (
              <Marker key={c._id} position={[c.location.lat, c.location.lng]} icon={icon}>
                <Popup>
                  <div className="text-xs p-1">
                    <div className="font-mono font-bold text-ink mb-0.5">{c.complaintId}</div>
                    <div className="font-semibold text-gray-800">{c.category}</div>
                    <p className="text-gray-600 line-clamp-2 my-1">{c.description}</p>
                    <div className="text-[10px] font-bold mt-1 text-teal">Status: {c.status}</div>
                    {c.photoUrl && (
                      <img src={getImageUrl(c.photoUrl)} alt="photo" className="w-16 h-16 object-cover rounded mt-1.5" />
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
}
