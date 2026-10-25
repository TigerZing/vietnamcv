import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { THEME_STORAGE_KEY, themeInitScript } from "@/lib/theme";

import messages from "../../messages/vi.json";

const html = document.documentElement;

function renderToggle() {
  return render(
    <NextIntlClientProvider locale="vi" messages={messages}>
      <ThemeToggle />
    </NextIntlClientProvider>,
  );
}

describe("theme", () => {
  beforeEach(() => {
    localStorage.clear();
    html.setAttribute("data-theme", "dark");
  });

  afterEach(() => {
    html.removeAttribute("data-theme");
  });

  it("init script applies a saved theme and ignores invalid values", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    new Function(themeInitScript)();
    expect(html).toHaveAttribute("data-theme", "light");

    html.setAttribute("data-theme", "dark");
    localStorage.setItem(THEME_STORAGE_KEY, "neon");
    new Function(themeInitScript)();
    expect(html).toHaveAttribute("data-theme", "dark");
  });

  it("defaults to dark and toggles and saves the choice", async () => {
    renderToggle();
    const toLight = screen.getByRole("button", {
      name: "Chuyển sang giao diện sáng",
    });
    fireEvent.click(toLight);

    expect(html).toHaveAttribute("data-theme", "light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    fireEvent.click(
      await screen.findByRole("button", { name: "Chuyển sang giao diện tối" }),
    );
    expect(html).toHaveAttribute("data-theme", "dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("restores a saved light theme on mount", async () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    renderToggle();
    expect(html).toHaveAttribute("data-theme", "light");
    expect(
      await screen.findByRole("button", { name: "Chuyển sang giao diện tối" }),
    ).toBeInTheDocument();
  });
});
