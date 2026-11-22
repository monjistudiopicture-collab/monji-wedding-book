
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function NewCustomerPage() {
  const router = useRouter();


  const [brideName, setBrideName] = useState("");
  const [groomName, setGroomName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!brideName.trim() || !groomName.trim()) {
      setError("Vui lòng nhập đầy đủ tên cô dâu và chú rể.");
      return;
    }

        setLoading(true);
    setError("");

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoading(false);
      setError("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
      return;
    }

    const { error: insertError } = await supabase
      .from("customers")
      .insert({
        bride_name: brideName.trim(),
        groom_name: groomName.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        wedding_date: weddingDate || null,
        notes: notes.trim() || null,
        status: "new",
        created_by: user.id,
      });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
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
            Tạo hồ sơ khách hàng để quản lý thông tin và gửi form cưới.
          </p>

          {error && (
            <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Tên cô dâu *
                </label>
                <input
                  type="text"
                  required
                  value={brideName}
                  onChange={(e) => setBrideName(e.target.value)}
                  placeholder="Nhập tên cô dâu"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Tên chú rể *
                </label>
                <input
                  type="text"
                  required
                  value={groomName}
                  onChange={(e) => setGroomName(e.target.value)}
                  placeholder="Nhập tên chú rể"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-amber-600"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Số điện thoại liên hệ
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

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Ngày cưới dự kiến
              </label>
              <input
                type="date"
                value={weddingDate}
                onChange={(e) => setWeddingDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Ghi chú
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Thông tin bổ sung..."
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
