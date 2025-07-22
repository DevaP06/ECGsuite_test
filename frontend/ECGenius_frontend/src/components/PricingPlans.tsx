import React from "react";

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
    // highlight: "Most Popular",
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
    <section className="bg-gradient-to-br from-black via-zinc-900 to-purple-950 py-20 px-4 min-h-screen flex flex-col justify-center">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-5xl font-extrabold mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
          Choose Your Perfect Plan
        </h2>
        <p className="text-gray-300 mb-14 text-lg">
          Transparent pricing for every need—start for free, upgrade anytime for advanced AI-powered cardiac care.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-black/90 border border-purple-400/40 rounded-2xl p-8 flex flex-col items-center justify-between shadow-xl transition-all duration-300 hover:scale-105 ${
                plan.popular ? "ring-4 ring-pink-400/50" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-pink-600 text-white px-5 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                  {plan.highlight}
                </div>
              )}
              <h3 className="text-3xl font-bold text-purple-300 mb-2">{plan.name}</h3>
              <p className="text-4xl font-extrabold mb-2 text-white">
                {plan.price}
                <span className="text-base font-medium text-gray-300">/month</span>
              </p>
              <ul className="mb-8 mt-4 space-y-3 text-gray-200 text-left w-full max-w-xs mx-auto">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2"
                  >
                    <span className="inline-block w-3 h-3 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 rounded-lg font-semibold transition bg-gradient-to-r from-blue-600 to-purple-500 text-white text-lg hover:brightness-110 shadow-md mb-2 ${
                  plan.popular ? "scale-105" : ""
                }`}
              >
                {plan.price === "₹0" ? "Get Started Free" : "Get Started"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingPlans;
