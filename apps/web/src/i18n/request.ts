import { locale as rootLocale } from "next/root-params";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

// The locale comes from the [locale] root segment via next/root-params rather than
// next-intl's request header, so server components stay statically prerenderable under
// Cache Components (reading headers would make every page dynamic).
export default getRequestConfig(async ({ locale: override }) => {
  const requested = override ?? (await rootLocale());
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: "Asia/Ho_Chi_Minh",
  };
});
