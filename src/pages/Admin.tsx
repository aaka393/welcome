/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Users, FileText, RefreshCw, DollarSign, Calendar, Settings } from "lucide-react";
import Layout from "../components/Layout/Layout";
import Button from "../components/UI/Button";
import Input from "../components/UI/Input";
import { useAdminAuthStore } from "../stores/adminAuthStore";
import { useDiscountStore } from "../stores/discountStore";
import { useToast } from "../components/UI/ToastContainer";
import DiscountCodeForm from "../components/Discount/DiscountCodeForm";
import DiscountCodeTable from "../components/Discount/DiscountCodeTable";
import PujaSegmentForm from "../components/Admin/PujaSegmentForm";
import BookingsTable from "../components/Admin/BookingsTable";
import { useAdminBookingStore } from "../stores/adminBookingStore";
import {
  DiscountCode,
  CreateDiscountCodeRequest,
  UpdateDiscountCodeRequest,
} from "../types/discount";

// Helper: Show revenue totals grouped by currency for successful payments
const RevenueByCurrency: React.FC<{ bookings: any[] }> = ({ bookings }) => {
  const successStatuses = new Set(["success", "paid", "completed"]);
  const totals = bookings?.reduce((acc: Record<string, number>, b: any) => {
    const status = (b?.paymentStatus || "").toString().toLowerCase();
    if (!successStatuses.has(status)) return acc;
    const currency = (b?.currency || "INR").toString().toUpperCase();
    const amount = typeof b?.amountPaid === "number" && !isNaN(b.amountPaid)
      ? b.amountPaid
      : (typeof b?.finalAmount === "number" && !isNaN(b.finalAmount) ? b.finalAmount : 0);
    if (!acc[currency]) acc[currency] = 0;
    acc[currency] += amount;
    return acc;
  }, {} as Record<string, number>);

  const entries = Object.entries(totals || {});
  if (entries.length === 0) {
    return <p className="text-2xl font-bold text-gray-800">0</p>;
  }

  return (
    <div className="space-y-1">
      {entries.map(([cur, total]) => (
        <p key={cur} className="text-2xl font-bold text-gray-800">
          {new Intl.NumberFormat("en", { style: "currency", currency: cur as any }).format(total)}
          <span className="ml-1 text-base align-middle text-gray-500">{cur}</span>
        </p>
      ))}
    </div>
  );
};

const Admin: React.FC = () => {
  const { 
    isAuthenticated, 
    user, 
    login: adminLogin, 
    isLoading: authLoading, 
    error: authError,
    clearError: clearAuthError,
    logout: adminLogout
  } = useAdminAuthStore();

  const {
    discountCodes,
    isLoading: discountLoading,
    error: discountError,
    fetchDiscountCodes,
    createDiscountCode,
    updateDiscountCode,
    deleteDiscountCode,
    clearError,
  } = useDiscountStore();
  const { showSuccess, showError } = useToast();

  const [email, setEmail] = useState("pujari@admin.com");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("bookings");
  // Admin bookings store
  const { bookings, fetchBookings } = useAdminBookingStore();
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(
    null
  );

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      fetchDiscountCodes();
      // Load bookings for header stats
      fetchBookings();
    }
  }, [isAuthenticated, user?.role, fetchDiscountCodes, fetchBookings]);

  useEffect(() => {
    return () => {
      clearAuthError();
    };
  }, [clearAuthError]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();

    const success = await adminLogin(email, password);
    if (!success) {
      showError("Login Failed", authError || "Invalid credentials");
    } else {
      showSuccess("Login Successful", "Welcome to the admin dashboard");
    }
  };

  const handleCreateDiscountCode = async (
    discountCode: CreateDiscountCodeRequest
  ): Promise<boolean> => {
    const success = await createDiscountCode(discountCode);
    if (success) {
      showSuccess("Success", "Discount code created successfully");
    } else {
      showError("Error", discountError || "Failed to create discount code");
    }
    return success;
  };

  const handleUpdateDiscountCode = async (
    discountCode: UpdateDiscountCodeRequest
  ): Promise<boolean> => {
    if (!editingDiscount) return false;

    // Ensure only allowed fields are passed for update (value, discountType, expiryDate, status)
    const updatePayload: UpdateDiscountCodeRequest = {
      value: discountCode.value,
      discountType: discountCode.discountType,
      expiryDate: discountCode.expiryDate,
      status: discountCode.status,
    };

    const success = await updateDiscountCode(editingDiscount.code, updatePayload);
    if (success) {
      showSuccess("Success", "Discount code updated successfully");
      setEditingDiscount(null);
    } else {
      showError("Error", discountError || "Failed to update discount code");
    }
    return success;
  };

  const handleDeleteDiscountCode = async (code: string): Promise<boolean> => {
    const success = await deleteDiscountCode(code);
    if (success) {
      showSuccess("Success", "Discount code deleted successfully");
    } else {
      showError("Error", discountError || "Failed to delete discount code");
    }
    return success;
  };

  const handleToggleDiscountStatus = async (
    code: string,
    currentStatus: string
  ): Promise<boolean> => {
    const discount = discountCodes.find((d) => d.code === code);
    if (!discount) return false;

    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    const success = await updateDiscountCode(code, {
      value: discount.value,
      discountType: discount.discountType,
      expiryDate: discount.expiryDate,
      status: newStatus,
    });

    if (success) {
      showSuccess("Success", `Discount code ${newStatus.toLowerCase()}`);
    } else {
      showError(
        "Error",
        discountError || "Failed to update discount code status"
      );
    }
    return success;
  };

  const handleEditDiscount = (discount: DiscountCode) => {
    setEditingDiscount(discount);
  };

  const handleCancelEdit = () => {
    setEditingDiscount(null);
  };

  // Show login form if not authenticated or not admin
  if (!isAuthenticated || !user || user.role !== "admin") {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-200 p-8">
              <div className="text-center mb-8">
                <img
                  src="/images/ai-pujari-logo.png"
                  alt="AI Pujari"
                  className="w-48 h-48 object-contain mx-auto mb-4"
                />
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Admin Access
                </h1>
                <p className="text-gray-600">Enter your admin credentials</p>
              </div>

              {authError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{authError}</p>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-6">
                <Input
                  type="email"
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={authLoading}
                  required
                />

                <Input
                  type="password"
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  disabled={authLoading}
                  required
                />

                <Button
                  type="submit"
                  loading={authLoading}
                  className="w-full"
                  size="lg"
                  disabled={authLoading}
                >
                  Login to Admin
                </Button>
              </form>

              {isAuthenticated && user && user.role !== "admin" && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    You don't have admin privileges. Please contact support if you believe this is an error.
                  </p>
                  <Button
                    onClick={adminLogout}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Admin Dashboard is only rendered if user exists and has the 'admin' role
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Welcome, {user.username || user.email.split("@")[0]}
            </div>
            <Button
              onClick={adminLogout}
              variant="outline"
              size="sm"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-orange-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-800">{bookings.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-orange-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Revenue</p>
                <RevenueByCurrency bookings={bookings} />
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-orange-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Discounts</p>
                <p className="text-2xl font-bold text-gray-800">
                  {
                    (Array.isArray(discountCodes) ? discountCodes : []).filter(
                      (code) => code.status === "Active"
                    ).length
                  }
                </p>
              </div>
              <RefreshCw className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-orange-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-800">{
                  bookings.filter((b: any) => (b?.paymentStatus || '').toLowerCase() === 'pending').length
                }</p>
              </div>
              <FileText className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-200 overflow-hidden">
          <div className="flex border-b border-orange-200 overflow-x-auto scrollbar-hide">
            {[
              { id: "bookings", label: "Bookings", icon: Users },
              { id: "invoices", label: "Invoices", icon: FileText },
              { id: "discounts", label: "Discount Codes", icon: RefreshCw },
              { id: "pujas", label: "Puja Management", icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center flex-shrink-0 space-x-2 px-4 py-3 text-sm md:px-6 md:py-4 md:text-base font-medium transition-colors ${activeTab === tab.id
                  ? "bg-orange-50 text-orange-600 border-b-2 border-orange-500"
                  : "text-gray-600 hover:text-orange-600 hover:bg-orange-50"
                  }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-4 md:p-6">
            {activeTab === "bookings" && <BookingsTable />}

            {activeTab === "pujas" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                    Puja Management
                  </h2>
                  <p className="text-sm text-gray-600">
                    Create and manage puja segments
                  </p>
                </div>

                <PujaSegmentForm />
              </div>
            )}
            {activeTab === "discounts" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                    Discount Codes
                  </h2>
                  {discountLoading && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Loading...</span>
                    </div>
                  )}
                </div>

                {/* Add/Edit Discount Form */}
                <DiscountCodeForm
                  discountCode={editingDiscount || undefined}
                  onSubmit={(payload) =>
                    editingDiscount
                      ? handleUpdateDiscountCode(payload as UpdateDiscountCodeRequest)
                      : handleCreateDiscountCode(payload as CreateDiscountCodeRequest)
                  }
                  onCancel={handleCancelEdit}
                  isLoading={discountLoading}
                  isEditing={!!editingDiscount}
                />

                {/* Discount Codes Table */}
                <DiscountCodeTable
                  discountCodes={discountCodes}
                  onEdit={handleEditDiscount}
                  onDelete={handleDeleteDiscountCode}
                  onToggleStatus={handleToggleDiscountStatus}
                  isLoading={discountLoading}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
