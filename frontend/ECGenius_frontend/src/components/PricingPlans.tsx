import React from "react";
import { motion } from "framer-motion";

const plans = [
  {
    name: "EC Lite",
    price: "₹0",
    highlight: "Free",
    features: [
      "Free access to basic features",
      "Limited ECGs per month",
      "Community support"
    ],
    popular: false,
  },
  {
    name: "ECG Pulse",
    price: "₹1,499",
    highlight: "Most Popular",
    features: [
      "1000 ECGs per month",
      "AI-powered insights",
      "Priority email support",
      "Report download"
    ],
    popular: true,
  },
  {
    name: "EC Master",
    price: "₹3,499",
    highlight: "",
    features: [
      "Unlimited ECGs per month",
      "Advanced AI insights",
      "24/7 priority support",
      "Report download"
    ],
    popular: false,
  }
];

const PricingPlans: React.FC = () => {
  return (
    <section className="bg-black py-20 px-4 min-h-screen flex flex-col justify-center">
      <div className="max-w-5xl mx-auto text-center">
        <motion.h2
          className="text-5xl font-extrabold mb-3 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          Choose Your Perfect Plan
        </motion.h2>

        <motion.p
          className="text-gray-300 mb-14 text-lg"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7 }}
          viewport={{ once: true }}
        >
          Transparent pricing for every need—start for free, upgrade anytime for advanced AI-powered cardiac care.
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              className={`relative bg-black/80 border border-cyan-400/20 rounded-2xl p-8 flex flex-col items-center justify-between shadow-xl transition-all duration-300 hover:scale-105 hover:border-cyan-400/40 hover:shadow-cyan-500/20 ${
                plan.popular ? "ring-2 ring-cyan-400/50" : ""
              }`}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.15, duration: 0.7 }}
              viewport={{ once: true }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-400 to-blue-400 text-black px-5 py-1 rounded-full text-xs font-bold shadow-lg">
                  {plan.highlight}
                </div>
              )}
              <h3 className="text-3xl font-bold text-cyan-300 mb-2">{plan.name}</h3>
              <p className="text-4xl font-extrabold mb-2 text-white">
                {plan.price}
                <span className="text-base font-medium text-gray-300">/month</span>
              </p>
              <ul className="mb-8 mt-4 space-y-3 text-gray-200 text-left w-full max-w-xs mx-auto">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full bg-gradient-to-br from-cyan-400 to-blue-400 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 rounded-lg font-semibold transition bg-gradient-to-r from-cyan-400 to-blue-500 text-black text-lg hover:brightness-110 shadow-md mb-2 ${
                  plan.popular ? "scale-105" : ""
                }`}
              >
                {plan.price === "₹0" ? "Get Started Free" : "Get Started"}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingPlans;
