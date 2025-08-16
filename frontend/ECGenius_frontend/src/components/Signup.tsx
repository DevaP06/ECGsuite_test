import React from "react";

const LoginPage = () => {
  return (
    <div className="flex h-screen bg-black text-white">
      {/* Left side - Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="max-w-md w-full mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">Login to ECGenius</h1>

          {/* Google Sign In */}
          <button className="w-full bg-white text-black py-2 rounded-md flex items-center justify-center gap-2 hover:bg-gray-200 transition">
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Sign in with Google
          </button>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="px-3 text-gray-400 text-sm">or</span>
            <div className="flex-grow border-t border-gray-700"></div>
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block mb-1 text-sm">Your email</label>
            <input
              type="email"
              placeholder="name@company.com"
              className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block mb-1 text-sm">Your password</label>
            <input
              type="password"
              placeholder="********"
              className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <div className="text-right mt-1">
              <a href="#" className="text-blue-400 text-sm hover:underline">
                Forgot Password?
              </a>
            </div>
          </div>

          {/* Submit */}
          <button className="w-full bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 hover:opacity-90 py-2 rounded-md font-medium transition">
            Login to your account
          </button>

          {/* Register */}
          <p className="mt-4 text-center text-sm text-gray-400">
            Not registered?{" "}
            <a href="#" className="text-blue-400 hover:underline">
              Create account
            </a>
          </p>
        </div>
      </div>

      {/* Right side - Image placeholder */}
      <div className="hidden md:block w-1/2">
        <div
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: "url('/path-to-your-image.jpg')" }}
        >
          {/* Image placeholder */}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
