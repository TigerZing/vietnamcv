import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";

describe("UI states", () => {
  it("empty state renders a heading, description and action", () => {
    render(
      <EmptyState
        title="Chưa có nội dung"
        description="Hãy quay lại sau"
        action={<button type="button">Về trang chủ</button>}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Chưa có nội dung" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Hãy quay lại sau")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Về trang chủ" }),
    ).toBeInTheDocument();
  });

  it("error state is announced as an alert", () => {
    render(<ErrorState title="Đã xảy ra lỗi" description="Thử lại sau" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Đã xảy ra lỗi");
  });

  it("loading state exposes an accessible status label", () => {
    render(<LoadingState label="Đang tải nội dung" rows={2} />);
    expect(screen.getByRole("status")).toHaveTextContent("Đang tải nội dung");
  });
});
