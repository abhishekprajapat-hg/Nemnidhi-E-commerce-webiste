import { useEffect, useRef, useState } from "react";

export default function ChatbotWidget({ cart }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState([]);

  const bottomRef = useRef(null);

  const quickReplies = [
    "Apply discount",
    "Track my order",
    "Show latest products",
    "Return policy",
    "Talk on WhatsApp",
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        { sender: "bot", text: "Hi! 👋 I’m your Glam shopping assistant 💖" },
      ]);
    }
  }, [open]);

  const detectCouponIntent = (txt) =>
    ["discount", "price", "too much", "offer", "expensive"].some((t) =>
      txt.toLowerCase().includes(t)
    );

  const maybeOfferCoupon = () => {
    pushBotMsg("🎁 Special offer! Use GLAM10 for flat 10% OFF 💞");
  };

  const pushBotMsg = (text) => {
    setMessages((prev) => [...prev, { sender: "bot", text }]);
  };

  const sendToWhatsApp = () => {
    const chat = messages.map((m) => `${m.sender}: ${m.text}`).join("\n");
    window.open(
      `https://wa.me/916263578372?text=${encodeURIComponent(chat)}`,
      "_blank"
    );
  };

  const startVoice = () => {
    const rec = new window.SpeechRecognition();
    rec.lang = "en-IN";
    rec.start();
    rec.onresult = (e) => setInput(e.results[0][0].transcript);
  };

  //--------------------------------------------------
  // ⭐ Updated order tracking (real + conversational)
  //--------------------------------------------------
  const trackOrder = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/chat/order/${id}`);
      const data = await res.json();

      if (!data?.success) {
        pushBotMsg("❌ Order not found. Please check the number 🙏");
        return;
      }

      pushBotMsg(
        `📦 Order #${id}\nStatus: ${data.status} ${statusEmoji(data.status)}`
      );

      // follow-up suggestion
      pushBotMsg(
        "Kya aap return, exchange, cancel, ya delivery time puchna chahte ho? 💬"
      );
    } catch {
      pushBotMsg("⚠ Couldn't fetch order details");
    }
  };

  const statusEmoji = (status) => {
    const map = {
      Created: "📝",
      Confirmed: "✔️",
      Packed: "📦",
      Shipped: "🚚",
      Delivered: "🎉",
      Cancelled: "❌",
    };
    return map[status] || "";
  };

  const recommendProducts = async (keyword) => {
    try {
      const res = await fetch("http://localhost:5000/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: keyword }),
      });

      const data = await res.json();

      if (!data.products?.length)
        return pushBotMsg("No matching items 😔 Try another ♥");

      data.products.forEach((p) => {
        setMessages((prev) => [
          ...prev,
          {
            sender: "product",
            product: {
              name: p.title,
              price: p.minPrice,
              image: p.variants?.[0]?.images?.[0],
              id: p.slug,
            },
          },
        ]);
      });
    } catch {
      pushBotMsg("⚠ Error fetching suggestions");
    }
  };

  //--------------------------------------------------
  // 📨 SEND MESSAGE HANDLER
  //--------------------------------------------------
  const sendMessage = async () => {
    if (!input.trim()) return;

    const msg = input.trim();
    setMessages((prev) => [...prev, { sender: "user", text: msg }]);
    setHistory((prev) => [...prev, { role: "user", content: msg }]);
    setInput("");

    if (/whatsapp/i.test(msg)) return sendToWhatsApp();
    if (/policy|return|refund/i.test(msg)) return fetchPolicies();

    if (/track|order|status/i.test(msg)) {
      const id = msg.replace(/\D/g, "");
      if (id) return trackOrder(id);
      else pushBotMsg("Order number dijiye 😊");
      return;
    }

    if (/dress|saree|lehenga|top|jeans|cloth|ethnic/i.test(msg))
      recommendProducts(msg);

    if (detectCouponIntent(msg)) return maybeOfferCoupon();

    try {
      setIsTyping(true);
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, cart, history }),
      });

      const data = await res.json();
      setIsTyping(false);
      pushBotMsg(data.reply);
      setHistory((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setIsTyping(false);
      pushBotMsg("⚠ Server offline");
    }
  };

  //--------------------------------------------------
  // UI
  //--------------------------------------------------
  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 bg-pink-600 text-white w-14 h-14 rounded-full shadow-lg text-3xl flex items-center justify-center hover:bg-pink-700 transition z-[99999]"
      >
        💬
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 w-80 h-[470px] bg-white shadow-xl rounded-xl flex flex-col border overflow-hidden animate-fade-in z-[99999]">

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((msg, i) => (
              <div key={i} className="w-full">
                {msg.sender !== "product" && (
                  <div
                    className={`flex ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span
                      className={`px-3 py-2 rounded-lg max-w-[75%] text-sm animate-chat-bubble ${
                        msg.sender === "user"
                          ? "bg-pink-600 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {msg.text}
                    </span>
                  </div>
                )}

                {msg.sender === "product" && (
                  <div className="bg-gray-100 p-2 rounded-lg shadow-sm border mb-1 animate-chat-bubble w-fit">
                    <img
                      src={msg.product.image}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <p className="text-xs font-medium">{msg.product.name}</p>
                    <p className="text-pink-600 text-xs font-bold">
                      ₹{msg.product.price}
                    </p>

                    <a
                      href={`/product/${msg.product.id}`}
                      className="mt-1 block text-center w-full text-xs bg-pink-600 text-white px-2 py-1 rounded hover:bg-pink-700 transition"
                    >
                      View Product
                    </a>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <p className="text-xs opacity-60 animate-pulse">Bot typing…</p>
            )}

            <div ref={bottomRef}></div>
          </div>

          <div className="border-t p-1 flex gap-1">
            <input
              value={input}
              placeholder="Type message…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 border rounded-lg p-2 text-sm outline-none focus:ring focus:ring-pink-300"
            />

            <button
              disabled={!input.trim()}
              onClick={sendMessage}
              className={`px-3 rounded-lg text-white flex items-center justify-center transition ${
                input.trim()
                  ? "bg-pink-600 hover:bg-pink-700"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
