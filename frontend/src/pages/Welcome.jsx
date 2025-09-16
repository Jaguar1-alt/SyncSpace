import React from "react";
import { Link } from "react-router-dom";

function Welcome() {
  return (
    <div 
      className="flex min-h-screen items-center justify-center text-white font-sans relative overflow-hidden"
      style={{ 
        backgroundImage: `url('background.jpg')`, // Ensure 'background.jpg' is in your 'public' folder
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
      }}
    >
      {/* --- UI ENHANCEMENT: Gradient overlay for a more modern feel --- */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/80"></div> 
      
      <div className="relative z-10 text-center max-w-3xl w-full p-8">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-4">
          {/* --- UI ENHANCEMENT: Gradient text for the brand name --- */}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Sync</span>Space
        </h1>
        <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed max-w-2xl mx-auto">
          The ultimate platform for modern teams. Collaborate in real-time,
          manage projects effortlessly, and achieve more together.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login"
            // --- UI ENHANCEMENT: Primary button style ---
            className="inline-flex items-center justify-center px-8 py-3 text-lg font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Get Started
          </Link>
          <Link
            to="/register"
            // --- UI ENHANCEMENT: Secondary "ghost" button style ---
            className="inline-flex items-center justify-center px-8 py-3 text-lg font-bold rounded-lg text-white bg-white/10 border-2 border-white/20 hover:bg-white/20 backdrop-blur-sm transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Welcome;