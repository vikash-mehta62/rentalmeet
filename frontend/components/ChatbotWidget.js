'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Phone } from 'lucide-react';

function getBotResponse(msg) {
  const lower = msg.toLowerCase();
  if (/hello|hi\b|hey|namaste/.test(lower))
    return "Hello! Welcome to RentalMeet. I'm your booking assistant. Ask me about venues, pricing, premium services, or how to list your space.";
  if (/book|booking|reserve/.test(lower))
    return "Booking a venue is simple:\n1. Browse venues on the Venues page\n2. Select your preferred venue\n3. Choose date, time & duration\n4. Fill in your details & confirm\n\nYou'll receive a confirmation instantly!";
  if (/pric|cost|rate|fee|charge/.test(lower))
    return "Venue pricing on RentalMeet:\n• Co-Work Spaces: ₹500–₹2,000/hr\n• Meeting Halls: ₹1,500–₹3,500/hr\n• Conference Halls: ₹6,000–₹12,000/hr\n• Function Halls: ₹7,000–₹15,000/hr\n• Marriage Gardens: ₹9,000–₹20,000/hr";
  if (/list|owner|my venue|my space/.test(lower))
    return "To list your venue:\n1. Click 'List Your Venue' in navigation\n2. Fill in venue details & upload photos\n3. Set pricing and availability\n4. Submit for review\n\nApproval within 24–48 hours.";
  if (/service|catering|decor|photo|entertain|makeup|security|celebrity|logistics|premium/.test(lower))
    return "Our Premium Services:\n• Catering & Food\n• Makeup & Beauty\n• Photography & Videography\n• Entertainment & DJ\n• Decor & Floral\n• Security & Bouncers\n• Celebrity Appearances\n• Logistics & Support\n\nVisit Premium Services page!";
  if (/contact|help|support|call|phone/.test(lower))
    return "Reach us anytime:\n📞 +91 9425796767\n📧 booking@rentalmeet.in\n📍 G-137, Gautam Nagar, Bhopal\n\nAvailable 24/7!";
  if (/payment|pay|refund|cancel/.test(lower))
    return "Payment & Refund:\n• All major payment modes accepted\n• 100% secured payments\n• Refunds in 24–48 hours\n• Cancellation policy varies by venue\n\nCall +91 9425796767 for help.";
  if (/location|city|bhopal|jaipur|indore|gwalior|jabalpur|udaipur/.test(lower))
    return "We're active in:\n\nMadhya Pradesh:\nBhopal, Indore, Gwalior, Jabalpur, Ujjain\n\nRajasthan:\nJaipur, Udaipur, Jodhpur, Sikar, Ajmer\n\nMore cities coming soon!";
  if (/vendor|partner|join/.test(lower))
    return "Join as a vendor! Visit registration and select 'Register as Vendor'. We welcome caterers, decorators, photographers, entertainers & more!";
  return "I can help with venue bookings, pricing, listing your space, or premium services. Tap a quick reply below or call +91 9425796767 for immediate help!";
}

const DEFAULT_QUICK_REPLIES = [
  { question: 'How to book a venue?',  answer: "Booking a venue is simple:\n1. Browse venues on the Venues page\n2. Select your preferred venue\n3. Choose date, time & duration\n4. Fill in your details & confirm\n\nYou'll receive a confirmation instantly!" },
  { question: 'Pricing & rates',       answer: "Venue pricing on RentalMeet:\n• Co-Work Spaces: ₹500–₹2,000/hr\n• Meeting Halls: ₹1,500–₹3,500/hr\n• Conference Halls: ₹6,000–₹12,000/hr\n• Function Halls: ₹7,000–₹15,000/hr\n• Marriage Gardens: ₹9,000–₹20,000/hr" },
  { question: 'List my venue',         answer: "To list your venue:\n1. Click 'List Your Venue' in navigation\n2. Fill in venue details & upload photos\n3. Set pricing and availability\n4. Submit for review\n\nApproval within 24–48 hours." },
  { question: 'Premium services',      answer: "Our Premium Services:\n• Catering & Food\n• Makeup & Beauty\n• Photography & Videography\n• Entertainment & DJ\n• Decor & Floral\n• Security & Bouncers\n\nVisit Premium Services page!" },
  { question: 'Contact support',       answer: "Reach us anytime:\n📞 +91 9425796767\n📧 booking@rentalmeet.in\n📍 G-137, Gautam Nagar, Bhopal\n\nAvailable 24/7!" },
];

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, from: 'bot', text: "Hello! I'm your RentalMeet booking assistant. How can I help you today?" },
  ]);
  const [input, setInput] = useState('');
  const [quickReplies, setQuickReplies] = useState(DEFAULT_QUICK_REPLIES);
  const [showTooltip, setShowTooltip] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/chatbot/quick-replies`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.quickReplies?.length) {
          // Support both old string[] and new {question,answer}[] format
          const normalized = d.quickReplies.map(r =>
            typeof r === 'string' ? { question: r, answer: getBotResponse(r) } : r
          );
          setQuickReplies(normalized);
        }
      })
      .catch(() => {});

    const show = setTimeout(() => setShowTooltip(true), 3000);
    const hide = setTimeout(() => setShowTooltip(false), 8000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  }, [messages, open]);

  const sendMessage = (text, directAnswer = null) => {
    if (!text.trim()) return;
    const answer = directAnswer || getBotResponse(text);
    setMessages(prev => [
      ...prev,
      { id: Date.now(), from: 'user', text: text.trim() },
      { id: Date.now() + 1, from: 'bot', text: answer },
    ]);
    setInput('');
  };

  return (
    <>
      {/* ── Chat Window ── */}
      {open && (
        <div
          className="fixed bottom-[88px] right-4 z-[201] w-[320px] sm:w-[350px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden"
          style={{ height: 'min(450px, calc(100svh - 120px))' }}
        >
          {/* Header */}
          <div className="bg-[#F59F0A] px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-white leading-tight">RentalMeet Assistant</p>
              <p className="text-[11px] text-white/85 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-300 inline-block" />
                Online • Replies instantly
              </p>
            </div>
            <a
              href="tel:+919425796767"
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-white"
              title="Call us"
            >
              <Phone className="h-4 w-4" />
            </a>
            {/* X — close chat window only */}
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-white"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50 dark:bg-slate-950">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-end gap-1.5 ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.from === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-[#F59F0A]/15 flex items-center justify-center flex-shrink-0 mb-0.5">
                    <Bot className="h-3.5 w-3.5 text-[#F59F0A]" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line leading-relaxed ${
                    msg.from === 'user'
                      ? 'bg-[#F59F0A] text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 rounded-bl-none shadow-sm border border-gray-100 dark:border-slate-700'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          <div className="px-3 pt-2 pb-1.5 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex-shrink-0">
            <p className="text-[9px] text-gray-400 mb-1.5 font-bold uppercase tracking-widest">Quick Replies</p>
            <div className="flex gap-1.5 flex-wrap">
              {quickReplies.map((qr) => (
                <button
                  key={qr.question}
                  onClick={() => sendMessage(qr.question, qr.answer)}
                  className="text-[10px] px-2.5 py-1 rounded-full border border-[#F59F0A]/60 text-[#D97706] bg-[#F59F0A]/5 hover:bg-[#F59F0A]/20 transition-colors leading-tight font-semibold"
                >
                  {qr.question}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-2 flex gap-2 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex-shrink-0">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
              placeholder="Type your message..."
              className="flex-1 text-sm h-9 px-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F59F0A] bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400"
            />
            <button
              onClick={() => sendMessage(input)}
              className="h-9 w-9 flex-shrink-0 bg-[#F59F0A] hover:bg-[#D97706] text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Tooltip ── */}
      {!open && showTooltip && (
        <div className="fixed bottom-[92px] right-20 z-[200] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg px-3 py-2 text-xs text-gray-700 dark:text-slate-200 whitespace-nowrap pointer-events-none">
          <span className="font-semibold">Need help?</span>
          <span className="text-gray-400 ml-1">Chat with us!</span>
          <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-white dark:border-l-slate-800" />
        </div>
      )}

      {/* ── Toggle Button — always fixed at bottom-right ── */}
      <button
        onClick={() => { setOpen(o => !o); setShowTooltip(false); }}
        className="fixed bottom-6 right-4 z-[202] h-14 w-14 rounded-full bg-[#F59F0A] hover:bg-[#D97706] text-white shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110"
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        <div className={`transition-all duration-300 ${open ? 'rotate-0 scale-100' : 'rotate-0 scale-100'}`}>
          {open
            ? <X className="h-6 w-6" />
            : <MessageCircle className="h-6 w-6" />
          }
        </div>
        {/* Pulse — only when closed */}
        {!open && (
          <span className="absolute inset-0 rounded-full bg-[#F59F0A] animate-ping opacity-20 pointer-events-none" />
        )}
      </button>
    </>
  );
}
