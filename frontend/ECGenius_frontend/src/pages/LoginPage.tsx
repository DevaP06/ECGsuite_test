import React from "react";
import LoginForm from "../components/Signup";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const LoginPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-black">
      <Navbar />
      <LoginForm />
      <Footer />
    </main>
  );
};

export default LoginPage;
