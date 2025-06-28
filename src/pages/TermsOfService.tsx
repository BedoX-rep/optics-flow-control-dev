
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

const TermsOfService = () => {
  const navigate = useNavigate();
  const { t, direction } = useLanguage();

  return (
    <div className={`min-h-screen bg-gray-50 ${direction === 'rtl' ? 'text-right' : 'text-left'}`} dir={direction}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className={`h-4 w-4 ${direction === 'rtl' ? 'rotate-180 ml-2' : 'mr-2'}`} />
            {t('back')}
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('termsOfService')}
          </h1>
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using Lensly, you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Service Description</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Lensly is an optical store management system that provides:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Client and customer management</li>
              <li>Inventory control and product management</li>
              <li>Receipt and invoice generation</li>
              <li>Prescription management</li>
              <li>Business analytics and reporting</li>
              <li>Multi-user access control</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              To access certain features of the service, you must create an account. You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
              <li>Providing accurate and complete information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Subscription and Payment</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Lensly offers various subscription plans:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Monthly subscription: 150 DH per month</li>
              <li>Quarterly subscription: 400 DH per quarter</li>
              <li>Lifetime access: 1500 DH one-time payment</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              All subscriptions include a 7-day free trial. Payment is due at the beginning of each billing cycle. 
              Failure to pay may result in service suspension.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data Security and Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              We take data security seriously and implement industry-standard measures to protect your information. 
              Your data is stored securely and will not be shared with third parties without your consent, 
              except as required by law. Please refer to our Privacy Policy for detailed information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Acceptable Use</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree not to use the service to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Transmit harmful or malicious content</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use the service for any unlawful purpose</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Service Availability</h2>
            <p className="text-gray-700 leading-relaxed">
              While we strive to maintain continuous service availability, we do not guarantee uninterrupted access. 
              We may temporarily suspend service for maintenance, updates, or technical issues. 
              We are not liable for any downtime or service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              Lensly is provided "as is" without warranties of any kind. We are not liable for any direct, 
              indirect, incidental, or consequential damages arising from your use of the service. 
              Our liability is limited to the amount you have paid for the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              Either party may terminate this agreement at any time. Upon termination, your access to the service 
              will cease, and your data may be deleted after a reasonable period. 
              You may export your data before termination.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. 
              Your continued use of the service constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">Email: support@lensly.com</p>
              <p className="text-gray-700">WhatsApp: 0627026249</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
