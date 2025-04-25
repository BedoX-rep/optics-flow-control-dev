
import React from 'react';

interface PageTitleProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const PageTitle: React.FC<PageTitleProps> = ({ title, subtitle, actions }) => {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
};

export default PageTitle;
