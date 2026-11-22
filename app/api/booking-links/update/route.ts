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
        {
          status: 400,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    if (
      !payload ||
      typeof payload !== "object" ||
      Array.isArray(payload)
    ) {
      return NextResponse.json(
        { error: "Dữ liệu biểu mẫu không hợp lệ." },
        {
          status: 400,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    const supabase = await createClient();

    const { data, error } = await supabase.rpc(
      "update_customer_booking",
      {
        p_token_hash: tokenHash,
        p_payload: payload,
      }
    );

    if (error) {
      const message = error.message || "";

      if (
        message.includes("Link không hợp lệ") ||
        message.includes("Link không còn hiệu lực") ||
        message.includes("Link đã hết hạn")
      ) {
        return NextResponse.json(
          { error: message },
          {
            status: 409,
            headers: { "Cache-Control": "no-store" },
          }
        );
      }

      console.error("Update customer booking failed:", message);

      return NextResponse.json(
        {
          error: message.includes("Vui lòng điền đầy đủ")
            ? message
            : "Không thể cập nhật booking. Vui lòng kiểm tra thông tin và thử lại.",
        },
        {
          status: 400,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    if (!data || data.success !== true) {
      return NextResponse.json(
        { error: "Không nhận được xác nhận cập nhật từ hệ thống." },
        {
          status: 500,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        changed: data.changed,
        message: data.message,
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Update booking API error:", error);

    return NextResponse.json(
      { error: "Đã xảy ra lỗi máy chủ. Vui lòng thử lại." },
      {
        status: 400,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
