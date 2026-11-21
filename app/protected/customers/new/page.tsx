
"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function NewCustomerPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!fullName.trim()) {
      setError("Vui lòng nhập họ và tên khách hàng.");
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await supabase
      .from("customers")
      .insert({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
      });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/protected/customers");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-3xl">

        <Link
          href="/protected/customers"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Quay lại danh sách khách hàng
        </Link>

        <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm md:p-8">

          <p className="text-sm font-medium uppercase tracking-widest text-amber-700">
            MONJI STUDIO
          </p>

          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            Thêm khách hàng mới
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Nhập thông tin để tạo hồ sơ khách hàng.
          </p>

          {error && (
            <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Họ và tên *
              </label>

              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên khách hàng"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Số điện thoại
              </label>

              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-amber-600"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">

              <Link
                href="/protected/customers"
                className="rounded-xl border border-gray-300 px-6 py-3 text-center font-medium text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-gray-900 px-6 py-3 font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Đang lưu..." : "Lưu khách hàng"}
              </button>

            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
