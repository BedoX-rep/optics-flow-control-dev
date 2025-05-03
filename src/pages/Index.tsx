
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { 
  CheckCircle, 
  EyeIcon, 
  Search,
  MessageCircle,
  BarChart3,
  ArrowRight
} from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const IndexPage = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section with Integrated Navigation */}
      <section className="relative w-full bg-gradient-to-r from-blue-600 to-cyan-400 pt-4">
        <div className="container mx-auto">
          {/* Navigation Bar */}
          <header className="w-full py-4 px-6 lg:px-10 z-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-white">Lensly</h1>
              </div>
              <nav className="hidden md:flex items-center space-x-6">
                <a href="#features" className="text-sm font-medium text-white hover:text-white/80 transition-colors">Features</a>
                <Link to="/pricing" className="text-sm font-medium text-white hover:text-white/80 transition-colors">Pricing</Link>
                <a href="#contact" className="text-sm font-medium text-white hover:text-white/80 transition-colors">Contact</a>
              </nav>
              <div className="flex items-center space-x-4">
                {user ? (
                  <Link to="/dashboard">
                    <Button className="bg-white text-primary hover:bg-white/90">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Link to="/auth">
                    <Button className="bg-white text-primary hover:bg-white/90">
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </header>
          
          {/* Hero Content */}
          <div className="text-center py-20 px-6 relative z-10">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white">
                Optical Software For All Your Eye Care Needs
              </h1>
              <p className="text-lg md:text-xl mb-10 text-white/90 max-w-2xl mx-auto">
                Effortlessly manage all your client needs and eyewear prescription lenses within seconds. The best eye care management software to get your exact data-backed prescription within seconds.
              </p>
              <Link to="/auth">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-lg py-6 px-8">
                  START A FREE 7-DAY TRIAL
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="text-white">
            <path fill="currentColor" fillOpacity="1" d="M0,160L1440,32L1440,320L0,320Z"></path>
          </svg>
        </div>
      </section>

      {/* Effortless, Fast Section with Image */}
      <section id="features" className="py-20 px-6 lg:px-10 bg-white">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-1/2">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <EyeIcon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Effortless, Fast, And Simple!</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Running an optical salon is a complex task. You need to quickly address the shop flow, your daily operations and of course make sure that all client data is stored digitally. Lensly Optical Software is incredibly efficient, helping you save time and streamline your everyday tasks.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <span>Lightning fast loading speeds</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <span>An intelligent search engine</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <span>Access to a vast database of frames</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <span>Customized search results</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <span>And so much more!</span>
                </li>
              </ul>
              <a href="#features">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                  Learn more <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
            <div className="md:w-1/2">
              <div className="relative">
                <div className="absolute -top-12 -left-12 w-24 h-24 bg-cyan-400 rounded-full z-0 opacity-70"></div>
                <div className="bg-gray-50 p-4 rounded-xl shadow-lg relative z-10">
                  <AspectRatio ratio={4/3} className="bg-white rounded-lg overflow-hidden border border-gray-200">
                    <img 
                      src="/lovable-uploads/62085b8b-26d0-44d3-91f7-56cef47bcb0b.png" 
                      alt="Lensly Dashboard" 
                      className="w-full h-full object-cover"
                    />
                  </AspectRatio>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Complete System Section */}
      <section className="py-20 px-6 lg:px-10 bg-gray-50">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row-reverse gap-12 items-center">
            <div className="md:w-1/2">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center mr-3">
                  <Search className="h-5 w-5 text-cyan-500" />
                </div>
                <h2 className="text-2xl font-bold">A Complete System</h2>
              </div>
              <p className="text-gray-600 mb-6">
                An eye care software is more than just finding the right lens, especially when you have to run an entire business. Lensly is a comprehensive and complete optometry practice management software. It is a one-stop hub that offers everything you need to run your optical salon, intuitively organized in a single place.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-cyan-500 mr-3 mt-0.5" />
                  <span>Not only speed up your service time but also simplify running an entire optical business</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-cyan-500 mr-3 mt-0.5" />
                  <span>Maintain an exceptional quality that your customers love</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-cyan-500 mr-3 mt-0.5" />
                  <span>Make running an entire optical salon business feel like a walk in the park</span>
                </li>
              </ul>
              <a href="#features">
                <Button variant="outline" className="border-cyan-500 text-cyan-500 hover:bg-cyan-500/10">
                  Learn more <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
            <div className="md:w-1/2">
              <div className="relative">
                <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-blue-400 rounded-full z-0 opacity-70"></div>
                <div className="bg-gray-50 p-4 rounded-xl shadow-lg relative z-10">
                  <AspectRatio ratio={4/3} className="bg-white rounded-lg overflow-hidden border border-gray-200">
                    <img 
                      src="/lovable-uploads/9760e056-7b64-4077-a227-61a2dfa313ec.png" 
                      alt="Lensly Complete System" 
                      className="w-full h-full object-cover"
                    />
                  </AspectRatio>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Software Benefits */}
      <section className="py-20 px-6 lg:px-10 bg-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Lensly Is A Software For Opticians That Lets You:</h2>
          <div className="max-w-3xl mx-auto mb-16">
            <p className="text-gray-500">Manage your optical business efficiently with our comprehensive suite of tools</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Access To Vast Database</h3>
              <p className="text-gray-500 text-sm">Find the right frame from a database of thousands of products for guaranteed results.</p>
            </div>
            
            <div className="p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-6 w-6 text-indigo-500" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Client Management</h3>
              <p className="text-gray-500 text-sm">Access your clients' data and history, including prescriptions and purchase records.</p>
            </div>
            
            <div className="p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <EyeIcon className="h-6 w-6 text-cyan-500" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Prescription Management</h3>
              <p className="text-gray-500 text-sm">Manage eyeglass prescriptions with precision and create detailed optical records for each client.</p>
            </div>
            
            <div className="p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Advanced Analytics</h3>
              <p className="text-gray-500 text-sm">Gain valuable insights into your business performance with comprehensive reporting tools.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section id="contact" className="py-16 px-6 lg:px-10 bg-primary text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl font-bold mb-6">Ready to transform your optical business?</h2>
          <p className="mb-8 max-w-xl mx-auto">Start your 7-day free trial today and see how Lensly can help you manage your optical business more efficiently.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-lg py-6 px-8">
                START A FREE 7-DAY TRIAL
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              CONTACT SALES
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-6 lg:px-10">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-10">
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">LENSLY</h3>
              <p className="text-sm">The comprehensive management solution designed specifically for opticians in Morocco and across Africa.</p>
            </div>
            <div>
              <h4 className="text-white text-base font-medium mb-4">PAGES</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm hover:text-white transition-colors">Home</a></li>
                <li><a href="#features" className="text-sm hover:text-white transition-colors">Features</a></li>
                <li><Link to="/pricing" className="text-sm hover:text-white transition-colors">Pricing</Link></li>
                <li><a href="#contact" className="text-sm hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-base font-medium mb-4">COMPANY</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-sm hover:text-white transition-colors">Documentation</a></li>
                <li><Link to="/pricing" className="text-sm hover:text-white transition-colors">Pricing List</Link></li>
                <li><a href="#" className="text-sm hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-base font-medium mb-4">Contact</h4>
              <p className="text-sm mb-4">info@lensly.app</p>
              <p className="text-sm mb-4">+212 634 85 98 303</p>
              <div className="flex space-x-3">
                <a href="#" className="text-white bg-blue-500 w-8 h-8 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">t</a>
                <a href="#" className="text-white bg-blue-500 w-8 h-8 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">f</a>
                <a href="#" className="text-white bg-blue-500 w-8 h-8 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">in</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-10 pt-6 text-sm text-center text-gray-500">
            <p>© {new Date().getFullYear()} Lensly. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default IndexPage;
