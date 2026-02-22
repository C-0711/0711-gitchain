"use client";

import { useState } from "react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Thank you!</h1>
          <p className="text-gray-400">We will be in touch soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-16 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-center">Contact Sales</h1>
        <p className="text-gray-400 text-center mb-12">
          Tell us about your needs and we will get back to you within 24 hours.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Name</label>
              <input
                type="text"
                required
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <input
                type="email"
                required
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Company</label>
            <input
              type="text"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Message</label>
            <textarea
              rows={5}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3"
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-semibold text-lg"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
