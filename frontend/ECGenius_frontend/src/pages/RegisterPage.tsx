import React from "react";
import RegisterForm from "../components/Register";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const RegisterPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-black">
      <Navbar />
      <RegisterForm />
      <Footer />
    </main>
  );
};

export default RegisterPage;
