"use client";

import "leaflet/dist/leaflet.css";

import Link from "next/link";
import { useEffect, useState } from "react";
import { divIcon } from "leaflet";
import { clsx } from "clsx";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock3,
  Instagram,
  Link2,
  Phone,
} from "lucide-react";
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

export function StorePopupContent({
  store,
}: {
  store: StoreWithRelations;
}) {
  const [isOpeningHoursOpen, setIsOpeningHoursOpen] = useState(false);
  const openingHours = store.openingHours?.trim();
  const mapLinks = [
    { label: "카카오지도", href: store.kakaoMapUrl },
    { label: "네이버지도", href: store.naverMapUrl },
    { label: "구글 지도", href: store.googleMapUrl },
  ].filter((link): link is { label: string; href: string } => Boolean(link.href));

  return (
    <div className="min-w-[220px] max-w-[240px]">
      {store.images[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={store.images[0].imageUrl}
          alt={store.images[0].altText ?? store.name}
          className="mb-3 h-28 w-full rounded-[16px] object-cover"
        />
      ) : null}
      <p className="font-semibold leading-5 text-stone-900">{store.name}</p>
      <p className="mt-1 line-clamp-2 text-sm text-stone-600">{store.summary}</p>
      <p className="mt-1 text-sm text-stone-600">{store.address}</p>
      <div className="mt-3 grid gap-2 text-xs text-stone-600">
        {openingHours ? (
          <div className="rounded-[16px] bg-stone-50 px-3 py-2">
            <button
              type="button"
              onClick={() => setIsOpeningHoursOpen((current) => !current)}
              className="flex w-full items-center justify-between gap-3 text-left"
              aria-expanded={isOpeningHoursOpen}
            >
              <span className="inline-flex items-center gap-2 font-medium text-stone-700">
                <Clock3 className="h-3.5 w-3.5 text-orange-500" />
                영업시간
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-stone-700">
                {isOpeningHoursOpen ? "접기" : "보기"}
                {isOpeningHoursOpen ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </span>
            </button>
            {isOpeningHoursOpen ? (
              <p className="mt-2 whitespace-pre-line pl-[22px] leading-5 text-stone-600">
                {openingHours}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <Clock3 className="mt-0.5 h-3.5 w-3.5 text-orange-500" />
            <span className="whitespace-pre-line leading-5">운영시간 정보 없음</span>
          </div>
        )}
        {store.phone ? (
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-orange-500" />
            <span>{store.phone}</span>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
          <span>
            신고 {store.reportCount}건
            {store.pendingReportCount > 0
              ? ` · 대기 ${store.pendingReportCount}건`
              : ""}
          </span>
        </div>
      </div>
      {store.instagramUrl || mapLinks.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {store.instagramUrl ? (
            <a
              href={store.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-900"
            >
              <Instagram className="h-3.5 w-3.5" />
              인스타그램
            </a>
          ) : null}
          {mapLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-900"
            >
              <Link2 className="h-3.5 w-3.5" />
              {link.label}
            </a>
          ))}
        </div>
      ) : null}
      <Link
        href={`/stores/${store.id}`}
        className="mt-4 inline-flex rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-900"
      >
        상세 보기
      </Link>
    </div>
  );
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
        className="map-theme-simple h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController selectedStore={selectedStore} />

        {stores.map((store) => {
          return (
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
                <StorePopupContent store={store} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
