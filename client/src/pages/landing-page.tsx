import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { motion } from "framer-motion";
import { useState } from "react";

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const [hovered, setHovered] = useState(false);

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  const featureContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.6
      }
    }
  };

  const featureItem = {
    hidden: { scale: 0.8, opacity: 0 },
    show: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  // If user is already logged in, redirect to the dashboard
  if (!isLoading && user) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-blue-100">
      {/* Hero Section */}
      <div className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 text-center">
        <motion.div 
          className="max-w-3xl mx-auto"
          initial="hidden"
          animate="show"
          variants={container}
        >
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-12 bg-gradient-to-r from-green-600 to-emerald-500 text-transparent bg-clip-text leading-normal pt-3 pb-5"
            variants={item}
          >
            Vegan 2.0
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl mb-8 text-gray-700 leading-relaxed py-2"
            variants={item}
          >
            Next-generation impact tracking for animal advocates
          </motion.p>
          
          <motion.div 
            className="flex flex-wrap justify-center gap-4 mb-12"
            variants={item}
          >
            <Link href="/auth">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white font-medium px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
                  Get Started Now
                </Button>
              </motion.div>
            </Link>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12"
            variants={featureContainer}
            initial="hidden"
            animate="show"
            viewport={{ once: true, amount: 0.3 }}
          >
            {/* Feature 1 */}
            <motion.div 
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300"
              variants={featureItem}
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <motion.svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 text-indigo-600"
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </motion.svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-center">Donation Tracking</h3>
              <p className="text-gray-600 text-sm text-center">Track your charitable donations and see their direct impact on animal welfare.</p>
            </motion.div>
            
            {/* Feature 2 */}
            <motion.div 
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300"
              variants={featureItem}
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <motion.svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 text-green-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </motion.svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-center">Vegan Conversions</h3>
              <p className="text-gray-600 text-sm text-center">Measure the impact of helping others adopt plant-based diets.</p>
            </motion.div>
            
            {/* Feature 3 */}
            <motion.div 
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300"
              variants={featureItem}
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <motion.svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 text-blue-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </motion.svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-center">Media Sharing</h3>
              <p className="text-gray-600 text-sm text-center">Calculate the reach and impact of sharing animal welfare content online.</p>
            </motion.div>
            
            {/* Feature 4 */}
            <motion.div 
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300"
              variants={featureItem}
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <motion.svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 text-amber-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </motion.svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-center">Campaign Impact</h3>
              <p className="text-gray-600 text-sm text-center">Track your participation in animal welfare campaigns and advocacy.</p>
            </motion.div>
          </motion.div>
          
          {/* Extra spacing at the bottom */}
          <div className="pb-12"></div>
        </motion.div>
      </div>
      
      {/* Footer */}
      <motion.footer 
        className="bg-white/30 backdrop-blur-sm py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
      >
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-600 text-sm">
            © {new Date().getFullYear()} Animal Saving Calculator. All rights reserved.
          </p>
        </div>
      </motion.footer>
    </div>
  );
}