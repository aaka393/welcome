/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Plus, Edit3 } from 'lucide-react';
import Button from '../UI/Button';
import Input from '../UI/Input';
import { DiscountCode, CreateDiscountCodeRequest, UpdateDiscountCodeRequest, Currency } from '../../types/discount';
import { htmlDateToBackendFormat } from '../../utils/dateUtils';

interface DiscountCodeFormProps {
  discountCode?: DiscountCode;
  onSubmit: (discountCode: CreateDiscountCodeRequest | UpdateDiscountCodeRequest) => Promise<boolean>;
  onCancel: () => void;
  isLoading: boolean;
  isEditing: boolean; 
}

const DiscountCodeForm: React.FC<DiscountCodeFormProps> = ({
  discountCode,
  onSubmit,
  onCancel,
  isEditing,
  isLoading
}) => {
  const [formData, setFormData] = useState<CreateDiscountCodeRequest>({
    code: '',
    value: 0,
    discountType: 'Percentage',
    expiryDate: '',
    status: 'Active',
    usageCount: 0,
    currency: 'INR',
    maxEntries: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (discountCode) {
      setFormData({
        // Editing should not allow changing code/currency/maxEntries (backend update doesn't accept those)
        code: discountCode.code,
        value: discountCode.value,
        discountType: discountCode.discountType,
        expiryDate: discountCode.expiryDate,
        status: discountCode.status,
        usageCount: discountCode.usageCount,
        currency: (discountCode.currency as Currency) || 'INR',
        maxEntries: typeof discountCode.maxEntries === 'number' ? discountCode.maxEntries : 0
      });
    }
  }, [discountCode]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Code validation
    if (!formData.code.trim()) {
      newErrors.code = 'Code is required';
    } else if (!/^[A-Z0-9]{3,20}$/.test(formData.code)) {
      newErrors.code = 'Code must be 3-20 characters, uppercase letters and numbers only';
    }

    // Value validation
    if (formData.value <= 0) {
      newErrors.value = 'Value must be greater than 0';
    } else if (formData.discountType === 'Percentage' && formData.value > 100) {
      newErrors.value = 'Percentage value cannot exceed 100';
    }

    // Expiry date validation
    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else {
      const selectedDate = new Date(formData.expiryDate);
      if (selectedDate <= new Date()) {
        newErrors.expiryDate = 'Expiry date must be in the future';
      }
    }

    // Currency validation
    if (!formData.currency) {
      newErrors.currency = 'Currency is required';
    }

    // maxEntries validation (optional but if provided must be >= 0 and integer)
    if (formData.maxEntries !== undefined && formData.maxEntries !== null) {
      const me = Number(formData.maxEntries);
      if (isNaN(me) || me < 0) {
        newErrors.maxEntries = 'Max entries must be 0 or a positive number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Convert HTML date to backend format and shape payload per mode
    const formattedExpiry = htmlDateToBackendFormat(formData.expiryDate);

    const payload: CreateDiscountCodeRequest | UpdateDiscountCodeRequest = isEditing
      ? {
          // Update payload must match backend DiscountUpdate
          value: formData.value,
          discountType: formData.discountType,
          expiryDate: formattedExpiry,
          status: formData.status
        }
      : {
          // Create payload includes all fields
          code: formData.code.toUpperCase(),
          value: formData.value,
          discountType: formData.discountType,
          expiryDate: formattedExpiry,
          status: formData.status,
          usageCount: formData.usageCount,
          currency: formData.currency,
          maxEntries: formData.maxEntries
        };

    const success = await onSubmit(payload);
    if (success) {
      if (!discountCode) {
        // Reset form for new discount code
        setFormData({
          code: '',
          value: 0,
          discountType: 'Percentage',
          expiryDate: '',
          status: 'Active',
          usageCount: 0,
          currency: 'INR',
          maxEntries: 0
        });
      }
      setErrors({});
    }
  };

  const handleInputChange = (field: keyof CreateDiscountCodeRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
      <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
        {discountCode ? (
          <>
            <Edit3 className="w-5 h-5 mr-2 text-orange-600" />
            Edit Discount Code
          </>
        ) : (
          <>
            <Plus className="w-5 h-5 mr-2 text-orange-600" />
            Add New Discount Code
          </>
        )}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Code"
            placeholder="DISCOUNT20"
            value={formData.code}
            onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
            error={errors.code}
            disabled={isLoading || isEditing} 
            maxLength={20}
          />
          
          <Input
            label="Value"
            type="number"
            placeholder="20"
            value={formData.value || ''}
            onChange={(e) => handleInputChange('value', parseInt(e.target.value) || 0)}
            error={errors.value}
            disabled={isLoading}
            min="1"
            max={formData.discountType === 'Percentage' ? "100" : undefined}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={formData.discountType}
              onChange={(e) => handleInputChange('discountType', e.target.value as 'Percentage' | 'Fixed')}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50"
            >
              <option value="Percentage">Percentage</option>
              <option value="Fixed">Fixed Amount</option>
            </select>
          </div>
          
          <Input
            label="Expiry Date"
            type="date"
            value={formData.expiryDate}
            onChange={(e) => handleInputChange('expiryDate', e.target.value)}
            error={errors.expiryDate}
            disabled={isLoading}
            min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
          />
        </div>

        {/* New Row: Currency and Max Entries */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => handleInputChange('currency', e.target.value as Currency)}
              disabled={isLoading || isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50"
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
            {errors.currency && (
              <p className="mt-1 text-sm text-red-600">{errors.currency}</p>
            )}
          </div>

          <Input
            label="Max Entries"
            type="number"
            placeholder="0 (unlimited)"
            value={formData.maxEntries ?? 0}
            onChange={(e) => handleInputChange('maxEntries', Math.max(0, parseInt(e.target.value || '0')))}
            error={errors.maxEntries}
            disabled={isLoading || isEditing}
            min="0"
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value as 'Active' | 'Inactive')}
              disabled={isLoading}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          {discountCode && (
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            loading={isLoading}
            disabled={isLoading}
          >
            {discountCode ? 'Update' : 'Add'} Discount Code
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DiscountCodeForm;