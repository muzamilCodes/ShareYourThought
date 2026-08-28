"use client";

type OtpModalProps = {
  open: boolean;
  otp: string;
  onOtpChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean;
};

export function OtpModal({
  open,
  otp,
  onOtpChange,
  onClose,
  onConfirm,
  submitting
}: OtpModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="otp-overlay">
      <div className="otp-panel">
        <h2>Confirm booking</h2>
        <p>OTP verify karke booking lock hogi. Ye extra step address aur provider contact ko secure rakhta hai.</p>
        <div className="field">
          <label htmlFor="otp">OTP code</label>
          <input
            id="otp"
            placeholder="Enter 6 digit OTP"
            value={otp}
            onChange={(event) => onOtpChange(event.target.value)}
          />
        </div>
        <div className="actions" style={{ marginTop: 16 }}>
          <button className="ghost-btn" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="primary-btn" type="button" onClick={onConfirm} disabled={submitting}>
            {submitting ? "Confirming..." : "Confirm Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
