
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function formatDate(value: string | null) {
  if (!value) return "Chưa xác định";

  return new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN");
}

function formatTime(value: string | null) {
  if (!value) return "—";
  return value.slice(0, 5);
}

function statusLabel(status: string) {
  switch (status) {
    case "new":
      return "Mới";
    case "confirmed":
      return "Đã xác nhận";
    case "cancelled":
      return "Đã hủy";
    default:
      return status || "Chưa xác định";
  }
}

function statusClass(status: string) {
  switch (status) {
    case "new":
      return "bg-blue-100 text-blue-700";
    case "confirmed":
      return "bg-green-100 text-green-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-stone-100 text-stone-700";
  }
}

async function BookingsContent() {
  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.getClaims();

  if (authError || !authData?.claims) {
    redirect("/auth/login");
  }

  const { data: bookings, error } = await supabase
    .from("wedding_bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="font-semibold text-red-700">
          Không thể tải dữ liệu booking
        </h2>
        <p className="mt-2 text-sm text-red-600">
          {error.message}
        </p>
      </div>
    );
  }

  const rows = bookings ?? [];

  const newCount = rows.filter(
    (item) => item.status === "new"
  ).length;

  const confirmedCount = rows.filter(
    (item) => item.status === "confirmed"
  ).length;

  const cancelledCount = rows.filter(
    (item) => item.status === "cancelled"
  ).length;

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
            MONJI WEDDING BOOK
          </p>
          <h1 className="mt-2 text-3xl font-bold text-stone-900">
            Quản lý booking
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            Danh sách lịch cưới được gửi từ khách hàng.
          </p>
        </div>

        <Link
          href="/protected"
          className="inline-flex items-center justify-center rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-stone-50"
        >
          ← Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-stone-500">Tổng booking</p>
          <p className="mt-2 text-3xl font-bold text-stone-900">
            {rows.length}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-stone-500">Booking mới</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {newCount}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-stone-500">Đã xác nhận</p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {confirmedCount}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-stone-500">Đã hủy</p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {cancelledCount}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">
              Danh sách khách hàng
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              {rows.length} booking trong hệ thống
            </p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-medium text-stone-700">
              Chưa có booking nào
            </p>
            <p className="mt-2 text-sm text-stone-500">
              Booking mới sẽ xuất hiện tại đây khi khách hàng gửi biểu mẫu.
            </p>
            <Link
              href="/form"
              className="mt-5 inline-block rounded-lg bg-stone-900 px-5 py-3 text-sm font-medium text-white hover:bg-stone-700"
            >
              Mở biểu mẫu khách hàng
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase text-stone-500">
                <tr>
                  <th className="whitespace-nowrap px-5 py-4">Mã booking</th>
                  <th className="whitespace-nowrap px-5 py-4">Cô dâu</th>
                  <th className="whitespace-nowrap px-5 py-4">Chú rể</th>
                  <th className="whitespace-nowrap px-5 py-4">Ngày cưới</th>
                  <th className="whitespace-nowrap px-5 py-4">Số điện thoại</th>
                  <th className="whitespace-nowrap px-5 py-4">Trạng thái</th>
                  <th className="whitespace-nowrap px-5 py-4">Ngày gửi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100">
                {rows.map((booking) => (
                  <tr key={booking.id} className="hover:bg-stone-50">
                    <td className="whitespace-nowrap px-5 py-4 font-semibold">
  <Link
    href={`/protected/bookings/${booking.id}`}
    className="text-blue-700 hover:text-blue-900 hover:underline"
  >
    {booking.booking_code || booking.id}
  </Link>
</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      {booking.bride_name || "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      {booking.groom_name || "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      {formatDate(booking.wedding_date)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      {booking.bride_phone || booking.groom_phone || "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(booking.status)}`}>
                        {statusLabel(booking.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-stone-500">
                      {booking.created_at
                        ? new Date(booking.created_at).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-stone-400">
        Dữ liệu được đọc trực tiếp từ Supabase. Khu vực này yêu cầu đăng nhập quản trị.
      </p>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-stone-500">
          Đang tải danh sách booking...
        </div>
      }
    >
      <BookingsContent />
    </Suspense>
  );
}
