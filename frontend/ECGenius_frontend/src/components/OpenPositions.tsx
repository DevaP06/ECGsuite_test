import React from "react";

const jobs = [
  {
    title: "Signal Processing Engineer",
    department: "Engineering",
    location: "Remote",
    keyResponsibilities: [
      "Develop algorithms for ECG signal feature extraction.",
      "Design and optimize digital filters for noise reduction in biomedical signals.",
      "Collaborate with clinical experts to interpret physiological data.",
      "Contribute to real-time processing solutions for cardiac monitoring devices.",
    ],
    requirements: [
      "Strong foundation in signal processing theory.",
      "Experience with Python, MATLAB, or similar tools.",
      "Understanding of biomedical sensors and acquisition systems.",
      "Ability to work with large physiological datasets.",
    ],
    preferredQualifications: [
      "Prior experience with ECG or similar bio-signal data.",
      "Familiarity with machine learning for physiological signal analysis.",
    ],
    formLink:
      "https://docs.google.com/forms/d/e/1FAIpQLSdXuOgXIIWxXeizQNt3u347AYzpIGHGnayWgCJ9lDYwbcCEOA/viewform?usp=header",
  },
  {
    title: "Computer Vision Engineer",
    department: "Engineering",
    location: "Remote",
    keyResponsibilities: [
      "Design image analysis algorithms for medical diagnostics.",
      "Develop deep learning models for feature extraction from ECG and cardiac images.",
      "Integrate vision modules into patient monitoring software.",
    ],
    requirements: [
      "Proficient in Python and TensorFlow/PyTorch.",
      "Solid grasp of image processing fundamentals and feature extraction.",
      "Experience with biomedical image datasets.",
      "Ability to optimize models for real-time performance.",
    ],
    preferredQualifications: [
      "Previous work on cardiac imaging or ECG visualization.",
      "Experience with cloud deployment of healthcare AI models.",
      "Knowledge of DICOM and healthcare interoperability standards.",
    ],
    formLink:
      "https://docs.google.com/forms/d/e/1FAIpQLScp7rXsY5K065Wxeevjv_ThPtp-iLLZ7loGUdlsNd3WJxlxDg/viewform?usp=header",
  },
];

const OpenPositions: React.FC = () => (
  <section className="py-20 bg-black">
    <div className="max-w-3xl mx-auto px-6">
      <h2 className="text-3xl font-bold text-blue-400 mb-10 text-center">
        Open Positions
      </h2>
      <div className="space-y-12">
        {jobs.map((job, idx) => (
          <div
            key={idx}
            className="border border-gray-700 rounded-2xl shadow-md p-8 bg-gray-900"
          >
            <div className="flex flex-col md:flex-row justify-between items-center mb-5">
              <div>
                <span className="block text-blue-400 font-semibold">
                  {job.department}
                </span>
                <h3 className="text-2xl font-bold mt-1 text-white">
                  {job.title}
                </h3>
                <span className="text-gray-400 text-sm">{job.location}</span>
              </div>
              {/* Apply Now Button with dynamic form link */}
              <a
                href={job.formLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 md:mt-0 bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-500 transition"
              >
                Apply Now
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-blue-400 font-medium mb-2">
                  Key Responsibilities
                </h4>
                <ul className="text-gray-300 text-sm list-disc ml-5 space-y-1">
                  {job.keyResponsibilities.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-blue-400 font-medium mb-2">Requirements</h4>
                <ul className="text-gray-300 text-sm list-disc ml-5 space-y-1">
                  {job.requirements.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-blue-400 font-medium mb-2">
                  Preferred Qualifications
                </h4>
                <ul className="text-gray-300 text-sm list-disc ml-5 space-y-1">
                  {job.preferredQualifications.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default OpenPositions;
