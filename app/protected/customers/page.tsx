
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Users,
  UserRound,
  CalendarDays,
  Phone,
  Mail,
  ClipboardList,
  Plus,
} from "lucide-react";

type Customer = {
  id: string;
  bride_name: string | null;
  groom_name: string | null;
  phone: string | null;
  email: string | null;
  wedding_date: string | null;
  status: string;
  source: string | null;
  created_at: string;
};

const statusConfig: Record<string, { label: string; className: string }> = {
  new: { label: "Khách mới", className: "bg-blue-50 text-blue-700" },
  consulting: { label: "Đang tư vấn", className: "bg-amber-50 text-amber-700" },
  booked: { label: "Đã đặt dịch vụ", className: "bg-emerald-50 text-emerald-700" },
  completed: { label: "Hoàn thành", className: "bg-gray-100 text-gray-700" },
  cancelled: { label: "Đã hủy", className: "bg-red-50 text-red-700" },
};

function formatDate(date: string | null) {
  if (!date) return "Chưa xác định";
  return new Date(`${date}T00:00:00`).toLocaleDateString("vi-VN");
}

function getCustomerName(customer: Customer) {
  return [customer.bride_name, customer.groom_name]
    .filter(Boolean)
    .join(" & ") || "Khách hàng chưa có tên";
}

export default async function CustomersPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, bride_name, groom_name, phone, email, wedding_date, status, source, created_at"
    )
    .order("created_at", { ascending: false });

  const customers = (data ?? []) as Customer[];

  const totalCustomers = customers.length;
  const newCustomers = customers.filter((c) => c.status === "new").length;
  const consultingCustomers = customers.filter((c) => c.status === "consulting").length;
  const bookedCustomers = customers.filter((c) => c.status === "booked").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#a58b65]">
            MONJI WEDDING BOOK
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#292722]">
            Khách hàng
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Quản lý thông tin cô dâu, chú rể và lịch sử tư vấn.
          </p>
        </div>

        <Link
          href="/protected/customers/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#292722] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#a58b65]"
        >
          <Plus size={17} />
          Thêm khách hàng
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Không thể tải danh sách khách hàng: {error.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Tổng khách hàng" value={totalCustomers} icon={<Users size={20} />} />
        <StatCard title="Khách hàng mới" value={newCustomers} icon={<UserRound size={20} />} />
        <StatCard title="Đang tư vấn" value={consultingCustomers} icon={<ClipboardList size={20} />} />
        <StatCard title="Đã đặt dịch vụ" value={bookedCustomers} icon={<CalendarDays size={20} />} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#e9e4dc] bg-white">
        <div className="flex flex-col gap-2 border-b border-[#eeeae3] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-[#292722]">Danh sách khách hàng</h2>
            <p className="mt-1 text-xs text-gray-500">
              Dữ liệu được đồng bộ từ Supabase.
            </p>
          </div>
          <span className="text-sm text-gray-500">
            {totalCustomers} khách hàng
          </span>
        </div>

        {customers.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f6f3ed] text-[#a58b65]">
              <Users size={25} />
            </div>
            <h3 className="mt-4 font-medium text-[#292722]">Chưa có khách hàng</h3>
            <p className="mt-2 max-w-sm text-sm text-gray-500">
              Danh sách khách hàng đang trống. Hãy tạo hồ sơ khách hàng đầu tiên.
            </p>
            <Link
              href="/protected/customers/new"
              className="mt-5 rounded-xl bg-[#292722] px-5 py-3 text-sm font-medium text-white hover:bg-[#a58b65]"
            >
              Thêm khách hàng đầu tiên
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-[#faf9f6] text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-medium">Khách hàng</th>
                  <th className="px-5 py-4 font-medium">Liên hệ</th>
                  <th className="px-5 py-4 font-medium">Ngày cưới</th>
                  <th className="px-5 py-4 font-medium">Nguồn</th>
                  <th className="px-5 py-4 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeae3]">
                {customers.map((customer) => {
                  const status = statusConfig[customer.status] ?? {
                    label: customer.status,
                    className: "bg-gray-100 text-gray-700",
                  };

                  return (
                    <tr key={customer.id} className="transition-colors hover:bg-[#fcfbf9]">
                      <td className="px-5 py-4">
                        <p className="font-medium text-[#292722]">
                          {getCustomerName(customer)}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          Mã: {customer.id.slice(0, 8)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          {customer.phone && (
                            <p className="flex items-center gap-2 text-gray-600">
                              <Phone size={13} />
                              {customer.phone}
                            </p>
                          )}
                          {customer.email && (
                            <p className="flex items-center gap-2 text-gray-500">
                              <Mail size={13} />
                              {customer.email}
                            </p>
                          )}
                          {!customer.phone && !customer.email && (
                            <span className="text-gray-400">Chưa có thông tin</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {formatDate(customer.wedding_date)}
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {customer.source || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-400">
        MONJI WEDDING BOOK · CUSTOMER MANAGEMENT
      </p>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#e9e4dc] bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{title}</p>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f6f3ed] text-[#a58b65]">
          {icon}
        </div>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-[#292722]">
        {value}
      </p>
    </div>
  );
}
