
import TeamSection from "../components/TeamSection";
import MissionSection from "../components/MissionSection";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-black-900 text-white overflow-x-hidden">
      {/* Main Content */}
      <main className="relative">
        <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAGKADAAQAAAABAAAAGAAAAADQ8G4QAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAAHUlEQVQI12NgYGAwMTAwPeH8/4/ADAAo8D9+9Y4m0QAAAABJRU5ErkJggg==')] bg-repeat opacity-10 z-0" />
        <div className="relative z-10">
          <TeamSection />
          <MissionSection />
        </div>
      </main>

     
    </div>
  );
};

export default AboutPage;