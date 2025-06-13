interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'warning' | 'danger' | 'info';
}

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    type = 'warning'
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const getTypeStyles = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: '⚠️',
                    confirmBg: 'bg-red-600 hover:bg-red-700',
                    titleColor: 'text-red-800'
                };
            case 'info':
                return {
                    icon: 'ℹ️',
                    confirmBg: 'bg-blue-600 hover:bg-blue-700',
                    titleColor: 'text-blue-800'
                };
            default: // warning
                return {
                    icon: '⚠️',
                    confirmBg: 'bg-orange-600 hover:bg-orange-700',
                    titleColor: 'text-orange-800'
                };
        }
    };

    const styles = getTypeStyles();

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-gray-200" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="text-3xl">{styles.icon}</div>
                        <h3 className={`text-xl font-bold ${styles.titleColor}`}>
                            {title}
                        </h3>
                    </div>
                    
                    <p className="text-gray-700 text-base leading-relaxed mb-6">
                        {message}
                    </p>
                    
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onCancel}
                            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`px-6 py-3 ${styles.confirmBg} text-white font-medium rounded-xl transition-colors`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
