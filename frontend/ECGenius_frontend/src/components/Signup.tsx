
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import signupImage from "../assets/signuppage.png";
import AxiosInstance from "../AxiosInstance";
import { useGoogleAuth } from "../hooks/useGoogleAuth";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    emailOrUsername: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { renderGoogleButton } = useGoogleAuth();

  useEffect(() => {
    renderGoogleButton('google-signin-button', 'signin_with');
  }, [renderGoogleButton]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await AxiosInstance.post("/auth/login", formData);
      const payload = response.data?.data || {};

      if (payload.token) {
        localStorage.setItem('token', payload.token);
        AxiosInstance.defaults.headers.common['Authorization'] = `Bearer ${payload.token}`;
      }

      if (payload.user) {
        localStorage.setItem('user', JSON.stringify(payload.user));
      }

      navigate("/dashboard");
    } catch (err: any) {
      let errorMessage = "Login failed";
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-black text-white">
      <div className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="max-w-md w-full mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">Login to ECGenius</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-md text-red-200 text-sm">
              {error}
            </div>
          )}

          <div id="google-signin-button" className="mb-4 flex justify-center"></div>

          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="px-3 text-gray-400 text-sm">or</span>
            <div className="flex-grow border-t border-gray-700"></div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-1 text-sm">Your email or username</label>
              <input
                type="text"
                name="emailOrUsername"
                value={formData.emailOrUsername}
                onChange={handleChange}
                placeholder="name@company.com or username"
                className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 text-sm">Your password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="********"
                className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                required
              />
              <div className="text-right mt-1">
                <a href="#" className="text-blue-400 text-sm hover:underline">
                  Forgot Password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 hover:opacity-90 py-2 rounded-md font-medium transition disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Login to your account"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-400">
            Not registered?{" "}
            <Link to="/Sign-Up-Page" className="text-blue-400 hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden md:block w-1/2">
        <div
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${signupImage})` }}
        />
      </div>
    </div>
  );
};

export default LoginPage;
