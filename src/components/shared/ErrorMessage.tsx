import { FiAlertCircle } from 'react-icons/fi';

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage = ({ message }: ErrorMessageProps) => (
  <div className="bg-red-400/10 backdrop-blur-lg border border-red-400/20 rounded-xl p-4 flex items-start gap-3">
    <FiAlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
    <div>
      <h4 className="text-sm font-medium text-red-400">Error</h4>
      <p className="text-sm text-red-300 mt-1">{message}</p>
    </div>
  </div>
); 