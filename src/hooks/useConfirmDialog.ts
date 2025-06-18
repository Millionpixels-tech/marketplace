import { useState, useCallback } from 'react';

interface UseConfirmDialogReturn {
    isOpen: boolean;
    showConfirmDialog: (options: ConfirmDialogOptions) => Promise<boolean>;
    confirmDialog: {
        title: string;
        message: string;
        confirmText: string;
        cancelText: string;
        type: 'warning' | 'danger' | 'info';
    };
    handleConfirm: () => void;
    handleCancel: () => void;
}

interface ConfirmDialogOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'danger' | 'info';
}

export function useConfirmDialog(): UseConfirmDialogReturn {
    const [isOpen, setIsOpen] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{
        title: string;
        message: string;
        confirmText: string;
        cancelText: string;
        type: 'warning' | 'danger' | 'info';
    }>({
        title: '',
        message: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        type: 'warning'
    });
    const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

    const showConfirmDialog = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfirmDialog({
                title: options.title,
                message: options.message,
                confirmText: options.confirmText || 'Confirm',
                cancelText: options.cancelText || 'Cancel',
                type: options.type || 'warning'
            });
            setResolvePromise(() => resolve);
            setIsOpen(true);
        });
    }, []);

    const handleConfirm = useCallback(() => {
        setIsOpen(false);
        if (resolvePromise) {
            resolvePromise(true);
            setResolvePromise(null);
        }
    }, [resolvePromise]);

    const handleCancel = useCallback(() => {
        setIsOpen(false);
        if (resolvePromise) {
            resolvePromise(false);
            setResolvePromise(null);
        }
    }, [resolvePromise]);

    return {
        isOpen,
        showConfirmDialog,
        confirmDialog,
        handleConfirm,
        handleCancel
    };
}
