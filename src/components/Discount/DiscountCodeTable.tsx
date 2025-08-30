import React, { useState } from 'react';
import { Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import Button from '../UI/Button';
import ConfirmDialog from '../UI/ConfirmDialog';
import { DiscountCode } from '../../types/discount';
import { formatBackendDateForDisplay } from '../../utils/dateUtils';

interface DiscountCodeTableProps {
  discountCodes: DiscountCode[];
  onEdit: (discountCode: DiscountCode) => void;
  onDelete: (code: string) => Promise<boolean>;
  onToggleStatus: (code: string, currentStatus: string) => Promise<boolean>;
  isLoading: boolean;
}

const DiscountCodeTable: React.FC<DiscountCodeTableProps> = ({
  discountCodes,
  onEdit,
  onDelete,
  onToggleStatus,
  isLoading
}) => {
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    code: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    code: '',
    isLoading: false
  });


  const handleDeleteClick = (code: string) => {
    setDeleteDialog({
      isOpen: true,
      code,
      isLoading: false
    });
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialog(prev => ({ ...prev, isLoading: true }));
    
    const success = await onDelete(deleteDialog.code);
    
    if (success) {
      setDeleteDialog({
        isOpen: false,
        code: '',
        isLoading: false
      });
    } else {
      setDeleteDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({
      isOpen: false,
      code: '',
      isLoading: false
    });
  };

  if (discountCodes.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No discount codes found</h3>
        <p className="text-gray-500">Create your first discount code to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Code</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Value</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Currency</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Max Entries</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Expiry Date</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Usage</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {discountCodes.map((discount) => (
              <tr key={discount.code} className="hover:bg-gray-50">
                <td className="py-4 px-4">
                  <span className="font-mono font-medium text-gray-900">
                    {discount.code}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="font-medium text-gray-900">
                    {discount.value}
                    {discount.discountType === 'Percentage' ? '%' : '₹'}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="capitalize text-gray-700">
                    {discount.discountType}
                  </span>
                </td>
                <td className="py-4 px-4 text-gray-700">
                  {(discount.currency || 'INR')}
                </td>
                <td className="py-4 px-4 text-gray-700">
                  {typeof discount.maxEntries === 'number' && discount.maxEntries > 0 ? discount.maxEntries : 'Unlimited'}
                </td>
                <td className="py-4 px-4 text-gray-700">
                  {formatBackendDateForDisplay(discount.expiryDate)}
                </td>
                <td className="py-4 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    discount.status === 'Active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {discount.status}
                  </span>
                </td>
                <td className="py-4 px-4 text-gray-700">
                  {discount.usageCount}
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => onEdit(discount)}
                      variant="ghost"
                      size="sm"
                      disabled={isLoading}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      onClick={() => onToggleStatus(discount.code, discount.status)}
                      variant="ghost"
                      size="sm"
                      disabled={isLoading}
                      className={`${
                        discount.status === 'Active'
                          ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50'
                          : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                      }`}
                    >
                      {discount.status === 'Active' ? (
                        <ToggleRight className="w-4 h-4" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => handleDeleteClick(discount.code)}
                      variant="ghost"
                      size="sm"
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Discount Code"
        message={`Are you sure you want to delete the discount code "${deleteDialog.code}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteDialog.isLoading}
      />
    </>
  );
};

export default DiscountCodeTable;