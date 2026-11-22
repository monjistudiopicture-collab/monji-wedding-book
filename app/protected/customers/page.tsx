
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

type Customer = {
  id: string;
  bride_name: string | null;
  groom_name: string | null;
  phone: string | null;
  email: string | null;
  wedding_date: string | null;
  status: string;
};

export default function CustomersPage() {
  const supabase = useMemo(() => createClient(), []);

  const [customers, setCustomers] = useState<Customer[]>([]);
    async function createBookingLink(customerId: string) {
    setCreatingCustomerId(customerId);
    setError("");
    setLinkMessage("");

    try {
      const response = await fetch("/api/booking-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customerId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Không thể tạo link.");
      }

      if (!result.link || typeof result.link !== "string") {
        throw new Error("Máy chủ không trả về link hợp lệ.");
      }

      setCustomerLinks((previous) => ({
        ...previous,
        [customerId]: result.link,
      }));

      setLinkMessage("Đã tạo link thành công. Bạn có thể sao chép để gửi khách hàng.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi tạo link."
      );
    } finally {
      setCreatingCustomerId(null);
    }
  }

  async function copyBookingLink(customerId: string) {
    const link = customerLinks[customerId];

    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      setLinkMessage("Đã sao chép link. Bạn có thể gửi cho khách hàng.");
    } catch {
      setError("Không thể tự động sao chép. Vui lòng chọn và sao chép link thủ công.");
    }
  }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
const [creatingCustomerId, setCreatingCustomerId] = useState<string | null>(null);
const [customerLinks, setCustomerLinks] = useState<Record<string, string>>({});
const [linkMessage, setLinkMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBrideName, setEditBrideName] = useState("");
  const [editGroomName, setEditGroomName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editWeddingDate, setEditWeddingDate] = useState("");

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("customers")
      .select(
        "id, bride_name, groom_name, phone, email, wedding_date, status"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setCustomers([]);
    } else {
      setCustomers((data ?? []) as Customer[]);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const keyword = search.trim().toLowerCase();

  const filteredCustomers = customers.filter((customer) => {
    return [
      customer.bride_name,
      customer.groom_name,
      customer.phone,
      customer.email,
    ].some((value) => (value ?? "").toLowerCase().includes(keyword));
  });

  function startEditing(customer: Customer) {
    setEditingId(customer.id);
    setEditBrideName(customer.bride_name ?? "");
    setEditGroomName(customer.groom_name ?? "");
    setEditPhone(customer.phone ?? "");
    setEditEmail(customer.email ?? "");
    setEditWeddingDate(customer.wedding_date ?? "");
  }

  async function saveCustomer() {
    if (!editingId) return;

    if (!editBrideName.trim() || !editGroomName.trim()) {
      setError("Vui lòng nhập tên cô dâu và chú rể.");
      return;
    }

    setError("");

    const { error } = await supabase
      .from("customers")
      .update({
        bride_name: editBrideName.trim(),
        groom_name: editGroomName.trim(),
        phone: editPhone.trim() || null,
        email: editEmail.trim() || null,
        wedding_date: editWeddingDate || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingId);

    if (error) {
      setError(error.message);
      return;
    }

    setEditingId(null);
    await loadCustomers();
  }

  async function deleteCustomer(id: string) {
    const confirmed = window.confirm(
      "Bạn có chắc chắn muốn xóa hồ sơ khách hàng này không?"
    );

    if (!confirmed) return;

    setError("");

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id);

    if (error) {
      setError(
        error.message.includes("foreign key")
          ? "Không thể xóa khách hàng vì hồ sơ này đã có liên kết form. Bạn nên giữ hồ sơ để bảo toàn lịch sử."
          : error.message
      );
      return;
    }

    await loadCustomers();
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-amber-700">
              MONJI STUDIO
            </p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              Quản lý khách hàng
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Quản lý và theo dõi hồ sơ khách hàng của MONJI.
            </p>
          </div>

          <Link
            href="/protected/customers/new"
            className="rounded-xl bg-gray-900 px-5 py-3 text-center font-medium text-white hover:bg-gray-700"
          >
            + Thêm khách hàng
          </Link>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Tổng khách hàng</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {customers.length}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Kết quả tìm kiếm</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {filteredCustomers.length}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row">
            <h2 className="text-lg font-semibold text-gray-900">
              Danh sách khách hàng
            </h2>

            <input
              type="text"
              placeholder="Tìm cô dâu, chú rể, điện thoại hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-amber-600 sm:max-w-md"
            />
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-gray-500">
              Đang tải dữ liệu khách hàng...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-medium text-gray-700">
                Chưa tìm thấy khách hàng
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Hãy thêm khách hàng mới hoặc thử từ khóa khác.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-500">
                    <th className="px-4 py-4">Cô dâu</th>
                    <th className="px-4 py-4">Chú rể</th>
                    <th className="px-4 py-4">Điện thoại</th>
                    <th className="px-4 py-4">Email</th>
                    <th className="px-4 py-4">Ngày cưới</th>
                    <th className="px-4 py-4">Trạng thái</th>
                    <th className="px-4 py-4">Link biểu mẫu</th>
                    <th className="px-4 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >
                      {editingId === customer.id ? (
                        <>
                          <td className="px-4 py-3">
                            <input
                              value={editBrideName}
                              onChange={(e) => setEditBrideName(e.target.value)}
                              className="w-36 rounded-lg border px-3 py-2"
                              placeholder="Cô dâu"
                            />
                          </td>

                          <td className="px-4 py-3">
                            <input
                              value={editGroomName}
                              onChange={(e) => setEditGroomName(e.target.value)}
                              className="w-36 rounded-lg border px-3 py-2"
                              placeholder="Chú rể"
                            />
                          </td>

                          <td className="px-4 py-3">
                            <input
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              className="w-32 rounded-lg border px-3 py-2"
                            />
                          </td>

                          <td className="px-4 py-3">
                            <input
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                              className="w-40 rounded-lg border px-3 py-2"
                            />
                          </td>

                          <td className="px-4 py-3">
                            <input
                              type="date"
                              value={editWeddingDate}
                              onChange={(e) =>
                                setEditWeddingDate(e.target.value)
                              }
                              className="rounded-lg border px-2 py-2"
                            />
                          </td>

                          <td className="px-4 py-3 text-gray-500">
                            {customer.status}
                          </td>
<td className="px-4 py-3 text-gray-400">
  Không khả dụng khi chỉnh sửa
</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={saveCustomer}
                              className="mr-3 font-medium text-green-700"
                            >
                              Lưu
                            </button>

                            <button
                              onClick={() => setEditingId(null)}
                              className="text-gray-500"
                            >
                              Hủy
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-4 font-medium text-gray-900">
                            {customer.bride_name || "Chưa có"}
                          </td>

                          <td className="px-4 py-4 font-medium text-gray-900">
                            {customer.groom_name || "Chưa có"}
                          </td>

                          <td className="px-4 py-4 text-gray-600">
                            {customer.phone || "Chưa có"}
                          </td>

                          <td className="px-4 py-4 text-gray-600">
                            {customer.email || "Chưa có"}
                          </td>

                          <td className="px-4 py-4 text-gray-600">
                            {customer.wedding_date
                              ? new Date(
                                  `${customer.wedding_date}T00:00:00`
                                ).toLocaleDateString("vi-VN")
                              : "Chưa xác định"}
                          </td>

                          <td className="px-4 py-4">
                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                              {customer.status}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-right">
                            <button
                              onClick={() => startEditing(customer)}
                              className="mr-4 font-medium text-blue-700 hover:underline"
                            >
                              Sửa
                            </button>

                            <button
                              onClick={() => deleteCustomer(customer.id)}
                              className="font-medium text-red-600 hover:underline"
                            >
                              Xóa
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
