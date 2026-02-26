
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
    detail: "0627026249",
    icon: Phone
  }
];

interface ContactMenuProps {
  modalMode?: boolean;
  onClose?: () => void;
}

const ContactMenu = ({ modalMode, onClose }: ContactMenuProps) => {
  if (modalMode) {
    return (
      <div className="flex flex-col items-center space-y-6 w-full">
        {contactMethods.map((item) => (
          <div key={item.method} className="flex flex-col items-center p-4 bg-gray-50 rounded-2xl w-full">
            <div className="bg-teal-100 p-3 rounded-xl mb-2 text-teal-600">
              <item.icon className="h-6 w-6" />
            </div>
            <p className="text-lg font-black text-gray-900">{item.method}</p>
            <p className="text-gray-600 font-medium">{item.detail}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="bg-transparent hover:bg-gray-100 text-gray-600 font-semibold uppercase tracking-wider">
        Contact
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-[400px] gap-3 p-4">
          {contactMethods.map((item) => (
            <li key={item.method} className="flex items-center p-2 hover:bg-accent rounded-md transition-colors">
              <item.icon className="h-5 w-5 mr-2 text-primary" />
              <div>
                <p className="text-sm font-medium">{item.method}</p>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};

export default ContactMenu;
