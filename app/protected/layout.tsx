
import Link from "next/link";
import { Suspense } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ClipboardList,
  Heart,
} from "lucide-react";

import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { hasEnvVars } from "@/lib/utils";

const navigation = [
  {
    label: "Tổng quan",
    href: "/protected",
    icon: LayoutDashboard,
  },
  {
    label: "Quản lý booking",
    href: "/protected/bookings",
    icon: CalendarDays,
  },
  {
    label: "Khách hàng",
    href: "/protected/customers",
    icon: Users,
  },
];

function Brand() {
  return (
    <Link href="/protected" className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0E7DA] text-[#745B43]">
        <Heart className="h-6 w-6" />
      </div>
      <div>
        <p className="text-base font-bold tracking-[0.12em] text-[#745B43]">
          MONJI
        </p>
        <p className="text-[10px] font-medium tracking-[0.18em] text-stone-500">
          WEDDING BOOK
        </p>
      </div>
    </Link>
  );
}

function NavigationLinks({ mobile = false }: { mobile?: boolean }) {
  return (
    <>
      {navigation.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              mobile
                ? "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-stone-500 transition hover:bg-[#F5EFE6] hover:text-[#745B43]"
                : "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-stone-600 transition hover:bg-[#F5EFE6] hover:text-[#745B43]"
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className={mobile ? "text-[10px] font-medium" : ""}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#F8F6F2] text-stone-800">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-[#EAE3D9] bg-white px-5 py-7 md:flex">
          <Brand />

          <div className="mt-10">
            <p className="mb-3 px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
              Quản lý
            </p>

            <nav className="space-y-2">
              <NavigationLinks />
            </nav>
          </div>

          <div className="mt-8 rounded-2xl bg-[#F8F5F0] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#745B43]">
              <ClipboardList className="h-4 w-4" />
              MONJI Studio
            </div>
            <p className="mt-2 text-xs leading-5 text-stone-500">
              Hệ thống quản lý lịch cưới và thông tin khách hàng.
            </p>
          </div>

          <div className="mt-auto space-y-4 pt-8">
            <Link
              href="/form"
              className="block rounded-xl border border-[#EAE3D9] px-4 py-3 text-center text-sm font-medium text-[#745B43] transition hover:bg-[#F8F5F0]"
            >
              Mở form đặt lịch
            </Link>

            <div className="border-t border-[#EAE3D9] pt-4">
              {!hasEnvVars ? (
                <EnvVarWarning />
              ) : (
                <Suspense
                  fallback={
                    <p className="text-xs text-stone-400">
                      Đang tải tài khoản...
                    </p>
                  }
                >
                  <AuthButton />
                </Suspense>
              )}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile header */}
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#EAE3D9] bg-white/95 px-4 py-3 backdrop-blur md:hidden">
            <Brand />

            {!hasEnvVars ? (
              <EnvVarWarning />
            ) : (
              <Suspense
                fallback={
                  <span className="text-xs text-stone-400">...</span>
                }
              >
                <AuthButton />
              </Suspense>
            )}
          </header>

          <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-28 sm:px-6 md:px-8 md:py-8">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#EAE3D9] bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-around">
          <NavigationLinks mobile />
        </div>
      </nav>
    </main>
  );
}
