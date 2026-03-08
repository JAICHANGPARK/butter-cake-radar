"use client";

import "leaflet/dist/leaflet.css";

import { useEffect } from "react";
import { divIcon } from "leaflet";
import { clsx } from "clsx";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import type { StoreWithRelations } from "@/lib/types";

const DEFAULT_CENTER: [number, number] = [37.5665, 126.978];

const createPinIcon = (isSelected: boolean) =>
  divIcon({
    className: "store-pin-icon",
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -34],
    html: `
      <div style="position:relative;width:28px;height:40px;filter:drop-shadow(0 6px 10px rgba(0,0,0,0.18));">
        <div style="position:absolute;left:50%;top:0;transform:translateX(-50%);width:${isSelected ? 24 : 22}px;height:${isSelected ? 24 : 22}px;border-radius:9999px;background:${isSelected ? "#fb923c" : "#f59e0b"};border:2px solid ${isSelected ? "#c2410c" : "#78350f"};"></div>
        <div style="position:absolute;left:50%;top:16px;transform:translateX(-50%) rotate(45deg);width:${isSelected ? 14 : 12}px;height:${isSelected ? 14 : 12}px;background:${isSelected ? "#fb923c" : "#f59e0b"};border-right:2px solid ${isSelected ? "#c2410c" : "#78350f"};border-bottom:2px solid ${isSelected ? "#c2410c" : "#78350f"};"></div>
        <div style="position:absolute;left:50%;top:${isSelected ? 8 : 7}px;transform:translateX(-50%);width:8px;height:8px;border-radius:9999px;background:white;"></div>
      </div>
    `,
  });

function MapController({
  selectedStore,
}: {
  selectedStore?: StoreWithRelations;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedStore) {
      return;
    }

    map.flyTo([selectedStore.latitude, selectedStore.longitude], 14, {
      duration: 0.8,
    });
  }, [map, selectedStore]);

  return null;
}

export function StoreMap({
  stores,
  selectedStoreId,
  onSelectStore,
  className,
}: {
  stores: StoreWithRelations[];
  selectedStoreId: string | null;
  onSelectStore: (storeId: string) => void;
  className?: string;
}) {
  const selectedStore =
    stores.find((store) => store.id === selectedStoreId) ?? undefined;
  const center = selectedStore
    ? ([selectedStore.latitude, selectedStore.longitude] as [number, number])
    : DEFAULT_CENTER;
  const zoom = selectedStore ? 14 : 11;

  return (
    <div
      className={clsx(
        "relative h-full min-h-[520px] overflow-hidden rounded-[32px] border border-stone-200 bg-white shadow-sm md:min-h-[680px]",
        className,
      )}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController selectedStore={selectedStore} />

        {stores.map((store) => (
          <Marker
            key={store.id}
            position={[store.latitude, store.longitude]}
            icon={createPinIcon(store.id === selectedStoreId)}
            zIndexOffset={store.id === selectedStoreId ? 1000 : 0}
            eventHandlers={{
              click: () => onSelectStore(store.id),
            }}
          >
            <Popup>
              <div className="min-w-[180px]">
                <p className="font-semibold text-stone-900">{store.name}</p>
                <p className="mt-1 text-sm text-stone-600">{store.address}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
