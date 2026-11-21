
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

type Customer = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
};

export default function CustomersPage() {
  const supabase = useMemo(() => createClient(), []);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("customers")
      .select("id, full_name, phone, email")
      .order("full_name", { ascending: true });

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

  const filteredCustomers = customers.filter((customer) => {
    const keyword = search.toLowerCase().trim();

    return (
      customer.full_name.toLowerCase().includes(keyword) ||
      (customer.phone ?? "").toLowerCase().includes(keyword) ||
      (customer.email ?? "").toLowerCase().includes(keyword)
    );
  });

  function startEditing(customer: Customer) {
    setEditingId(customer.id);
    setEditName(customer.full_name);
    setEditPhone(customer.phone ?? "");
    setEditEmail(customer.email ?? "");
  }

  async function saveCustomer() {
    if (!editingId || !editName.trim()) {
      setError("Vui lòng nhập họ tên khách hàng.");
      return;
    }

    setError("");

    const { error } = await supabase
      .from("customers")
      .update({
        full_name: editName.trim(),
        phone: editPhone.trim() || null,
        email: editEmail.trim() || null,
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
      "Bạn có chắc chắn muốn xóa khách hàng này không?"
    );

    if (!confirmed) return;

    setError("");

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
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
              Quản lý và theo dõi thông tin khách hàng của MONJI.
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
              placeholder="Tìm tên, số điện thoại hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-amber-600 sm:max-w-sm"
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
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-500">
                    <th className="px-4 py-4">Họ và tên</th>
                    <th className="px-4 py-4">Số điện thoại</th>
                    <th className="px-4 py-4">Email</th>
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
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full rounded-lg border px-3 py-2"
                            />
                          </td>

                          <td className="px-4 py-3">
                            <input
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              className="w-full rounded-lg border px-3 py-2"
                            />
                          </td>

                          <td className="px-4 py-3">
                            <input
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                              className="w-full rounded-lg border px-3 py-2"
                            />
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
                            {customer.full_name}
                          </td>

                          <td className="px-4 py-4 text-gray-600">
                            {customer.phone || "Chưa có"}
                          </td>

                          <td className="px-4 py-4 text-gray-600">
                            {customer.email || "Chưa có"}
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
