
import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = body?.token;
    const payload = body?.payload;

    if (
      typeof token !== "string" ||
      !/^[A-Za-z0-9_-]{43}$/.test(token)
    ) {
      return NextResponse.json(
        { error: "Link không hợp lệ." },
        { status: 400 }
      );
    }

    if (
      !payload ||
      typeof payload !== "object" ||
      Array.isArray(payload)
    ) {
      return NextResponse.json(
        { error: "Dữ liệu biểu mẫu không hợp lệ." },
        { status: 400 }
      );
    }

    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    const supabase = await createClient();

    const { data, error } = await supabase.rpc(
      "submit_booking_form",
      {
        p_token_hash: tokenHash,
        p_payload: payload,
      }
    );

    if (error) {
      const message = error.message || "";

      if (
        message.includes("Link không hợp lệ") ||
        message.includes("Link đã được sử dụng") ||
        message.includes("Link đã hết hạn")
      ) {
        return NextResponse.json(
          { error: message },
          { status: 409 }
        );
      }

      console.error("Submit booking form failed:", message);

      return NextResponse.json(
        { error: "Không thể lưu biểu mẫu. Vui lòng kiểm tra thông tin và thử lại." },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Không nhận được mã đặt lịch sau khi lưu." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bookingId: data,
      message: "Gửi thông tin thành công.",
    });
  } catch (error) {
    console.error("Submit booking API error:", error);

    return NextResponse.json(
      { error: "Đã xảy ra lỗi máy chủ. Vui lòng thử lại." },
      { status: 400 }
    );
  }
}
