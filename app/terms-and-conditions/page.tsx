import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms and Conditions | AtoZ Works",
  description: "Terms and Conditions for AtoZ Works home services.",
};

export default function TermsAndConditions() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8 sm:p-12">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">Terms & Conditions</h1>
        <div className="prose prose-blue max-w-none text-gray-600 space-y-6">
          <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
          
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using the AtoZ Works platform and services, you accept and agree to be bound by the terms and provision of this agreement. 
              In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">2. Description of Service</h2>
            <p>
              AtoZ Works provides a platform to connect users with verified professionals for various home services, including but not limited to AC repair, cleaning, plumbing, and electrical work. 
              We act as an intermediary to facilitate the booking of these services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">3. User Responsibilities</h2>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>You must provide accurate and complete information when booking a service.</li>
              <li>You agree to pay all charges associated with the services you book through our platform.</li>
              <li>You are responsible for ensuring a safe environment for the service professionals at your premises.</li>
              <li>You agree not to use the platform for any unlawful purpose or in any way that interrupts, damages, or impairs the service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">4. Cancellations & Refunds</h2>
            <p>
              You may cancel a booking subject to our cancellation policy. Cancellations made within a certain timeframe prior to the scheduled service may incur a cancellation fee. 
              Refunds will be processed in accordance with our refund policy, and timelines may vary depending on the payment method used.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">5. Limitation of Liability</h2>
            <p>
              AtoZ Works shall not be liable for any indirect, incidental, special, consequential or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">6. Modifications to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will always post the most current version on our website. 
              By continuing to use the platform after changes become effective, you agree to be bound by the revised terms.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
