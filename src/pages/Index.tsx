
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { 
  CheckCircle, 
  EyeIcon, 
  ShieldCheck, 
  Users, 
  Package, 
  Receipt, 
  FileText,
  ArrowRight,
  Search,
  MessageCircle,
  BarChart3,
  LayoutDashboard,
  Box
} from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const IndexPage = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header/Navigation */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-gray-100 py-4 px-6 lg:px-10 fixed top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary">Lensly</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">Features</a>
            <Link to="/pricing" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">Pricing</Link>
            <a href="#about" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">About Us</a>
            <a href="#contact" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">Contact</a>
          </nav>
          <div className="flex items-center space-x-4">
            {user ? (
              <Link to="/dashboard">
                <Button>
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button>
                  Sign In / Register
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 py-32 px-6 lg:px-10 mt-16">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQ0MCIgaGVpZ2h0PSI3NjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cmVjdCBmaWxsPSIjMDBDOUZGIiB3aWR0aD0iMTQ0MCIgaGVpZ2h0PSI3NjAiLz48Y2lyY2xlIGZpbGwtb3BhY2l0eT0iLjEiIGZpbGw9IiNGRkYiIGN4PSI3MjAiIGN5PSIxMDAiIHI9IjMwMCIvPjxjaXJjbGUgZmlsbC1vcGFjaXR5PSIuMTUiIGZpbGw9IiNGRkYiIGN4PSI4MDAiIGN5PSIxMDAiIHI9IjQwMCIvPjwvZz48L3N2Zz4=')]"></div>
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white">
              Optical Software For All Your Eye Care Needs
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white/90 max-w-2xl mx-auto">
              Effortlessly manage all your client needs and eyewear prescription lenses within seconds. The best eye care management software to get your exact data backed prescription within seconds.
            </p>
            <Link to="/auth">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                START A FREE TRIAL
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="text-white">
            <path fill="currentColor" fillOpacity="1" d="M0,160L1440,32L1440,320L0,320Z"></path>
          </svg>
        </div>
      </section>

      {/* Features Section */}
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
                Running an optical store is a complex task. You need to quickly address the shopflow, your daily operations and of course make sure that all client data is stored digitally. Lensly Optical Software is incredibly efficient, helping you save time and streamline your everyday tasks.
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
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                Learn more <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="md:w-1/2">
              <div className="bg-gray-50 p-4 rounded-xl shadow-lg">
                <AspectRatio ratio={4/3} className="bg-white rounded-lg overflow-hidden border border-gray-200">
                  <img 
                    src="/lovable-uploads/0f26f5dc-e2fd-4bff-8678-9d874c60c398.png" 
                    alt="Lensly Dashboard" 
                    className="w-full h-full object-cover"
                  />
                </AspectRatio>
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
                  <LayoutDashboard className="h-5 w-5 text-cyan-500" />
                </div>
                <h2 className="text-2xl font-bold">A Complete System</h2>
              </div>
              <p className="text-gray-600 mb-6">
                On top of taking great care of those eyeglasses your clients, especially when they have flown to other cities, Lensly App is a comprehensive and complete optical management software. Lensly is your one-stop shop that offers literally everything you need to run your optical store, whatever important to you about each client.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-cyan-500 mr-3 mt-0.5" />
                  <span>Not only speed up your service time but also create running an entire optical table!</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-cyan-500 mr-3 mt-0.5" />
                  <span>Set the online maintenance, an exceptional quality that your customers love.</span>
                </li>
              </ul>
              <Button variant="outline" className="border-cyan-500 text-cyan-500 hover:bg-cyan-500/10">
                Learn more <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="md:w-1/2">
              <div className="bg-gray-50 p-4 rounded-xl shadow-lg">
                <AspectRatio ratio={4/3} className="bg-white rounded-lg overflow-hidden border border-gray-200">
                  <img 
                    src="/lovable-uploads/0f26f5dc-e2fd-4bff-8678-9d874c60c398.png" 
                    alt="Lensly Complete System" 
                    className="w-full h-full object-cover"
                  />
                </AspectRatio>
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
                <Users className="h-6 w-6 text-indigo-500" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Centralized Client Management</h3>
              <p className="text-gray-500 text-sm">Access your clients' data and history, automated as well as customized text messages.</p>
            </div>
            
            <div className="p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="h-6 w-6 text-cyan-500" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Tailor-Made Results</h3>
              <p className="text-gray-500 text-sm">Leverage the intelligent search engine of the optometry software to access precise, fast, focused, and speedy results.</p>
            </div>
            
            <div className="p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Your Competitive Advantage</h3>
              <p className="text-gray-500 text-sm">Gain an edge with an intuitive eye care software to diversified services and quality with incredible client insight and profits.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Icons Grid */}
      <section className="py-16 bg-gray-50 px-6 lg:px-10">
        <div className="container mx-auto">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium">Lens Finder</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium">Communication</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium">Clients</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium">Statistics</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <EyeIcon className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium">Eye Care</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Box className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium">Inventory Module</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section id="contact" className="py-16 px-6 lg:px-10 bg-white border-t border-gray-100">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl font-bold mb-6">7-day free trial</h2>
          <p className="mb-8 text-gray-600 max-w-xl mx-auto">Got Any Questions? Let us know in the Contact Us form below.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              FIND OUT MORE
            </Button>
            <Button size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              CONTACT US
            </Button>
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="py-20 px-6 lg:px-10 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-10 text-center">What's new?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="h-48 overflow-hidden bg-blue-100">
                <img 
                  src="/lovable-uploads/0f26f5dc-e2fd-4bff-8678-9d874c60c398.png" 
                  alt="Smart Glasses" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="font-semibold text-lg mb-2">Smart Glasses and Wearable Tech: Coming Soon to Your Optical Store Soon</h3>
                <p className="text-gray-500 text-sm">The latest innovation in eyewear technology...</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="h-48 overflow-hidden bg-blue-100">
                <img 
                  src="/lovable-uploads/0f26f5dc-e2fd-4bff-8678-9d874c60c398.png" 
                  alt="Optical Trade Shows" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="font-semibold text-lg mb-2">Why Optical Trade Shows Are More Important Than Ever in 2024's Highlights</h3>
                <p className="text-gray-500 text-sm">Connecting with industry experts and discovering new products...</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="h-48 overflow-hidden bg-blue-100">
                <img 
                  src="/lovable-uploads/0f26f5dc-e2fd-4bff-8678-9d874c60c398.png" 
                  alt="World Optometry Week" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="font-semibold text-lg mb-2">World Optometry Week 2023: Eyes to the Future</h3>
                <p className="text-gray-500 text-sm">Celebrating advancements in eye care technology...</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-6 lg:px-10">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-10">
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">GLASSON</h3>
              <p className="text-sm">The comprehensive management solution designed specifically for opticians in Morocco and across Africa.</p>
            </div>
            <div>
              <h4 className="text-white text-base font-medium mb-4">GLASSON</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm hover:text-white transition-colors">Home</a></li>
                <li><a href="#features" className="text-sm hover:text-white transition-colors">Live Preview</a></li>
                <li><a href="#features" className="text-sm hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-sm hover:text-white transition-colors">Screenshots</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-base font-medium mb-4">COMPANY</h4>
              <ul className="space-y-2">
                <li><a href="#about" className="text-sm hover:text-white transition-colors">Careers</a></li>
                <li><a href="#about" className="text-sm hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#contact" className="text-sm hover:text-white transition-colors">Communication</a></li>
                <li><Link to="/pricing" className="text-sm hover:text-white transition-colors">Pricing List</Link></li>
                <li><a href="#" className="text-sm hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-base font-medium mb-4">Contact</h4>
              <p className="text-sm mb-4">info@glasson.app</p>
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
