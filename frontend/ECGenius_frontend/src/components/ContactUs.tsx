import React from "react";
import { Mail, Phone, User, Edit2, MessageSquare } from "lucide-react";

const ContactUs: React.FC = () => {
  return (
    <section className="bg-black min-h-screen flex items-center justify-center px-2">
      <div className="bg-gray-900 shadow-xl rounded-xl p-10 max-w-lg w-full mx-auto">
        <h2 className="text-3xl font-bold mb-2 text-blue-400 flex items-center gap-2">
          <Mail className="w-6 h-6 text-blue-500" /> Contact Us
        </h2>
        <p className="text-gray-300 mb-6">
          We're here to help. Have a question, need support, or want to provide feedback about ECGenius? Reach out and our team will respond promptly!
        </p>

        <form className="space-y-5">
          <div>
            <label className="text-gray-300 font-medium mb-1 flex items-center gap-1">
              <User className="w-4 h-4 text-gray-400" /> Name
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              className="w-full border border-gray-700 bg-black rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="text-gray-300 font-medium mb-1 flex items-center gap-1">
              <Mail className="w-4 h-4 text-gray-400" /> Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full border border-gray-700 bg-black rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="text-gray-300 font-medium mb-1 flex items-center gap-1">
              <Edit2 className="w-4 h-4 text-gray-400" /> Subject
            </label>
            <input
              type="text"
              placeholder="Enter the subject"
              className="w-full border border-gray-700 bg-black rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="text-gray-300 font-medium mb-1 flex items-center gap-1">
              <MessageSquare className="w-4 h-4 text-gray-400" /> Message
            </label>
            <textarea
              placeholder="Enter your message"
              rows={4}
              className="w-full border border-gray-700 bg-black rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400 resize-none text-white placeholder-gray-500"
            ></textarea>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold py-2 rounded-lg shadow transition duration-200"
          >
            Submit
          </button>
        </form>

        <div className="mt-8 pt-5 border-t border-gray-700">
          <h3 className="text-lg font-semibold mb-2 text-gray-300">Contact Information</h3>
          <div className="flex items-center text-gray-400 text-sm mb-1">
            <Mail className="w-4 h-4 mr-2" /> support@ecgenius.com
          </div>
          <div className="flex items-center text-gray-400 text-sm">
            <Phone className="w-4 h-4 mr-2" /> (555) 123-4567
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;
