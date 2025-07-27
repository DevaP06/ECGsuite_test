import React, { useState } from "react";
import axios from "axios"; // install with: npm install axios

const Signup: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3000/api/auth/register", {
        username: formData.name,
        email: formData.email,
        password: formData.password,
      });
      setMessage("✅ " + res.data.message);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Something went wrong";
      setMessage("❌ " + errorMsg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-gray-900 shadow-lg rounded-lg flex w-full max-w-4xl overflow-hidden">
        <div className="flex-1 p-10 flex flex-col justify-center">
          <h1 className="text-3xl font-bold mb-2 text-blue-400">
            Join ECGenius – Your Journey to ECG Mastery Begins Here!
          </h1>
          <p className="mb-6 text-gray-300">
            Sign up to unlock personalized ECG practice, instant feedback, and step-by-step learning.
          </p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block mb-1 font-medium text-gray-300">Name</label>
              <input
                id="name"
                type="text"
                placeholder="Enter your name"
                onChange={handleChange}
                value={formData.name}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-200"
              />
            </div>
            <div>
              <label htmlFor="email" className="block mb-1 font-medium text-gray-300">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                onChange={handleChange}
                value={formData.email}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-200"
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="block mb-1 font-medium text-gray-300">Password</label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                onChange={handleChange}
                value={formData.password}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 pr-10 text-gray-200"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-blue-400 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {/* Your SVG icons remain unchanged */}
                {/* ... */}
              </button>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold transition"
            >
              Sign Up
            </button>
          </form>

          {message && (
            <p className="mt-4 text-center text-sm text-white bg-gray-800 p-2 rounded">{message}</p>
          )}

          <p className="mt-4 text-gray-400 text-center">
            Already have an account?{" "}
            <a href="/login" className="text-blue-400 hover:underline">Login</a>
          </p>
        </div>

        <div className="flex-1 hidden md:flex items-center justify-center bg-gradient-to-tr from-blue-900 to-black">
          <img
            src="https://st.depositphotos.com/3367263/60773/i/1600/depositphotos_607735936-stock-photo-vertical-image-red-heart-stethoscope.jpg"
            alt="ECG illustration"
            className="object-contain rounded-lg shadow-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default Signup;