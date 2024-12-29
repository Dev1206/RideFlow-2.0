import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RiCarFill, RiMapPinFill, RiUserStarFill, RiShieldCheckFill, RiArrowRightLine, RiRocketFill } from 'react-icons/ri';

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </svg>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const features = [
    {
      icon: <RiCarFill className="w-8 h-8" />,
      title: "Easy Booking",
      description: "Book your ride in seconds with our streamlined process",
      gradient: "from-[#FF5E8C] to-[#FF8C5E]",
      shadowColor: "shadow-pink-500/20"
    },
    {
      icon: <RiMapPinFill className="w-8 h-8" />,
      title: "Cost-Effective and Affordable Rides",
      description: "Quality travel options that fit your budget",
      gradient: "from-[#3B82F6] to-[#2DD4BF]",
      shadowColor: "shadow-blue-500/20"
    },
    {
      icon: <RiUserStarFill className="w-8 h-8" />,
      title: "Professional Drivers",
      description: "Experienced and vetted drivers for your safety",
      gradient: "from-[#8B5CF6] to-[#D946EF]",
      shadowColor: "shadow-violet-500/20"
    },
    {
      icon: <RiShieldCheckFill className="w-8 h-8" />,
      title: "Secure Rides",
      description: "Your safety and comfort are our top priorities",
      gradient: "from-[#059669] to-[#34D399]",
      shadowColor: "shadow-emerald-500/20"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] overflow-hidden font-sans selection:bg-[#8B5CF6]/20 selection:text-[#8B5CF6]">
      {/* Background Pattern - Enhanced with more modern gradients */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(30deg,#F0F7FF_0%,#ffffff_30%,#FDF4FF_70%)]"></div>
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_25%),radial-gradient(circle_at_70%_60%,rgba(139,92,246,0.15),transparent_25%)]"></div>
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-white to-transparent"></div>
      </div>

      {/* Navigation - Enhanced with backdrop filter */}
      <nav className="fixed top-0 left-0 right-0 bg-white/60 backdrop-blur-xl border-b border-black/[0.06] z-50 supports-[backdrop-filter]:bg-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] p-[1px] relative">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                <div className="relative w-full h-full rounded-2xl bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">🚗</span>
                </div>
              </div>
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] group-hover:opacity-80 transition-opacity duration-200">
                RideFlow
              </span>
            </div>
            <button
              onClick={handleGoogleSignIn}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black/[0.03] hover:bg-black/[0.05] transition-all duration-200 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] opacity-0 group-hover:opacity-5 transition-opacity duration-200"></div>
              <GoogleIcon />
              <span className="font-semibold text-gray-700 relative z-10">Sign in</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Enhanced with modern touches */}
      <div className="pt-40 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#3B82F6]/8 to-[#8B5CF6]/8 text-sm font-semibold mb-8 border border-[#8B5CF6]/10 backdrop-blur-sm">
              <RiRocketFill className="w-5 h-5 text-[#3B82F6] animate-pulse" />
              <span className="text-[#8B5CF6] relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-px after:bg-[#8B5CF6]/20">
                Smart ride booking platform
              </span>
              <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-ping"></span>
            </div>
            <h1 className="text-6xl sm:text-7xl font-bold mb-8 tracking-tight leading-tight">
              Your Journey,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] animate-gradient">
                Our Priority
              </span>
            </h1>
            <p className="text-xl text-gray-600/90 mb-12 max-w-2xl mx-auto leading-relaxed">
              Experience seamless ride booking with professional drivers at your service.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleGoogleSignIn}
                className="group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] rounded-2xl text-white transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5 w-full sm:w-auto"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                <div className="relative flex items-center gap-3 justify-center w-full">
                  <GoogleIcon />
                  <span className="font-semibold">Continue with Google</span>
                  <RiArrowRightLine className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </button>
              <button className="px-8 py-4 border-2 border-[#8B5CF6]/20 hover:border-[#8B5CF6]/30 rounded-2xl text-gray-700 hover:text-gray-900 transition-all duration-200 font-semibold hover:shadow-lg relative overflow-hidden group w-full sm:w-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6]/10 via-[#8B5CF6]/10 to-[#D946EF]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                <span className="relative z-10">Learn more</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-24 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] mb-4">
              How RideFlow Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Simple, Seamless, and Secure Ride Booking in Just a Few Steps
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: "Sign Up",
                description: "Create your account using Google Sign-In for quick and secure access.",
                icon: <RiUserStarFill className="w-12 h-12 text-[#3B82F6]" />
              },
              {
                step: 2,
                title: "Book Your Ride",
                description: "Select your destination, pickup point, and preferred ride type.",
                icon: <RiCarFill className="w-12 h-12 text-[#8B5CF6]" />
              },
              {
                step: 3,
                title: "Relax & Enjoy",
                description: "We handle finding the best driver for you, so you can sit back and enjoy the ride.",
                icon: <RiShieldCheckFill className="w-12 h-12 text-[#D946EF]" />
              }
            ].map((item) => (
              <div 
                key={item.step}
                className="group relative p-8 rounded-3xl bg-white border border-gray-100 hover:border-transparent transition-all duration-300 hover:shadow-[0_0_40px_-10px_rgba(0,0,0,0.15)] hover:-translate-y-1 overflow-hidden text-center"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/5 via-[#8B5CF6]/5 to-[#D946EF]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#3B82F6]/10 via-[#8B5CF6]/10 to-[#D946EF]/10 mb-6">
                    {item.icon}
                  </div>
                  <div className="absolute top-4 right-4 text-5xl font-bold text-gray-200 opacity-50">{item.step}</div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-800">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Grid with Enhanced Cards */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] mb-4">
              Why Choose RideFlow
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Experience the future of ride booking with our innovative features
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative p-8 rounded-3xl bg-white border border-gray-100 hover:border-transparent transition-all duration-300 hover:shadow-[0_0_40px_-10px_rgba(0,0,0,0.15)] hover:-translate-y-1 overflow-hidden"
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`}></div>
                
                {/* Top Corner Decoration */}
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${feature.gradient} opacity-[0.07] rounded-bl-[100px] -mr-8 -mt-8 transition-transform duration-300 group-hover:scale-110`}></div>
                
                {/* Icon Container */}
                <div className="relative">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white mb-6 shadow-lg ${feature.shadowColor} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    {feature.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="relative">
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#3B82F6] group-hover:to-[#8B5CF6]">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Bottom Decoration */}
                <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${feature.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section - Enhanced with modern effects */}
      <div className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF]">
          <div className="absolute inset-0 bg-grid-white/[0.2] bg-[length:20px_20px]"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4 text-white [text-shadow:_0_1px_0_rgb(0_0_0_/_20%)]">
            Ready to get started?
          </h2>
          <button
            onClick={handleGoogleSignIn}
            className="group px-8 py-4 bg-white text-gray-900 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6]/10 via-[#8B5CF6]/10 to-[#D946EF]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            <div className="relative flex items-center gap-3">
              <GoogleIcon />
              <span className="font-semibold">Sign up now</span>
              <RiArrowRightLine className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </button>
        </div>
      </div>

      {/* Footer - Enhanced with hover effects */}
      <footer className="py-12 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] p-[1px] relative">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-500"></div>
                <div className="relative w-full h-full rounded-xl bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] flex items-center justify-center">
                  <span className="text-lg font-bold text-white">R</span>
                </div>
              </div>
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] group-hover:opacity-80 transition-opacity duration-200">
                RideFlow
              </span>
            </div>
            <p className="text-sm text-gray-500 font-medium hover:text-gray-600 transition-colors duration-200">
              © 2024 RideFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 
