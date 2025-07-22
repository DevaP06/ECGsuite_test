const ThreeStepsSection = () => {
  return (
    <section className="bg-black py-12 px-4 md:px-8 text-white">
      <div className="max-w-5xl mx-auto text-center">
        <h3 className="text-lg font-medium text-gray-400 mb-2">
          Three Steps to Smarter ECG Analysis
        </h3>
        <h2 className="text-4xl font-bold mb-6 text-white">
          ECG Genius: Streamlining ECG Interpretation
        </h2>
        <p className="text-base mb-10 max-w-2xl mx-auto text-gray-300">
          Our AI-powered platform simplifies ECG analysis into three key steps, ensuring accuracy and efficiency.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#18181b] p-6 rounded-lg shadow-md border border-gray-800 hover:shadow-lg transition-shadow duration-300">
            <div className="text-2xl mb-4 text-red-400">❤️</div>
            <h4 className="text-xl font-semibold mb-2 text-white">Upload ECG Data</h4>
            <p className="text-sm text-gray-300">
              Securely upload ECG data from any device, ensuring patient privacy and data integrity.
            </p>
          </div>
          <div className="bg-[#18181b] p-6 rounded-lg shadow-md border border-gray-800 hover:shadow-lg transition-shadow duration-300">
            <div className="text-2xl mb-4 text-blue-400">📊</div>
            <h4 className="text-xl font-semibold mb-2 text-white">AI-Powered Analysis</h4>
            <p className="text-sm text-gray-300">
              Our AI algorithms analyze ECG data in real-time, identifying potential anomalies and patterns.
            </p>
          </div>
          <div className="bg-[#18181b] p-6 rounded-lg shadow-md border border-gray-800 hover:shadow-lg transition-shadow duration-300">
            <div className="text-2xl mb-4 text-green-400">✅</div>
            <h4 className="text-xl font-semibold mb-2 text-white">Receive Detailed Report</h4>
            <p className="text-sm text-gray-300">
              Receive a comprehensive report with detailed insights, supporting informed clinical decisions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ThreeStepsSection;
