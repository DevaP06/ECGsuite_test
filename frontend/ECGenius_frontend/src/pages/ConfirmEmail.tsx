import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import api from "../AxiosInstance";
// import posthog from 'posthog-js'

export default function VerifyEmailPage() {
  type status = "waiting" | "success" | "error"
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<status>("waiting"); // waiting, success, error
  const token = searchParams.get("token");
  console.log("Token being sent:", token);


  if (!token) {
    return <p>Invalid or missing token.</p>;
  }


  const handleConfirm = async () => {
    try {
      await api.post("api/email/confirm-email/", { token });

      /*
        is equivalent to sending:

      {
        "token": "your_token_value"
      }

    in the body of the POST request with Content-Type: application/json (which Axios sets automatically unless overridden).
          
      */

      setStatus("success");
    } catch (err) {

      setStatus("error");
      console.log(err)
    }
  };

  if (status === "success") return <p>Email verified successfully!</p>;
  if (status === "error") return <p>Verification failed. Try again later.</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Confirm Your Email</h2>
      <button
        onClick={handleConfirm}
        className="mt-4 btn btn-active btn-info text-white px-4 py-2 rounded"
      >
        Confirm Email
      </button>
    </div>
  );
}
