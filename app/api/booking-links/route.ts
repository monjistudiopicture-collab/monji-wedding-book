
import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


const ADMIN_USER_ID = "7c0a6a73-47f7-49b8-bd7d-32026bb9320a";

export async function POST(request: NextRequest) {
  try {
    // 1. Xác thực phiên đăng nhập
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Bạn cần đăng nhập để thực hiện thao tác này." },
        { status: 401 }
      );
    }

    // 2. Chỉ cho phép Admin MONJI
    if (user.id !== ADMIN_USER_ID) {
      return NextResponse.json(
        { error: "Bạn không có quyền tạo link khách hàng." },
        { status: 403 }
      );
    }

    // 3. Kiểm tra dữ liệu đầu vào
    const body = await request.json();
    const customerId = body?.customerId;

    if (
      typeof customerId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        customerId
      )
    ) {
      return NextResponse.json(
        { error: "Mã khách hàng không hợp lệ." },
        { status: 400 }
      );
    }

    // 4. Kiểm tra khách hàng có tồn tại
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id")
      .eq("id", customerId)
      .maybeSingle();

    if (customerError) {
      console.error("Customer lookup failed:", customerError.message);
      return NextResponse.json(
        { error: "Không thể kiểm tra thông tin khách hàng." },
        { status: 500 }
      );
    }

    if (!customer) {
      return NextResponse.json(
        { error: "Không tìm thấy khách hàng." },
        { status: 404 }
      );
    }

    // 5. Tạo token ngẫu nhiên và chỉ lưu mã băm
    const token = randomBytes(32).toString("base64url");

    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    // 6. Lưu link vào Supabase
    const { data: linkRecord, error: insertError } = await supabase
      .from("booking_form_links")
      .insert({
        customer_id: customerId,
        token_hash: tokenHash,
        status: "created",
        created_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .select("id, customer_id, status, created_at, expires_at")
      .single();

    if (insertError) {
      console.error("Create booking link failed:", insertError.message);
      return NextResponse.json(
        { error: "Không thể tạo link. Vui lòng thử lại." },
        { status: 500 }
      );
    }

    // 7. Trả link gốc cho Admin đúng một lần
    const formUrl = `${request.nextUrl.origin}/f/${token}`;

    return NextResponse.json({
      success: true,
      message: "Tạo link thành công.",
      link: formUrl,
      data: linkRecord,
    });
  } catch (error) {
    console.error("Booking link API error:", error);

    return NextResponse.json(
      { error: "Đã xảy ra lỗi máy chủ." },
      { status: 500 }
    );
  }
}
