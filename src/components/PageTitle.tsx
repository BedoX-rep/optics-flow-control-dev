
import React from 'react';

interface PageTitleProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const PageTitle = ({ title, subtitle, actions }: PageTitleProps) => {
  return (
    <div className="mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-1 text-gray-500 max-w-2xl">{subtitle}</p>}
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

