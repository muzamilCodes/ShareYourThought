"use client";

import { useState } from "react";
import { apiFetch } from "../lib/api";
import { OtpModal } from "./otp-modal";

type Provider = {
  _id: string;
  businessName: string;
  whatsappPhone: string;
  categories: string[];
  servicesOffered: string[];
  availability?: {
    isAvailable?: boolean;
    scheduleLabel?: string;
  };
};

type BookingFormProps = {
  providers: Provider[];
};

export function BookingForm({ providers }: BookingFormProps) {
  const [form, setForm] = useState({
    providerId: providers[0]?._id || "",
    customerName: "",
    customerPhone: "",
    serviceType: providers[0]?.categories?.[0] || "plumber",
    serviceDescription: "",
    address: {
      city: "",
      pincode: "",
      fullAddress: ""
    },
    isEmergency: false
  });
  const [token, setToken] = useState(process.env.NEXT_PUBLIC_DEMO_TOKEN || "");
  const [otp, setOtp] = useState("");
  const [mode, setMode] = useState<"system" | "whatsapp">("system");
  const [otpOpen, setOtpOpen] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const selectedProvider = providers.find((provider) => provider._id === form.providerId) || providers[0];

  const updateForm = (key: string, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const sendBookingOtp = async (nextMode: "system" | "whatsapp") => {
    try {
      setLoadingOtp(true);
      setMessage("");
      setMode(nextMode);
      await apiFetch("/auth/send-booking-otp", {
        method: "POST",
        token
      });
      setOtpOpen(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send booking OTP");
    } finally {
      setLoadingOtp(false);
    }
  };

  const confirmBooking = async () => {
    try {
      setSubmitting(true);
      const payload = { ...form, bookingOtp: otp };
      const endpoint = mode === "system" ? "/bookings/system" : "/bookings/whatsapp-link";
      const result = await apiFetch<{ message: string; whatsappLink?: string }>(endpoint, {
        method: "POST",
        token,
        body: JSON.stringify(payload)
      });
      setMessage(result.message);
      setOtpOpen(false);
      setOtp("");

      if (result.whatsappLink) {
        window.location.href = result.whatsappLink;
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="form-panel">
        <h2 className="form-title">Book in one screen</h2>
        <p className="form-copy">
          Provider choose karo, address bharo, OTP verify karo, aur ya to system booking save karo ya
          direct WhatsApp chat khol do.
        </p>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="demo-token">Access token</label>
            <input
              id="demo-token"
              placeholder="Paste JWT access token"
              value={token}
              onChange={(event) => setToken(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="provider">Provider</label>
            <select
              id="provider"
              value={form.providerId}
              onChange={(event) => updateForm("providerId", event.target.value)}
            >
              {providers.map((provider) => (
                <option key={provider._id} value={provider._id}>
                  {provider.businessName} - {provider.categories.join(", ")}
                </option>
              ))}
            </select>
          </div>

          <div className="inline-grid">
            <div className="field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                placeholder="Customer name"
                value={form.customerName}
                onChange={(event) => updateForm("customerName", event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                placeholder="Phone number"
                value={form.customerPhone}
                onChange={(event) => updateForm("customerPhone", event.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="service">Service</label>
            <input
              id="service"
              placeholder="plumber / electrician / driver"
              value={form.serviceType}
              onChange={(event) => updateForm("serviceType", event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="description">Problem description</label>
            <textarea
              id="description"
              placeholder="Tap leak, urgent ride, wiring issue..."
              value={form.serviceDescription}
              onChange={(event) => updateForm("serviceDescription", event.target.value)}
            />
          </div>

          <div className="inline-grid">
            <div className="field">
              <label htmlFor="city">City</label>
              <input
                id="city"
                placeholder="City"
                value={form.address.city}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    address: { ...current.address, city: event.target.value }
                  }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="pincode">Pincode</label>
              <input
                id="pincode"
                placeholder="Pincode"
                value={form.address.pincode}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    address: { ...current.address, pincode: event.target.value }
                  }))
                }
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="address">Full address</label>
            <textarea
              id="address"
              placeholder="House no, street, landmark, area"
              value={form.address.fullAddress}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  address: { ...current.address, fullAddress: event.target.value }
                }))
              }
            />
          </div>

          <div className="toggle-row">
            <div className="toggle-copy">
              <strong>Emergency booking</strong>
              <span>Use this when response speed matters more than scheduled timing.</span>
            </div>
            <input
              type="checkbox"
              checked={form.isEmergency}
              onChange={(event) => updateForm("isEmergency", event.target.checked)}
            />
          </div>

          <div className="actions">
            <button
              className="primary-btn"
              type="button"
              onClick={() => sendBookingOtp("system")}
              disabled={loadingOtp || submitting}
            >
              {loadingOtp && mode === "system" ? "Sending OTP..." : "Book Now"}
            </button>
            <button
              className="secondary-btn"
              type="button"
              onClick={() => sendBookingOtp("whatsapp")}
              disabled={loadingOtp || submitting}
            >
              {loadingOtp && mode === "whatsapp" ? "Sending OTP..." : "Chat on WhatsApp"}
            </button>
          </div>

          {selectedProvider ? (
            <div className="message-box">
              Working with <strong>{selectedProvider.businessName}</strong> for{" "}
              {selectedProvider.categories.join(", ")}.
            </div>
          ) : null}

          {message ? <div className="message-box">{message}</div> : null}
        </div>
      </section>

      <OtpModal
        open={otpOpen}
        otp={otp}
        onOtpChange={setOtp}
        onClose={() => setOtpOpen(false)}
        onConfirm={confirmBooking}
        submitting={submitting}
      />
    </>
  );
}
