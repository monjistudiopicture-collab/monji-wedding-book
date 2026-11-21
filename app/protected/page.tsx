
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  Clock,
  CheckCircle2,
  Users,
  ArrowRight,
  MapPin,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

function getTodayVietnam() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(`${date}T00:00:00+07:00`));
}

function getStatus(status: string) {
  const statuses: Record<string, { label: string; color: string }> = {
    new: {
      label: "Mới",
      color: "bg-blue-100 text-blue-700",
    },
    confirmed: {
      label: "Đã xác nhận",
      color: "bg-green-100 text-green-700",
    },
    in_progress: {
      label: "Đang xử lý",
      color: "bg-yellow-100 text-yellow-700",
    },
    completed: {
      label: "Hoàn thành",
      color: "bg-purple-100 text-purple-700",
    },
    cancelled: {
      label: "Đã hủy",
      color: "bg-red-100 text-red-700",
    },
  };

  return statuses[status] ?? {
    label: status || "Chưa xác định",
    color: "bg-gray-100 text-gray-700",
  };
}

async function ProtectedDashboardContent() {
  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.getClaims();

  if (authError || !authData?.claims) {
    redirect("/auth/login");
  }

  const today = getTodayVietnam();

  const [
    { count: totalCount, error: totalError },
    { count: newCount, error: newError },
    { count: confirmedCount, error: confirmedError },
    { count: upcomingCount, error: upcomingCountError },
    { data: upcomingBookings, error: upcomingError },
  ] = await Promise.all([
    supabase
      .from("wedding_bookings")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("wedding_bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "new"),

    supabase
      .from("wedding_bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "confirmed"),

    supabase
      .from("wedding_bookings")
      .select("*", { count: "exact", head: true })
      .gte("wedding_date", today)
      .neq("status", "cancelled"),

    supabase
      .from("wedding_bookings")
      .select(
        "id, booking_code, bride_name, groom_name, wedding_date, groom_phone, status, groom_address"
      )
      .gte("wedding_date", today)
      .neq("status", "cancelled")
      .order("wedding_date", { ascending: true })
      .limit(5),
  ]);

  const databaseError =
    totalError ||
    newError ||
    confirmedError ||
    upcomingCountError ||
    upcomingError;

  const stats = [
    {
      title: "Tổng booking",
      value: totalCount ?? 0,
      icon: ClipboardList,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Booking mới",
      value: newCount ?? 0,
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      title: "Đã xác nhận",
      value: confirmedCount ?? 0,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Lịch cưới sắp tới",
      value: upcomingCount ?? 0,
      icon: CalendarDays,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">
          MONJI WEDDING BOOK / ADMIN
        </p>

        <h1 className="text-3xl font-bold tracking-tight">
          Tổng quan quản trị
        </h1>

        <p className="text-muted-foreground">
          Quản lý thông tin khách hàng và lịch cưới của MONJI Studio.
        </p>
      </div>

      {databaseError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Không thể tải đầy đủ dữ liệu booking.
          Vui lòng kiểm tra quyền truy cập Supabase và cấu trúc bảng.
          <p className="mt-1 break-words">
            {databaseError.message}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-xl border bg-background p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {stat.title}
                </p>

                <div className={`rounded-lg p-2 ${stat.bg}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>

              <p className="mt-4 text-3xl font-bold">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link
          href="/protected/bookings"
          className="group rounded-xl border bg-background p-5 transition hover:border-primary hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-3">
                <CalendarDays className="h-6 w-6 text-blue-600" />
              </div>

              <div>
                <h2 className="font-semibold">
                  Quản lý booking cưới
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Xem, tìm kiếm và quản lý lịch cưới
                </p>
              </div>
            </div>

            <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          href="/protected/customers"
          className="group rounded-xl border bg-background p-5 transition hover:border-primary hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-50 p-3">
                <Users className="h-6 w-6 text-green-600" />
              </div>

              <div>
                <h2 className="font-semibold">
                  Quản lý khách hàng
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Theo dõi danh sách khách hàng
                </p>
              </div>
            </div>

            <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
          </div>
        </Link>
      </div>

      <section className="overflow-hidden rounded-xl border bg-background">
        <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Lịch cưới sắp tới
            </h2>
            <p className="text-sm text-muted-foreground">
              Những booking có ngày tổ chức gần nhất.
            </p>
          </div>

          <Link
            href="/protected/bookings"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {!upcomingBookings?.length ? (
          <div className="p-10 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground" />

            <p className="mt-3 font-medium">
              Chưa có lịch cưới sắp tới
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Booking mới sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {upcomingBookings.map((booking) => {
              const status = getStatus(booking.status);

              return (
                <div
                  key={booking.id}
                  className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {booking.bride_name} & {booking.groom_name}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Mã: {booking.booking_code}
                    </p>

                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {booking.groom_address || "Chưa có địa chỉ"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium">
                      {formatDate(booking.wedding_date)}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}export default function ProtectedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[300px] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Đang tải dữ liệu MONJI WEDDING BOOK...
          </p>
        </div>
      }
    >
      <ProtectedDashboardContent />
    </Suspense>
  );
}
