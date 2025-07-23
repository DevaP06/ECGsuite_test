import React from "react";
import ContactUs from "../components/ContactUs"; 
import Footer from "../components/Footer";

const ContactPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-black-900">
      <ContactUs />
      <Footer></Footer>
    </main>
  );
};

export default ContactPage;
