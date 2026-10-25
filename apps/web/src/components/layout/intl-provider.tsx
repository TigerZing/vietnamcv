"use client";

// Re-exported from a client module so the layout gets the plain client provider. The
// server variant of NextIntlClientProvider reads request config lazily, which counts as
// runtime data under Cache Components and blocks static prerendering.
export { NextIntlClientProvider as IntlProvider } from "next-intl";
