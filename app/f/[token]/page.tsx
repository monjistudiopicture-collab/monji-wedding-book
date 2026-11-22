
import { Suspense } from "react";
import WeddingForm from "@/components/WeddingForm";

export default function TokenFormPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f8f6f1]">
          <p className="text-sm text-stone-500">
            Đang tải biểu mẫu MONJI...
          </p>
        </main>
      }
    >
      <TokenFormContent params={params} />
    </Suspense>
  );
}

async function TokenFormContent({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <WeddingForm token={token} />;
}
