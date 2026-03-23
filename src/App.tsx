/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center"
      >
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-zinc-900 mb-4">
          Hello World
        </h1>
        <p className="text-zinc-500 text-lg md:text-xl font-medium uppercase tracking-widest">
          Welcome to your new application
        </p>
        <div className="mt-12 h-px w-24 bg-zinc-200 mx-auto" />
      </motion.div>
    </div>
  );
}
