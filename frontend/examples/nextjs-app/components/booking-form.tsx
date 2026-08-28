"use client";

import { useState } from "react";
import { apiFetch } from "../lib/api";
import { OtpModal } from "./otp-modal";

type BookingFormProps = {
  token: string;
  providerId: string;
};

export function BookingForm({ token, providerId }: BookingFormProps) {
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    serviceType: "",
    serviceDescription: "",
    address: {
      city: "",
      pincode: "",
      fullAddress: ""
    },
    isEmergency: false
  });
  const [bookingOtp, setBookingOtp] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [mode, setMode] = useState<"system" | "whatsapp">("system");
  const [message, setMessage] = useState("");

  const sendBookingOtp = async () => {
    await apiFetch("/auth/send-booking-otp", {
      method: "POST",
      token
    });
    setShowOtpModal(true);
  };

  const submitBooking = async () => {
    const payload = { ...form, providerId, bookingOtp };
    const path = mode === "system" ? "/bookings/system" : "/bookings/whatsapp-link";
    const data = await apiFetch<{ message: string; whatsappLink?: string }>(path, {
      method: "POST",
      token,
      body: JSON.stringify(payload)
    });

    setMessage(data.message);
    setShowOtpModal(false);

    if (data.whatsappLink) {
      window.location.href = data.whatsappLink;
    }
  };

  return (
    <div className="space-y-4">
      <input
        placeholder="Name"
        value={form.customerName}
        onChange={(event) => setForm({ ...form, customerName: event.target.value })}
      />
      <input
        placeholder="Phone"
        value={form.customerPhone}
        onChange={(event) => setForm({ ...form, customerPhone: event.target.value })}
      />
      <input
        placeholder="Service"
        value={form.serviceType}
        onChange={(event) => setForm({ ...form, serviceType: event.target.value })}
      />
      <textarea
        placeholder="Describe the problem"
        value={form.serviceDescription}
        onChange={(event) => setForm({ ...form, serviceDescription: event.target.value })}
      />
      <input
        placeholder="City"
        value={form.address.city}
        onChange={(event) =>
          setForm({ ...form, address: { ...form.address, city: event.target.value } })
        }
      />
      <input
        placeholder="Pincode"
        value={form.address.pincode}
        onChange={(event) =>
          setForm({ ...form, address: { ...form.address, pincode: event.target.value } })
        }
      />
      <textarea
        placeholder="Full Address"
        value={form.address.fullAddress}
        onChange={(event) =>
          setForm({ ...form, address: { ...form.address, fullAddress: event.target.value } })
        }
      />

      <label>
        <input
          type="checkbox"
          checked={form.isEmergency}
          onChange={(event) => setForm({ ...form, isEmergency: event.target.checked })}
        />
        Emergency booking
      </label>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => {
            setMode("system");
            sendBookingOtp();
          }}
        >
          Book Now
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("whatsapp");
            sendBookingOtp();
          }}
        >
          Chat on WhatsApp
        </button>
      </div>

      {message ? <p>{message}</p> : null}

      <OtpModal
        open={showOtpModal}
        otp={bookingOtp}
        onOtpChange={setBookingOtp}
        onClose={() => setShowOtpModal(false)}
        onConfirm={submitBooking}
      />
    </div>
  );
}
