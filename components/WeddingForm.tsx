
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createClient } from "@/utils/supabase/client";

type FormData = {
  weddingType: string;
  weddingDate: string;

  brideName: string;
  groomName: string;
  bridePhone: string;
  groomPhone: string;

  brideAddress: string;
  brideMakeupStart: string;
  groomArrivalBride: string;

  groomAddress: string;
  groomDeparture: string;
  brideDepartureToGroom: string;

  restaurantAddress: string;
  restaurantName: string;
  restaurantGuestArrival: string;
  restaurantBanquetTime: string;
  extraNotes: string;
};

const initialForm: FormData = {
  weddingType: "Cưới",
  weddingDate: "2026-12-20",

  brideName: "",
  groomName: "",
  bridePhone: "",
  groomPhone: "",

  brideAddress: "",
  brideMakeupStart: "",
  groomArrivalBride: "",

  groomAddress: "",
  groomDeparture: "",
  brideDepartureToGroom: "",

  restaurantAddress: "",
  restaurantName: "",
  restaurantGuestArrival: "",
  restaurantBanquetTime: "",
  extraNotes: "",
};

function subtractMinutes(time: string, minutes: number) {
  if (!time) return "";

  const [hours, mins] = time.split(":").map(Number);
  const total = (hours * 60 + mins - minutes + 1440) % 1440;

  const resultHours = Math.floor(total / 60);
  const resultMinutes = total % 60;

  return `${String(resultHours).padStart(2, "0")}:${String(
    resultMinutes
  ).padStart(2, "0")}`;
}

function formatTime(time: string) {
  if (!time) return "Chưa xác định";
  return time;
}

type WeddingFormProps = {
  token?: string;
};

export default function WeddingForm({ token }: WeddingFormProps) {
  const supabase = useMemo(() => createClient(), []);

  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validating, setValidating] = useState(Boolean(token));
const [validLink, setValidLink] = useState(!token);

useEffect(() => {
  if (!token) return;

  let cancelled = false;

  async function validateLink() {
    try {
      const response = await fetch("/api/booking-links/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
        cache: "no-store",
      });

      const result = await response.json();

      if (cancelled) return;

      if (!response.ok || !result.success) {
        setError(result.error || "Link không hợp lệ.");
        setValidLink(false);
        return;
      }

      setForm((previous) => ({
        ...previous,
        brideName: result.customer.brideName || "",
        groomName: result.customer.groomName || "",
        weddingDate: result.customer.weddingDate || previous.weddingDate,
      }));

      setValidLink(true);
    } catch {
      if (!cancelled) {
        setError("Không thể xác thực link. Vui lòng thử lại.");
        setValidLink(false);
      }
    } finally {
      if (!cancelled) {
        setValidating(false);
      }
    }
  }

  validateLink();

  return () => {
    cancelled = true;
  };
}, [token]);
  const makeupFinish = subtractMinutes(form.groomArrivalBride, 90);
  const brideTeamArrival = subtractMinutes(makeupFinish, 15);
  const groomTeamArrival = subtractMinutes(form.groomDeparture, 90);

  function updateField<K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  setError("");

  if (token && (!validLink || validating)) {
    setError("Link chưa được xác thực hoặc không còn hiệu lực.");
    return;
  }

  if (!form.brideName.trim() || !form.groomName.trim()) {
    setError("Vui lòng nhập đầy đủ tên cô dâu và chú rể.");
    return;
  }

  if (!form.groomPhone.trim()) {
    setError("Vui lòng nhập số điện thoại chú rể.");
    return;
  }

  if (!form.groomAddress.trim()) {
    setError("Vui lòng nhập địa chỉ nhà trai.");
    return;
  }

  setLoading(true);

  try {
    const payload = {
      wedding_type: form.weddingType,
      wedding_date: form.weddingDate,

      bride_name: form.brideName.trim(),
      groom_name: form.groomName.trim(),
      bride_phone: form.bridePhone.trim() || null,
      groom_phone: form.groomPhone.trim(),

      bride_address: form.brideAddress.trim() || null,
      bride_makeup_start: form.brideMakeupStart || null,
      bride_makeup_finish: makeupFinish || null,
      bride_team_arrival: brideTeamArrival || null,

      groom_address: form.groomAddress.trim(),
      groom_departure: form.groomDeparture || null,
      groom_team_arrival: groomTeamArrival || null,
      groom_arrival_bride: form.groomArrivalBride || null,
      bride_departure_to_groom: form.brideDepartureToGroom || null,

      restaurant_address: form.restaurantAddress.trim() || null,
      restaurant_name: form.restaurantName.trim() || null,
      restaurant_guest_arrival: form.restaurantGuestArrival || null,
      restaurant_banquet_time: form.restaurantBanquetTime || null,
      extra_notes: form.extraNotes.trim() || null,
    };

    if (token) {
      const response = await fetch("/api/booking-links/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, payload }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Không thể gửi biểu mẫu.");
      }
    } else {
      const { error: insertError } = await supabase
        .from("wedding_bookings")
        .insert(payload);

      if (insertError) {
        throw new Error(insertError.message);
      }
    }

    setSuccess(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : "Không thể gửi biểu mẫu. Vui lòng thử lại."
    );
  } finally {
    setLoading(false);
  }
}

  const sectionClass =
    "rounded-2xl border border-stone-200 bg-white p-5 shadow-sm md:p-7";

  const inputClass =
    "mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-100";

  const labelClass = "block text-sm font-medium text-stone-700";

if (token && validating) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f6f1] px-4">
      <div className="text-center">
        <p className="text-lg font-semibold text-stone-800">
          MONJI STUDIO
        </p>
        <p className="mt-3 text-sm text-stone-500">
          Đang xác thực đường dẫn...
        </p>
      </div>
    </main>
  );
}

if (token && !validLink) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f6f1] px-4">
      <div className="max-w-md rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-stone-900">
          Đường dẫn không hợp lệ
        </h1>
        <p className="mt-4 text-sm leading-7 text-stone-600">
          {error || "Link đã hết hạn, bị thu hồi hoặc đã được sử dụng."}
        </p>
        <p className="mt-6 text-xs tracking-widest text-stone-400">
          MONJI STUDIO
        </p>
      </div>
    </main>
  );
}
  if (success) {
    return (
      <main className="min-h-screen bg-[#f8f6f1] px-4 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl text-green-700">
            ✓
          </div>

          <p className="mt-6 text-xs font-semibold tracking-[0.3em] text-amber-800">
            MONJI STUDIO
          </p>

          <h1 className="mt-3 text-2xl font-semibold text-stone-900">
            Gửi thông tin thành công!
          </h1>

          <p className="mt-4 leading-7 text-stone-600">
            Cảm ơn bạn đã gửi thông tin ngày cưới. MONJI đã nhận được biểu mẫu
            và sẽ liên hệ để xác nhận các thông tin cần thiết.
          </p>

          <button
            type="button"
            onClick={() => {
              setForm(initialForm);
              setSuccess(false);
            }}
            className="mt-8 rounded-xl bg-stone-900 px-6 py-3 text-sm font-medium text-white hover:bg-stone-700"
          >
            Gửi biểu mẫu khác
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f6f1] px-4 py-10 md:py-16">
      <div className="mx-auto max-w-3xl">

        <header className="mb-10 text-center">
          <p className="text-xs font-semibold tracking-[0.35em] text-amber-800">
            MONJI STUDIO
          </p>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
            Thông tin ngày cưới
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-stone-600">
            Những thông tin dưới đây sẽ giúp MONJI chuẩn bị ekip và lịch trình
            phù hợp, để lưu giữ trọn vẹn những khoảnh khắc trong ngày trọng đại
            của hai bạn.
          </p>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* LOẠI LỄ VÀ NGÀY TỔ CHỨC */}
          <section className={sectionClass}>
            <h2 className="text-xl font-semibold text-stone-900">
              Thông tin buổi lễ
            </h2>

            <div className="mt-6">
              <label className={labelClass}>Loại lễ *</label>
              <select
                required
                value={form.weddingType}
                onChange={(e) => updateField("weddingType", e.target.value)}
                className={inputClass}
              >
                <option value="Cưới">Cưới</option>
                <option value="Đính hôn">Đính hôn</option>
                <option value="Tiệc báo hỷ">Tiệc báo hỷ</option>
              </select>
            </div>

            <div className="mt-5">
              <label className={labelClass}>Ngày tổ chức *</label>
              <input
                type="date"
                required
                value={form.weddingDate}
                onChange={(e) => updateField("weddingDate", e.target.value)}
                className={inputClass}
              />
            </div>
          </section>

          {/* CÔ DÂU VÀ CHÚ RỂ */}
          <section className={sectionClass}>
            <h2 className="text-xl font-semibold text-stone-900">
              Cô dâu & chú rể
            </h2>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Tên cô dâu *</label>
                <input
                  required
                  value={form.brideName}
                  onChange={(e) => updateField("brideName", e.target.value)}
                  placeholder="Họ và tên cô dâu"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Tên chú rể *</label>
                <input
                  required
                  value={form.groomName}
                  onChange={(e) => updateField("groomName", e.target.value)}
                  placeholder="Họ và tên chú rể"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Số điện thoại cô dâu</label>
                <input
                  type="tel"
                  value={form.bridePhone}
                  onChange={(e) => updateField("bridePhone", e.target.value)}
                  placeholder="Số điện thoại cô dâu"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Số điện thoại chú rể *</label>
                <input
                  type="tel"
                  required
                  value={form.groomPhone}
                  onChange={(e) => updateField("groomPhone", e.target.value)}
                  placeholder="Số điện thoại chú rể"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* NHÀ GÁI */}
          <section className={sectionClass}>
            <h2 className="text-xl font-semibold text-stone-900">
              Nhà gái
            </h2>

            <div className="mt-6">
              <label className={labelClass}>Địa chỉ nhà gái</label>
              <textarea
                rows={3}
                value={form.brideAddress}
                onChange={(e) => updateField("brideAddress", e.target.value)}
                placeholder="Địa chỉ cụ thể hoặc link Google Maps"
                className={inputClass}
              />
              <p className="mt-2 text-xs text-stone-500">
                Nếu khó tìm, bạn có thể dán link Google Maps vào đây.
              </p>
            </div>

            <div className="mt-5">
              <label className={labelClass}>Giờ makeup (trang điểm)</label>
              <input
                type="time"
                value={form.brideMakeupStart}
                onChange={(e) =>
                  updateField("brideMakeupStart", e.target.value)
                }
                className={inputClass}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <label className={labelClass}>
                Giờ cô dâu cần makeup xong
              </label>

              <div className="mt-3 text-3xl font-semibold tabular-nums text-amber-950">
                {formatTime(makeupFinish)}
              </div>

              <p className="mt-2 text-xs leading-6 text-amber-900">
                Tự tính: trước giờ nhà trai trình lễ 1 tiếng 30 phút.
              </p>

              <p className="mt-4 text-sm leading-7 text-stone-700">
                Đây là mốc quan trọng nhất của buổi sáng. Từ giờ này ekip bắt
                đầu chụp những tấm chân dung thật đẹp của cô dâu, cùng những
                hình ảnh bên người thân, bạn bè trước khi buổi lễ diễn ra. Nếu
                makeup trễ, khoảng thời gian quý giá này sẽ bị rút ngắn hoặc bỏ
                lỡ. Bạn báo giúp chuyên viên makeup đây là giờ phải hoàn thiện,
                không phải giờ bắt đầu, để bạn ấy tính giờ bắt đầu cho kịp nhé!
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 p-5">
              <label className={labelClass}>
                Giờ ekip có mặt ở nhà gái
              </label>

              <div className="mt-3 text-2xl font-semibold tabular-nums text-stone-900">
                {formatTime(brideTeamArrival)}
              </div>

              <p className="mt-2 text-xs text-stone-500">
                Tự tính: trước giờ cô dâu makeup xong 15 phút.
              </p>
            </div>
          </section>

          {/* NHÀ TRAI */}
          <section className={sectionClass}>
            <h2 className="text-xl font-semibold text-stone-900">
              Nhà trai
            </h2>

            <div className="mt-6">
              <label className={labelClass}>Địa chỉ nhà trai *</label>
              <textarea
                required
                rows={3}
                value={form.groomAddress}
                onChange={(e) => updateField("groomAddress", e.target.value)}
                placeholder="Địa chỉ cụ thể hoặc link Google Maps"
                className={inputClass}
              />
              <p className="mt-2 text-xs text-stone-500">
                Nếu khó tìm, bạn có thể dán link Google Maps vào đây.
              </p>
            </div>

            <div className="mt-5">
              <label className={labelClass}>
                Giờ nhà trai xuất phát đến nhà gái
              </label>
              <input
                type="time"
                value={form.groomDeparture}
                onChange={(e) => updateField("groomDeparture", e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <label className={labelClass}>
                Giờ ekip có mặt ở nhà trai
              </label>

              <div className="mt-3 text-3xl font-semibold tabular-nums text-amber-950">
                {formatTime(groomTeamArrival)}
              </div>

              <p className="mt-2 text-xs text-amber-900">
                Tự tính: trước giờ nhà trai xuất phát 1 tiếng 30 phút.
              </p>

              <p className="mt-4 text-sm leading-7 text-stone-700">
                Ekip đến sớm để ghi lại những khoảnh khắc đầu tiên của ngày
                cưới bên nhà trai: chú rể chỉnh trang áo vest, cài hoa, những
                phút bên bố mẹ và gia đình cạnh mâm quả, nghi thức thắp hương
                xin phép gia tiên, rồi cả đoàn lên đường sang nhà gái làm lễ
                xin dâu. Bạn nhớ chuẩn bị sẵn tóc tai, trang phục để ekip bắt
                đầu ngay khi đến nhé!
              </p>
            </div>

            <div className="mt-5">
              <label className={labelClass}>
                Giờ nhà trai có mặt tại nhà gái & trình lễ
              </label>
              <input
                type="time"
                value={form.groomArrivalBride}
                onChange={(e) =>
                  updateField("groomArrivalBride", e.target.value)
                }
                className={inputClass}
              />
            </div>

            <div className="mt-5">
              <label className={labelClass}>
                Giờ rước dâu từ nhà gái về nhà trai
              </label>
              <input
                type="time"
                value={form.brideDepartureToGroom}
                onChange={(e) =>
                  updateField("brideDepartureToGroom", e.target.value)
                }
                className={inputClass}
              />
            </div>
          </section>

          {/* NHÀ HÀNG */}
          <section className={sectionClass}>
            <h2 className="text-xl font-semibold text-stone-900">
              Nhà hàng
            </h2>

            <div className="mt-6">
              <label className={labelClass}>Địa chỉ nhà hàng</label>
              <textarea
                rows={3}
                value={form.restaurantAddress}
                onChange={(e) =>
                  updateField("restaurantAddress", e.target.value)
                }
                placeholder="Địa chỉ hoặc link Google Maps"
                className={inputClass}
              />
            </div>

            <div className="mt-5">
              <label className={labelClass}>
                Tên nhà hàng / sảnh
              </label>
              <input
                value={form.restaurantName}
                onChange={(e) => updateField("restaurantName", e.target.value)}
                placeholder="Tên nhà hàng hoặc sảnh tiệc"
                className={inputClass}
              />
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Giờ đón khách tại nhà hàng
                </label>
                <input
                  type="time"
                  value={form.restaurantGuestArrival}
                  onChange={(e) =>
                    updateField("restaurantGuestArrival", e.target.value)
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Giờ đãi tiệc tại nhà hàng
                </label>
                <input
                  type="time"
                  value={form.restaurantBanquetTime}
                  onChange={(e) =>
                    updateField("restaurantBanquetTime", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-5">
              <label className={labelClass}>Ghi chú thêm</label>
              <textarea
                rows={4}
                value={form.extraNotes}
                onChange={(e) => updateField("extraNotes", e.target.value)}
                placeholder="Những yêu cầu hoặc thông tin MONJI cần lưu ý..."
                className={inputClass}
              />
            </div>
          </section>

          {/* SUBMIT */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 text-center shadow-sm md:p-7">
            <p className="text-sm leading-7 text-stone-600">
              Vui lòng kiểm tra lại thông tin trước khi gửi. MONJI sẽ sử dụng
              những thông tin này để chuẩn bị lịch trình và ekip cho ngày cưới
              của hai bạn.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-stone-900 px-6 py-4 text-sm font-semibold tracking-wide text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-64"
            >
              {loading ? "ĐANG GỬI THÔNG TIN..." : "GỬI THÔNG TIN NGÀY CƯỚI"}
            </button>

            <p className="mt-5 text-xs tracking-widest text-stone-400">
              MONJI STUDIO · WEDDING PHOTOGRAPHY
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
