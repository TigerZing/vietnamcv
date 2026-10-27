import type { Metadata } from "next";
import { connection } from "next/server";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import {
  AdminDashboard,
  type AdminData,
  loadAdminData,
} from "@/components/admin/admin-dashboard";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { LoadingState } from "@/components/states/loading-state";
import type { Locale } from "@/i18n/routing";
import { AdminSignedOut } from "@/lib/admin";
import { parseAdminView } from "@/lib/admin-view";
import { getAdminSession } from "@/lib/auth/admin";

type Props = PageProps<"/[locale]/admin">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "Admin",
  });
  return { title: t("title"), robots: { index: false, follow: false } };
}

/** Request-time part: reads the admin cookie, then shows the login or the dashboard. */
async function AdminGate({ params, searchParams }: Props) {
  await connection();
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const session = await getAdminSession();
  if (!session) return <AdminLoginForm />;
  const view = parseAdminView(query);
  let data: AdminData;
  try {
    data = await loadAdminData(session.token, view);
  } catch (error) {
    // An expired or refused session falls back to the login form; other errors reach
    // the route's error boundary, which offers a retry.
    if (error instanceof AdminSignedOut) return <AdminLoginForm />;
    throw error;
  }
  return (
    <AdminDashboard
      username={session.username}
      view={view}
      data={data}
      locale={locale as Locale}
    />
  );
}

export default function Page(props: Props) {
  const t = useTranslations("Loading");
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center">
      <Suspense
        fallback={
          <div className="w-full">
            <LoadingState label={t("label")} rows={4} />
          </div>
        }
      >
        <AdminGate {...props} />
      </Suspense>
    </div>
  );
}
