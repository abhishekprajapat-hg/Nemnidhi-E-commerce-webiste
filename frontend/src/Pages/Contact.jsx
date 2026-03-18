import React, { useState, useRef, useEffect } from "react";

const WHATSAPP_NUMBER = "+918269150205";
const WHATSAPP_ICON_SRC = "/images/whatsapp-icon.webp";

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const formRef = useRef(null);
  const nameRef = useRef(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const buildWhatsAppUrl = (payload = {}) => {
    const to = WHATSAPP_NUMBER.replace(/\D/g, "");
    const parts = [];
    if (payload.name) parts.push(`Name: ${payload.name}`);
    if (payload.email) parts.push(`Email: ${payload.email}`);
    if (payload.message) parts.push(`Message: ${payload.message}`);
    return `https://wa.me/${to}?text=${encodeURIComponent(parts.join("\n"))}`;
  };

  const onSubmit = (event) => {
    event.preventDefault();

    if (!name.trim() || !message.trim()) {
      alert("Please enter your name and message.");
      return;
    }

    setSending(true);
    const url = buildWhatsAppUrl({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });

    const popup = window.open(url, "_blank");
    if (!popup) window.location.href = url;
    setTimeout(() => setSending(false), 800);
  };

  const openQuickWhatsApp = () => {
    window.open(
      buildWhatsAppUrl({ message: "Hi! I need help with my order." }),
      "_blank"
    );
  };

  return (
    <div className="nm-shell py-8 sm:py-10">
      <div className="mb-7">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--nm-muted)]">
          Contact
        </p>
        <h1 className="nm-display mt-2 text-5xl font-semibold leading-none">
          Let&apos;s talk
        </h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5 sm:p-7">
          <h2 className="text-xl font-semibold">Send a message</h2>
          <p className="mt-1 text-sm text-[var(--nm-muted)]">
            We typically respond within one business day.
          </p>

          <form ref={formRef} onSubmit={onSubmit} className="mt-5 space-y-4">
            <Field label="Full Name">
              <input
                ref={nameRef}
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                placeholder="Your name"
                className="w-full rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-3 text-sm focus:border-[var(--nm-accent)] focus:outline-none"
              />
            </Field>

            <Field label="Email (optional)">
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-3 text-sm focus:border-[var(--nm-accent)] focus:outline-none"
              />
            </Field>

            <Field label="Message">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={6}
                required
                placeholder="How can we help?"
                className="w-full rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-3 text-sm focus:border-[var(--nm-accent)] focus:outline-none"
              />
            </Field>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={sending}
                className="nm-btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? "Opening..." : "Send via WhatsApp"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setName("");
                  setEmail("");
                  setMessage("");
                  formRef.current?.querySelector("input,textarea")?.focus();
                }}
                className="nm-btn-secondary text-sm"
              >
                Clear
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-4">
          <article className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            <div className="mt-3 space-y-1.5 text-sm text-[var(--nm-muted)]">
              <p>Indore, Madhya Pradesh, India</p>
              <p>+91 82691 50205</p>
              <p>support@nemnidhiglam.com</p>
            </div>
          </article>

          <article className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <div className="mt-3 space-y-2">
              <button
                onClick={openQuickWhatsApp}
                className="flex w-full items-center gap-3 rounded-2xl bg-green-600 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-green-700"
              >
                <img
                  src={WHATSAPP_ICON_SRC}
                  alt="WhatsApp"
                  className="h-6 w-6 rounded bg-white/15"
                  onError={(event) => {
                    event.currentTarget.src = "/placeholder.png";
                  }}
                />
                Chat on WhatsApp
              </button>
              <a
                href="tel:+918269150205"
                className="block rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-3 text-sm font-semibold transition hover:border-[var(--nm-accent)] hover:text-[var(--nm-accent)]"
              >
                Call Us
              </a>
              <a
                href="mailto:support@nemnidhiglam.com"
                className="block rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-3 text-sm font-semibold transition hover:border-[var(--nm-accent)] hover:text-[var(--nm-accent)]"
              >
                Send Email
              </a>
            </div>
          </article>

          <article className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5">
            <h3 className="text-lg font-semibold">Support Hours</h3>
            <p className="mt-2 text-sm text-[var(--nm-muted)]">Mon-Sat: 10:00 to 19:00</p>
            <p className="text-sm text-[var(--nm-muted)]">Sunday: Closed</p>
          </article>
        </section>
      </div>

      <button
        aria-label="Chat on WhatsApp"
        onClick={openQuickWhatsApp}
        className="fixed bottom-24 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-xl transition hover:scale-105 sm:bottom-6"
      >
        <img
          src={WHATSAPP_ICON_SRC}
          alt="WhatsApp"
          className="h-5 w-5"
          onError={(event) => {
            event.currentTarget.src = "/placeholder.png";
          }}
        />
        <span className="hidden sm:inline">WhatsApp</span>
      </button>
    </div>
  );
}
