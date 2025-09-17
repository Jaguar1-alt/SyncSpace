import React, { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

function Welcome() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // A slight delay to ensure the animation is visible on load
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 font-sans relative overflow-hidden bg-slate-900 text-white">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 z-0 opacity-50">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600 rounded-full filter blur-3xl animate-spin-slow"></div>
        <div className="absolute -bottom-40 -right-20 w-96 h-96 bg-blue-600 rounded-full filter blur-3xl animate-spin-slow animation-delay-4000"></div>
      </div>

      {/* Glassmorphism Panel */}
      <div
        className={`relative z-10 w-full max-w-xl p-10 md:p-12 text-center bg-gray-800/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl transition-all duration-700 ease-out
          ${isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
      >
        <div className="flex flex-col items-center gap-8">
          
          {/* Logo - Made Larger */}
          <div
            className={`transition-all duration-700 ease-out delay-100
              ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
          >
            <img src="/logo.png" alt="SyncSpace Logo" className="w-32 h-32 md:w-36 md:h-36" /> {/* CHANGED THIS LINE */}
          </div>
          
          {/* Heading */}
          <h1
            className={`text-5xl md:text-6xl font-bold tracking-tight transition-all duration-700 ease-out delay-200
              ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
          >
            Welcome to <span className="text-blue-400">Sync</span>Space
          </h1>

          {/* Subtitle */}
          <p
            className={`text-lg text-slate-200 transition-all duration-700 ease-out delay-300
              ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
          >
            Your all-in-one platform for modern team collaboration.
          </p>
          
          {/* CTA Button */}
          <div
            className={`w-full pt-4 transition-all duration-700 ease-out delay-500
              ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
          >
            <Link
              to="/login"
              className="group inline-flex items-center justify-center w-full md:w-auto px-8 py-4 text-lg font-semibold text-white transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg hover:shadow-2xl hover:scale-105 transform"
            >
              Get Started
              <ArrowRight className="w-6 h-6 ml-3 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Welcome;