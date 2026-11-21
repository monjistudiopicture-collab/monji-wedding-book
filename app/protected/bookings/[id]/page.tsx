
import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="border-b border-stone-100 py-3">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 font-medium text-stone-900">
        {value || "Chưa cung cấp"}
      </p>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN");
}

function formatTime(value: string | null) {
  return value ? value.slice(0, 5) : null;
}

async function BookingDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.getClaims();

  if (authError || !authData?.claims) {
    redirect("/auth/login");
  }

  const { data: booking, error } = await supabase
    .from("wedding_bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        Không thể tải thông tin booking: {error.message}
      </div>
    );
  }

  if (!booking) notFound();

  return (
    <div className="w-full space-y-7">
      <div>
        <Link
          href="/protected/bookings"
          className="text-sm text-stone-500 hover:text-stone-900"
        >
          ← Quay lại danh sách booking
        </Link>

        <p className="mt-5 text-sm uppercase tracking-widest text-stone-500">
          MONJI WEDDING BOOK
        </p>

        <h1 className="mt-2 text-3xl font-bold text-stone-900">
          Chi tiết booking
        </h1>

        <p className="mt-2 font-medium text-blue-700">
          {booking.booking_code || booking.id}
        </p>
      </div>

      <section className="rounded-xl border bg-white p-5">
        <h2 className="text-lg font-semibold">Thông tin buổi lễ</h2>
        <div className="mt-3 grid gap-x-8 sm:grid-cols-2">
          <DetailItem
            label="Loại lễ"
            value={booking.wedding_type}
          />
          <DetailItem
            label="Ngày cưới"
            value={formatDate(booking.wedding_date)}
          />
          <DetailItem
            label="Trạng thái"
            value={booking.status}
          />
          <DetailItem
            label="Ngày gửi booking"
            value={
              booking.created_at
                ? new Date(booking.created_at).toLocaleString("vi-VN")
                : null
            }
          />
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5">
        <h2 className="text-lg font-semibold">Thông tin cô dâu</h2>
        <div className="mt-3 grid gap-x-8 sm:grid-cols-2">
          <DetailItem label="Họ tên" value={booking.bride_name} />
          <DetailItem label="Số điện thoại" value={booking.bride_phone} />
          <DetailItem label="Địa chỉ" value={booking.bride_address} />
          <DetailItem
            label="Giờ bắt đầu trang điểm"
            value={formatTime(booking.bride_makeup_start)}
          />
          <DetailItem
            label="Giờ hoàn thành trang điểm"
            value={formatTime(booking.bride_makeup_finish)}
          />
          <DetailItem
            label="Giờ ekip cô dâu đến"
            value={formatTime(booking.bride_team_arrival)}
          />
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5">
        <h2 className="text-lg font-semibold">Thông tin chú rể</h2>
        <div className="mt-3 grid gap-x-8 sm:grid-cols-2">
          <DetailItem label="Họ tên" value={booking.groom_name} />
          <DetailItem label="Số điện thoại" value={booking.groom_phone} />
          <DetailItem label="Địa chỉ" value={booking.groom_address} />
          <DetailItem
            label="Giờ chú rể xuất phát"
            value={formatTime(booking.groom_departure)}
          />
          <DetailItem
            label="Giờ ekip chú rể đến"
            value={formatTime(booking.groom_team_arrival)}
          />
          <DetailItem
            label="Giờ chú rể đến nhà gái"
            value={formatTime(booking.groom_arrival_bride)}
          />
          <DetailItem
            label="Giờ cô dâu di chuyển sang nhà trai"
            value={formatTime(booking.bride_departure_to_groom)}
          />
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5">
        <h2 className="text-lg font-semibold">Thông tin nhà hàng</h2>
        <div className="mt-3 grid gap-x-8 sm:grid-cols-2">
          <DetailItem
            label="Tên nhà hàng"
            value={booking.restaurant_name}
          />
          <DetailItem
            label="Địa chỉ nhà hàng"
            value={booking.restaurant_address}
          />
          <DetailItem
            label="Giờ khách đến"
            value={formatTime(booking.restaurant_guest_arrival)}
          />
          <DetailItem
            label="Giờ đãi tiệc"
            value={formatTime(booking.restaurant_banquet_time)}
          />
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5">
        <h2 className="text-lg font-semibold">Ghi chú bổ sung</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm text-stone-700">
          {booking.extra_notes || "Không có ghi chú"}
        </p>
      </section>

      <Link
        href="/protected/bookings"
        className="inline-flex rounded-lg border px-5 py-3 text-sm font-medium hover:bg-stone-50"
      >
        ← Quay lại danh sách
      </Link>
    </div>
  );
}

export default function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-stone-500">
          Đang tải thông tin booking...
        </div>
      }
    >
      <BookingDetail params={params} />
    </Suspense>
  );
}
