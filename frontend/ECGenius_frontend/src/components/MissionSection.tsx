const MissionSection = () => {
  return (
    <section className="relative bg-gradient-to-br from-black via-black to-purple-900 text-white py-20 px-4 overflow-hidden">
      {/* Soft texture background */}
      <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAGKADAAQAAAABAAAAGAAAAADQ8G4QAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAAHUlEQVQI12NgYGAwMTAwPeH8/4/ADAAo8D9+9Y4m0QAAAABJRU5ErkJggg==')] bg-repeat opacity-10 z-0" />
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-6">
          Our Mission
        </h2>
        <p className="text-lg text-gray-200 mb-14 max-w-2xl mx-auto">
          At ECGenius, we’re on a mission to empower healthcare with cutting-edge technology, making heart diagnostics smarter, faster, and accessible to everyone.
        </p>
        <div className="space-y-8">
          <div className="group bg-black/80 rounded-2xl border border-purple-500/30 shadow-md hover:shadow-purple-700/30 hover:-translate-y-2 hover:scale-105 transition-all duration-300 p-8">
            <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Innovation at Our Core
            </h3>
            <p className="text-base text-gray-300">
              We're redefining the future of cardiac care through continuous innovation, leveraging the latest AI and medical insights to push boundaries and improve lives.
            </p>
          </div>
          <div className="group bg-black/80 rounded-2xl border border-purple-500/30 shadow-md hover:shadow-purple-700/30 hover:-translate-y-2 hover:scale-105 transition-all duration-300 p-8">
            <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Trust and Accessibility
            </h3>
            <p className="text-base text-gray-300">
              We believe every heartbeat matters. Our mission is to make reliable ECG analysis widely available, bridging gaps in medical access and building lasting trust.
            </p>
          </div>
          <div className="group bg-black/80 rounded-2xl border border-purple-500/30 shadow-md hover:shadow-purple-700/30 hover:-translate-y-2 hover:scale-105 transition-all duration-300 p-8">
            <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">
              Empowerment through Knowledge
            </h3>
            <p className="text-base text-gray-300">
              By equipping healthcare professionals and patients with actionable insights, we help people make informed decisions for a healthier tomorrow.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;
