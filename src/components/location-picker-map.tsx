"use client";

import "leaflet/dist/leaflet.css";

import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

const DEFAULT_CENTER: [number, number] = [36.4, 127.8];

function MapController({
  latitude,
  longitude,
}: {
  latitude?: number;
  longitude?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (latitude === undefined || longitude === undefined) {
      return;
    }

    map.flyTo([latitude, longitude], 16, {
      duration: 0.8,
    });
  }, [latitude, longitude, map]);

  return null;
}

function Picker({
  latitude,
  longitude,
  onPick,
}: {
  latitude?: number;
  longitude?: number;
  onPick: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click(event) {
      onPick(
        Number(event.latlng.lat.toFixed(6)),
        Number(event.latlng.lng.toFixed(6)),
      );
    },
  });

  if (latitude === undefined || longitude === undefined) {
    return null;
  }

  return (
    <CircleMarker
      center={[latitude, longitude]}
      radius={10}
      pathOptions={{
        color: "#ea580c",
        fillColor: "#fb923c",
        fillOpacity: 0.9,
        weight: 2,
      }}
    />
  );
}

export function LocationPickerMap({
  latitude,
  longitude,
  onPick,
}: {
  latitude?: number;
  longitude?: number;
  onPick: (latitude: number, longitude: number) => void;
}) {
  return (
    <div className="h-[280px] overflow-hidden rounded-[28px] border border-stone-200">
      <MapContainer
        center={
          latitude !== undefined && longitude !== undefined
            ? [latitude, longitude]
            : DEFAULT_CENTER
        }
        zoom={7}
        scrollWheelZoom
        className="map-theme-simple h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController latitude={latitude} longitude={longitude} />
        <Picker latitude={latitude} longitude={longitude} onPick={onPick} />
      </MapContainer>
    </div>
  );
}
