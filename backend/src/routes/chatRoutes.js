const express = require("express");
const OpenAI = require("openai").default;
const Product = require("../models/Product");
const Order = require("../models/Order");

const router = express.Router();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// detect coupon intent
function detectCouponIntent(text) {
  const triggers = ["discount", "expensive", "price", "offer", "cost"];
  return triggers.some((w) => text.toLowerCase().includes(w));
}

// detect product search
function productKeywords(text) {
  return /dress|saree|lehenga|top|jeans|kurti|cloth|ethnic/i.test(text);
}

router.post("/", async (req, res) => {
  try {
    const { message, cart = [], history = [] } = req.body;

    //---------------------------------------------------
    // dynamic system context
    //---------------------------------------------------
    let context = `
You are a smart conversational shopping assistant for Glam Nemnidhi 💖
Rules:
- reply short + friendly
- avoid long paragraphs
- use emojis naturally
- help users place, track orders, learn policy
- when needed ask for order number politely
    `;

    if (cart.length > 0) {
      context += `Customer cart items: ${cart
        .map((c) => `${c.name} x${c.qty}`)
        .join(", ")}`;
    }

    //---------------------------------------------------
    // PRODUCT recommendations
    //---------------------------------------------------
    if (productKeywords(message)) {
      const matches = await Product.find({
        $or: [
          { title: new RegExp(message, "i") },
          { description: new RegExp(message, "i") },
          { category: new RegExp(message, "i") },
          { tags: message.toLowerCase() },
        ],
      })
        .limit(5)
        .select("title slug minPrice variants");

      return res.json({
        reply: `Here are some styles you may like 💖`,
        products: matches,
      });
    }

    //---------------------------------------------------
    // REAL ORDER TRACKING — cancelled, shipped, delivered
    //---------------------------------------------------
    if (
      /order.*status|track.*order|order.*kaha|mera order|status batao/i.test(
        message
      )
    ) {
      const orderId = message.replace(/\D/g, "").trim();

      if (!orderId) {
        return res.json({
          reply:
            "📦 Order number dijiye 😊 Example: *Track order 258338*",
        });
      }

      const order = await Order.findOne({ orderId });

      if (!order) {
        return res.json({
          reply: `❌ Order #${orderId} not found`,
        });
      }

      let reply = `📦 Order #${orderId}\n`;

      // Cancelled case
      if (
        order.cancelReason ||
        order.status?.toLowerCase() === "cancelled" ||
        order.isCancelled === true ||
        order.cancelledAt
      ) {
        reply += `Status: ❌ Cancelled`;
        if (order.cancelReason)
          reply += `\nReason: ${order.cancelReason}`;
        return res.json({ reply });
      }

      // Delivered case
      if (
        order.isDelivered ||
        order.status?.toLowerCase() === "delivered"
      ) {
        reply += `Status: Delivered 🎉\nHope you loved your purchase 💖`;
        return res.json({ reply });
      }

      // Shipped case
      if (order.status?.toLowerCase() === "shipped") {
        reply += `Status: Shipped 🚚\nEstimated delivery: 2–4 days`;
      } else {
        reply += `Status: ${order.status}`;
      }

      if (order.trackingCode) {
        reply += `\nTrack: https://tracking.com/${order.trackingCode}`;
      }

      return res.json({ reply });
    }

    //---------------------------------------------------
    // coupon intent detection
    //---------------------------------------------------
    if (detectCouponIntent(message)) {
      return res.json({
        reply: "🎀 Use code *GLAM10* for flat 10% OFF 💖",
      });
    }

    //---------------------------------------------------
    // fallback → generate AI response
    //---------------------------------------------------
    const chatMessages = [
      { role: "system", content: context },
      ...history,
      { role: "user", content: message },
    ];

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: chatMessages,
      temperature: 0.6,
    });

    return res.json({
      reply: completion.choices[0].message.content,
    });
  } catch (err) {
    console.error("CHAT ROUTE ERROR:", err);
    res.status(500).json({ error: "AI backend failed" });
  }
});

// return policy
router.get("/policies", (req, res) => {
  res.json({
    policies: `
Return Policy  
• return within 7 days  
• free pickup above ₹499  
• refund within 3–5 business days  
💖
`,
  });
});

module.exports = router;
