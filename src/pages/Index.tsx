
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { 
  CheckCircle, 
  Globe, 
  ShieldCheck, 
  Users, 
  Package, 
  Receipt, 
  FileText,
  ArrowRight
} from 'lucide-react';

const IndexPage = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header/Navigation */}
      <header className="w-full bg-white border-b border-gray-100 py-4 px-6 lg:px-10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary">Lensly</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">Features</a>
            <a href="#benefits" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">Benefits</a>
            <a href="#about" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">About Us</a>
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
      <section className="relative w-full bg-gradient-to-r from-[#0B6E63] to-[#38B2AC] py-20 px-6 lg:px-10">
        <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="text-white animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Optical Management Solution for Modern Opticians
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white/90 max-w-lg">
              Streamline your optical practice with our comprehensive management system designed for opticians across Morocco and Africa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  Explore Features
                </Button>
              </a>
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="absolute -left-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <div className="relative bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20 shadow-xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/20 p-4 rounded-lg">
                  <div className="h-32 bg-white/10 rounded-md mb-2"></div>
                  <div className="h-4 w-3/4 bg-white/20 rounded-md"></div>
                </div>
                <div className="bg-white/20 p-4 rounded-lg">
                  <div className="h-32 bg-white/10 rounded-md mb-2"></div>
                  <div className="h-4 w-3/4 bg-white/20 rounded-md"></div>
                </div>
                <div className="bg-white/20 p-4 rounded-lg">
                  <div className="h-32 bg-white/10 rounded-md mb-2"></div>
                  <div className="h-4 w-3/4 bg-white/20 rounded-md"></div>
                </div>
                <div className="bg-white/20 p-4 rounded-lg">
                  <div className="h-32 bg-white/10 rounded-md mb-2"></div>
                  <div className="h-4 w-3/4 bg-white/20 rounded-md"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 lg:px-10 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Our platform provides everything you need to manage your optical business efficiently</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover-scale">
              <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-lg mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Client Management</h3>
              <p className="text-gray-500">Track client histories, appointments, and prescriptions in one place.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover-scale">
              <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-lg mb-4">
                <Package className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Inventory Control</h3>
              <p className="text-gray-500">Manage your frames, lenses, and other products with real-time stock updates.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover-scale">
              <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-lg mb-4">
                <Receipt className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Simplified Billing</h3>
              <p className="text-gray-500">Create and manage receipts, invoices, and track payments efficiently.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover-scale">
              <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-lg mb-4">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Localized for Africa</h3>
              <p className="text-gray-500">Designed specifically for opticians in Morocco and across Africa.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover-scale">
              <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-lg mb-4">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Prescription Management</h3>
              <p className="text-gray-500">Easily record and track patient prescriptions and changes over time.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover-scale">
              <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-lg mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure & Reliable</h3>
              <p className="text-gray-500">Your data is securely stored and backed up regularly for peace of mind.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-6 lg:px-10 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose Us</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Designed with the unique needs of optical businesses in mind</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-10">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-4">Optimized for Your Business</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <span>Designed for opticians in Morocco and Africa</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <span>Simplified workflow designed for busy professionals</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <span>Reduces administrative burden by automating routine tasks</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <span>Streamlines client record management</span>
                </li>
              </ul>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-4">Comprehensive Support</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <span>Responsive customer service team available when you need help</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <span>Regular updates based on user feedback and industry changes</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <span>Training resources to help you get the most from the system</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <span>Growing network of opticians utilizing our platform</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* About/Call to Action Section */}
      <section id="about" className="py-20 px-6 lg:px-10 bg-primary text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Join the Leading Optical Management Solution</h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto text-white/90">
            Join hundreds of opticians across Morocco and Africa who are streamlining their practice with our comprehensive management system.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90">
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-6 lg:px-10">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Lensly</h3>
              <p className="text-sm">The comprehensive management solution designed specifically for opticians in Morocco and across Africa.</p>
            </div>
            <div>
              <h4 className="text-white text-base font-medium mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-sm hover:text-white transition-colors">Features</a></li>
                <li><a href="#benefits" className="text-sm hover:text-white transition-colors">Benefits</a></li>
                <li><Link to="/auth" className="text-sm hover:text-white transition-colors">Sign In</Link></li>
                <li><Link to="/auth" className="text-sm hover:text-white transition-colors">Register</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-base font-medium mb-4">Contact</h4>
              <p className="text-sm mb-2">Have questions? Reach out to us.</p>
              <Button variant="outline" className="border-gray-500 hover:bg-white/10 text-sm mt-2">
                Contact Support
              </Button>
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
