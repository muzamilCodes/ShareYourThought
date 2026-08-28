import { BookingForm } from "../../../components/booking-form";

export default async function ProviderBookingPage({
  params
}: {
  params: Promise<{ providerId: string }>;
}) {
  const { providerId } = await params;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-3xl font-semibold">Book Quick Service</h1>
      <BookingForm token="REPLACE_WITH_AUTH_TOKEN" providerId={providerId} />
    </main>
  );
}
