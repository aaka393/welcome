import React from "react";
import ReactDOM from "react-dom";
import { XCircle, X, AlertTriangle } from "lucide-react";

type PaymentFailureModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  reason?: string;
  orderId?: string;
  paymentId?: string;
  errorCode?: string | number;
  email?: string;
};

const DetailRow: React.FC<{ label: string; value?: React.ReactNode }> = ({
  label,
  value,
}) => {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between py-2">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900 text-right ml-4 break-all">
        {value}
      </span>
    </div>
  );
};

const PaymentFailureModal: React.FC<PaymentFailureModalProps> = ({
  isOpen,
  onClose,
  title = "Payment Failed",
  message,
  reason,
  orderId,
  paymentId,
  errorCode,
  email,
}) => {
  // Freeze timestamp for this modal instance
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
            <div className="bg-white/90 backdrop-blur-md border border-red-200 rounded-2xl shadow-xl p-8 md:p-10">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-3">
                  <XCircle className="w-9 h-9 text-red-600" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900">{title}</h3>
                <p className="text-gray-600 mt-2 max-w-2xl">{message}</p>
              </div>

              <div className="p-4 bg-red-50/70 border border-red-200 rounded-xl mb-6">
                <DetailRow label="Reason" value={reason} />
                <DetailRow label="Order ID" value={orderId} />
                <DetailRow label="Payment ID" value={paymentId} />
                <DetailRow label="Error Code" value={errorCode?.toString()} />
                <DetailRow label="Date & Time" value={dateTimeRef.current} />
                {email && <DetailRow label="Customer" value={email} />}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition"
                >
                  Close and Try Again
                </button>
                <div className="flex items-center text-sm text-gray-600 gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  If the issue persists, contact support.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default PaymentFailureModal;
