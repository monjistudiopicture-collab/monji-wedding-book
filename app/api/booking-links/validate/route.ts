import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = body?.token;

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

    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    const supabase = await createClient();

    // First: check whether this link is still awaiting submission.
    const { data: customerData, error: customerError } =
      await supabase.rpc("get_booking_form_link", {
        p_token_hash: tokenHash,
      });

    if (customerError) {
      console.error(
        "Validate booking link failed:",
        customerError.message
      );

      return NextResponse.json(
        { error: "Không thể kiểm tra link. Vui lòng thử lại." },
        {
          status: 500,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    if (Array.isArray(customerData) && customerData.length > 0) {
      const customer = customerData[0];

      return NextResponse.json(
        {
          success: true,
          mode: "create",
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
    }

    // Second: if not awaiting submission, try loading a completed booking.
    const { data: bookingData, error: bookingError } =
      await supabase.rpc("get_customer_booking", {
        p_token_hash: tokenHash,
      });

    if (bookingError) {
      console.error(
        "Load customer booking failed:",
        bookingError.message
      );

      return NextResponse.json(
        { error: "Không thể tải thông tin booking. Vui lòng thử lại." },
        {
          status: 500,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    if (!Array.isArray(bookingData) || bookingData.length === 0) {
      return NextResponse.json(
        {
          error:
            "Link không hợp lệ, đã hết hạn, bị thu hồi hoặc không còn hiệu lực.",
        },
        {
          status: 404,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    const booking = bookingData[0];

    return NextResponse.json(
      {
        success: true,
        mode: "edit",
        booking: {
          weddingType: booking.wedding_type,
          weddingDate: booking.wedding_date,
          brideName: booking.bride_name,
          groomName: booking.groom_name,
          bridePhone: booking.bride_phone || "",
          groomPhone: booking.groom_phone || "",
          brideAddress: booking.bride_address || "",
          brideMakeupStart: booking.bride_makeup_start?.slice(0, 5) || "",
          groomAddress: booking.groom_address,
          groomDeparture: booking.groom_departure?.slice(0, 5) || "",
          groomArrivalBride: booking.groom_arrival_bride?.slice(0, 5) || "",
          brideDepartureToGroom:
            booking.bride_departure_to_groom?.slice(0, 5) || "",
          restaurantAddress: booking.restaurant_address || "",
          restaurantName: booking.restaurant_name || "",
          restaurantGuestArrival:
            booking.restaurant_guest_arrival?.slice(0, 5) || "",
          restaurantBanquetTime:
            booking.restaurant_banquet_time?.slice(0, 5) || "",
          extraNotes: booking.extra_notes || "",
          updatedAt: booking.updated_at,
        },
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Validate API error:", error);

    return NextResponse.json(
      {
        error: "Dữ liệu gửi lên không hợp lệ hoặc đã xảy ra lỗi máy chủ.",
      },
      {
        status: 400,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
