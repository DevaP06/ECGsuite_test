const TimelineSection = () => {
  return (
    <section className="bg-black py-12 px-4 md:px-8 text-white">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold text-white mb-8 text-center">
          Timeline of Analysis
        </h2>
        <div className="relative">
          {/* Timeline vertical line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-blue-700"></div>
          {[
            {
              icon: '📤',
              title: 'Data Upload',
              description: 'Securely upload ECG data from any device.',
            },
            {
              icon: '🧠',
              title: 'AI Analysis',
              description: 'AI algorithms analyze ECG data in seconds.',
            },
            {
              icon: '📄',
              title: 'Report Generation',
              description: 'Receive a comprehensive report with detailed insights.',
            },
          ].map((step, index) => (
            <div
              key={index}
              className={`flex items-center mb-12 ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`w-1/2 ${index % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'}`}
              >
                <div className="bg-[#18181b] p-4 rounded-lg shadow-md border border-gray-700">
                  <div className="text-2xl mb-2 text-blue-400">{step.icon}</div>
                  <h3 className="text-lg font-medium text-white">{step.title}</h3>
                  <p className="text-sm text-gray-300">{step.description}</p>
                </div>
              </div>
              <div className="w-4 h-4 bg-blue-500 rounded-full z-10 border-2 border-blue-100"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TimelineSection;
