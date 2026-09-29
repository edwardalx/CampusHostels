import React from "react";

export default function ContactPage() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-600 to-teal-800 px-4 py-12">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-6 sm:p-10">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Contact Us
        </h1>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Contact Info */}
          <div className="space-y-5 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">Get in Touch</h2>

            <p>
              If you have any questions or need help, feel free to contact us.
              We will get back to you as soon as possible.
            </p>

            <div>
              <p className="font-semibold text-gray-900">Email</p>
              <p>support@example.com</p>
            </div>

            <div>
              <p className="font-semibold text-gray-900">Phone</p>
              <p>+44 123 456 7890</p>
            </div>

            <div>
              <p className="font-semibold text-gray-900">Address</p>
              <p>Nuneaton, Warwickshire, UK</p>
            </div>
          </div>

          {/* Contact Form */}
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                placeholder="Your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                rows="4"
                className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                placeholder="Write your message..."
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-primary-teal text-white rounded-lg font-semibold hover:bg-teal-600 py-3 transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
