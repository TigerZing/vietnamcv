import type { routing } from "./routing";
import type messages from "../../messages/vi.json";

// Type-checks every translation key against the Vietnamese source messages.
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
