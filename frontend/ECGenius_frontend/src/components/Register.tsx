import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { useAuth } from "../features/auth/useAuth";
import { getPostAuthRoute } from "../features/auth/roleUtils";
import signupImage from "../assets/signuppage.png";
import { extractErrorMessage } from "../utils/errorUtils";
import FormFeedback from "./auth/FormFeedback";
import ValidationMessage from "./auth/ValidationMessage";
import FieldStatus, { type FieldValidity } from "./auth/FieldStatus";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [touched, setTouched] = useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();
  const { renderGoogleButton } = useGoogleAuth();

  useEffect(() => {
    // Render Google button as soon as the component mounts
    renderGoogleButton('google-signup-button', 'signup_with');
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

  // Real-time field validity — drives FieldStatus icons and ValidationMessage hints.
  const usernameValid = formData.username.trim().length >= 3;
  const emailValid = EMAIL_PATTERN.test(formData.email.trim());
  const passwordValid = formData.password.length >= MIN_PASSWORD_LENGTH;
  const confirmValid = formData.confirmPassword.length > 0 && formData.confirmPassword === formData.password;

  const statusFor = (touchedField: boolean, hasValue: boolean, valid: boolean): FieldValidity => {
    if (!touchedField || !hasValue) return 'idle';
    return valid ? 'valid' : 'invalid';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, email: true, password: true, confirmPassword: true });
    setError("");

    if (!usernameValid || !emailValid || !passwordValid || !confirmValid) {
      setError("Please fix the highlighted fields before continuing.");
      return;
    }

    setLoading(true);
    try {
      // Backend already returns { token, user } on register — this establishes
      // the session immediately (auto-login), so the account is usable right away.
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      navigate(getPostAuthRoute());
    } catch (err: unknown) {
      console.error('Registration error:', err);
      setError(extractErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Left side - Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="max-w-md w-full mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">Join ECGenius</h1>

          <FormFeedback tone="error" message={error} />

          {/* Google Sign Up */}
          <div id="google-signup-button" className="mb-4 w-full flex justify-center min-h-[44px]"></div>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="px-3 text-gray-400 text-sm">or</span>
            <div className="flex-grow border-t border-gray-700"></div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div className="mb-4">
              <label className="block mb-1 text-sm">Username</label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Choose a username"
                  className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 pr-10 text-sm focus:outline-none focus:border-blue-500"
                  required
                />
                <FieldStatus state={statusFor(touched.username, formData.username.length > 0, usernameValid)} />
              </div>
              {touched.username && formData.username.length > 0 && !usernameValid && (
                <ValidationMessage tone="error" message="Username must be at least 3 characters." />
              )}
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block mb-1 text-sm">Email</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="name@company.com"
                  className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 pr-10 text-sm focus:outline-none focus:border-blue-500"
                  required
                />
                <FieldStatus state={statusFor(touched.email, formData.email.length > 0, emailValid)} />
              </div>
              {touched.email && formData.email.length > 0 && !emailValid && (
                <ValidationMessage tone="error" message="Enter a valid email address." />
              )}
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="block mb-1 text-sm">Password</label>
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
              {touched.password && formData.password.length > 0 && !passwordValid ? (
                <ValidationMessage tone="error" message={`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`} />
              ) : (
                <ValidationMessage tone="info" message={`Use ${MIN_PASSWORD_LENGTH}+ characters for a stronger password.`} />
              )}
            </div>

            {/* Confirm Password */}
            <div className="mb-4">
              <label className="block mb-1 text-sm">Confirm Password</label>
              <div className="relative">
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="********"
                  className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 pr-10 text-sm focus:outline-none focus:border-blue-500"
                  required
                />
                <FieldStatus state={statusFor(touched.confirmPassword, formData.confirmPassword.length > 0, confirmValid)} />
              </div>
              {touched.confirmPassword && formData.confirmPassword.length > 0 && !confirmValid && (
                <ValidationMessage tone="error" message="Passwords do not match." />
              )}
            </div>

            {/* Submit */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 hover:opacity-90 py-2 rounded-md font-medium transition disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create your account"}
            </button>
          </form>

          {/* Login */}
          <p className="mt-4 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden md:block w-1/2">
        <div
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${signupImage})` }}
        />
      </div>
    </div>
  );
};

export default RegisterPage;