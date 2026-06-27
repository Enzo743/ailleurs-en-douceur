interface EmptyStateProps {
  message: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
  className?: string;
}

export default function EmptyState({ message, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`dashboard-empty-state ${className}`}>
      <p>{message}</p>
      {description && <p>{description}</p>}
      {action && (
        <a href={action.href} className="dashboard-create-button">
          {action.label}
        </a>
      )}
    </div>
  );
}