
import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";



export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = body?.token;

    // Token được tạo từ randomBytes(32).toString("base64url")
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

    // Chỉ gửi mã băm đến Supabase, không gửi token gốc
    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    const supabase = await createClient();

    const { data, error } = await supabase.rpc(
      "get_booking_form_link",
      {
        p_token_hash: tokenHash,
      }
    );

    if (error) {
      console.error("Validate booking link failed:", error.message);

      return NextResponse.json(
        { error: "Không thể kiểm tra link. Vui lòng thử lại." },
        {
          status: 500,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        {
          error:
            "Link không hợp lệ, đã hết hạn, bị thu hồi hoặc đã được sử dụng.",
        },
        {
          status: 404,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    const customer = data[0];

    return NextResponse.json(
      {
        success: true,
        customer: {
          brideName: customer.bride_name,
          groomName: customer.groom_name,
          weddingDate: customer.wedding_date,
        },
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Validate API error:", error);

    return NextResponse.json(
      { error: "Dữ liệu gửi lên không hợp lệ hoặc đã xảy ra lỗi máy chủ." },
      {
        status: 400,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
