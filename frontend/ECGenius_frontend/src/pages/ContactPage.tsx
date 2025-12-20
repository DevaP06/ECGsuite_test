import React from "react";
import ContactUs from "../components/ContactUs"; 
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
const ContactPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-black-900">
      <Navbar />
      <ContactUs />
      <Footer />
    </main>
  );
};

export default ContactPage;
