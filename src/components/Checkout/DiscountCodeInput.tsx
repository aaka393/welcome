import React, { useState } from 'react';
import { Tag, Check, X } from 'lucide-react';
import Button from '../UI/Button';
import Input from '../UI/Input';
import { useDiscountStore } from '../../stores/discountStore';
import { DiscountCode, Currency } from '../../types/discount';

interface DiscountCodeInputProps {
  bookingId: string;
  onDiscountApplied: (discount: DiscountCode) => void;
  onDiscountRemoved: () => void;
  appliedDiscount?: DiscountCode;
  disabled?: boolean;
  validateDiscountCode?: (code: string, bookingId: string) => Promise<{ valid: boolean; discount?: DiscountCode; error?: string }>;
  showEditOption?: boolean;
}

const DiscountCodeInput: React.FC<DiscountCodeInputProps> = ({
  bookingId,
  onDiscountApplied,
  onDiscountRemoved,
  appliedDiscount,
  disabled = false,
  validateDiscountCode: customValidateDiscountCode,
  showEditOption = true
}) => {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const { validateDiscountCode } = useDiscountStore();

  const symbolForCurrency = (currency: Currency | string): string => {
    switch ((currency || 'INR').toString().toUpperCase()) {
      case 'USD':
        return '$';
      case 'GBP':
        return '£';
      case 'INR':
      default:
        return '₹';
    }
  };

  const handleApplyDiscount = async () => {
    if (!code.trim()) {
      setError('Please enter a discount code');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      // Use custom validation function if provided, otherwise use store function
      const result = customValidateDiscountCode 
        ? await customValidateDiscountCode(code.toUpperCase(), bookingId)
  : await validateDiscountCode(code.toUpperCase());
      
      if (result.valid && result.discount) {
        onDiscountApplied(result.discount);
        setCode('');
        setError(null);
        setIsEditing(false);
      } else {
        setError(result.error || 'Invalid discount code');
      }
    } catch (error) {
      setError((error as Error).message || 'Failed to validate discount code');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveDiscount = () => {
    onDiscountRemoved();
    setCode('');
    setError(null);
    setIsEditing(false);
  };

  const handleEditDiscount = () => {
    setIsEditing(true);
    setCode('');
    setError(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setCode('');
    setError(null);
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyDiscount();
    }
  };

  if (appliedDiscount && !isEditing) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Tag className="w-5 h-5 mr-2 text-orange-600" />
          Applied Discount
        </h3>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-800">
                  {appliedDiscount.code}
                </p>
                <p className="text-sm text-green-600">
                  {appliedDiscount.value}
                  {appliedDiscount.discountType === 'Percentage'
                    ? '% off'
                    : ` ${symbolForCurrency(appliedDiscount.currency || 'INR')} off`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {showEditOption && (
                <Button
                  onClick={handleEditDiscount}
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  Edit
                </Button>
              )}
              <Button
                onClick={handleRemoveDiscount}
                variant="ghost"
                size="sm"
                disabled={disabled}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center">
        <Tag className="w-5 h-5 mr-2 text-orange-600" />
        {isEditing ? 'Edit Discount Code' : 'Discount Code'}
      </h3>
      
      <div className="flex space-x-3">
        <div className="flex-1">
          <Input
            placeholder="Enter discount code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (error) setError(null);
            }}
            onKeyPress={handleKeyPress}
            disabled={disabled || isValidating}
            maxLength={20}
          />
        </div>
        <Button
          onClick={handleApplyDiscount}
          variant="outline"
          disabled={disabled || isValidating || !code.trim()}
          loading={isValidating}
        >
          Apply
        </Button>
        {isEditing && (
          <Button
            onClick={handleCancelEdit}
            variant="ghost"
            disabled={disabled || isValidating}
          >
            Cancel
          </Button>
        )}
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <X className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      <div className="text-xs text-gray-500">
        <p>• Discount codes are case-insensitive</p>
        <p>• Only one discount code can be applied per booking</p>
        <p>• Some restrictions may apply</p>
      </div>
    </div>
  );
};

export default DiscountCodeInput;