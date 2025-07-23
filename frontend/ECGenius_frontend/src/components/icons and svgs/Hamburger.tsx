
// const Hamburger = () => {
//   return (
//     <>
//                   <svg
//             xmlns="http://www.w3.org/2000/svg"
//             className="h-6 w-6"
//             fill="none"
//             viewBox="0 0 24 24"
//             stroke="currentColor"
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth="2"
//               d="M4 6h16M4 12h16M4 18h16"
//             />
//           </svg>
//     </>
//   )
// }

// export default Hamburger


import { useState } from "react";
import { motion } from "framer-motion";

const Hamburger = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    
    <motion.svg
      onClick={() => setIsOpen(!isOpen)}
      xmlns="http://www.w3.org/2000/svg"
      className="h-8 w-8 cursor-pointer"
      viewBox="0 0 24 24"
      stroke="currentColor"
      fill="none"
    >
      <motion.path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 6h16"
        animate={isOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.3 }}
      />
      <motion.path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 12h16"
        animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      <motion.path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 18h16"
        animate={isOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.svg>
  );
};

export default Hamburger;
