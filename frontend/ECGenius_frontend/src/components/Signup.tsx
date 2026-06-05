import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import signupImage from "../assets/signuppage.png";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { useAuth } from "../features/auth/useAuth";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    emailOrUsername: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { renderGoogleButton } = useGoogleAuth();
  const { signin } = useAuth();

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
      await signin(formData.emailOrUsername, formData.password);
      navigate("/dashboard");
    } catch (err: unknown) {
      const error = err as {
        response?: {
          data?: string | { message?: string; error?: string };
        };
        message?: string;
      };
      let errorMessage = "Login failed";
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (typeof error.response.data === 'object' && error.response.data !== null) {
          if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data.error) {
            errorMessage = error.response.data.error;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
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

          <div id="google-signin-button" className="mb-4 w-full flex justify-center min-h-[44px]"></div>

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
