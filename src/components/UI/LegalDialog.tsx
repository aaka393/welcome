import React from 'react';
import { X, Scroll } from 'lucide-react';

interface LegalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy' | 'cancellation' | 'shipping' | 'cookies';
}

const LegalDialog: React.FC<LegalDialogProps> = ({ isOpen, onClose, type }) => {
  if (!isOpen) return null;

  const getContent = () => {
    switch (type) {
      case 'terms':
        return {
    title: 'Terms of Service',
    icon: <Scroll className="w-6 h-6 text-orange-600" />,
    sections: [
      {
        title: '1. Acceptance of Terms',
        content: 'By accessing and using AI Pujari services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.'
      },
      {
        title: '2. Service Description',
        content: 'AI Pujari provides digital spiritual services including AI-powered puja ceremonies, personalized chanting, and virtual religious guidance. Our services are designed to complement, not replace, traditional religious practices.'
      },
      {
        title: '3. User Responsibilities',
        content: 'Users are responsible for providing accurate information during booking, including family names and gotras for proper pronunciation during ceremonies. Users must treat the service with respect and reverence appropriate to religious content.'
      },
      {
        title: '4. Payment and Refunds',
        content: 'All payments are processed securely through our payment partners. Refunds may be provided in case of technical issues preventing service delivery. Refund requests must be made within 24 hours of the scheduled ceremony.'
      },
      {
        title: '5. Intellectual Property',
        content: 'All AI-generated content, including chants, ceremonies, and avatar representations, remain the intellectual property of AI Pujari. Users may not record, distribute, or commercialize our content without explicit permission.'
      },
      {
        title: '6. Limitation of Liability',
        content: 'AI Pujari provides digital spiritual services for educational and devotional purposes. We are not liable for any spiritual, emotional, or personal outcomes resulting from use of our services.'
      },
      {
        title: '7. Privacy and Data Protection',
        content: 'We collect and process personal information in accordance with our Privacy Policy. Your spiritual and personal data is handled with the utmost care and respect.'
      },
      {
        title: '8. Modifications to Terms',
        content: 'AI Pujari reserves the right to modify these terms at any time. Users will be notified of significant changes via email or through our platform.'
      }
    ]
        };
      case 'privacy':
        return {
    title: 'Privacy Policy',
    icon: <Scroll className="w-6 h-6 text-orange-600" />,
    sections: [
      {
        title: '1. Information We Collect',
        content: 'We collect personal information including your name, email address, family member names, gotras, and payment information. We also collect usage data to improve our AI services and user experience.'
      },
      {
        title: '2. How We Use Your Information',
        content: 'Your information is used to provide personalized puja services, process payments, send booking confirmations, and improve our AI algorithms. Family names and gotras are used specifically for accurate pronunciation during ceremonies.'
      },
      {
        title: '3. Data Storage and Security',
        content: 'All personal data is encrypted and stored securely using industry-standard security measures. We use secure cloud infrastructure and regularly audit our security practices to protect your sensitive information.'
      },
      {
        title: '4. Sharing of Information',
        content: 'We do not sell, trade, or share your personal information with third parties except as necessary to provide our services (payment processing) or as required by law. Your spiritual and family information remains confidential.'
      },
      {
        title: '5. Audio Recordings',
        content: 'If you provide audio recordings of family member names for pronunciation, these recordings are used solely for AI training and service personalization. Recordings are encrypted and not shared with third parties.'
      },
      {
        title: '6. Cookies and Tracking',
        content: 'We use cookies to enhance user experience, remember preferences, and analyze usage patterns. You can control cookie settings through your browser preferences.'
      },
      {
        title: '7. Your Rights',
        content: 'You have the right to access, update, or delete your personal information. You can request data portability or restrict processing of your data by contacting our support team.'
      },
      {
        title: '8. Children\'s Privacy',
        content: 'Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13 without parental consent.'
      },
      {
        title: '9. International Data Transfers',
        content: 'Your data may be processed in countries other than your residence. We ensure appropriate safeguards are in place for international data transfers in compliance with applicable privacy laws.'
      },
      {
        title: '10. Contact Information',
        content: 'For privacy-related questions or concerns, contact us at privacy@aipujari.com or through our support channels. We respond to privacy inquiries within 30 days.'
      }
    ]
        };
      case 'cancellation':
        return {
          title: 'Cancellation Policy',
          icon: <Scroll className="w-6 h-6 text-red-600" />,
          sections: [
            {
              title: '1. No Cancellation Policy',
              content: 'Once a puja booking is confirmed and payment is processed, no cancellations are allowed. This policy ensures that our AI Pujaris can prepare personalized content and maintain the sacred scheduling of ceremonies.'
            },
            {
              title: '2. Booking Confirmation',
              content: 'Please carefully review all booking details including date, time, puja type, and family information before confirming your payment. Once confirmed, the booking becomes final and non-cancellable.'
            },
            {
              title: '3. Rescheduling Options',
              content: 'While cancellations are not permitted, we may allow rescheduling in exceptional circumstances such as medical emergencies or natural disasters. Rescheduling requests must be made at least 24 hours before the scheduled ceremony.'
            },
            {
              title: '4. Technical Issues',
              content: 'If technical issues on our end prevent the delivery of your puja service, we will provide a full refund or reschedule at no additional cost. This does not apply to technical issues on the customer\'s end.'
            },
            {
              title: '5. Refund Exceptions',
              content: 'Refunds are only provided in cases where AI Pujari fails to deliver the booked service due to technical failures on our platform. Customer-side technical issues, change of mind, or scheduling conflicts do not qualify for refunds.'
            },
            {
              title: '6. Contact for Emergencies',
              content: 'For genuine emergencies that may require rescheduling, contact our support team at support@aiyensi.com immediately. Each case will be reviewed individually with appropriate documentation required.'
            }
          ]
        };
      case 'shipping':
        return {
          title: 'Shipping Policy',
          icon: <Scroll className="w-6 h-6 text-blue-600" />,
          sections: [
            {
              title: '1. Digital Service Only',
              content: 'AI Pujari provides exclusively digital spiritual services. No physical products are shipped or delivered. All puja ceremonies, chanting sessions, and spiritual guidance are delivered through our online platform.'
            },
            {
              title: '2. Service Delivery Method',
              content: 'Your personalized puja experience is delivered via secure video streaming directly to your device. You will receive access credentials and session links via email after successful payment confirmation.'
            },
            {
              title: '3. Access Requirements',
              content: 'To access your puja service, you need a stable internet connection and a device capable of video streaming (computer, tablet, or smartphone). We recommend a minimum internet speed of 5 Mbps for optimal experience.'
            },
            {
              title: '4. Delivery Timeline',
              content: 'Digital access to your booked puja session is provided immediately after payment confirmation. You will receive an email with session details and access instructions within 15 minutes of successful payment.'
            },
            {
              title: '5. No Physical Materials',
              content: 'We do not provide physical puja materials, idols, or ceremonial items. Customers are responsible for arranging their own puja materials as guided by our AI Pujari during the session.'
            },
            {
              title: '6. Technical Support',
              content: 'If you experience any technical difficulties accessing your digital puja service, our support team is available at support@aiyensi.com to assist you promptly.'
            }
          ]
        };
      case 'cookies':
        return {
          title: 'Cookie Policy',
          icon: <Scroll className="w-6 h-6 text-orange-600" />,
          sections: [
            {
              title: '1. What Are Cookies',
              content: 'Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our site.'
            },
            {
              title: '2. Types of Cookies We Use',
              content: 'We use four types of cookies: Strictly Necessary (essential for website function), Analytics (help us understand usage patterns), Functional (remember your preferences), and Marketing (deliver personalized content and measure campaign effectiveness).'
            },
            {
              title: '3. Strictly Necessary Cookies',
              content: 'These cookies are essential for our website to function properly. They enable basic functions like page navigation, access to secure areas of the website, and authentication. The website cannot function properly without these cookies.'
            },
            {
              title: '4. Analytics Cookies',
              content: 'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This includes data about which pages are visited most often and if users get error messages from web pages.'
            },
            {
              title: '5. Functional Cookies',
              content: 'These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages. If you do not allow these cookies, some or all of these services may not function properly.'
            },
            {
              title: '6. Marketing Cookies',
              content: 'These cookies are used to deliver advertisements more relevant to you and your interests. They are also used to limit the number of times you see an advertisement and help measure the effectiveness of advertising campaigns.'
            },
            {
              title: '7. Managing Your Cookie Preferences',
              content: 'You can manage your cookie preferences at any time by clicking the "Cookie Settings" link in our footer. You can also control cookies through your browser settings, though this may affect website functionality.'
            },
            {
              title: '8. Third-Party Cookies',
              content: 'Some cookies on our site are set by third-party services that appear on our pages. We do not control these cookies and recommend reviewing the privacy policies of these third-party services for more information.'
            },
            {
              title: '9. Cookie Retention',
              content: 'Different cookies have different retention periods. Session cookies are deleted when you close your browser, while persistent cookies remain on your device for a set period or until you delete them manually.'
            },
            {
              title: '10. Updates to Cookie Policy',
              content: 'We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the updated policy on our website.'
            }
          ]
        };
      default:
        return { title: '', icon: null, sections: [] };
    }
  };

  const content = getContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
          <div className="flex items-center space-x-3">
            {content.icon}
            <h2 className="text-2xl font-bold text-gray-800">{content.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-orange-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="space-y-6">
              <div className="text-sm text-gray-600 bg-orange-50 p-4 rounded-lg border border-orange-200">
                <p className="font-medium text-orange-800 mb-2">
                  Last Updated: August 21, 2025
                  {type === 'cancellation' && ' | Effective Immediately'}
                  {type === 'shipping' && ' | Digital Services Only'}
                  {type === 'cookies' && ' | GDPR Compliant'}
                </p>
                <p>
                  This {
                    type === 'terms' ? 'Terms of Service' : 
                    type === 'privacy' ? 'Privacy Policy' :
                    type === 'cookies' ? 'Cookie Policy' :
                    'Policy'
                  } governs your use of AI Pujari services. 
                  Please read carefully and contact us if you have any questions.
                </p>
              </div>
              
              {content.sections.map((section, index) => (
                <div key={index} className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <span className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      {index + 1}
                    </span>
                    {section.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed ml-11">
                    {section.content}
                  </p>
                </div>
              ))}
              
              <div className="mt-8 p-4 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg border border-orange-200">
                <h3 className="font-semibold text-gray-800 mb-2">Contact Us</h3>
                <p className="text-gray-600 text-sm">
                  If you have questions about this {
                    type === 'terms' ? 'Terms of Service' : 
                    type === 'privacy' ? 'Privacy Policy' :
                    type === 'cancellation' ? 'Cancellation Policy' : 
                    type === 'shipping' ? 'Shipping Policy' : 'Cookie Policy'
                  }, 
                  please contact us at:
                </p>
                <div className="mt-2 text-sm text-gray-700">
                  <p>Email: support@aiyensi.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex-shrink-0 p-6 border-t border-orange-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-700 transition-all duration-200"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalDialog;