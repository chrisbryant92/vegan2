import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function LandingPage() {
  const { user, isLoading } = useAuth();

  // If user is already logged in, redirect to the dashboard
  if (!isLoading && user) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-blue-100">
      {/* Hero Section */}
      <div className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-12 bg-gradient-to-r from-indigo-600 to-blue-500 text-transparent bg-clip-text leading-normal pt-3 pb-5">
            Animal Saving Calculator
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-gray-700 leading-relaxed py-2">
            Track and visualize your real-world impact on animal welfare
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Link href="/auth">
              <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white font-medium px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
                Get Started
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {/* Feature 1 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-md">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-center">Donation Tracking</h3>
              <p className="text-gray-600 text-sm text-center">Track your charitable donations and see their direct impact on animal welfare.</p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-md">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-center">Vegan Conversions</h3>
              <p className="text-gray-600 text-sm text-center">Measure the impact of helping others adopt plant-based diets.</p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-center">Media Sharing</h3>
              <p className="text-gray-600 text-sm text-center">Calculate the reach and impact of sharing animal welfare content online.</p>
            </div>
            
            {/* Feature 4 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-md">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-center">Campaign Impact</h3>
              <p className="text-gray-600 text-sm text-center">Track your participation in animal welfare campaigns and advocacy.</p>
            </div>
          </div>
          
          {/* Testimonials Section */}
          <div className="mt-24 mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">What Animal Advocates Are Saying</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-md">
                <div className="flex flex-col items-center mb-4">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-indigo-600">J</span>
                  </div>
                  <h4 className="font-semibold">Jamie Wilson</h4>
                  <p className="text-gray-500 text-sm">Animal Rights Activist</p>
                </div>
                <p className="text-gray-700 text-center italic">
                  "This calculator has completely transformed how I track my advocacy efforts. Now I can see exactly how many animals I'm helping save through all my different activities."
                </p>
                <div className="flex justify-center mt-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              
              {/* Testimonial 2 */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-md">
                <div className="flex flex-col items-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-green-600">S</span>
                  </div>
                  <h4 className="font-semibold">Sarah Chen</h4>
                  <p className="text-gray-500 text-sm">Vegan Educator</p>
                </div>
                <p className="text-gray-700 text-center italic">
                  "As someone who helps others transition to a vegan lifestyle, this tool gives me concrete data to show the impact of dietary choices. It's a game-changer for my advocacy work."
                </p>
                <div className="flex justify-center mt-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              
              {/* Testimonial 3 */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-md">
                <div className="flex flex-col items-center mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-blue-600">M</span>
                  </div>
                  <h4 className="font-semibold">Michael Taylor</h4>
                  <p className="text-gray-500 text-sm">Nonprofit Director</p>
                </div>
                <p className="text-gray-700 text-center italic">
                  "Our organization uses this calculator to demonstrate our collective impact to donors and volunteers. The visualizations make it easy to show the real-world difference we're making."
                </p>
                <div className="flex justify-center mt-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Call to Action Section */}
          <div className="py-16 px-6 bg-indigo-600 rounded-3xl shadow-xl">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Start Tracking Your Impact Today
              </h2>
              <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of animal advocates who are measuring and maximizing their positive impact on animal welfare. Every action counts!
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/auth">
                  <Button size="lg" className="bg-white hover:bg-gray-100 text-indigo-700 font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
                    Create Free Account
                  </Button>
                </Link>
              </div>
              <p className="text-indigo-200 text-sm mt-6">
                No credit card required. Start making a difference in just 60 seconds.
              </p>
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-white/30 backdrop-blur-sm py-6">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-600 text-sm">
            © {new Date().getFullYear()} Animal Saving Calculator. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}