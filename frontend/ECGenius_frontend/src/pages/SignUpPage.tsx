import React from "react";
import Signup from "../components/Signup";
import Footer from "../components/Footer";

const SignUpPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-black-900">
      <Signup></Signup>
      <Footer></Footer>
    </main>
  );
};

export default SignUpPage;
