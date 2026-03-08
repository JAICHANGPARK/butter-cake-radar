import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SubmissionHub } from "@/components/submission-hub";
import { createDemoDatabase } from "@/lib/demo-data";
import { buildStoreRelations } from "@/lib/utils";

vi.mock("next/dynamic", () => ({
  default: () => () => <div data-testid="location-picker-map" />,
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
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("keeps the draft values when validation fails before submit", async () => {
    const database = createDemoDatabase();
    const stores = buildStoreRelations(
      database.stores,
      database.storeImages,
      database.storeReports,
    );
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
});
