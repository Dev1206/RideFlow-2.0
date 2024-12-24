import { ReactNode } from 'react';
import { FiInbox } from 'react-icons/fi';

interface EmptyStateProps {
  icon?: ReactNode;
  message: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = ({ 
  icon = <FiInbox className="w-8 h-8 text-indigo-400" />,
  message,
  description,
  action
}: EmptyStateProps) => (
  <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 text-center">
    <div className="w-16 h-16 bg-indigo-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-white mb-2">{message}</h3>
    {description && (
      <p className="text-gray-400 mb-6">{description}</p>
    )}
    {action && (
      <div className="mt-6">
        {action}
      </div>
    )}
  </div>
); 