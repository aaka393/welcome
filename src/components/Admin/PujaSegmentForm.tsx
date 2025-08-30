import React, { useState } from 'react';
import { Plus, Video } from 'lucide-react';
import Button from '../UI/Button';
import Input from '../UI/Input';
import { CreatePujaSegmentRequest } from '../../types/puja';
import { pujaService } from '../../services/pujaService';
import { useToast } from '../UI/ToastContainer';

const PujaSegmentForm: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreatePujaSegmentRequest>({
    pujaType: '',
    segmentType: '',
    sequenceOrder: 0,
    isDynamic: true,
    defaultVideoUrl: '',
    textScript: '',
    durationSeconds: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.pujaType.trim()) {
      newErrors.pujaType = 'Puja type is required';
    }

    if (!formData.segmentType.trim()) {
      newErrors.segmentType = 'Segment type is required';
    }

    if (formData.sequenceOrder < 0) {
      newErrors.sequenceOrder = 'Sequence order must be 0 or greater';
    }

    if (!formData.defaultVideoUrl.trim()) {
      newErrors.defaultVideoUrl = 'Default video URL is required';
    }

    if (!formData.textScript.trim()) {
      newErrors.textScript = 'Text script is required';
    }

    if (formData.durationSeconds <= 0) {
      newErrors.durationSeconds = 'Duration must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await pujaService.createPujaSegment(formData);
      
      if (result.success) {
        showSuccess('Success', 'Puja segment created successfully');
        // Reset form
        setFormData({
          pujaType: '',
          segmentType: '',
          sequenceOrder: 0,
          isDynamic: true,
          defaultVideoUrl: '',
          textScript: '',
          durationSeconds: 0
        });
        setErrors({});
      } else {
        showError('Error', result.error || 'Failed to create puja segment');
      }
    } catch (error: any) {
      showError('Error', error.message || 'Failed to create puja segment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreatePujaSegmentRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-800 mb-6 flex items-center">
        <Video className="w-5 h-5 mr-2 text-orange-600" />
        Create Puja Segment
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Puja Type"
            placeholder="e.g., holipuja"
            value={formData.pujaType}
            onChange={(e) => handleInputChange('pujaType', e.target.value)}
            error={errors.pujaType}
            disabled={isSubmitting}
          />
          
          <Input
            label="Segment Type"
            placeholder="e.g., intro"
            value={formData.segmentType}
            onChange={(e) => handleInputChange('segmentType', e.target.value)}
            error={errors.segmentType}
            disabled={isSubmitting}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Sequence Order"
            type="number"
            placeholder="0"
            value={formData.sequenceOrder}
            onChange={(e) => handleInputChange('sequenceOrder', parseInt(e.target.value) || 0)}
            error={errors.sequenceOrder}
            disabled={isSubmitting}
            min="0"
          />
          
          <Input
            label="Duration (seconds)"
            type="number"
            placeholder="300"
            value={formData.durationSeconds}
            onChange={(e) => handleInputChange('durationSeconds', parseInt(e.target.value) || 0)}
            error={errors.durationSeconds}
            disabled={isSubmitting}
            min="1"
          />
        </div>

        <Input
          label="Default Video URL"
          placeholder="https://example.com/video.mp4"
          value={formData.defaultVideoUrl}
          onChange={(e) => handleInputChange('defaultVideoUrl', e.target.value)}
          error={errors.defaultVideoUrl}
          disabled={isSubmitting}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Text Script
          </label>
          <textarea
            value={formData.textScript}
            onChange={(e) => handleInputChange('textScript', e.target.value)}
            placeholder="Enter the text script for this segment..."
            disabled={isSubmitting}
            rows={4}
            className={`block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
              errors.textScript ? 'border-red-500' : ''
            }`}
          />
          {errors.textScript && (
            <p className="text-sm text-red-600 mt-1">{errors.textScript}</p>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="isDynamic"
            checked={formData.isDynamic}
            onChange={(e) => handleInputChange('isDynamic', e.target.checked)}
            disabled={isSubmitting}
            className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
          />
          <label htmlFor="isDynamic" className="text-sm font-medium text-gray-700">
            Is Dynamic Segment
          </label>
        </div>
        
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Puja Segment
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PujaSegmentForm;