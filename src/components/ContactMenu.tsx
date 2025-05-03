
import React from 'react';
import { Mail, Phone } from 'lucide-react';
import {
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@/components/ui/navigation-menu";

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

const ContactMenu = () => {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="bg-transparent hover:bg-white/10 text-white">
        Contact
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-[400px] gap-3 p-4">
          {contactMethods.map((item) => (
            <li key={item.method}>
              <button className="w-full flex items-center p-2 hover:bg-accent rounded-md transition-colors">
                <item.icon className="h-5 w-5 mr-2 text-primary" />
                <div>
                  <p className="text-sm font-medium">{item.method}</p>
                  <p className="text-sm text-muted-foreground">{item.detail}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};

export default ContactMenu;
