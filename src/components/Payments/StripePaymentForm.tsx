/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import Button from "../UI/Button";
import { pujaService } from "../../services/pujaService";

// Prefer runtime-injected env (window.__ENV__) then Vite build-time env
const runtimeEnv = (window as any).__ENV__ || {};
const publishableKey =
  runtimeEnv.VITE_STRIPE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  "";

const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export type StripePaymentFormProps = {
  amount: number; // in selectedCurrency base units (e.g., 12.34)
  currency: "USD" | "GBP";
  receipt: string;
  bookingId?: string;
  user?: { id?: string; email?: string } | null;
  onSuccess: (info: { amount: number; currency: string; paymentIntentId: string }) => void;
  onError: (info: { title?: string; message: string; reason?: string }) => void;
};

const InnerForm: React.FC<{
  amount: number;
  currency: "USD" | "GBP";
  user?: { id?: string; email?: string } | null;
  onSuccess: StripePaymentFormProps["onSuccess"];
  onError: StripePaymentFormProps["onError"];
}> = ({ amount, currency, user, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isElementReady, setIsElementReady] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    // Ensure the Payment Element is mounted and validated
    const submitResult = await elements.submit();
    if (submitResult?.error) {
      setIsProcessing(false);
      onError({ message: "Please check your payment details.", reason: submitResult.error.message });
      return;
    }
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Optionally provide a return_url if using redirects for 3DS; here we use modal when possible
        // return_url: window.location.href,
        payment_method_data: {
          billing_details: {
            email: user?.email || undefined,
          },
        },
      },
      redirect: "if_required",
    });

    if (error) {
      setIsProcessing(false);
      onError({ message: "Payment failed to confirm.", reason: error.message });
      return;
    }

    if (paymentIntent?.id) {
      try {
        // Verify intent status with backend and update booking
        const result = await pujaService.verifyStripePaymentIntent(paymentIntent.id);
        if (result?.status === "succeeded" || paymentIntent.status === "succeeded") {
          onSuccess({ amount, currency, paymentIntentId: paymentIntent.id });
        } else {
          onError({
            title: "Payment Pending",
            message: "Your payment is not completed yet.",
            reason: `Status: ${result?.status || paymentIntent.status}`,
          });
        }
      } catch (verifyErr: any) {
        onError({ title: "Verification Error", message: "Could not verify payment.", reason: verifyErr?.message });
      } finally {
        setIsProcessing(false);
      }
    } else {
      setIsProcessing(false);
      onError({ message: "No payment intent returned by Stripe." });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement options={{ layout: "accordion" }} onReady={() => setIsElementReady(true)} />
      <div className="mt-6">
        <Button
          type="submit"
          className="w-full"
          loading={isProcessing}
          disabled={isProcessing || !stripe || !elements || !isElementReady}
        >
          {isProcessing ? "Processing..." : `Pay ${currency} ${amount.toFixed(2)}`}
        </Button>
      </div>
    </form>
  );
};

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  amount,
  currency,
  receipt,
  bookingId,
  user,
  onSuccess,
  onError,
}) => {
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const init = async () => {
      try {
        if (!stripePromise) {
          setError("Stripe publishable key is not configured.");
          return;
        }
        // Create PaymentIntent in backend
        const result = await pujaService.createStripePaymentIntent({
          // Backend expects an integer; it multiplies by 100 internally
          amount: Math.round(amount),
          currency,
          receipt,
          notes: {
            userId: user?.id || "guest",
            userEmail: user?.email || "guest@example.com",
          },
          bookingId,
        });
        const cs = (result && (result as any).clientSecret) || (result && (result as any).data?.clientSecret) || (result as any)?.client_secret;
        if (!cs) throw new Error("Missing client secret from backend.");
        setClientSecret(cs);
      } catch (e: any) {
        const msg = e?.message || "Failed to initialize Stripe payment.";
        setError(msg);
        onError({ message: "Stripe initialization failed", reason: msg });
      }
    };
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, currency, receipt, bookingId]);

  if (!publishableKey) {
    return <div className="text-sm text-red-600">Stripe is not configured.</div>;
  }

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  if (!clientSecret) {
    return <div>Loading payment form...</div>;
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#EA580C",
        colorText: "#111827",
      },
    },
    // currency is derived from the PaymentIntent; do not set here for Payment Element
    locale: "auto",
  } as StripeElementsOptions;

  return (
    <Elements stripe={stripePromise!} options={options}>
      <InnerForm
        amount={amount}
        currency={currency}
        user={user}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
};

export default StripePaymentForm;
