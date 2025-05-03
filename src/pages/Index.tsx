import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { 
  CheckCircle, 
  Package, 
  Receipt, 
  FileText,
  ArrowRight,
  Mail,
  Phone,
  ChartBar,
  Database
} from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import ContactMenu from '@/components/ContactMenu';
import { cn } from '@/lib/utils';

const IndexPage = () => {
  const { user } = useAuth();

  const features = [
    {
      title: "Client Management",
      description: "Track client histories, appointments, and prescriptions in one place",
      icon: <Package className="h-6 w-6" />,
      detail: "Store detailed client information including contact details, prescription history, purchase records, and appointment scheduling."
    },
    {
      title: "Inventory Control",
      description: "Manage your frames, lenses, and other products with real-time stock updates",
      icon: <Package className="h-6 w-6" />,
      detail: "Track stock levels, set reorder points, manage suppliers, and categorize products for easy searching and management."
    },
    {
      title: "Simplified Billing",
      description: "Create and manage receipts, invoices, and track payments efficiently",
      icon: <Receipt className="h-6 w-6" />,
      detail: "Generate professional receipts, manage payment methods, track outstanding balances, and integrate with common accounting systems."
    },
    {
      title: "Prescription Management",
      description: "Easily record and track patient prescriptions and changes over time",
      icon: <FileText className="h-6 w-6" />,
      detail: "Record detailed prescription data, track changes over time, and quickly retrieve prescription history for returning clients."
    },
    {
      title: "Statistics",
      description: "Comprehensive analytics and reporting on your business performance",
      icon: <ChartBar className="h-6 w-6" />,
      detail: "Monitor sales trends, analyze customer preferences, and generate insightful reports to optimize your business operations."
    },
    {
      title: "Access Control",
      description: "Manage user permissions and control access to sensitive data",
      icon: <Database className="h-6 w-6" />,
      detail: "Set role-based permissions, secure sensitive client information, and ensure data privacy compliance."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header/Navigation with Gradient Background */}
      <div className="w-full h-screen bg-gradient-to-r from-[#4861F0] to-[#22CDEE] text-white relative">
        <header className="container mx-auto py-4 px-6 lg:px-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Lensly</h1>
            </div>
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent hover:bg-white/10 text-white">
                    Features
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[600px] gap-3 p-4 md:grid-cols-2">
                      {features.map((feature) => (
                        <li key={feature.title}>
                          <div className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                            <div className="flex items-center gap-2">
                              {React.cloneElement(feature.icon, { className: "h-5 w-5 text-primary" })}
                              <div className="text-sm font-medium leading-none">{feature.title}</div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {feature.description}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/pricing">
                    <NavigationMenuLink className={cn(
                      "group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10 text-white"
                    )}>
                      Pricing
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <ContactMenu />
              </NavigationMenuList>
            </NavigationMenu>
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
                    Sign In / Register
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Hero Section - Part of the gradient background */}
        <section className="container mx-auto py-16 px-6 lg:px-10 text-center relative">
          <h1 className="text-3xl md:text-5xl font-bold mb-5 leading-tight max-w-2xl mx-auto">
            Optical Software For All Your Eye Care Needs
          </h1>
          <p className="text-base md:text-lg mb-8 text-white/90 max-w-xl mx-auto leading-relaxed">
            Effortlessly manage all your client needs and prepare prescription 
            lenses within seconds. The best eye care management software get 
            your exact data-backed prescription within seconds
          </p>
          <div className="relative z-[1]">
            <Button size="lg" className="bg-[#FF3B9A] text-white hover:bg-[#FF3B9A]/90 px-6 py-5 text-base">
              START A FREE TRIAL
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* Diagonal cut for hero section */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-white"
            style={{
              clipPath: 'polygon(0% 85%, 100% 65%, 100% 100%, 0% 100%)'
            }}
          />
        </div>
      </div>

      {/* Effortless, Fast, Simple Section with twisted image */}
      <section className="pt-0 -mt-48 px-6 lg:px-10 bg-transparent relative z-10">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="inline-block bg-primary/10 text-primary rounded-full p-3 mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-6 text-teal-600">Effortless, Fast, And Simple!</h2>
              <p className="text-gray-600 mb-8">
                Running an optical salon is a complex task. You need optical software that simplifies your daily operations 
                while enhancing your services — both in quality and quantity. Lensly is incredibly intuitive, helping you find 
                the perfect lenses for every client.
              </p>

              <p className="text-gray-600 mb-8">This optical software offers:</p>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-teal-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Client Management - Track client histories, appointments, and prescriptions in one place</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-teal-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Inventory Control - Manage your frames, lenses, and other products with real-time stock updates</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-teal-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Simplified Billing - Create and manage receipts, invoices, and track payments efficiently</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-teal-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Prescription Management - Easily record and track patient prescriptions and changes over time</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-teal-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Statistics - Comprehensive analytics and reporting on your business performance</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-teal-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Access Control - Manage user permissions and control access to sensitive data</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-teal-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">And so much more!</span>
                </li>
              </ul>

              <Button className="text-base px-5 py-5">
                Learn more
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="relative order-1 md:order-2">
              <div className="rounded-xl overflow-hidden shadow-2xl transform -rotate-6">
                <img 
                  src="/lovable-uploads/1ee9153a-e7e1-41c4-b82e-f1e5f3fffc11.png" 
                  alt="Lensly software interface" 
                  className="w-full h-auto"
                />
              </div>
              <div className="absolute -z-10 -bottom-6 -right-6 w-64 h-64 bg-primary/10 rounded-full"></div>
              <div className="absolute -z-10 -top-6 -left-6 w-48 h-48 bg-primary/10 rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 lg:px-10 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">Our platform provides everything you need to manage your optical business efficiently</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-lg mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 lg:px-10 bg-primary text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Join the Leading Optical Management Solution</h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto text-white/90">
            Join hundreds of opticians across Morocco and Africa who are streamlining their practice with our comprehensive management system.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 px-8 py-6 text-lg">
              Start Free Trial Today
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
                <li><Link to="/" className="text-sm hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="text-sm hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/auth" className="text-sm hover:text-white transition-colors">Sign In</Link></li>
                <li><Link to="/auth" className="text-sm hover:text-white transition-colors">Register</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-base font-medium mb-4">Contact</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4" /> 
                  <span>support@lensly.com</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4" /> 
                  <span>+1-234-567-8900</span>
                </li>
              </ul>
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