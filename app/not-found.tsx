"use client"

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        {/* Animated vector: broken candlestick chart */}
        <svg width="140" height="90" viewBox="0 0 140 90" fill="none">
          <motion.rect x="20" y="40" width="12" height="30" rx="2" fill="#ef4444" initial={{ y: 90 }} animate={{ y: 40 }} transition={{ duration: 0.8, delay: 0.2 }} />
          <motion.rect x="45" y="20" width="12" height="50" rx="2" fill="#22d3ee" initial={{ y: 90 }} animate={{ y: 20 }} transition={{ duration: 0.8, delay: 0.4 }} />
          <motion.rect x="70" y="60" width="12" height="10" rx="2" fill="#f59e42" initial={{ y: 90 }} animate={{ y: 60 }} transition={{ duration: 0.8, delay: 0.6 }} />
          <motion.rect x="95" y="30" width="12" height="40" rx="2" fill="#6366f1" initial={{ y: 90 }} animate={{ y: 30 }} transition={{ duration: 0.8, delay: 0.8 }} />
          <motion.line x1="10" y1="80" x2="130" y2="80" stroke="#64748b" strokeWidth="2" strokeDasharray="6 4" />
        </svg>
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 1.2 }}
        className="md:text-4xl font-bold text-red-400 mb-2"
      >
        404 - Page Not Found
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 1.5 }}
        className="text-blue-300 text-xs md:text-lg mb-8 text-center max-w-md"
      >
        Oops! The trading signal for this page is missing.<br />
        Try going back to the dashboard to analyze the markets.
      </motion.p>
      <Link href="/">
        <Button className="bg-blue-500 text-white hover:bg-blue-600 px-6 py-2 rounded-lg shadow-lg">
          Go to Dashboard
        </Button>
      </Link>
    </div>
  );
}
