"use client"
import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'

function MainLoading() {
    const [show, setShow] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setShow(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    if (!show) return null;
    return (
        <>
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
            >
                <svg width="120" height="80" viewBox="0 0 120 80" fill="none" className="w-32 h-20 md:w-40 md:h-28">
                <motion.rect x="10" y="30" width="10" height="40" rx="2" fill="#22d3ee" initial={{ y: 80 }} animate={{ y: 30 }} transition={{ duration: 0.8, delay: 0.2 }} />
                <motion.rect x="30" y="20" width="10" height="50" rx="2" fill="#38bdf8" initial={{ y: 80 }} animate={{ y: 20 }} transition={{ duration: 0.8, delay: 0.4 }} />
                <motion.rect x="50" y="40" width="10" height="30" rx="2" fill="#0ea5e9" initial={{ y: 80 }} animate={{ y: 40 }} transition={{ duration: 0.8, delay: 0.6 }} />
                <motion.rect x="70" y="25" width="10" height="45" rx="2" fill="#2563eb" initial={{ y: 80 }} animate={{ y: 25 }} transition={{ duration: 0.8, delay: 0.8 }} />
                <motion.rect x="90" y="35" width="10" height="35" rx="2" fill="#6366f1" initial={{ y: 80 }} animate={{ y: 35 }} transition={{ duration: 0.8, delay: 1.0 }} />
                </svg>
            </motion.div>
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1.2 }}
                className="text-2xl md:text-3xl font-bold text-blue-400 mb-2 text-center"
            >
                Loading Market Data...
            </motion.h2>
      </>
    )
}

export default MainLoading