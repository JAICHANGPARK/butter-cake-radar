"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { ImagePlus, LoaderCircle, MapPin, Search, X } from "lucide-react";

import { SIDO_OPTIONS, SIGUNGU_BY_SIDO } from "@/lib/regions";
import type { SimilarStoreCandidate, StoreInput, StoreWithRelations } from "@/lib/types";
import {
  MAX_IMAGE_DIMENSION,
  MAX_UPLOAD_FILE_SIZE_BYTES,
  MAX_WEBP_FILE_SIZE_BYTES,
} from "@/lib/uploads";
import { findSimilarStoreCandidates } from "@/lib/utils";

const LocationPickerMap = dynamic(
  () =>
    import("@/components/location-picker-map").then(
      (module) => module.LocationPickerMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[280px] place-items-center rounded-[28px] border border-stone-200 bg-stone-50 text-sm text-stone-500">
        위치 선택 지도를 불러오는 중입니다.
      </div>
    ),
  },
);

type ResultState = {
  kind: "success" | "error";
  message: string;
} | null;

type KakaoPostcodeData = {
  address: string;
  apartment: "Y" | "N";
  bname: string;
  buildingName: string;
  jibunAddress: string;
  roadAddress: string;
  sigungu: string;
  sido: string;
  userSelectedType: "R" | "J";
  zonecode: string;
};

type KakaoPostcodeEmbedOptions = {
  autoClose?: boolean;
};

type KakaoPostcodeInstance = {
  embed: (element: HTMLElement, options?: KakaoPostcodeEmbedOptions) => void;
};

type KakaoPostcodeConstructorOptions = {
  oncomplete: (data: KakaoPostcodeData) => void;
  onresize?: (size: { height: number; width: number }) => void;
  width?: string | number;
  height?: string | number;
};

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: KakaoPostcodeConstructorOptions) => KakaoPostcodeInstance;
    };
  }
}

let postcodeScriptPromise: Promise<void> | null = null;

const POSTCODE_SCRIPT_URL =
  "https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

const loadPostcodeScript = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("브라우저 환경에서만 주소 검색을 사용할 수 있습니다."));
  }

  if (window.daum?.Postcode) {
    return Promise.resolve();
  }

  if (postcodeScriptPromise) {
    return postcodeScriptPromise;
  }

  postcodeScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${POSTCODE_SCRIPT_URL}"]`,
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("주소 검색 스크립트를 불러오지 못했습니다.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = POSTCODE_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("주소 검색 스크립트를 불러오지 못했습니다."));
    document.head.appendChild(script);
  }).catch((error) => {
    postcodeScriptPromise = null;
    throw error;
  });

  return postcodeScriptPromise;
};

const resolveSigungu = (nextSido: string, nextSigungu: string) => {
  if (nextSido === "세종특별자치시") {
    return "세종시";
  }

  const options = SIGUNGU_BY_SIDO[nextSido as keyof typeof SIGUNGU_BY_SIDO] ?? [];

  return (
    options.find((option) => option === nextSigungu) ??
    options.find((option) => option.endsWith(nextSigungu)) ??
    options.find((option) => nextSigungu.endsWith(option)) ??
    ""
  );
};

const buildAddressFromPostcode = (data: KakaoPostcodeData) => {
  const baseAddress =
    data.userSelectedType === "R"
      ? data.roadAddress || data.address
      : data.jibunAddress || data.address;

  if (data.userSelectedType !== "R") {
    return baseAddress;
  }

  const extras = [
    data.bname,
    data.buildingName && data.apartment === "Y" ? data.buildingName : "",
  ].filter(Boolean);

  return extras.length > 0 ? `${baseAddress} (${extras.join(", ")})` : baseAddress;
};

const createWebpFile = async (file: File) => {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new window.Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("이미지를 읽을 수 없습니다."));
      nextImage.src = objectUrl;
    });

    const scale = Math.min(
      1,
      MAX_IMAGE_DIMENSION / Math.max(image.width, image.height),
    );
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("이미지 변환 컨텍스트를 만들 수 없습니다.");
    }

    context.drawImage(image, 0, 0, width, height);

    const qualities = [0.82, 0.72, 0.62, 0.5];
    let blob: Blob | null = null;

    for (const quality of qualities) {
      blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (nextBlob) => {
            if (!nextBlob) {
              reject(new Error("webp 변환에 실패했습니다."));
              return;
            }

            resolve(nextBlob);
          },
          "image/webp",
          quality,
        );
      });

      if (blob.size <= MAX_WEBP_FILE_SIZE_BYTES) {
        break;
      }
    }

    if (!blob || blob.size > MAX_WEBP_FILE_SIZE_BYTES) {
      throw new Error(
        "이미지 용량이 커서 업로드할 수 없습니다. 더 작은 이미지를 사용해 주세요.",
      );
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "store-image";
    return new File([blob], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export function SubmissionHub({
  stores,
}: {
  stores: StoreWithRelations[];
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ResultState>(null);
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [address, setAddress] = useState("");
  const [sido, setSido] = useState("");
  const [sigungu, setSigungu] = useState("");
  const [postcode, setPostcode] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [phone, setPhone] = useState("");
  const [openingDays, setOpeningDays] = useState("");
  const [openingTime, setOpeningTime] = useState("");
  const [closingTime, setClosingTime] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [kakaoMapUrl, setKakaoMapUrl] = useState("");
  const [naverMapUrl, setNaverMapUrl] = useState("");
  const [googleMapUrl, setGoogleMapUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageName, setImageName] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isAddressSearchOpen, setIsAddressSearchOpen] = useState(false);
  const [addressSearchError, setAddressSearchError] = useState<string | null>(null);
  const [isAddressSearchLoading, setIsAddressSearchLoading] = useState(false);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const postcodeLayerRef = useRef<HTMLDivElement | null>(null);

  const sigunguOptions =
    sido && sido in SIGUNGU_BY_SIDO
      ? SIGUNGU_BY_SIDO[sido as keyof typeof SIGUNGU_BY_SIDO]
      : [];

  const duplicateCandidates = useMemo<SimilarStoreCandidate[]>(() => {
    if (!name || !address || !sido || !sigungu) {
      return [];
    }

    return findSimilarStoreCandidates(stores, {
      name,
      address,
      sido,
      sigungu,
    }).slice(0, 3);
  }, [address, name, sido, sigungu, stores]);

  const openingHours = [
    openingDays.trim(),
    openingTime && closingTime ? `${openingTime}-${closingTime}` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const geocodeSelectedAddress = useEffectEvent(
    async ({
      fullAddress,
      roadAddress,
      jibunAddress,
      nextSido,
      nextSigungu,
    }: {
      fullAddress: string;
      roadAddress?: string;
      jibunAddress?: string;
      nextSido?: string;
      nextSigungu?: string;
    }) => {
    setIsGeocodingAddress(true);
    setLocationMessage("주소를 기준으로 매장 위치를 찾는 중입니다.");
    setLatitude(undefined);
    setLongitude(undefined);

    try {
      const params = new URLSearchParams({
        q: fullAddress,
      });

      if (roadAddress) {
        params.set("roadAddress", roadAddress);
      }

      if (jibunAddress) {
        params.set("jibunAddress", jibunAddress);
      }

      if (nextSido) {
        params.set("sido", nextSido);
      }

      if (nextSigungu) {
        params.set("sigungu", nextSigungu);
      }

      const response = await fetch(`/api/geocode?${params.toString()}`);
      const data = (await response.json()) as {
        latitude?: number;
        longitude?: number;
        message?: string;
      };

      if (!response.ok || data.latitude === undefined || data.longitude === undefined) {
        throw new Error(
          data.message ?? "주소 좌표를 찾지 못했습니다. 아래 지도에서 직접 선택해 주세요.",
        );
      }

      setLatitude(Number(data.latitude.toFixed(6)));
      setLongitude(Number(data.longitude.toFixed(6)));
      setLocationMessage("주소 기준으로 핀이 자동 배치되었습니다. 필요하면 지도에서 다시 조정해 주세요.");
    } catch (error) {
      setLocationMessage(
        error instanceof Error
          ? error.message
          : "주소 좌표를 찾지 못했습니다. 아래 지도에서 직접 선택해 주세요.",
      );
    } finally {
      setIsGeocodingAddress(false);
    }
    },
  );

  useEffect(() => {
    if (!isAddressSearchOpen || !postcodeLayerRef.current) {
      return;
    }

    let isCancelled = false;
    const container = postcodeLayerRef.current;

    const openPostcode = async () => {
      setIsAddressSearchLoading(true);
      setAddressSearchError(null);

      try {
        await loadPostcodeScript();

        if (isCancelled || !window.daum?.Postcode) {
          return;
        }

        container.innerHTML = "";

        const postcodeSearch = new window.daum.Postcode({
          oncomplete: (data) => {
            const nextAddress = buildAddressFromPostcode(data);
            const nextSido = data.sido;
            const nextSigungu = resolveSigungu(nextSido, data.sigungu);

            setAddress(nextAddress);
            setPostcode(data.zonecode);
            setSido(nextSido);
            setSigungu(nextSigungu);
            setIsAddressSearchOpen(false);
            void geocodeSelectedAddress({
              fullAddress: nextAddress,
              roadAddress: data.roadAddress || undefined,
              jibunAddress: data.jibunAddress || undefined,
              nextSido,
              nextSigungu: nextSigungu || data.sigungu,
            });
          },
          onresize: (size) => {
            container.style.height = `${Math.max(size.height, 360)}px`;
          },
          width: "100%",
          height: "100%",
        });

        postcodeSearch.embed(container, { autoClose: false });
      } catch (error) {
        if (!isCancelled) {
          setAddressSearchError(
            error instanceof Error
              ? error.message
              : "주소 검색을 불러오는 중 오류가 발생했습니다.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsAddressSearchLoading(false);
        }
      }
    };

    void openPostcode();

    return () => {
      isCancelled = true;
      container.innerHTML = "";
    };
  }, [isAddressSearchOpen]);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    setImageError(null);

    if (selectedFile.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
      setImageError("원본 이미지가 너무 큽니다. 8MB 이하 이미지를 선택해 주세요.");
      event.target.value = "";
      return;
    }

    setIsUploadingImage(true);

    try {
      const webpFile = await createWebpFile(selectedFile);
      const formData = new FormData();
      formData.append("file", webpFile);

      const response = await fetch("/api/uploads/store-image", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { imageUrl?: string; message?: string };

      if (!response.ok || !data.imageUrl) {
        throw new Error(data.message ?? "이미지 업로드에 실패했습니다.");
      }

      setImageUrl(data.imageUrl);
      setImagePreviewUrl(data.imageUrl);
      setImageName(webpFile.name);
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.",
      );
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(null);

    const payload: StoreInput = {
      name,
      summary,
      address,
      sido,
      sigungu,
      latitude: latitude ?? 0,
      longitude: longitude ?? 0,
      phone,
      openingHours: openingHours || undefined,
      websiteUrl,
      instagramUrl,
      kakaoMapUrl,
      naverMapUrl,
      googleMapUrl,
      imageUrls: imageUrl ? [imageUrl] : [],
    };

    startTransition(async () => {
      const response = await fetch("/api/stores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setResult({
          kind: "error",
          message: data.message ?? "가게 등록 중 오류가 발생했습니다.",
        });
        return;
      }

      setResult({
        kind: "success",
        message: "가게가 바로 등록되었습니다. 오정보 신고가 생기면 매장 상세에서 이력을 바로 확인할 수 있습니다.",
      });
      setName("");
      setSummary("");
      setAddress("");
      setSido("");
      setSigungu("");
      setPostcode("");
      setLatitude(undefined);
      setLongitude(undefined);
      setLocationMessage(null);
      setPhone("");
      setOpeningDays("");
      setOpeningTime("");
      setClosingTime("");
      setWebsiteUrl("");
      setInstagramUrl("");
      setKakaoMapUrl("");
      setNaverMapUrl("");
      setGoogleMapUrl("");
      setImageUrl("");
      setImagePreviewUrl("");
      setImageName("");
      setImageError(null);
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-8 md:px-8 md:py-10">
      {result?.kind === "success" ? (
        <div
          className="rounded-[24px] bg-emerald-50 px-5 py-4 text-sm text-emerald-900"
        >
          {result.message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <form
          className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">상호명</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                placeholder="예: 버터필름 수성"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">한 줄 소개</span>
              <textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                className="h-24 w-full rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                placeholder="대표 메뉴와 분위기를 간단히 적어주세요."
              />
            </label>

            <label className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-stone-700">주소</span>
                <button
                  type="button"
                  onClick={() => setIsAddressSearchOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800"
                >
                  <Search className="h-3.5 w-3.5" />
                  주소 검색
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
                <input
                  value={postcode}
                  readOnly
                  className="w-full rounded-[20px] border border-stone-200 bg-stone-100 px-4 py-3 text-sm text-stone-600"
                  placeholder="우편번호"
                />
                <input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  className="w-full rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                  placeholder="도로명 주소를 권장합니다"
                />
              </div>
              <p className="text-sm text-stone-500">
                카카오 주소 검색으로 기본 주소를 채운 뒤 필요한 상세 주소를 직접 수정할 수 있습니다.
              </p>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">시/도</span>
                <select
                  value={sido}
                  onChange={(event) => {
                    setSido(event.target.value);
                    setSigungu("");
                  }}
                  className="w-full rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                >
                  <option value="">선택하세요</option>
                  {SIDO_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">시군구</span>
                <select
                  value={sigungu}
                  onChange={(event) => setSigungu(event.target.value)}
                  className="w-full rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                  disabled={!sido}
                >
                  <option value="">선택하세요</option>
                  {sigunguOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-stone-700">
                지도를 클릭해 매장 위치 선택
              </span>
              <p className="text-sm text-stone-500">
                주소 검색은 주소 입력만 도와주고, 실제 핀 위치는 아래 지도에서 직접 찍어주세요.
              </p>
              {locationMessage ? (
                <p
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    isGeocodingAddress
                      ? "bg-stone-100 text-stone-700"
                      : latitude !== undefined && longitude !== undefined
                        ? "bg-emerald-50 text-emerald-900"
                        : "bg-amber-50 text-amber-900"
                  }`}
                >
                  {locationMessage}
                </p>
              ) : null}
              <LocationPickerMap
                latitude={latitude}
                longitude={longitude}
                onPick={(nextLatitude, nextLongitude) => {
                  setLatitude(nextLatitude);
                  setLongitude(nextLongitude);
                  setLocationMessage("지도에서 매장 위치를 직접 조정했습니다.");
                }}
              />
              <div className="flex flex-wrap gap-3 text-sm text-stone-600">
                <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1">
                  <MapPin className="h-4 w-4" />
                  위도 {latitude?.toFixed(6) ?? "-"}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1">
                  경도 {longitude?.toFixed(6) ?? "-"}
                </span>
              </div>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">연락처</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                placeholder="02-123-4567"
              />
            </label>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-stone-700">운영시간</p>
                <p className="mt-1 text-sm text-stone-500">
                  요일은 직접 입력하고, 시간은 선택기로 지정해 주세요.
                </p>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">운영 요일</span>
                <input
                  value={openingDays}
                  onChange={(event) => setOpeningDays(event.target.value)}
                  className="w-full rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                  placeholder="예: 매일, 화-일, 월-토"
                />
              </label>

              <div className="grid gap-3">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-700">오픈 시간</span>
                  <input
                    type="time"
                    value={openingTime}
                    onChange={(event) => setOpeningTime(event.target.value)}
                    className="w-full rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-700">마감 시간</span>
                  <input
                    type="time"
                    value={closingTime}
                    onChange={(event) => setClosingTime(event.target.value)}
                    className="w-full rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                  />
                </label>
              </div>

              {openingHours ? (
                <p className="rounded-2xl bg-stone-100 px-4 py-3 text-sm text-stone-700">
                  저장될 운영시간: {openingHours}
                </p>
              ) : null}
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">홈페이지</span>
              <input
                value={websiteUrl}
                onChange={(event) => setWebsiteUrl(event.target.value)}
                className="w-full rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                placeholder="https://..."
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">인스타그램</span>
              <input
                value={instagramUrl}
                onChange={(event) => setInstagramUrl(event.target.value)}
                className="w-full rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                placeholder="https://instagram.com/..."
              />
            </label>

            <div className="grid gap-4">
              <div>
                <p className="text-sm font-medium text-stone-700">외부 지도 공유 링크</p>
                <p className="mt-1 text-sm text-stone-500">
                  카카오지도, 네이버지도, 구글 지도에서 가게 공유 링크가 있으면 함께 넣어주세요.
                </p>
              </div>

              <div className="grid gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-700">카카오지도</span>
                  <input
                    value={kakaoMapUrl}
                    onChange={(event) => setKakaoMapUrl(event.target.value)}
                    className="w-full rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                    placeholder="https://place.map.kakao.com/..."
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-700">네이버지도</span>
                  <input
                    value={naverMapUrl}
                    onChange={(event) => setNaverMapUrl(event.target.value)}
                    className="w-full rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                    placeholder="https://map.naver.com/..."
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-700">구글 지도</span>
                  <input
                    value={googleMapUrl}
                    onChange={(event) => setGoogleMapUrl(event.target.value)}
                    className="w-full rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                    placeholder="https://maps.app.goo.gl/..."
                  />
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-stone-700">
                  대표 사진 1장 (선택)
                </span>
              </div>
              <p className="text-sm text-stone-500">
                대표 이미지가 없어도 가게를 등록할 수 있습니다.
              </p>
              <label className="flex cursor-pointer items-center gap-3 rounded-[24px] border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-sm text-stone-700 hover:border-orange-400 hover:bg-orange-50">
                {isUploadingImage ? (
                  <LoaderCircle className="h-5 w-5 animate-spin text-orange-600" />
                ) : (
                  <ImagePlus className="h-5 w-5 text-orange-600" />
                )}
                <span>
                  {isUploadingImage
                    ? "이미지를 webp로 변환하고 업로드하는 중입니다."
                    : "이미지 파일 선택 (선택, 최대 1장)"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={isUploadingImage}
                />
              </label>

              {imageName ? (
                <p className="text-sm text-stone-600">
                  업로드 완료: <span className="font-medium text-stone-900">{imageName}</span>
                </p>
              ) : null}

              {imagePreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreviewUrl}
                  alt="업로드된 대표 사진 미리보기"
                  className="h-56 w-full rounded-[24px] object-cover"
                />
              ) : null}

              {imageError ? (
                <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-900">
                  {imageError}
                </p>
              ) : null}
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="mt-6 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            가게 등록하기
          </button>
        </form>

        <section className="space-y-6">
          <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(58,40,12,0.08)]">
            <p className="font-heading text-3xl text-stone-950">중복 후보 확인</p>
            <p className="mt-2 text-sm leading-7 text-stone-600">
              비슷한 상호명과 주소가 이미 등록돼 있으면 새로 올리기보다 해당 매장 상세에서 신고나 정보 보완을 하는 편이 낫습니다.
            </p>
            <div className="mt-4 grid gap-3">
              {duplicateCandidates.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-stone-300 bg-stone-50 p-5 text-sm text-stone-600">
                  아직 비슷한 매장이 감지되지 않았습니다.
                </div>
              ) : null}
              {duplicateCandidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="rounded-[24px] border border-stone-200 bg-stone-50 p-5"
                >
                  <p className="font-semibold text-stone-950">{candidate.name}</p>
                  <p className="mt-1 text-sm text-stone-600">{candidate.address}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/stores/${candidate.id}`}
                      className="rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-900"
                    >
                      상세 보기
                    </Link>
                    <Link
                      href={`/stores/${candidate.id}#report`}
                      className="rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-900"
                    >
                      오정보 신고
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(58,40,12,0.08)]">
            <p className="font-heading text-3xl text-stone-950">운영 원칙</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-stone-600">
              <li>누구나 등록할 수 있지만 잘못된 정보는 신고로 누적됩니다.</li>
              <li>내 위치 기능은 개인정보 이슈를 고려해 비활성화했습니다.</li>
              <li>오정보 신고 이력은 매장 상세에서 누구나 확인할 수 있습니다.</li>
            </ul>
          </div>
        </section>
      </div>

      {isAddressSearchOpen ? (
        <div className="fixed inset-0 z-[800] bg-stone-950/60 px-4 py-6 backdrop-blur-sm">
          <div className="mx-auto flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-[32px] bg-white shadow-[0_24px_80px_rgba(20,20,20,0.22)]">
            <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-stone-900">주소 검색</p>
                <p className="mt-1 text-sm text-stone-500">
                  검색 결과를 선택하면 주소와 지역이 자동으로 채워집니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddressSearchOpen(false)}
                className="rounded-full border border-stone-300 p-2 text-stone-700"
                aria-label="주소 검색 닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden p-4">
              {addressSearchError ? (
                <div className="rounded-[24px] bg-rose-50 px-4 py-3 text-sm text-rose-900">
                  {addressSearchError}
                </div>
              ) : null}

              <div className="relative h-full min-h-[360px] overflow-hidden rounded-[24px] border border-stone-200 bg-stone-50">
                {isAddressSearchLoading ? (
                  <div className="absolute inset-0 z-10 grid place-items-center bg-stone-50/90 text-sm text-stone-500">
                    주소 검색창을 불러오는 중입니다.
                  </div>
                ) : null}

                <div ref={postcodeLayerRef} className="h-full min-h-[360px]" />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {result?.kind === "error" ? (
        <div className="fixed inset-0 z-[810] bg-stone-950/55 px-4 py-6 backdrop-blur-sm">
          <div className="mx-auto flex h-full max-w-md items-center justify-center">
            <div className="w-full rounded-[28px] bg-white p-6 shadow-[0_24px_80px_rgba(20,20,20,0.22)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-stone-900">
                    입력 내용을 확인해 주세요
                  </p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {result.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="rounded-full border border-stone-300 p-2 text-stone-700"
                  aria-label="오류 팝업 닫기"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setResult(null)}
                className="mt-6 w-full rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
