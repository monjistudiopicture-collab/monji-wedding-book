
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_USER_ID = "7c0a6a73-47f7-49b8-bd7d-32026bb9320a";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
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

    // 2. Chỉ Admin MONJI được phép thao tác
    if (user.id !== ADMIN_USER_ID) {
      return NextResponse.json(
        { error: "Bạn không có quyền quản lý link." },
        { status: 403 }
      );
    }

    // 3. Kiểm tra ID
    const { id } = await params;

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id
      )
    ) {
      return NextResponse.json(
        { error: "Mã link không hợp lệ." },
        { status: 400 }
      );
    }

    // 4. Kiểm tra hành động
    const body = await request.json();
    const action = body?.action;

    if (action !== "sent" && action !== "revoked") {
      return NextResponse.json(
        { error: "Thao tác không hợp lệ." },
        { status: 400 }
      );
    }

    // 5. Đọc trạng thái hiện tại
    const { data: link, error: lookupError } = await supabase
      .from("booking_form_links")
      .select("id, status")
      .eq("id", id)
      .maybeSingle();

    if (lookupError) {
      console.error("Booking link lookup failed:", lookupError.message);

      return NextResponse.json(
        { error: "Không thể kiểm tra link." },
        { status: 500 }
      );
    }

    if (!link) {
      return NextResponse.json(
        { error: "Không tìm thấy link." },
        { status: 404 }
      );
    }

    // 6. Kiểm tra quy tắc chuyển trạng thái
    if (action === "sent" && link.status !== "created") {
      return NextResponse.json(
        { error: "Chỉ link chưa gửi mới có thể đánh dấu đã gửi." },
        { status: 409 }
      );
    }

    if (
      action === "revoked" &&
      link.status !== "created" &&
      link.status !== "sent"
    ) {
      return NextResponse.json(
        { error: "Chỉ link chưa gửi hoặc đã gửi mới có thể thu hồi." },
        { status: 409 }
      );
    }

    // 7. Cập nhật trạng thái
    const now = new Date().toISOString();

    const updateData =
      action === "sent"
        ? {
            status: "sent",
            sent_at: now,
            updated_at: now,
          }
        : {
            status: "revoked",
            revoked_at: now,
            updated_at: now,
          };

    const { data: updatedLink, error: updateError } = await supabase
      .from("booking_form_links")
      .update(updateData)
      .eq("id", id)
      .eq("status", link.status)
      .select(
        "id, customer_id, booking_id, status, sent_at, completed_at, expires_at, revoked_at, created_at, updated_at"
      )
      .maybeSingle();

    if (updateError) {
      console.error("Booking link update failed:", updateError.message);

      return NextResponse.json(
        { error: "Không thể cập nhật trạng thái link." },
        { status: 500 }
      );
    }

    if (!updatedLink) {
      return NextResponse.json(
        { error: "Trạng thái link đã thay đổi. Vui lòng tải lại trang." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        action === "sent"
          ? "Đã đánh dấu link đã gửi."
          : "Đã thu hồi link thành công.",
      data: updatedLink,
    });
  } catch (error) {
    console.error("Manage booking link API error:", error);

    return NextResponse.json(
      { error: "Đã xảy ra lỗi máy chủ." },
      { status: 500 }
    );
  }
}
