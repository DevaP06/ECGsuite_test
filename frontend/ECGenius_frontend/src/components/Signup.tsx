import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import signupImage from "../assets/signuppage.png";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { useAuth } from "../features/auth/useAuth";
import { getPostAuthRoute } from "../features/auth/roleUtils";
import { extractErrorMessage } from "../utils/errorUtils";
import FormFeedback from "./auth/FormFeedback";
import ValidationMessage from "./auth/ValidationMessage";
import FieldStatus, { type FieldValidity } from "./auth/FieldStatus";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    emailOrUsername: "",
    password: ""
  });
  const [touched, setTouched] = useState({ emailOrUsername: false, password: false });
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

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const emailOrUsernameValid = formData.emailOrUsername.trim().length > 0;
  const passwordValid = formData.password.length > 0;

  const statusFor = (touchedField: boolean, hasValue: boolean, valid: boolean): FieldValidity => {
    if (!touchedField || !hasValue) return 'idle';
    return valid ? 'valid' : 'invalid';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ emailOrUsername: true, password: true });
    setError("");

    if (!emailOrUsernameValid || !passwordValid) {
      setError("Enter your email or username and password to continue.");
      return;
    }

    setLoading(true);
    try {
      await signin(formData.emailOrUsername, formData.password);
      // Resumes onboarding if incomplete; otherwise lands on the role dashboard directly.
      navigate(getPostAuthRoute());
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex h-screen bg-black text-white">
      <div className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="max-w-md w-full mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">Login to ECGenius</h1>

          <FormFeedback tone="error" message={error} />

          <div id="google-signin-button" className="mb-4 w-full flex justify-center min-h-[44px]"></div>

          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="px-3 text-gray-400 text-sm">or</span>
            <div className="flex-grow border-t border-gray-700"></div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-1 text-sm">Your email or username</label>
              <div className="relative">
                <input
                  type="text"
                  name="emailOrUsername"
                  value={formData.emailOrUsername}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="name@company.com or username"
                  className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 pr-10 text-sm focus:outline-none focus:border-blue-500"
                  required
                />
                <FieldStatus state={statusFor(touched.emailOrUsername, formData.emailOrUsername.length > 0, emailOrUsernameValid)} />
              </div>
              {touched.emailOrUsername && !emailOrUsernameValid && (
                <ValidationMessage tone="error" message="Enter your email or username." />
              )}
            </div>

            <div className="mb-4">
              <label className="block mb-1 text-sm">Your password</label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="********"
                  className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 pr-10 text-sm focus:outline-none focus:border-blue-500"
                  required
                />
                <FieldStatus state={statusFor(touched.password, formData.password.length > 0, passwordValid)} />
              </div>
              {touched.password && !passwordValid && (
                <ValidationMessage tone="error" message="Enter your password." />
              )}
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
            <Link to="/register" className="text-blue-400 hover:underline">
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
