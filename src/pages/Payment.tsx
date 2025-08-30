/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Layout from "../components/Layout/Layout";
import Button from "../components/UI/Button";
import DiscountCodeInput from "../components/Checkout/DiscountCodeInput";
import { useBookingStore } from "../stores/bookingStore";
import { DiscountCode } from "../types/discount";
import { pujaService } from "../services/pujaService";
import { discountService } from "../services/discountService";
import { useToast } from "../components/UI/ToastContainer";
import { useAuthStore } from "../stores/useAuthStore";
import { useShallow } from "zustand/react/shallow";
import PaymentSuccessModal from "../components/Checkout/PaymentSuccessModal";
import PaymentFailureModal from "../components/Checkout/PaymentFailureModal";
import { PRICING, formatMoney } from "../constants/pricing";
import { useUserMetadataStore } from "../stores/userMetadataStore";
import { formatBackendDateForDisplay } from "../utils/dateUtils";
import StripePaymentForm from "../components/Payments/StripePaymentForm";

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay !== undefined) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const [discountInlineMessage, setDiscountInlineMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(
    null
  );
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    amount: number;
    currency: string;
    orderId: string;
    paymentId: string;
  } | null>(null);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [failureInfo, setFailureInfo] = useState<{
    title?: string;
    message: string;
    reason?: string;
    orderId?: string;
    paymentId?: string;
    errorCode?: string | number;
  } | null>(null);
  const { user } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
    }))
  );
  const {
    currentBooking,
    selectedPujari,
    families,
    discountCode: bookingDiscountCode,
    discountAmount: bookingDiscountAmount,
    finalAmount: bookingFinalAmount,
    isLoadingBookings,
    setDiscountDetails,
    clearDiscount,
    bookingId,
  } = useBookingStore();

  const { selectedCurrency } = useUserMetadataStore();
  const pricing = PRICING[selectedCurrency];

  // Initialize with discount from booking page if exists
  React.useEffect(() => {
    if (
      bookingDiscountCode &&
      bookingDiscountAmount > 0 &&
      bookingFinalAmount
    ) {
      setAppliedDiscount({
        code: bookingDiscountCode,
        value: bookingDiscountAmount,
        discountAmount: bookingDiscountAmount,
        finalAmount: bookingFinalAmount,
        discountType: "Fixed",
        expiryDate: "",
        status: "Active",
        usageCount: 0,
      });
    }
  }, [bookingDiscountCode, bookingDiscountAmount, bookingFinalAmount]);

  // Show loading state while fetching bookings
  if (isLoadingBookings) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your booking details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Calculate base total (base price + additional families)
  const calculateBaseTotal = (): number => {
    const basePrice = pricing.intro;
    const additionalFamiliesPrice = families.length * pricing.additionalFamily;
    return basePrice + additionalFamiliesPrice;
  };

  const calculateDiscountedTotal = (): number => {
    const baseTotal = calculateBaseTotal();

    if (!appliedDiscount) {
      return baseTotal;
    }

    // Use the finalAmount from the backend response
    return appliedDiscount.finalAmount || baseTotal;
  };

  const getDiscountAmount = (): number => {
    if (!appliedDiscount) return 0;
    // Use the discountAmount from the backend response
    return appliedDiscount.discountAmount || 0;
  };

  const isINR = selectedCurrency === 'INR';

  const handleRazorpayPayment = async () => {
    setIsProcessing(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setFailureInfo({
          title: "Payment Setup Failed",
          message: "We couldn't load the payment gateway.",
          reason:
            "The Razorpay script failed to load. Please check your internet connection and try again.",
        });
        setShowFailureModal(true);
        return; // stays on payment page
      }
      // Create booking
      const orderData: any = await pujaService.createPaymentByRazorpay({
        amount: finalTotal * 100,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        notes: {
          userId: user?.id || "guest",
          userEmail: user?.email || "guest@example.com",
        },
        bookingId: bookingId || "",
      });

      console.log("Order data from backend:", orderData);

      // Prefer runtime-injected env (window.__ENV__) and fallback to build-time Vite env
      const runtimeEnv = (window as any).__ENV__ || {};
      const razorpayKey =
        runtimeEnv.VITE_RAZORPAY_KEY_ID ||
        import.meta.env.VITE_RAZORPAY_KEY_ID ||
        "NO_KEY_ID";

      const options = {
        key: razorpayKey,
        amount: orderData.data.amount,
        currency: orderData.data.currency,
        name: "AI Pujari",
        description: "Test Transaction",
        order_id: orderData.data.orderId,
        handler: async (response: any) => {
          try {
            console.log("Payment response:", response);
            if (!response || !response.razorpay_order_id) {
              setFailureInfo({
                message: "Invalid payment response received.",
                reason:
                  "The payment gateway did not return a valid order reference.",
                paymentId: response?.razorpay_payment_id,
              });
              setShowFailureModal(true);
              return; // keep user on page
            }

            const verificationResult = await pujaService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verificationResult?.status === "success") {
              // Show success modal with details
              setSuccessInfo({
                amount: Math.round(orderData.data.amount / 100),
                currency: orderData.data.currency || "INR",
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
              });
              setShowSuccessModal(true);
            } else {
              setFailureInfo({
                title: "Verification Failed",
                message: "We couldn't verify your payment.",
                reason:
                  verificationResult?.message ||
                  "Signature mismatch or timeout during verification.",
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
              });
              setShowFailureModal(true);
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            setFailureInfo({
              title: "Verification Error",
              message: "An error occurred while verifying your payment.",
              reason:
                (error as any)?.message ||
                "A network or server error interrupted verification.",
            });
            setShowFailureModal(true);
          }
        },
        prefill: {
          email: user?.email || "",
        },
        notes: {
          user_id: user?.id || "",
        },
        theme: {
          color: "var(--color-theme-primary)",
        },
        modal: {
          ondismiss: () => {
            console.log("Payment cancelled by user");
            // Don't show error for user cancellation
          },
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

      console.log("Booking created:", options);
    } catch (error) {
      console.error("Payment failed:", error);
      setFailureInfo({
        message: "Something went wrong while initiating your payment.",
        reason: (error as any)?.message || "Unexpected client error.",
      });
      setShowFailureModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const discountAmount = getDiscountAmount();
  const finalTotal = calculateDiscountedTotal();
  const additionalFamilies = families.length * pricing.additionalFamily;

  // Use actual booking ID or generate a temporary one
  const currentBookingId = bookingId;

  // Custom discount validation function that sends the correct basePrice
  const validateDiscountCode = async (code: string, bookingId: string) => {
    try {
      const totalAmount = calculateBaseTotal(); // Send total calculated amount
      const result = await discountService.validateDiscountCodeWithBookingId(
        code,
        bookingId,
        totalAmount,
        selectedCurrency
      );
      return result;
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || "Failed to validate discount code",
      };
    }
  };

  const handleDiscountApplied = (discount: any) => {
    // Create a proper DiscountCode object with the backend response data
    const discountCode: DiscountCode = {
      code: discount.code || discount.discountCode || "",
      value: discount.value || 0,
      discountAmount: discount.discountAmount || 0,
      finalAmount: discount.finalAmount || calculateBaseTotal(),
      discountType: discount.discountType || "Fixed",
      expiryDate: discount.expiryDate || "",
      status: discount.status || "Active",
      usageCount: discount.usageCount || 0,
    };

    setAppliedDiscount(discountCode);

    // Also update the booking store with the discount details
    setDiscountDetails(
      discountCode.code,
      discountCode.discountAmount,
      discountCode.finalAmount || calculateBaseTotal()
    );

  // Inline feedback handled by DiscountCodeInput and summary; no toast needed here
  setDiscountInlineMessage(`You saved ${formatMoney(discount.discountAmount, selectedCurrency)}`);
  };

  const handleDiscountRemoved = () => {
    setAppliedDiscount(null);
    clearDiscount(); // Also clear from booking store
    showSuccess(
      "Discount Removed",
      "Discount code has been removed from your booking"
    );
  };

  const handleViewBooking = () => {
    navigate("/booking");
  };

  const handleGoHome = () => navigate("/");

  const handleDownloadReceipt = () => {
    if (!successInfo) return;
    const lines = [
      "AI Pujari - Payment Receipt",
      "--------------------------------------",
      `Date: ${new Date().toLocaleString()}`,
      `Amount: ${formatMoney(successInfo.amount, successInfo.currency as any)} (${successInfo.currency})`,
      `Order ID: ${successInfo.orderId}`,
      `Payment ID: ${successInfo.paymentId}`,
      currentBookingId ? `Booking ID: ${currentBookingId}` : "",
      user?.email ? `Customer: ${user.email}` : "",
      "\nThank you for your payment.",
    ].filter(Boolean);

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt_${successInfo.orderId}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const onStripeSuccess = (info: { amount: number; currency: string; paymentIntentId: string }) => {
    setSuccessInfo({
      amount: Number(info.amount.toFixed(2)),
      currency: info.currency,
      orderId: currentBookingId || info.paymentIntentId,
      paymentId: info.paymentIntentId,
    });
    setShowSuccessModal(true);
  };

  const onStripeError = (info: { title?: string; message: string; reason?: string }) => {
    setFailureInfo({
      title: info.title || "Payment Failed",
      message: info.message,
      reason: info.reason,
    });
    setShowFailureModal(true);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Payment Summary */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-200 p-8">
            <div className="flex items-center mb-6">
              <Button
                onClick={() => navigate("/booking")}
                variant="ghost"
                size="sm"
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-800">
                Payment Summary
              </h1>
            </div>

            {/* Pujari Info */}
            {selectedPujari && (
              <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-4">
                  <img
                    src={selectedPujari.image}
                    alt={selectedPujari.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {selectedPujari.name}
                    </h3>
                    <p className="text-sm text-orange-600">
                      {selectedPujari.tagline}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Booking Details */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Puja Type:</span>
                <span className="font-medium">{currentBooking.pujaType}</span>
              </div>
              {currentBooking.preferredDatetime && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Date & Time:</span>
                  <span className="font-medium">
                    {formatBackendDateForDisplay(currentBooking.preferredDatetime)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Families:</span>
                <span className="font-medium">{families.length}</span>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 pt-4 border-t border-orange-200">
              <div className="flex justify-between">
                <span>Base Price:</span>
                <span>
                  <span className="line-through text-gray-500 mr-2">{formatMoney(pricing.base, selectedCurrency)}</span>
                  <span className="text-orange-700 font-medium">{formatMoney(pricing.intro, selectedCurrency)}</span>
                </span>
              </div>
              {families.length > 0 && (
                <div className="flex justify-between">
                  <span>Additional Families ({families.length}):</span>
                  <span>{formatMoney(additionalFamilies, selectedCurrency)}</span>
                </div>
              )}
              {appliedDiscount && discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>
                    Discount ({appliedDiscount.code} - {appliedDiscount.value}
                    {appliedDiscount.discountType === "Percentage" ? "%" : PRICING[selectedCurrency].symbol}
                    ):
                  </span>
                  <span>-{formatMoney(discountAmount, selectedCurrency)}</span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between font-bold text-xl">
                  <span>Total:</span>
                  <span className="text-orange-600">{formatMoney(finalTotal, selectedCurrency)}</span>
                </div>
              </div>
            </div>

            {/* Discount Code Section */}
            <div className="mt-8 pt-6 border-t border-orange-200">
              <DiscountCodeInput
                bookingId={currentBookingId ?? ""}
                onDiscountApplied={handleDiscountApplied}
                onDiscountRemoved={handleDiscountRemoved}
                appliedDiscount={appliedDiscount || undefined}
                disabled={isProcessing}
                validateDiscountCode={validateDiscountCode}
              />
              {discountInlineMessage && !appliedDiscount && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">{discountInlineMessage}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-200 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Payment Method
            </h2>

            <div className="mb-6 p-4 border-2 rounded-lg bg-white flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">
                  {isINR ? 'Razorpay' : 'Stripe'}
                </h3>
                <p className="text-sm text-gray-600">
                  {isINR ? 'UPI, Cards, Net Banking & Wallets' : 'Cards and Wallets'}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full border bg-gray-50 text-gray-700">
                {isINR ? 'INR' : selectedCurrency}
              </span>
            </div>

            {isINR ? (
              <Button
                onClick={handleRazorpayPayment}
                loading={isProcessing}
                size="lg"
                className="w-full"
              >
                {isProcessing
                  ? "Processing..."
                  : `Pay ${formatMoney(finalTotal, selectedCurrency)} with Razorpay`}
              </Button>
            ) : (
              <StripePaymentForm
                amount={finalTotal}
                currency={selectedCurrency as "USD" | "GBP"}
                receipt={`receipt_${Date.now()}`}
                bookingId={currentBookingId || undefined}
                user={{ id: user?.id, email: user?.email }}
                onSuccess={onStripeSuccess}
                onError={onStripeError}
              />
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Your payment is secured with 256-bit SSL encryption
              </p>
            </div>
          </div>
        </div>

        {showSuccessModal && successInfo && (
          <PaymentSuccessModal
            isOpen={showSuccessModal}
            onClose={() => {
              setShowSuccessModal(false);
              navigate("/booking");
            }}
            amount={successInfo.amount}
            currency={successInfo.currency}
            orderId={successInfo.orderId}
            paymentId={successInfo.paymentId}
            email={user?.email || ""}
            bookingId={currentBookingId || undefined}
            onViewBooking={handleViewBooking}
            onGoHome={handleGoHome}
            onDownloadReceipt={handleDownloadReceipt}
          />
        )}

        {showFailureModal && failureInfo && (
          <PaymentFailureModal
            isOpen={showFailureModal}
            onClose={() => setShowFailureModal(false)}
            title={failureInfo.title}
            message={failureInfo.message}
            reason={failureInfo.reason}
            orderId={failureInfo.orderId}
            paymentId={failureInfo.paymentId}
            errorCode={failureInfo.errorCode}
            email={user?.email || ""}
          />
        )}
      </div>
    </Layout>
  );
};

export default Payment;
