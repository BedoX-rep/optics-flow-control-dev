
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
  Phone
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
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
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
    }
  ];

  const contactMethods = [
    {
      method: "Email",
      detail: "support@lensly.com",
      icon: Mail
    },
    {
      method: "WhatsApp",
      detail: "+1-234-567-8900",
      icon: Phone
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header/Navigation with Gradient Background */}
      <div className="w-full bg-gradient-to-r from-[#0B6E63] to-[#38B2AC] text-white">
        <header className="container mx-auto py-4 px-6 lg:px-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Lensly</h1>
            </div>
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link to="/features" legacyBehavior passHref>
                    <NavigationMenuLink className={cn(
                      navigationMenuTriggerStyle(),
                      "bg-transparent hover:bg-white/10 text-white"
                    )}>
                      Features
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/pricing" legacyBehavior passHref>
                    <NavigationMenuLink className={cn(
                      navigationMenuTriggerStyle(),
                      "bg-transparent hover:bg-white/10 text-white"
                    )}>
                      Pricing
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent hover:bg-white/10 text-white">
                    Contact
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4">
                      {contactMethods.map((item) => (
                        <li key={item.method} className="flex items-center p-2">
                          <item.icon className="h-5 w-5 mr-2" />
                          <div>
                            <p className="text-sm font-medium">{item.method}</p>
                            <p className="text-sm text-muted-foreground">{item.detail}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
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
        <section className="container mx-auto py-20 px-6 lg:px-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Optical Software For All Your Eye Care Needs
          </h1>
          <p className="text-lg md:text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Effortlessly manage all your client needs and prepare prescription 
            lenses within seconds. The best eye care management software get 
            your exact data-backed prescription within seconds.
          </p>
          <Button size="lg" className="bg-white text-primary hover:bg-white/90 px-8 py-6 text-lg">
            START A FREE 7-DAY TRIAL
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <div className="mt-16 relative">
            <svg className="absolute bottom-0 left-0 right-0 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" preserveAspectRatio="none">
              <path fill="currentColor" d="M0,96L80,106.7C160,117,320,139,480,138.7C640,139,800,117,960,106.7C1120,96,1280,96,1360,96L1440,96L1440,160L1360,160C1280,160,1120,160,960,160C800,160,640,160,480,160C320,160,160,160,80,160L0,160Z"></path>
            </svg>
          </div>
        </section>
      </div>

      {/* Effortless, Fast, Simple Section - Following layout from the image */}
      <section className="py-20 px-6 lg:px-10 bg-white">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-primary/10 text-primary rounded-full p-3 mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-6">Effortless, Fast, And Simple!</h2>
              <p className="text-gray-600 mb-8">
                Running an optical salon is a complex task. You need optical software that simplifies your daily operations 
                while enhancing your services — both in quality and quantity. Lensly is incredibly intuitive, helping you find
                the perfect lenses for every client.
              </p>
              
              <p className="text-gray-700 font-medium mb-4">This optical software offers:</p>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <HoverCard key={index}>
                    <HoverCardTrigger asChild>
                      <li className="flex items-start cursor-help">
                        <CheckCircle className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                        <span>{feature.title} - {feature.description}</span>
                      </li>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="flex flex-col gap-2">
                        <h4 className="font-medium">{feature.title}</h4>
                        <p className="text-sm text-gray-600">{feature.detail}</p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ))}
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span>And so much more!</span>
                </li>
              </ul>
              
              <div className="mt-8">
                <Button className="gap-2">
                  Learn more
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-100">
                <img 
                  src="/lovable-uploads/3f116841-38fb-4c30-9c49-e56e0ea362dc.png" 
                  alt="Lensly software interface" 
                  className="w-full h-auto"
                />
              </div>
              <div className="absolute -z-10 -bottom-6 -right-6 w-48 h-48 bg-primary/10 rounded-full"></div>
              <div className="absolute -z-10 -top-6 -left-6 w-32 h-32 bg-primary/10 rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 lg:px-10 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Our platform provides everything you need to manage your optical business efficiently</p>
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
            <Button size="lg" className="bg-white text-primary hover:bg-white/90">
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
                <li><Link to="/features" className="text-sm hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="text-sm hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/auth" className="text-sm hover:text-white transition-colors">Sign In</Link></li>
                <li><Link to="/auth" className="text-sm hover:text-white transition-colors">Register</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-base font-medium mb-4">Contact</h4>
              <ul className="space-y-2">
                {contactMethods.map((contact, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <contact.icon className="h-4 w-4" /> 
                    <span>{contact.detail}</span>
                  </li>
                ))}
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
