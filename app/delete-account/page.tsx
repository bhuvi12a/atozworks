import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Delete Account | AtoZ Works",
  description: "Request to delete your AtoZ Works account and associated data.",
};

export default function DeleteAccount() {
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center">
          <Link href="/" className="text-gray-500 hover:text-gray-900 transition mr-4">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Account Deletion</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white shadow rounded-lg p-6 sm:p-10 text-gray-700 leading-relaxed">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Request Account Deletion</h2>
          
          <p className="mb-4">
            At AtoZ Works, we respect your privacy and your right to control your personal data. 
            If you wish to permanently delete your account and all associated data, please follow the instructions below.
          </p>

          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">Important Notice</h3>
            <ul className="list-disc pl-5 text-red-700 space-y-1">
              <li>Deleting your account is permanent and cannot be undone.</li>
              <li>All your booking history, saved addresses, and profile information will be permanently erased.</li>
              <li>Any active service requests will be cancelled.</li>
            </ul>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">How to delete your account</h3>
          <p className="mb-4">
            To request account deletion, please send an email to our support team from the email address or provide the phone number associated with your account:
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
            <p className="mb-2"><strong>Email To:</strong> <a href="mailto:support@atozworks.in" className="text-blue-600 hover:underline">support@atozworks.in</a></p>
            <p className="mb-2"><strong>Subject:</strong> Account Deletion Request</p>
            <p><strong>Body:</strong> Please include your registered phone number and a brief statement requesting the deletion of your account and data.</p>
          </div>

          <p className="mb-4">
            Once we receive your request, our team will process the deletion within 7-14 business days. 
            We may contact you to verify your identity before completing the deletion process to ensure the security of your account.
          </p>

          <p className="mt-8 text-sm text-gray-500 text-center">
            Last updated: August 2026
          </p>
        </div>
      </main>
    </div>
  );
}
