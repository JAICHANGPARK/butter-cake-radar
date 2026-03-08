import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SubmissionHub } from "@/components/submission-hub";
import { createDemoDatabase } from "@/lib/demo-data";
import { buildStoreRelations } from "@/lib/utils";

const push = vi.fn();

vi.mock("next/dynamic", () => ({
  default: () => () => <div data-testid="location-picker-map" />,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("SubmissionHub", () => {
  const createStores = () => {
    const database = createDemoDatabase();

    return buildStoreRelations(
      database.stores,
      database.storeImages,
      database.storeReports,
    );
  };

  const seedDraftWithLocation = () => {
    window.sessionStorage.setItem(
      "butter-cake-radar:submission-draft",
      JSON.stringify({
        name: "",
        summary: "",
        address: "",
        sido: "",
        sigungu: "",
        postcode: "",
        latitude: 37.5665,
        longitude: 126.978,
        phone: "",
        openingDays: "",
        openingTime: "",
        closingTime: "",
        websiteUrl: "",
        instagramUrl: "",
        kakaoMapUrl: "",
        naverMapUrl: "",
        googleMapUrl: "",
        imageUrl: "",
        imagePreviewUrl: "",
        imageName: "",
      }),
    );
  };

  const fillRequiredFields = () => {
    fireEvent.change(screen.getByLabelText("상호명"), {
      target: { value: "버터 테스트" },
    });
    fireEvent.change(screen.getByLabelText("한 줄 소개"), {
      target: { value: "버터떡이 맛있는 가게예요" },
    });
    fireEvent.change(screen.getByPlaceholderText("도로명 주소를 권장합니다"), {
      target: { value: "서울특별시 중구 세종대로 110" },
    });
    fireEvent.change(screen.getByLabelText("시/도"), {
      target: { value: "서울특별시" },
    });
    fireEvent.change(screen.getByLabelText("시군구"), {
      target: { value: "중구" },
    });
  };

  beforeEach(() => {
    window.sessionStorage.clear();
    vi.restoreAllMocks();
    push.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps the draft values when validation fails before submit", async () => {
    const stores = createStores();
    const fetchSpy = vi.spyOn(global, "fetch");

    render(<SubmissionHub stores={stores} />);

    fireEvent.change(screen.getByLabelText("상호명"), {
      target: { value: "테스트 가게" },
    });
    fireEvent.change(screen.getByPlaceholderText("도로명 주소를 권장합니다"), {
      target: { value: "서울특별시 중구 세종대로 110" },
    });
    fireEvent.change(screen.getByLabelText("시/도"), {
      target: { value: "서울특별시" },
    });
    fireEvent.change(screen.getByLabelText("시군구"), {
      target: { value: "중구" },
    });

    fireEvent.click(screen.getByRole("button", { name: "가게 등록하기" }));

    expect(
      await screen.findByText("한 줄 소개은(는) 5자 이상 입력해 주세요."),
    ).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByLabelText("상호명")).toHaveValue("테스트 가게");
    expect(screen.getByPlaceholderText("도로명 주소를 권장합니다")).toHaveValue(
      "서울특별시 중구 세종대로 110",
    );
    expect(screen.getByLabelText("시/도")).toHaveValue("서울특별시");
    expect(screen.getByLabelText("시군구")).toHaveValue("중구");
  });

  it("shows a success popup and lets the user close it", async () => {
    const stores = createStores();
    seedDraftWithLocation();

    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: "가게가 등록되었습니다.",
          store: { id: "store-123" },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    render(<SubmissionHub stores={stores} />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: "가게 등록하기" }));

    expect(
      await screen.findByText("가게 등록이 완료되었습니다"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "확인" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "지도로 이동" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "확인" }));
    expect(
      screen.queryByText("가게 등록이 완료되었습니다"),
    ).not.toBeInTheDocument();
  });

  it("shows a generic error when the store API returns an empty body", async () => {
    const stores = createStores();
    seedDraftWithLocation();

    vi.spyOn(global, "fetch").mockResolvedValue(new Response(null, { status: 500 }));

    render(<SubmissionHub stores={stores} />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: "가게 등록하기" }));

    expect(
      await screen.findByText("가게 등록 중 오류가 발생했습니다."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Unexpected end of JSON input/i),
    ).not.toBeInTheDocument();
  });

  it("moves to the map from the success popup", async () => {
    const stores = createStores();
    seedDraftWithLocation();

    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: "가게가 등록되었습니다.",
          store: { id: "store-123" },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    render(<SubmissionHub stores={stores} />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: "가게 등록하기" }));

    expect(
      await screen.findByText("가게 등록이 완료되었습니다"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "지도로 이동" }));
    expect(push).toHaveBeenCalledWith("/");
  });
});
