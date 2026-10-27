"use client";

import { useTranslations } from "next-intl";
import { useActionState, useId } from "react";

import { Button } from "@/components/ui/button";

import { adminLogin, type AdminLoginState } from "./actions";

const inputClass =
  "min-h-10 w-full rounded-md border border-border bg-surface px-3 text-base focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

export function AdminLoginForm() {
  const t = useTranslations("Admin.login");
  const [state, action, pending] = useActionState<AdminLoginState, FormData>(
    adminLogin,
    { status: "idle" },
  );
  const ids = { username: useId(), password: useId(), status: useId() };

  return (
    <form
      action={action}
      aria-describedby={ids.status}
      className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-border bg-surface p-6"
    >
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("lead")}</p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={ids.username} className="text-sm font-medium">
          {t("username")}
        </label>
        <input
          id={ids.username}
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={64}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={ids.password} className="text-sm font-medium">
          {t("password")}
        </label>
        <input
          id={ids.password}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={256}
          className={inputClass}
        />
      </div>
      <p
        id={ids.status}
        role="status"
        aria-live="polite"
        className="min-h-5 text-sm text-danger"
      >
        {state.status === "error"
          ? t(`errors.${state.reason}`, { minutes: state.retryMinutes ?? 1 })
          : null}
      </p>
      <Button type="submit" disabled={pending}>
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
