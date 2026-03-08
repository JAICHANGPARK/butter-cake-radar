import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StorePopupContent } from "@/components/store-map";
import { createDemoDatabase } from "@/lib/demo-data";
import { buildStoreRelations } from "@/lib/utils";

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

describe("StorePopupContent", () => {
  it("keeps opening hours collapsed until the user expands them", () => {
    const database = createDemoDatabase();
    const stores = buildStoreRelations(
      database.stores,
      database.storeImages,
      database.storeReports,
    );
    const store = {
      ...stores[0],
      openingHours: "월-금 11:00-20:00\n토-일 12:00-18:00",
    };

    render(<StorePopupContent store={store} />);

    expect(screen.getByText(store.name)).toBeVisible();
    expect(screen.getByRole("button", { name: /영업시간/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByText("월-금 11:00-20:00")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /영업시간/i }));

    expect(screen.getByRole("button", { name: /영업시간/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(
      screen.getByText(/월-금 11:00-20:00\s*토-일 12:00-18:00/),
    ).toBeVisible();
  });
});
