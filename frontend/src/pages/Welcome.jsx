import React, { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";

function Welcome() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center text-white font-sans relative overflow-hidden bg-slate-900">
      {/* Clean professional background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black" />
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Main content */}
      <div className={`relative z-10 text-center max-w-4xl w-full p-8 transition-all duration-800 ${
        isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        
        {/* Clean, professional logo */}
        <div className="mb-6">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-8">
            <span className="text-blue-500">Sync</span>Space
          </h1>
          
          {/* Professional tagline */}
          <p className="text-xl md:text-2xl text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
            Professional collaboration platform for modern teams
          </p>
        </div>

        {/* Clean description */}
        <div className="mb-10">
          <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Streamline your workflow with powerful tools designed for productivity, 
            security, and seamless team collaboration.
          </p>
        </div>

        {/* Professional CTA button */}
        <div className="flex justify-center">
          <button
            onClick={() => window.location.href = '/login'}
            className="group inline-flex items-center justify-center px-2 py-1 text-lg font-semibold rounded-lg text-white bg-blue-800 hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <span className="flex items-center gap-2">
              Get Started
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </span>
          </button>
        </div>

        {/* Professional feature indicators */}
        <div className="mt-16 flex justify-center items-center gap-8 text-slate-500">
          <div className="flex items-center gap-2 text-sm">
       
            <span></span>
          </div>
          <div className="flex items-center gap-2 text-sm">
          
            <span></span>
          </div>
          <div className="flex items-center gap-2 text-sm">
          
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Welcome;