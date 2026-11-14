import React, { useState } from 'react';
import { motion } from 'framer-motion';

function ContactUs() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 py-16 px-4">
      <div className="max-w-2xl mx-auto bg-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">Contact Us</h1>
          <p className="text-gray-300 mb-8">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
          
          {submitted ? (
            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-6 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Message Sent!</h2>
              <p className="text-green-200">Thank you for reaching out. We will get back to you shortly.</p>
              <button 
                onClick={() => setSubmitted(false)}
                className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input 
                  type="text" 
                  required 
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="Your Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input 
                  type="email" 
                  required 
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="you@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                <textarea 
                  required 
                  rows="4"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                  placeholder="How can we help you?"
                ></textarea>
              </div>
              
              <button 
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transform transition-all hover:scale-[1.02]"
              >
                Send Message
              </button>
            </form>
          )}
          
          <div className="mt-8 text-center">
            <a href="/" className="text-blue-400 hover:text-blue-300 font-medium">← Back to Home</a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default ContactUs;
