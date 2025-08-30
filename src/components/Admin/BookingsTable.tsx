import React, { useEffect, useMemo, useState } from 'react';
import Button from '../UI/Button';
import { Eye, RefreshCw, Trash2 } from 'lucide-react';
import { useAdminBookingStore } from '../../stores/adminBookingStore';
import { formatBackendDateForDisplay } from '../../utils/dateUtils';

const statusBadgeClass = (status?: string) => {
  switch ((status || '').toLowerCase()) {
    case 'completed':
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'failed':
    default:
      return 'bg-red-100 text-red-800';
  }
};

const BookingsTable: React.FC = () => {
  const { bookings, isLoading, error, fetchBookings, updateBooking, deleteBooking } = useAdminBookingStore();
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('');
  const [filterPujaType, setFilterPujaType] = useState<string>('');
  const [filterEmail, setFilterEmail] = useState<string>('');

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      // Exclude deleted bookings from view
      if (b.isDeleted === true) return false;
      const matchesStatus = filterPaymentStatus ? b.paymentStatus?.toLowerCase() === filterPaymentStatus.toLowerCase() : true;
      const matchesPuja = filterPujaType ? b.pujaType?.toLowerCase().includes(filterPujaType.toLowerCase()) : true;
      const matchesEmail = filterEmail ? b.userEmail?.toLowerCase().includes(filterEmail.toLowerCase()) : true;
      return matchesStatus && matchesPuja && matchesEmail;
    });
  }, [bookings, filterPaymentStatus, filterPujaType, filterEmail]);

  const markAsCompleted = async (id: string) => {
    try {
      await updateBooking(id, { paymentStatus: 'completed' });
    } catch (e) {
      console.error('Failed to update booking', e);
    }
  };

  const deleteBookingLocal = async (id: string, label?: string) => {
    const confirmMsg = `Are you sure you want to delete this booking${label ? ` (${label})` : ''}?\nThis will mark the booking as deleted.`;
    const ok = window.confirm(confirmMsg);
    if (!ok) return;
    try {
      await deleteBooking(id);
    } catch (e) {
      console.error('Failed to delete booking', e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-end md:space-x-3 space-y-3 md:space-y-0">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Puja Type</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Search puja type"
            value={filterPujaType}
            onChange={(e) => setFilterPujaType(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">User Email</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Search email"
            value={filterEmail}
            onChange={(e) => setFilterEmail(e.target.value)}
          />
        </div>
        <div>
          <Button variant="outline" onClick={() => fetchBookings({
            paymentStatus: filterPaymentStatus || undefined,
            pujaType: filterPujaType || undefined,
            userEmail: filterEmail || undefined,
          })}>Refresh</Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-600">ID</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">User</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Puja Type</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Preferred Time</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td className="py-6 px-4 text-center text-sm text-gray-500" colSpan={7}>Loading...</td></tr>
            )}
            {!isLoading && error && (
              <tr><td className="py-6 px-4 text-center text-sm text-red-600" colSpan={7}>{error}</td></tr>
            )}
            {!isLoading && !error && filtered.length === 0 && (
              <tr><td className="py-6 px-4 text-center text-sm text-gray-500" colSpan={7}>No bookings found</td></tr>
            )}
            {!isLoading && !error && filtered.map((booking) => (
              <tr key={booking.id} className="border-b border-gray-100">
                <td className="py-4 px-4 text-sm font-mono">#{booking.id}</td>
                <td className="py-4 px-4 text-sm">{booking.userEmail}</td>
                <td className="py-4 px-4">{booking.pujaType}</td>
                <td className="py-4 px-4">{booking.preferredDatetime ? formatBackendDateForDisplay(booking.preferredDatetime) : '-'}</td>
                <td className="py-4 px-4 font-medium">₹{(booking.amountPaid ?? booking.finalAmount ?? 0).toLocaleString()}</td>
                <td className="py-4 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadgeClass(booking.paymentStatus)}`}>
                    {booking.paymentStatus}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" title="View">
                      <Eye className="w-4 h-4" />
                    </Button>
                    {(booking.paymentStatus || '').toLowerCase() !== 'completed' && (
                      <Button variant="ghost" size="sm" className="text-green-600" onClick={() => markAsCompleted(booking.id)}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    )}
                    {booking.isDeleted !== true && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        title="Delete"
                        onClick={() => deleteBookingLocal(booking.id, `${booking.userEmail} - ${booking.pujaType}`)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookingsTable;
