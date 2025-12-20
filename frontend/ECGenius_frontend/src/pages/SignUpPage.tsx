import React from "react";
import Signup from "../components/Signup";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
const SignUpPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-black-900">
      <Navbar />
      <Signup />
      <Footer />
    </main>
  );
};

export default SignUpPage;
