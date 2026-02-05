"use client";

import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="border-b border-neutral-200 bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-neutral-900">Contact us</h1>
        <p className="mt-2 text-neutral-600">
          Have a question or feedback? Send us a message and we'll get back to you.
        </p>
        {sent ? (
          <div className="mt-8 rounded-xl border border-primary-200 bg-primary-50 p-6 text-primary-800">
            Thanks for your message. We'll reply to {email} as soon as we can.
          </div>
        ) : (
          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-neutral-700">
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                className="mt-1 w-full resize-y rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                placeholder="How can we help?"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              Send message
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
