
import React from 'react';
import { Mail, Phone } from 'lucide-react';

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
    <div className="relative group">
      <button className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10 text-white">
        Contact
      </button>
      <div className="absolute hidden group-hover:block right-0 top-full mt-2 w-[400px] bg-white rounded-md shadow-lg">
        <ul className="grid gap-3 p-4">
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
      </div>
    </div>
  );
};

export default ContactMenu;
