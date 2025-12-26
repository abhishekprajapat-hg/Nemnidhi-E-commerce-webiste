// src/pages/Contact.jsx
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

/**
 * Contact page with WhatsApp integration (floating button + form -> wa.me fallback)
 *
 * NOTE: WhatsApp icon uses the uploaded local path. Your environment / build should
 * map /mnt/data/9cc668de-dd81-4471-a362-5f5bbc9700b8.png to a public URL (per your dev env).
 * If not, replace iconSrc with a public URL or import an asset.
 */

const WHATSAPP_NUMBER = "+918269150205"; // <- change to your number (include country code)
const WHATSAPP_ICON_SRC = "/images/whatsapp-icon.webp"; // <- change to your WhatsApp icon path

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">{label}</label>
      {children}
    </div>
  );
}

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const formRef = useRef(null);

  // accessibility: focus first input on mount
  const nameRef = useRef(null);
  useEffect(() => {
    if (nameRef.current) nameRef.current.focus();
  }, []);

  // build wa.me url with prefilled message
  const buildWhatsAppUrl = (payload = {}) => {
    const to = WHATSAPP_NUMBER.replace(/\D/g, ""); // digits only
    const parts = [];
    if (payload.name) parts.push(`Name: ${payload.name}`);
    if (payload.email) parts.push(`Email: ${payload.email}`);
    if (payload.message) parts.push(`Message: ${payload.message}`);
    const text = encodeURIComponent(parts.join("\n"));
    return `https://wa.me/${to}?text=${text}`;
  };

  // when user clicks form Submit -> open whatsapp with prefilled text
  const onSubmit = (e) => {
    e?.preventDefault();
    // basic validation
    if (!name.trim() || !message.trim()) {
      alert("Please enter your name and a message.");
      return;
    }
    setSending(true);
    const url = buildWhatsAppUrl({ name: name.trim(), email: email.trim(), message: message.trim() });

    // open wa.me in new tab/window
    const win = window.open(url, "_blank");
    if (!win) {
      // popup blocked fallback: redirect current window
      window.location.href = url;
    }
    // keep UI responsive
    setTimeout(() => setSending(false), 800);
  };

  // floating WhatsApp button open quick chat
  const openQuickWhatsApp = () => {
    const url = buildWhatsAppUrl({ message: "Hi! I need help with your store." });
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#fdf7f7] dark:bg-black pt-24 pb-32 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold text-center text-gray-900 dark:text-white mb-8"
        >
          Contact Us
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow border border-gray-200 dark:border-zinc-700"
          >
            <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
              <Field label="Full Name">
                <input
                  ref={nameRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  placeholder="Your name"
                  required
                />
              </Field>

              <Field label="Email (optional)">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  placeholder="you@example.com"
                />
              </Field>

              <Field label="Message">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows="6"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  placeholder="How can we help?"
                  required
                />
              </Field>

              <div className="flex gap-3 items-center">
                <button
                  type="submit"
                  disabled={sending}
                  className={`px-6 py-3 rounded-lg font-semibold transition ${
                    sending ? "bg-gray-400 text-gray-700 cursor-not-allowed" : "bg-black text-white hover:opacity-90 dark:bg-white dark:text-black"
                  }`}
                >
                  {sending ? "Opening WhatsApp…" : "Send via WhatsApp"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    // clear
                    setName("");
                    setEmail("");
                    setMessage("");
                    formRef.current?.querySelector("input,textarea")?.focus();
                  }}
                  className="px-4 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-800 dark:text-gray-300"
                >
                  Clear
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                We will open WhatsApp with a prefilled message. If you're on desktop and don't have WhatsApp Desktop/ Web logged in, it will prompt you to sign in.
              </p>
            </form>
          </motion.div>

          {/* Contact details + quick whatsapp */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-4"
          >
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow border border-gray-200 dark:border-zinc-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contact Info</h3>
              <p className="mt-2 text-gray-700 dark:text-gray-400">Indore, Madhya Pradesh, India</p>
              <p className="mt-1 text-gray-700 dark:text-gray-400">Phone: +91-8269150205</p>
              <p className="mt-1 text-gray-700 dark:text-gray-400">Email: support@glam.nemnidhi.com</p>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow border border-gray-200 dark:border-zinc-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>

              <div className="mt-4 flex flex-col gap-3">
                <button
                  onClick={openQuickWhatsApp}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition"
                >
                  <img src={WHATSAPP_ICON_SRC} alt="WhatsApp" className="w-6 h-6 rounded-sm bg-white/10" onError={(e)=>{e.currentTarget.onerror=null; e.currentTarget.src='/placeholder.png'}} />
                  Chat on WhatsApp
                </button>

                <a
                  href={`tel:+91-8269150205`}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50"
                >
                  Call us
                </a>

                <a
                  href="mailto:support@glam.nemnidhi.com"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50"
                >
                  Send email
                </a>
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow border border-gray-200 dark:border-zinc-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hours</h3>
              <p className="mt-2 text-gray-700 dark:text-gray-400">Mon–Sat: 10:00 — 19:00</p>
              <p className="mt-1 text-gray-700 dark:text-gray-400">Sun: Closed</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating WhatsApp FAB */}
      <button
        aria-label="Chat on WhatsApp"
        onClick={openQuickWhatsApp}
        className="fixed right-5 bottom-6 z-50 flex items-center gap-3 px-4 py-3 rounded-full bg-green-600 text-white shadow-xl hover:scale-105 transition-transform"
      >
        <img src={WHATSAPP_ICON_SRC} alt="wa" className="w-6 h-6 rounded-sm bg-white/10" onError={(e)=>{e.currentTarget.onerror=null; e.currentTarget.src='/placeholder.png'}} />
        <span className="hidden sm:inline-block font-medium">WhatsApp</span>
      </button>
    </div>
  );
}
