
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, X, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

const PricingPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header/Navigation */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-gray-100 py-4 px-6 lg:px-10 fixed top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-primary">Lensly</Link>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/#features" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">Features</Link>
            <Link to="/pricing" className="text-sm font-medium text-primary border-b-2 border-primary pb-1">Pricing</Link>
            <Link to="/#about" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">About Us</Link>
            <Link to="/#contact" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">Contact</Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link to="/auth">
              <Button>
                Sign In / Register
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 pt-32 pb-16 px-6 lg:px-10 mt-16">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQ0MCIgaGVpZ2h0PSI3NjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cmVjdCBmaWxsPSIjMDBDOUZGIiB3aWR0aD0iMTQ0MCIgaGVpZ2h0PSI3NjAiLz48Y2lyY2xlIGZpbGwtb3BhY2l0eT0iLjEiIGZpbGw9IiNGRkYiIGN4PSI3MjAiIGN5PSIxMDAiIHI9IjMwMCIvPjxjaXJjbGUgZmlsbC1vcGFjaXR5PSIuMTUiIGZpbGw9IiNGRkYiIGN4PSI4MDAiIGN5PSIxMDAiIHI9IjQwMCIvPjwvZz48L3N2Zz4=')]"></div>
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-white">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg mb-8 text-white/90 max-w-2xl mx-auto">
              Choose the plan that best fits your optical business needs. All plans include our core features with different limits.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="text-white">
            <path fill="currentColor" fillOpacity="1" d="M0,160L1440,32L1440,320L0,320Z"></path>
          </svg>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 px-6 lg:px-10 bg-white">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Basic Plan */}
            <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="text-center pb-4">
                <h3 className="text-xl font-bold">Basic</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$29</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Perfect for small optical stores</p>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Up to 500 client records</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Basic inventory management</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Prescription management</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Basic reporting</span>
                  </li>
                  <li className="flex items-start">
                    <X className="h-5 w-5 text-gray-300 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-500">Advanced analytics</span>
                  </li>
                  <li className="flex items-start">
                    <X className="h-5 w-5 text-gray-300 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-500">Multi-location support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="pt-6 flex justify-center">
                <Button className="w-full">Get Started</Button>
              </CardFooter>
            </Card>

            {/* Professional Plan */}
            <Card className="border-primary shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-white text-xs px-3 py-1 font-medium">
                POPULAR
              </div>
              <CardHeader className="text-center pb-4">
                <h3 className="text-xl font-bold">Professional</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$79</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Great for growing optical businesses</p>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Unlimited client records</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Advanced inventory management</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Prescription management</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Advanced reporting & analytics</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Email marketing tools</span>
                  </li>
                  <li className="flex items-start">
                    <X className="h-5 w-5 text-gray-300 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-500">Multi-location support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="pt-6 flex justify-center">
                <Button className="w-full bg-primary hover:bg-primary/90">Get Started</Button>
              </CardFooter>
            </Card>

            {/* Enterprise Plan */}
            <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="text-center pb-4">
                <h3 className="text-xl font-bold">Enterprise</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$149</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">For large optical businesses with multiple locations</p>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Unlimited client records</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Advanced inventory management</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Prescription management</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Advanced reporting & analytics</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Email marketing tools</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Multi-location support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="pt-6 flex justify-center">
                <Button className="w-full" variant="outline">Contact Sales</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 lg:px-10 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-10 text-center">Frequently Asked Questions</h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-3">Can I upgrade or downgrade my plan?</h3>
              <p className="text-gray-600">Yes, you can easily upgrade or downgrade your plan at any time. Changes to your billing will be prorated.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-3">Is there a free trial available?</h3>
              <p className="text-gray-600">Yes, we offer a 7-day free trial on all plans so you can test the features before committing.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-3">What payment methods do you accept?</h3>
              <p className="text-gray-600">We accept all major credit cards, as well as PayPal and bank transfers for annual plans.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-3">Is my data secure?</h3>
              <p className="text-gray-600">Yes, we use industry-standard encryption and security practices to keep your data safe and secure.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-3">Can I cancel my subscription?</h3>
              <p className="text-gray-600">You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-3">Do you offer custom enterprise solutions?</h3>
              <p className="text-gray-600">Yes, we can create custom solutions for large optical businesses with specific requirements. Contact our sales team for details.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-6 lg:px-10 bg-primary text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl font-bold mb-6">Ready to transform your optical business?</h2>
          <p className="mb-8 max-w-xl mx-auto">Start your 7-day free trial today and see how Lensly can help you manage your optical business more efficiently.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90">
              START FREE TRIAL
            </Button>
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
              <h4 className="text-white text-base font-medium mb-4">GLASSON</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="text-sm hover:text-white transition-colors">Home</Link></li>
                <li><Link to="/#features" className="text-sm hover:text-white transition-colors">Live Preview</Link></li>
                <li><Link to="/#features" className="text-sm hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/" className="text-sm hover:text-white transition-colors">Screenshots</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-base font-medium mb-4">COMPANY</h4>
              <ul className="space-y-2">
                <li><Link to="/#about" className="text-sm hover:text-white transition-colors">Careers</Link></li>
                <li><Link to="/#about" className="text-sm hover:text-white transition-colors">Documentation</Link></li>
                <li><Link to="/#contact" className="text-sm hover:text-white transition-colors">Communication</Link></li>
                <li><Link to="/pricing" className="text-sm hover:text-white transition-colors">Pricing List</Link></li>
                <li><Link to="/" className="text-sm hover:text-white transition-colors">Blog</Link></li>
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

export default PricingPage;
