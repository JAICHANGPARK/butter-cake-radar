import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDemoDatabase } from "@/lib/demo-data";
import { buildStoreRelations } from "@/lib/utils";
import { MapBrowser } from "@/components/map-browser";
import type { RegionRecord } from "@/lib/types";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/",
}));

vi.mock("next/image", () => ({
  default: (
    rawProps: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean },
  ) => {
    const props = { ...rawProps };
    delete props.fill;

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img {...props} alt={props.alt ?? ""} />
    );
  },
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

vi.mock("@/components/store-map", () => ({
  StoreMap: () => <div data-testid="map-canvas" />,
}));

describe("MapBrowser", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("filters stores by region without a nearby button", async () => {
    const database = createDemoDatabase();
    const stores = buildStoreRelations(
      database.stores,
      database.storeImages,
      database.storeReports,
    );

    render(
      <MapBrowser
        stores={stores}
        filters={{}}
        regions={[] as RegionRecord[]}
        isDemoMode
      />,
    );

    act(() => {
      window.dispatchEvent(new Event("butter-map:open-search"));
    });

    fireEvent.change(await screen.findByLabelText("시/도"), {
      target: { value: "서울특별시" },
    });
    fireEvent.click(screen.getByRole("button", { name: "결과 보기" }));

    expect(push).toHaveBeenCalledWith("/?sido=%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C");
    expect(screen.queryByRole("button", { name: "내 주변" })).not.toBeInTheDocument();
  });
});
