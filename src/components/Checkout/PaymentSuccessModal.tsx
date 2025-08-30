import React from "react";
import ReactDOM from "react-dom";
import { CheckCircle2, ReceiptText, Home, Download, X } from "lucide-react";

type PaymentSuccessModalProps = {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency: string;
  orderId: string;
  paymentId: string;
  email?: string;
  bookingId?: string;
  onViewBooking?: () => void;
  onGoHome?: () => void;
  onDownloadReceipt?: () => void;
};

const formatCurrency = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${amount}`;
  }
};

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="flex items-start justify-between py-2">
    <span className="text-gray-600">{label}</span>
    <span className="font-medium text-gray-900 text-right ml-4 break-all">
      {value}
    </span>
  </div>
);

const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  isOpen,
  onClose,
  amount,
  currency,
  orderId,
  paymentId,
  bookingId,
  onViewBooking,
  onGoHome,
  onDownloadReceipt,
}) => {
  // Freeze the date/time once on the first render of this component instance
  const dateTimeRef = React.useRef<string>(new Date().toLocaleString());
  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-white" onClick={onClose} />
      <div className="relative w-full h-full overflow-auto">
        <div className="absolute top-4 right-4">
          <button
            aria-label="Close"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="min-h-full flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-3xl">
            <div className="bg-white/90 backdrop-blur-md border border-orange-200 rounded-2xl shadow-xl p-8 md:p-10">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-9 h-9 text-green-600" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900">
                  Payment Successful
                </h3>
                <p className="text-gray-600 mt-2">
                  Thank you for your payment. Your transaction has been verified
                  and your booking is confirmed.
                </p>
              </div>

              <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-xl mb-6">
                <DetailRow
                  label="Amount Paid"
                  value={formatCurrency(amount, currency)}
                />
                <DetailRow label="Currency" value={currency} />
                <DetailRow label="Order ID" value={orderId} />
                <DetailRow label="Payment ID" value={paymentId} />
                {bookingId && (
                  <DetailRow label="Booking ID" value={bookingId} />
                )}
                <DetailRow label="Date & Time" value={dateTimeRef.current} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={onViewBooking}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 transition"
                >
                  <ReceiptText className="w-5 h-5" />
                  View Booking
                </button>
                <button
                  onClick={onGoHome}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-orange-300 text-orange-700 bg-white hover:bg-orange-50 font-medium transition"
                >
                  <Home className="w-5 h-5" />
                  Go Home
                </button>
                <button
                  onClick={onDownloadReceipt}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium transition"
                >
                  <Download className="w-5 h-5" />
                  Download Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default PaymentSuccessModal;
