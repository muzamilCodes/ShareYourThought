"use client";

type OtpModalProps = {
  open: boolean;
  otp: string;
  onOtpChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function OtpModal({ open, otp, onOtpChange, onClose, onConfirm }: OtpModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">Verify OTP</h2>
        <input
          className="w-full border p-2"
          placeholder="Enter OTP"
          value={otp}
          onChange={(event) => onOtpChange(event.target.value)}
        />
        <div className="flex gap-3">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm}>
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
}
