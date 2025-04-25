
import React from 'react';

interface PageTitleProps {
  title: string;
  description?: string; // Changed from subtitle to description to match usage
  subtitle?: string;    // Keep subtitle for backward compatibility
  actions?: React.ReactNode;
}

const PageTitle = ({ title, subtitle, description, actions }: PageTitleProps) => {
  // Use description or subtitle, prioritizing description if both are provided
  const subText = description || subtitle;
  
  return (
    <div className="mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">{title}</h1>
        {subText && <p className="mt-1 text-gray-500 max-w-2xl">{subText}</p>}
      </div>
      {actions && (
        <div className="flex flex-wrap gap-3 items-center justify-start sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageTitle;
