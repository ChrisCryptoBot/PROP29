import React from 'react';
import { Link } from 'react-router-dom';
import styles from './PageContainer.module.css';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface ActionButton {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'primary' | 'danger';
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface PageContainerProps {
  title: string;
  subtitle?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ActionButton[];
  children: React.ReactNode;
  layout?: 'fullWidth' | 'constrained';
  showHeader?: boolean;
  showFooter?: boolean;
  footerContent?: React.ReactNode;
  className?: string;
  testId?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  subtitle,
  description,
  breadcrumbs,
  actions,
  children,
  layout = 'constrained',
  showHeader = true,
  showFooter = false,
  footerContent,
  className = '',
  testId
}) => {
  const renderBreadcrumbs = () => {
    if (!breadcrumbs || breadcrumbs.length === 0) return null;

    return (
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <ol className={styles.breadcrumbList}>
          {breadcrumbs.map((item, index) => (
            <li key={index} className={styles.breadcrumbItem}>
              {item.href && !item.current ? (
                <Link to={item.href} className={styles.breadcrumbLink}>
                  {item.label}
                </Link>
              ) : (
                <span className={item.current ? styles.breadcrumbCurrent : ''}>
                  {item.label}
                </span>
              )}
              {index < breadcrumbs.length - 1 && (
                <span className={styles.breadcrumbSeparator}>/</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  };

  const renderActions = () => {
    if (!actions || actions.length === 0) return null;

    return (
      <div className={styles.actions}>
        {actions.map((action, index) => {
          const buttonClass = `${styles.actionButton} ${action.variant ? styles[action.variant] : ''}`;
          
          if (action.href) {
            return (
              <Link
                key={index}
                to={action.href}
                className={buttonClass}
                onClick={action.onClick}
              >
                {action.icon && <span className={styles.actionIcon}>{action.icon}</span>}
                {action.label}
              </Link>
            );
          }

          return (
            <button
              key={index}
              className={buttonClass}
              onClick={action.onClick}
              disabled={action.disabled}
              type="button"
            >
              {action.icon && <span className={styles.actionIcon}>{action.icon}</span>}
              {action.label}
            </button>
          );
        })}
      </div>
    );
  };

  const containerClass = `${styles.container} ${styles[layout]} ${className}`;
  const contentClass = `${styles.content} ${layout === 'fullWidth' ? styles.contentFullWidth : ''} ${layout === 'constrained' ? styles.contentConstrained : ''}`;

  return (
    <div className={containerClass} data-testid={testId}>
      {showHeader && (
        <header className={styles.header}>
          {renderBreadcrumbs()}
          <div className={styles.titleSection}>
            <div className={styles.titleGroup}>
              <h1 className={styles.title}>{title}</h1>
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
              {description && <p className={styles.description}>{description}</p>}
            </div>
            {renderActions()}
          </div>
        </header>
      )}
      
      <main className={contentClass}>
        {children}
      </main>
      
      {showFooter && (
        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            {footerContent || (
              <>
                <span>© 2024 PROPER 2.9. All rights reserved.</span>
                <span>Version 2.9.0</span>
              </>
            )}
          </div>
        </footer>
      )}
    </div>
  );
};

// Fix the action components to return proper ActionButton objects instead of React elements
export const QuickAction = (props: Omit<ActionButton, 'variant'> & { variant?: 'default' | 'primary' | 'danger' }): ActionButton => {
  return { ...props, variant: props.variant || 'default' };
};

export const RefreshAction = ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }): ActionButton => ({
  label: 'Refresh',
  onClick,
  disabled,
  icon: ''
});

export const AddAction = ({ href, onClick }: { href?: string; onClick?: () => void }): ActionButton => ({
  label: 'Add New',
  href,
  onClick,
  variant: 'primary' as const,
  icon: '➕'
});

export default PageContainer;
