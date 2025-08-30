import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Users, Plus, Trash2, Mic } from "lucide-react";
import Layout from "../components/Layout/Layout";
import Button from "../components/UI/Button";
import Input from "../components/UI/Input";
import PujariCard from "../components/Pujari/PujariCard";
import { useBookingStore } from "../stores/bookingStore";
import { pujaService } from "../services/pujaService";
import { Family, FamilyMember, Pujari } from "../types";
import { useToast } from "../components/UI/ToastContainer";
import uuid from "../utils/uuid";
import { useAuthStore } from "../stores/useAuthStore";
import { useShallow } from "zustand/react/shallow";
import AudioRecorderModal from "../components/UI/AudioRecorderModal";
import { PRICING, formatMoney, SupportedCurrency } from "../constants/pricing";
import { useUserMetadataStore } from "../stores/userMetadataStore";

const Booking: React.FC = () => {
  const navigate = useNavigate();
  const { userEmail, userId, authState } = useAuthStore(
    useShallow((state) => ({
      userEmail: state.user?.email,
      userId: state.user?.id,
      authState: state.authState,
    }))
  );
  const { showSuccess, showError } = useToast();
  const { submitBooking, fetchUserBookings, clearBookingError } =
    useBookingStore();
  const {
    currentBooking,
    selectedPujari,
    bookingId,
    setSelectedPujari,
    families,
    discountCode,
    discountAmount,
    setPujaDetails,
    addFamily,
    updateFamily,
    removeFamily,
    setDiscountDetails,
    clearDiscount,
    calculateTotal,
    calculateFinalTotal,
  } = useBookingStore();

  const [pujaType, setPujaType] = useState("Ganesh Chaturthi");
  // HTML date input expects YYYY-MM-DD and time input expects HH:MM (24h)
  const [date, setDate] = useState("2025-08-27");
  const [time, setTime] = useState("10:00");
  const [pujaris, setPujaris] = useState<Pujari[]>([]);
  const [pujaTypes, setPujaTypes] = useState<string[]>([]);
  const [currentDiscountCode, setCurrentDiscountCode] = useState("");
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [discountValidationError, setDiscountValidationError] = useState<string | null>(null);
  // audio recorder modal state
  const [recModalOpen, setRecModalOpen] = useState(false);
  const [recTarget, setRecTarget] = useState<
    | { type: 'member'; familyId: string; memberId: string }
    | { type: 'gotra'; familyId: string }
    | null
  >(null);

  // Freeze UI if booking already paid
  const isFrozen = currentBooking?.paymentStatus === "success";

  // Currency selection from user metadata store
  const { selectedCurrency, setSelectedCurrency } = useUserMetadataStore();
  const pricing = PRICING[selectedCurrency];
  const isCurrencyLocked = Boolean(bookingId);

  // Sync selected currency to the booking's currency once a booking exists
  useEffect(() => {
    const bkCurrency = currentBooking?.currency as SupportedCurrency | undefined;
    if (bookingId && bkCurrency && bkCurrency !== selectedCurrency) {
      setSelectedCurrency(bkCurrency);
    }
  }, [bookingId, currentBooking?.currency, selectedCurrency, setSelectedCurrency]);

  useEffect(() => {
    if (authState === "invalid") {
      navigate("/login");
    }
  }, [authState, navigate]);

  useEffect(() => {
    if (!userEmail || !userId) {
      return;
    }
    clearBookingError();
    fetchUserBookings(userEmail, userId);
  }, [fetchUserBookings, clearBookingError, userEmail, userId]);

  useEffect(() => {
    const loadPujaTypes = async () => {
      const types = await pujaService.getPujaTypes();
      setPujaTypes(types);
    };
    const loadPujaris = async () => {
      const data = await pujaService.getPujaris();
      setPujaris(data);
    };
    loadPujaTypes();
    loadPujaris();
  }, []);

  const handlePujariSelect = (pujari: Pujari) => {
    if (isFrozen) return;
    setSelectedPujari(pujari);
  };

  const handleAddFamily = () => {
    if (isFrozen) return;
    const newFamily: Family = {
      id: uuid(),
      gotra: "",
      members: [
        {
          id: uuid(),
          name: "",
        },
      ],
    };
    addFamily(newFamily);
  };

  const handleAddMember = (familyId: string) => {
    if (isFrozen) return;
    const family = families.find((f) => f.id === familyId);
    if (family) {
      const newMember: FamilyMember = {
        id: uuid(),
        name: "",
      };
      updateFamily(familyId, {
        members: [...family.members, newMember],
      });
    }
  };

  const handleRemoveMember = (familyId: string, memberId: string) => {
    if (isFrozen) return;
    const family = families.find((f) => f.id === familyId);
    if (family && family.members.length > 1) {
      updateFamily(familyId, {
        members: family.members.filter((m) => m.id !== memberId),
      });
    }
  };

  const openMemberRecorder = (familyId: string, memberId: string) => {
    if (isFrozen) return;
    setRecTarget({ type: 'member', familyId, memberId });
    setRecModalOpen(true);
  };

  const openGotraRecorder = (familyId: string) => {
    if (isFrozen) return;
    setRecTarget({ type: 'gotra', familyId });
    setRecModalOpen(true);
  };

  const handlePronunciationSaved = (uniqueId: string, url: string) => {
    if (!recTarget) return;
    const target = recTarget;
    const family = families.find((f) => f.id === target.familyId);
    if (!family) return;
    if (target.type === 'member') {
      const updatedMembers = family.members.map((m) =>
        m.id === target.memberId ? { ...m, pronunciationId: uniqueId, pronunciationUrl: url } : m
      );
      updateFamily(target.familyId, { members: updatedMembers });
    } else if (target.type === 'gotra') {
      updateFamily(target.familyId, { gotraPronunciationId: uniqueId, gotraPronunciationUrl: url });
    }
    setRecTarget(null);
  };

  const handleApplyDiscount = async () => {
    if (isFrozen) return;
    if (!currentDiscountCode.trim()) {
      setDiscountValidationError("Please enter a discount code");
      return;
    }

    setIsApplyingDiscount(true);
    setDiscountValidationError(null);

    try {
      const basePrice = calculateTotal();

      // Make direct API call to validate discount
      const response = await fetch("/api/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          code: currentDiscountCode.toUpperCase(),
          basePrice: basePrice,
          currency: selectedCurrency,
        }),
      });

  const data = await response.json();

      if (data.code === 3037 && data.result) {
        const { discountAmount, finalAmount } = data.result;

        // Update booking store with discount details
        setDiscountDetails(
          currentDiscountCode.toUpperCase(),
          discountAmount,
          finalAmount
        );

        // Success handled by applied discount card; no toast
        setCurrentDiscountCode("");
      } else {
        setDiscountValidationError(
          data.message || "This discount code is not valid or has expired"
        );
      }
    } catch (err: unknown) {
      console.error("Discount validation failed:", err);
      setDiscountValidationError(
        "Unable to validate discount code. Please check your connection and try again."
      );
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    if (isFrozen) return;
    clearDiscount();
    showSuccess(
      "Discount Removed",
      "Discount code has been removed from your booking"
    );
  };

  const handleDiscountCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFrozen) return;
    setCurrentDiscountCode(e.target.value.toUpperCase());
    if (discountValidationError) setDiscountValidationError(null);
    // Clear any existing discount when user starts typing a new code
    if (discountCode && e.target.value !== discountCode) {
      clearDiscount();
    }
  };

  const handleProceedToPayment = async () => {
    if (isFrozen) return;
    try {
      setPujaDetails(pujaType, date, time);
      if (!userEmail) {
        showError("User Not Authenticated", "Please log in to continue.");
        return;
      }
      const res = await submitBooking(userEmail);
      console.log("Booking created:", res);

      // if backend gives a payment link:
      if (res.paymentLink) {
        window.location.href = res.paymentLink;
      } else {
        navigate("/payment");
      }
    } catch (err) {
      console.error("Booking failed", err);
      showError(
        "Booking Failed",
        "Please try again or contact support if the issue persists."
      );
    }
  };

  const isFormValid =
    pujaType &&
    date &&
    time &&
    families.length > 0 &&
    families.every((f) => f.gotra && f.members.every((m) => m.name));

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-200 p-8">
          <div className="flex items-start justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              Book Your Divine Puja
            </h1>
            {/* Currency switcher */}
            <div className="flex items-center gap-2">
              {(['INR','GBP','USD'] as SupportedCurrency[]).map((c) => (
                <button
                  key={c}
                  onClick={() => { if (!isCurrencyLocked) setSelectedCurrency(c); }}
                  disabled={isCurrencyLocked}
                  className={`px-3 py-1 rounded-full border text-sm ${
                    selectedCurrency === c
                      ? 'bg-orange-100 border-orange-400 text-orange-900'
                      : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700'
                  } ${isCurrencyLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {!selectedPujari ? (
            // Pujari Selection Section
            <div className="mb-8 p-6 bg-orange-50 rounded-xl border border-orange-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-orange-600" />
                Choose Your Sacred Guide
              </h2>
              <p className="text-gray-600 mb-6">
                Select from our blessed AI Pujaris, each trained in traditional
                vedic chanting and rituals from different regional traditions
              </p>

              <div
                className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 ${isFrozen ? "opacity-60 pointer-events-none" : ""
                  }`}
              >
                {pujaris.map((pujari) => (
                  <div
                    key={pujari.id}
                    className="transform hover:scale-105 transition-transform max-w-[140px] mx-auto"
                  >
                    <PujariCard
                      pujari={pujari}
                      selected={false}
                      isCenter={false}
                      compact={true}
                      onClick={() => handlePujariSelect(pujari)}
                    />
                  </div>
                ))}
              </div>

              {pujaris.length === 0 && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading sacred guides...</p>
                </div>
              )}
            </div>
          ) : (
            // Selected Pujari Display
            <div className="mb-8 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-800">
                  Selected Pujari
                </h3>
                <Button
                  onClick={() => setSelectedPujari(null)}
                  variant="outline"
                  size="sm"
                  disabled={isFrozen}
                >
                  Change Pujari
                </Button>
              </div>
              <div className="flex items-center space-x-4">
                <img
                  src={selectedPujari.image}
                  alt={selectedPujari.name}
                  className="w-16 h-16 rounded-full object-cover"
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

          {selectedPujari && (
            <div className="space-y-8">
              {/* Puja Details */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-orange-600" />
                  Puja Details
                </h2>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Puja Type
                    </label>
                    <select
                      value={pujaType}
                      onChange={(e) => setPujaType(e.target.value)}
                      disabled={isFrozen}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">Select Puja</option>
                      {pujaTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    type="date"
                    label="Date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    icon={<Calendar className="w-5 h-5 text-gray-400" />}
                    disabled={isFrozen}
                    min={new Date().toISOString().split("T")[0]}
                  />

                  <Input
                    type="time"
                    label="Time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    icon={<Clock className="w-5 h-5 text-gray-400" />}
                    disabled={isFrozen}
                  />
                </div>
              </div>

              {/* Families */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center text-xl font-semibold text-gray-800">
                    <Users className="mr-2 h-5 w-5 text-orange-600" />
                    Family Members
                  </h2>
                  <Button
                    onClick={handleAddFamily}
                    size="sm"
                    disabled={isFrozen}
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4" />
                    Add Family
                  </Button>
                </div>

                {families.map((family, familyIndex) => (
                  <div
                    key={family.id}
                    className="border border-orange-200 rounded-lg p-6 bg-orange-50/50"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium text-gray-800">
                        Family {familyIndex + 1}
                      </h3>
                      <Button
                        onClick={() => removeFamily(family.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        disabled={isFrozen}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gotra</label>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <Input
                              placeholder="Enter family gotra"
                              value={family.gotra}
                              onChange={(e) =>
                                updateFamily(family.id, { gotra: e.target.value })
                              }
                              disabled={isFrozen}
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10"
                            disabled={isFrozen}
                            onClick={() => openGotraRecorder(family.id)}
                            title="Record gotra pronunciation"
                          >
                            <Mic className="w-4 h-4" />
                          </Button>
                          {family.gotraPronunciationUrl && (
                            <audio controls src={family.gotraPronunciationUrl} className="h-10" title="Listen gotra" />
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium text-gray-700">
                            Family Members
                          </label>
                          <Button
                            onClick={() => handleAddMember(family.id)}
                            variant="outline"
                            size="sm"
                            disabled={isFrozen}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Member
                          </Button>
                        </div>

                        {family.members.map((member, memberIndex) => (
                          <div
                            key={member.id}
                            className="flex items-center space-x-3"
                          >
                            <div className="flex-1">
                              <Input
                                placeholder={`Member ${memberIndex + 1} name`}
                                value={member.name}
                                onChange={(e) => {
                                  const updatedMembers = family.members.map(
                                    (m) =>
                                      m.id === member.id
                                        ? { ...m, name: e.target.value }
                                        : m
                                  );
                                  updateFamily(family.id, {
                                    members: updatedMembers,
                                  });
                                }}
                                disabled={isFrozen}
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isFrozen}
                              onClick={() => openMemberRecorder(family.id, member.id)}
                            >
                              <Mic className="w-4 h-4" />
                            </Button>
                            {/* Inline audio playback if recorded */}
                            {member.pronunciationUrl && (
                              <audio
                                controls
                                src={member.pronunciationUrl}
                                className="h-8"
                                title="Listen to recorded name"
                              />
                            )}
                            {family.members.length > 1 && (
                              <Button
                                onClick={() =>
                                  handleRemoveMember(family.id, member.id)
                                }
                                variant="ghost"
                                size="sm"
                                className="text-red-600"
                                disabled={isFrozen}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {families.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-orange-300 rounded-lg">
                    <Users className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No families added yet</p>
                    <Button onClick={handleAddFamily}>Add Your Family</Button>
                  </div>
                )}
              </div>

              {/* Discount Code */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Discount Code
                </h2>

                {discountCode ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-sm font-bold">
                            ✓
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-green-800">
                            {discountCode}
                          </p>
                          <p className="text-sm text-green-600">
                            You saved {formatMoney(discountAmount, selectedCurrency)}!
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleRemoveDiscount}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={isFrozen}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex space-x-3">
                    <Input
                      placeholder="Enter discount code"
                      value={currentDiscountCode}
                      onChange={handleDiscountCodeChange}
                      disabled={isApplyingDiscount || isFrozen}
                    />
                    <Button
                      onClick={handleApplyDiscount}
                      variant="outline"
                      loading={isApplyingDiscount}
                      disabled={
                        !currentDiscountCode.trim() || isApplyingDiscount || isFrozen
                      }
                    >
                      Apply
                    </Button>
                    </div>
                    {discountValidationError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-red-500 font-bold">!</span>
                          <p className="text-sm text-red-700">{discountValidationError}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Booking Summary
                </h2>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Base Price:</span>
                    <span>
                      <span className="line-through text-gray-500 mr-2">
                        {formatMoney(pricing.base, selectedCurrency)}
                      </span>
                      <span className="text-orange-700 font-medium">
                        {formatMoney(pricing.intro, selectedCurrency)}
                      </span>
                    </span>
                  </div>
                  {families.length > 0 && (
                    <div className="flex justify-between">
                      <span>Families ({families.length}):</span>
                      <span>{formatMoney(families.length * pricing.additionalFamily, selectedCurrency)}</span>
                    </div>
                  )}
                  {discountCode && discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({discountCode}):</span>
                      <span>-{formatMoney(discountAmount, selectedCurrency)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span>{formatMoney(calculateFinalTotal(), selectedCurrency)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {currentBooking && currentBooking.paymentStatus === "success" && (
                <div className="flex justify-center text-green-600 font-bold space-x-0">
                  <span>Payment successfully completed.</span>
                </div>
              )}
              {(!currentBooking || currentBooking.paymentStatus !== "success") && (
                <Button
                  onClick={handleProceedToPayment}
                  disabled={!isFormValid || isFrozen}
                  size="lg"
                  className="w-full"
                >
                  Proceed to Payment
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      <AudioRecorderModal
        isOpen={recModalOpen}
        onClose={() => setRecModalOpen(false)}
        onSaved={handlePronunciationSaved}
        title={
          recTarget?.type === 'gotra'
            ? "Record your gotra (say the gotra name and then the word 'gotram')"
            : 'Record your name for correct pronunciation'
        }
      />
    </Layout>
  );
};

export default Booking;
