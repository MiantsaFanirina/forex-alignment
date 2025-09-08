import { motion } from 'framer-motion';

export function TradingLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      {/* Enhanced Loading Text */}
      <motion.div className="text-center space-y-4 sm:space-y-6 px-4">
        <motion.h2
          initial={{ opacity: 0, y: 30, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
            rotateY: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 1.2, 
            delay: 1.5,
            rotateY: {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
          className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent"
        >
          Loading Market Data
        </motion.h2>
        
        {/* Animated Status Indicators */}
        <motion.div 
          className="flex justify-center items-center space-x-3 sm:space-x-6 text-gray-400 text-xs sm:text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          <motion.div 
            className="flex items-center space-x-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Live Feed</span>
          </motion.div>
          
          <motion.div 
            className="flex items-center space-x-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          >
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>Analyzing Trends</span>
          </motion.div>
          
          <motion.div 
            className="flex items-center space-x-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
          >
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <span>Processing Data</span>
          </motion.div>
        </motion.div>
        
        {/* Progress Indicator */}
        <motion.div 
          className="w-64 sm:w-80 h-1 bg-gray-800 rounded-full overflow-hidden mx-auto"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2.5 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-full"
            initial={{ x: '-100%', scaleX: 0 }}
            animate={{ x: '100%', scaleX: [0, 1, 0] }}
            transition={{
              x: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              scaleX: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
            }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
