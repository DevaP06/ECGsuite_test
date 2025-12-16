import { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { motion } from 'framer-motion';

interface WaitlistFormProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function WaitlistForm({ onClose, onSuccess }: WaitlistFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [waitlistCount, setWaitlistCount] = useState<number>(0);

  useEffect(() => {
    const fetchWaitlistCount = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/waitlist/all`
        );
        if (response.data.count) {
          setWaitlistCount(response.data.count);
        }
      } catch (err) {
        console.error('Failed to fetch waitlist count', err);
      }
    };

    fetchWaitlistCount();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/waitlist/join`,
        formData
      );

      if (response.data.success) {
        setFormData({ name: '', email: '' });
        setWaitlistCount(waitlistCount + 1);
        if (onSuccess) onSuccess();
        
        // Close modal immediately
        if (onClose) onClose();
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      setError(
        axiosError.response?.data?.message || 
        'Failed to join waitlist. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className="bg-gray-900 rounded-lg p-8 w-full max-w-md shadow-xl border border-gray-700"
        initial={{ scale: 0.8, rotate: -5, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 0.8, rotate: 5, opacity: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 25,
          duration: 0.4
        }}
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Join Waitlist</h2>
          <motion.div 
            className="text-3xl font-bold text-blue-400"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {waitlistCount}
          </motion.div>
          {onClose && (
            <motion.button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 text-2xl"
              whileHover={{ rotate: 90, scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              ×
            </motion.button>
          )}
        </div>

        {message && (
          <motion.div 
            className="mb-4 p-4 bg-green-900 border border-green-700 text-green-300 rounded"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Your name"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your.email@example.com"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span
              animate={loading ? { rotate: 360 } : {}}
              transition={{ duration: 1, repeat: loading ? Infinity : 0 }}
            >
              {loading ? 'Joining...' : 'Join Waitlist'}
            </motion.span>
          </motion.button>

          <motion.p 
            className="text-xs text-gray-400 text-center mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            We'll notify you when ECGenius is ready to launch. No spam guaranteed.
          </motion.p>
        </form>
      </motion.div>
    </motion.div>
  );
}
