
const TeamSection = () => {
  const teamMembers = [
    {
      name: "Shekhar Deshmukh",
      role: "Co-Founder",
      description:
        "As a passionate innovator, Shekhar leads with vision and a commitment to excellence, inspiring the team to new heights.",
    },
    {
      name: "Dhruv Pekhale",
      role: "Co-Founder",
      description:
        "Dhruv brings creativity and strategic thinking to every challenge, making every project a success.",
    },
    {
      name: "Karmanya Belsare",
      role: "Co-Founder",
      description:
        "Karmanya’s technical expertise and dedication fuel our innovative solutions and seamless user experiences.",
    },
    {
      name: "Yash Ghule",
      role: "Co-Founder",
      description:
        "Yash’s energy and enthusiasm empower the whole team, fostering a collaborative and fun working environment.",
    },
  ];

  return (
    <section className="relative bg-gradient-to-br from-black via-black to-purple-900 text-white py-20 px-4 overflow-hidden">
      {/* Soft texture in the background */}
      <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAGKADAAQAAAABAAAAGAAAAADQ8G4QAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAAHUlEQVQI12NgYGAwMTAwPeH8/4/ADAAo8D9+9Y4m0QAAAABJRU5ErkJggg==')] bg-repeat opacity-10 z-0" />

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
          Meet Our Team
        </h2>
        <p className="mb-16 text-gray-300 max-w-xl mx-auto text-lg">
          Dreamers, builders, and innovators — together, we’re on a mission to make ECGenius revolutionary.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {teamMembers.map((member) => (
            <div
              key={member.name}
              className="group bg-black/80 rounded-2xl border border-purple-500/30 shadow-md hover:shadow-purple-600/30 hover:-translate-y-2 hover:scale-105 hover:border-purple-400 transition-all duration-300 p-7 flex flex-col items-center"
            >
              <h3 className="text-xl font-semibold text-white mb-0.5">
                {member.name}
              </h3>
              <span className="mb-3 inline-block text-xs uppercase font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full shadow">
                {member.role}
              </span>
              <p className="text-sm text-gray-300 text-center">{member.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
