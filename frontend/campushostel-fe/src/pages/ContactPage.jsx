import React from "react";

export default function ContactPage() {
  return (
    <div className="w-full min-h-screen  flex items-center justify-center bg-gradient-to-br from-teal-700 to-teal-800 dark:bg-gray-800">
      <div className="max-w-4xl w-full bg-gradient-to-br from-teal-500 to-teal-600 dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-6">
          Contact Us
        </h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <h2 className="text-xl font-semibold">Get in Touch</h2>

            <p>
              If you have any questions or need help, feel free to contact us.
              We will get back to you as soon as possible.
            </p>

            <div>
              <p className="font-semibold">Email</p>
              <p>support@example.com</p>
            </div>

            <div>
              <p className="font-semibold">Phone</p>
              <p>+44 123 456 7890</p>
            </div>

            <div>
              <p className="font-semibold">Address</p>
              <p>Nuneaton, Warwickshire, UK</p>
            </div>
          </div>

          {/* Contact Form */}
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name
              </label>
              <input
                type="text"
                className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="Your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Message
              </label>
              <textarea
                rows="4"
                className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="Write your message..."
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-white text-teal-900 rounded-lg font-semibold hover:bg-gray-100  py-3  transition"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
