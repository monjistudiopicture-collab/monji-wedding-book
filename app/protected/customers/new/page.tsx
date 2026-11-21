
"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  Users,
  Phone,
  Save,
  Loader2,
  FileText,
} from "lucide-react";

type FormData = {
  event_type: string;
  event_date: string;
  bride_name: string;
  groom_name: string;
  bride_phone: string;
  groom_phone: string;
  bride_house_address: string;
  bride_maps_url: string;
  bride_makeup_time: string;
  groom_departure_time: string;
  groom_house_address: string;
  groom_maps_url: string;
  groom_arrival_bride_house_time: string;
  restaurant_address: string;
  restaurant_name: string;
  guest_arrival_time: string;
  banquet_time: string;
  extra_notes: string;
  source: string;
  status: string;
};

const initialForm: FormData = {
  event_type: "Cưới",
  event_date: "",
  bride_name: "",
  groom_name: "",
  bride_phone: "",
  groom_phone: "",
  bride_house_address: "",
  bride_maps_url: "",
  bride_makeup_time: "07:30",
  groom_departure_time: "",
  groom_house_address: "",
  groom_maps_url: "",
  groom_arrival_bride_house_time: "",
  restaurant_address: "",
  restaurant_name: "",
  guest_arrival_time: "",
  banquet_time: "",
  extra_notes: "",
  source: "",
  status: "new",
};

function addMinutes(time: string, minutes: number) {
  if (!time) return "";

  const [hours, mins] = time.split(":").map(Number);
  const date = new Date(2000, 0, 1, hours, mins + minutes);

  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

function subtractMinutes(time: string, minutes: number) {
  return addMinutes(time, -minutes);
}

function formatTime(time: string) {
  if (!time) return "Chưa xác định";
  return time;
}

export default function NewCustomerPage() {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Tự động tính giờ theo lịch trình
  const brideMakeupDone = useMemo(
    () => subtractMinutes(form.groom_arrival_bride_house_time, 90),
    [form.groom_arrival_bride_house_time]
  );

  const brideTeamArrival = useMemo(
    () => subtractMinutes(brideMakeupDone, 15),
    [brideMakeupDone]
  );

  const groomTeamArrival = useMemo(
    () => subtractMinutes(form.groom_departure_time, 90),
    [form.groom_departure_time]
  );

  function updateField(name: keyof FormData, value: string) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");

    if (!form.event_date) {
      setErrorMessage("Vui lòng chọn ngày tổ chức.");
      return;
    }

    if (!form.bride_name.trim() && !form.groom_name.trim()) {
      setErrorMessage("Vui lòng nhập tên cô dâu hoặc chú rể.");
      return;
    }

    if (!form.groom_name.trim()) {
      setErrorMessage("Vui lòng nhập tên chú rể.");
      return;
    }

    if (!form.groom_phone.trim()) {
      setErrorMessage("Vui lòng nhập số điện thoại chú rể.");
      return;
    }

    if (!form.groom_house_address.trim()) {
      setErrorMessage("Vui lòng nhập địa chỉ nhà trai.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErrorMessage("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        setLoading(false);
        return;
      }

      // 1. Tạo hồ sơ khách hàng trong CRM
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .insert({
          bride_name: form.bride_name.trim() || null,
          groom_name: form.groom_name.trim(),
          phone: form.groom_phone.trim(),
          email: null,
          wedding_date: form.event_date,
          source: form.source || null,
          status: form.status,
          notes: form.extra_notes.trim() || null,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (customerError || !customer) {
        setErrorMessage(
          customerError?.message || "Không thể tạo hồ sơ khách hàng."
        );
        setLoading(false);
        return;
      }

      // 2. Lưu lịch trình ngày cưới
      const { error: detailError } = await supabase
        .from("wedding_details")
        .insert({
          customer_id: customer.id,
          event_type: form.event_type,
          event_date: form.event_date,

          bride_name: form.bride_name.trim() || null,
          groom_name: form.groom_name.trim(),
          bride_phone: form.bride_phone.trim() || null,
          groom_phone: form.groom_phone.trim(),

          bride_house_address: form.bride_house_address.trim() || null,
          bride_maps_url: form.bride_maps_url.trim() || null,
          bride_makeup_time: form.bride_makeup_time || null,
          bride_makeup_done_time: brideMakeupDone || null,
          bride_team_arrival_time: brideTeamArrival || null,

          groom_house_address: form.groom_house_address.trim(),
          groom_maps_url: form.groom_maps_url.trim() || null,
          groom_departure_time: form.groom_departure_time || null,
          groom_team_arrival_time: groomTeamArrival || null,
          groom_arrival_bride_house_time:
            form.groom_arrival_bride_house_time || null,
          groom_departure_bride_house_time: null,

          restaurant_address: form.restaurant_address.trim() || null,
          restaurant_name: form.restaurant_name.trim() || null,
          guest_arrival_time: form.guest_arrival_time || null,
          banquet_time: form.banquet_time || null,

          extra_notes: form.extra_notes.trim() || null,
          created_by: user.id,
        });

      if (detailError) {
        setErrorMessage(
          "Hồ sơ CRM đã được tạo nhưng lịch trình cưới chưa lưu được: " +
            detailError.message +
            ". Mã khách hàng: " +
            customer.id
        );
        setLoading(false);
        return;
      }

      router.push("/protected/customers");
      router.refresh();
    } catch {
      setErrorMessage("Đã xảy ra lỗi. Vui lòng thử lại.");
      setLoading(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-[#777064] bg-transparent px-3 py-3 text-sm text-white outline-none transition placeholder:text-[#aaa398] focus:border-[#c6a875] focus:ring-1 focus:ring-[#c6a875]";

  const labelClass = "text-sm font-semibold text-[#f4eee3]";

  const sectionClass =
    "rounded-2xl border border-[#70695e] p-4 sm:p-6";

  function SectionTitle({
    icon,
    title,
    description,
  }: {
    icon: React.ReactNode;
    title: string;
    description?: string;
  }) {
    return (
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#39352d] text-[#c6a875]">
          {icon}
        </div>
        <div>
          <h2 className="font-semibold text-[#fffaf1]">{title}</h2>
          {description && (
            <p className="mt-1 text-xs text-[#bcb3a5]">{description}</p>
          )}
        </div>
      </div>
    );
  }

  function TextField({
    label,
    name,
    placeholder,
    required,
    type = "text",
    full = false,
  }: {
    label: string;
    name: keyof FormData;
    placeholder?: string;
    required?: boolean;
    type?: string;
    full?: boolean;
  }) {
    return (
      <div className={full ? "sm:col-span-2" : ""}>
        <label className={labelClass}>
          {label} {required && <span className="text-[#d6b47e]">*</span>}
        </label>
        <input
          className={inputClass}
          type={type}
          value={form[name]}
          onChange={(e) => updateField(name, e.target.value)}
          placeholder={placeholder || ""}
          required={required}
        />
      </div>
    );
  }

  function TimeField({
    label,
    name,
    placeholder,
  }: {
    label: string;
    name: keyof FormData;
    placeholder?: string;
  }) {
    return (
      <div>
        <label className={labelClass}>{label}</label>
        <input
          className={inputClass}
          type="time"
          value={form[name]}
          onChange={(e) => updateField(name, e.target.value)}
          placeholder={placeholder}
        />
      </div>
    );
  }

  function CalculatedTime({
    label,
    value,
    note,
  }: {
    label: string;
    value: string;
    note: string;
  }) {
    return (
      <div>
        <label className={labelClass}>{label}</label>
        <div className="mt-2 rounded-xl border border-[#a58b65] bg-[#39352d] px-3 py-3 text-sm text-[#e4c99d]">
          <Clock3 className="mr-2 inline-block" size={15} />
          {formatTime(value)}
        </div>
        <p className="mt-2 text-xs leading-5 text-[#bcb3a5]">{note}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#302d27] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/protected/customers"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#c6a875] transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách khách hàng
        </Link>

        <div className="mb-7">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#c6a875]">
            MONJI WEDDING BOOK
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#fffaf1] sm:text-4xl">
            THÔNG TIN NGÀY CƯỚI
          </h1>
          <p className="mt-2 text-sm text-[#d0c8bb]">
            Hai bạn điền giúp MONJI lịch trình để ekip chuẩn bị chu đáo nhé!
          </p>
          <p className="mt-3 text-xs text-[#bcb3a5]">
            Mục có dấu <span className="text-[#d6b47e]">*</span> là cần điền
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* THÔNG TIN NGÀY CƯỚI */}
          <section className={sectionClass}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Loại lễ</label>
                <select
                  className={inputClass}
                  value={form.event_type}
                  onChange={(e) =>
                    updateField("event_type", e.target.value)
                  }
                >
                  <option className="bg-[#302d27]" value="Cưới">Cưới</option>
                  <option className="bg-[#302d27]" value="Ăn hỏi">Ăn hỏi</option>
                  <option className="bg-[#302d27]" value="Vu quy">Vu quy</option>
                  <option className="bg-[#302d27]" value="Tân hôn">Tân hôn</option>
                  <option className="bg-[#302d27]" value="Khác">Khác</option>
                </select>
              </div>

              <TextField
                label="Ngày tổ chức"
                name="event_date"
                type="date"
                required
              />
            </div>

            <p className="mt-3 text-xs text-[#bcb3a5]">
              Vui lòng chọn chính xác ngày tổ chức để MONJI sắp xếp lịch ekip.
            </p>
          </section>

          {/* CÔ DÂU CHÚ RỂ */}
          <section className={sectionClass}>
            <SectionTitle
              icon={<Users size={20} />}
              title="CÔ DÂU & CHÚ RỂ"
              description="Thông tin liên hệ của hai bạn"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                label="Tên cô dâu"
                name="bride_name"
                placeholder="Nhập tên cô dâu"
              />
              <TextField
                label="Tên chú rể"
                name="groom_name"
                placeholder="Nhập tên chú rể"
                required
              />
              <TextField
                label="Số điện thoại cô dâu"
                name="bride_phone"
                placeholder="Nhập số điện thoại"
                type="tel"
              />
              <TextField
                label="Số điện thoại chú rể"
                name="groom_phone"
                placeholder="Nhập số điện thoại"
                type="tel"
                required
              />
            </div>
          </section>

          {/* NHÀ GÁI */}
          <section className={sectionClass}>
            <SectionTitle
              icon={<MapPin size={20} />}
              title="NHÀ GÁI"
              description="Địa điểm chuẩn bị và thời gian makeup"
            />

            <div className="space-y-4">
              <TextField
                label="Địa chỉ nhà gái"
                name="bride_house_address"
                placeholder="Nhập địa chỉ nhà gái"
                full
              />
              <TextField
                label="Link Google Maps nhà gái"
                name="bride_maps_url"
                placeholder="Dán link Google Maps nếu có"
                full
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TimeField
                  label="Giờ makeup (trang điểm)"
                  name="bride_makeup_time"
                />
                <CalculatedTime
                  label="Giờ cô dâu cần makeup xong"
                  value={brideMakeupDone}
                  note="Tự tính: trước giờ nhà trai đến nhà gái 1 tiếng 30 phút."
                />
                <CalculatedTime
                  label="Giờ ekip có mặt tại nhà gái"
                  value={brideTeamArrival}
                  note="Tự tính: trước giờ cô dâu makeup xong 15 phút."
                />
              </div>
            </div>
          </section>

          {/* NHÀ TRAI */}
          <section className={sectionClass}>
            <SectionTitle
              icon={<MapPin size={20} />}
              title="NHÀ TRAI"
              description="Lịch trình xuất phát và đón dâu"
            />

            <div className="space-y-4">
              <TextField
                label="Địa chỉ nhà trai"
                name="groom_house_address"
                placeholder="Nhập địa chỉ nhà trai"
                required
                full
              />
              <TextField
                label="Link Google Maps nhà trai"
                name="groom_maps_url"
                placeholder="Dán link Google Maps nếu có"
                full
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TimeField
                  label="Giờ nhà trai xuất phát đến nhà gái"
                  name="groom_departure_time"
                />
                <CalculatedTime
                  label="Giờ ekip có mặt tại nhà trai"
                  value={groomTeamArrival}
                  note="Tự tính: trước giờ nhà trai xuất phát 1 tiếng 30 phút."
                />
                <TimeField
                  label="Giờ nhà trai có mặt tại nhà gái"
                  name="groom_arrival_bride_house_time"
                />
                <div>
                  <label className={labelClass}>
                    Giờ cô dâu cần makeup xong
                  </label>
                  <div className="mt-2 rounded-xl border border-[#a58b65] bg-[#39352d] px-3 py-3 text-sm text-[#e4c99d]">
                    {formatTime(brideMakeupDone)}
                  </div>
                  <p className="mt-2 text-xs text-[#bcb3a5]">
                    Tự tính từ giờ nhà trai đến nhà gái.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* NHÀ HÀNG */}
          <section className={sectionClass}>
            <SectionTitle
              icon={<CalendarDays size={20} />}
              title="NHÀ HÀNG"
              description="Thông tin địa điểm tổ chức tiệc"
            />

            <div className="space-y-4">
              <TextField
                label="Địa chỉ nhà hàng"
                name="restaurant_address"
                placeholder="Nhập địa chỉ nhà hàng"
                full
              />
              <TextField
                label="Tên nhà hàng / sảnh"
                name="restaurant_name"
                placeholder="Nhập tên nhà hàng hoặc sảnh"
                full
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TimeField
                  label="Giờ đón khách tại nhà hàng"
                  name="guest_arrival_time"
                />
                <TimeField
                  label="Giờ đãi tiệc tại nhà hàng"
                  name="banquet_time"
                />
              </div>
            </div>
          </section>

          {/* THÔNG TIN CRM */}
          <section className={sectionClass}>
            <SectionTitle
              icon={<FileText size={20} />}
              title="THÔNG TIN TƯ VẤN"
              description="Nguồn khách hàng và trạng thái hồ sơ"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Nguồn khách hàng</label>
                <select
                  className={inputClass}
                  value={form.source}
                  onChange={(e) => updateField("source", e.target.value)}
                >
                  <option className="bg-[#302d27]" value="">Chọn nguồn khách</option>
                  <option className="bg-[#302d27]" value="Facebook">Facebook</option>
                  <option className="bg-[#302d27]" value="Instagram">Instagram</option>
                  <option className="bg-[#302d27]" value="TikTok">TikTok</option>
                  <option className="bg-[#302d27]" value="Giới thiệu">Người quen giới thiệu</option>
                  <option className="bg-[#302d27]" value="Website">Website</option>
                  <option className="bg-[#302d27]" value="Khác">Khác</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Trạng thái khách hàng</label>
                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(e) => updateField("status", e.target.value)}
                >
                  <option className="bg-[#302d27]" value="new">Khách mới</option>
                  <option className="bg-[#302d27]" value="consulting">Đang tư vấn</option>
                  <option className="bg-[#302d27]" value="booked">Đã đặt dịch vụ</option>
                  <option className="bg-[#302d27]" value="completed">Hoàn thành</option>
                  <option className="bg-[#302d27]" value="cancelled">Đã hủy</option>
                </select>
              </div>
            </div>
          </section>

          {/* GHI CHÚ */}
          <section className={sectionClass}>
            <SectionTitle
              icon={<FileText size={20} />}
              title="GHI CHÚ THÊM"
              description="Yêu cầu đặc biệt dành cho ekip MONJI"
            />

            <textarea
              className={`${inputClass} min-h-32 resize-y`}
              value={form.extra_notes}
              onChange={(e) => updateField("extra_notes", e.target.value)}
              placeholder="Yêu cầu đặc biệt, lưu ý cho ekip..."
            />
          </section>

          {errorMessage && (
            <div className="rounded-xl border border-red-400/40 bg-red-950/50 p-4 text-sm leading-6 text-red-200">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-[#c6a875] bg-[#171614] px-6 py-4 text-sm font-semibold text-[#f8f1e5] transition hover:bg-[#c6a875] hover:text-[#211e18] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Đang lưu thông tin...
              </>
            ) : (
              <>
                <Save size={18} />
                GỬI THÔNG TIN CHO MONJI
              </>
            )}
          </button>

          <p className="pb-5 text-center text-xs tracking-wider text-[#aaa092]">
            MONJI WEDDING BOOK · WEDDING PLANNING
          </p>
        </form>
      </div>
    </div>
  );
}
