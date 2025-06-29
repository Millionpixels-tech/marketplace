import { FiAlertTriangle, FiCheckCircle, FiInfo, FiSettings } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

interface BuyerStatusWarningProps {
  type: 'warning' | 'error' | 'info';
  message: string;
  canProceed: boolean;
}

export default function BuyerStatusWarning({ type, message, canProceed }: BuyerStatusWarningProps) {
  const navigate = useNavigate();
  
  if (!message) return null;

  const showVerificationButton = type === 'error' && !canProceed && message.includes('verification badge');
  const showContactSupportButton = type === 'error' && !canProceed && message.includes('contact customer support') && !showVerificationButton;
  const showWarningContactButton = type === 'warning' && canProceed && message.includes('consider resolving these issues');

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <FiAlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <FiAlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <FiCheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <FiInfo className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 border',
          text: 'text-red-800',
          icon: 'text-red-600'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 border',
          text: 'text-yellow-800',
          icon: 'text-yellow-600'
        };
      case 'info':
        return {
          container: 'bg-green-50 border-green-200 border',
          text: 'text-green-800',
          icon: 'text-green-600'
        };
      default:
        return {
          container: 'bg-blue-50 border-blue-200 border',
          text: 'text-blue-800',
          icon: 'text-blue-600'
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`rounded-lg p-4 mb-6 ${styles.container}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className={`text-sm font-medium ${styles.text}`}>
            {message}
          </p>
          {showVerificationButton && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => navigate('/profile')}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                <FiSettings className="w-3 h-3" />
                Go to Settings
              </button>
              <button
                onClick={() => navigate('/customer-service')}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
              >
                Contact Support
              </button>
            </div>
          )}
          {showContactSupportButton && (
            <div className="mt-3">
              <button
                onClick={() => navigate('/customer-service')}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Contact Support
              </button>
            </div>
          )}
          {showWarningContactButton && (
            <div className="mt-3">
              <button
                onClick={() => navigate('/customer-service')}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-yellow-700 bg-yellow-100 hover:bg-yellow-200 rounded-md transition-colors"
              >
                Contact Support
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
