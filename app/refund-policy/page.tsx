import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Refund Policy | AtoZ Works",
  description: "Refund Policy for AtoZ Works home services.",
};

export default function RefundPolicy() {
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
        
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">Refund & Cancellation Policy</h1>
        <div className="prose prose-blue max-w-none text-gray-600 space-y-6">
          <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
          
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">1. Cancellation by the User</h2>
            <p>
              We understand that plans can change. You can cancel your service booking free of charge up to 4 hours before the scheduled service time. 
              If you cancel within 4 hours of the scheduled service time, a nominal cancellation fee may be charged to compensate our service partners for their time and travel.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">2. Cancellation by AtoZ Works</h2>
            <p>
              In rare circumstances where we are unable to assign a service partner to your booking due to unavailability or unforeseen emergencies, we will notify you as soon as possible. 
              Any advance payments made will be fully refunded to your original payment method.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">3. Refund Guidelines</h2>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li><strong>Pre-paid Services:</strong> If you cancel your prepaid booking in accordance with our cancellation policy, a full refund will be initiated.</li>
              <li><strong>Unsatisfactory Service:</strong> If you are not satisfied with the service provided, please raise a complaint within 24 hours of the service completion. We will arrange a free rework or provide a partial/full refund based on a thorough inspection.</li>
              <li><strong>Processing Time:</strong> Refunds take approximately 5-7 business days to reflect in your bank account, depending on your card issuer or bank.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">4. Non-Refundable Scenarios</h2>
            <p>
              Refunds will not be issued in the following scenarios:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>If the service was completed as per the agreed requirements and there is no defect in the workmanship.</li>
              <li>If you provide incorrect or incomplete information that prevents the service from being completed.</li>
              <li>Spare parts and materials purchased directly from third-party vendors for your service are non-refundable through us.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">5. Contacting Support for Refunds</h2>
            <p>
              To request a cancellation or refund, please navigate to the &quot;My Bookings&quot; section on the app/website or contact our support team immediately.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
