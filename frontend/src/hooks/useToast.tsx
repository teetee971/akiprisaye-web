import toast from 'react-hot-toast';

interface ToastOptions {
  duration?: number;
  position?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
}

interface UndoableToastOptions extends ToastOptions {
  onUndo: () => void;
  undoText?: string;
}

export function useToast() {
  const success = (message: string, options?: ToastOptions) => {
    return toast.success(message, options);
  };

  const error = (message: string, options?: ToastOptions) => {
    return toast.error(message, options);
  };

  const info = (message: string, options?: ToastOptions) => {
    return toast(message, {
      icon: 'ℹ️',
      ...options,
    });
  };

  const warning = (message: string, options?: ToastOptions) => {
    return toast(message, {
      icon: '⚠️',
      style: {
        border: '1px solid #f59e0b',
      },
      ...options,
    });
  };

  const loading = (message: string, options?: ToastOptions) => {
    return toast.loading(message, options);
  };

  const promise = <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    },
    options?: ToastOptions
  ) => {
    return toast.promise(promise, messages, options);
  };

  const undoable = (message: string, options: UndoableToastOptions) => {
    const { onUndo, undoText = 'Annuler', duration = 5000, ...toastOptions } = options;

    return toast(
      (t) => (
        <div className="flex items-center justify-between gap-4">
          <span>{message}</span>
          <button
            onClick={() => {
              onUndo();
              toast.dismiss(t.id);
            }}
            className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
          >
            {undoText}
          </button>
        </div>
      ),
      {
        duration,
        ...toastOptions,
      }
    );
  };

  const dismiss = (toastId?: string) => {
    toast.dismiss(toastId);
  };

  const dismissAll = () => {
    toast.dismiss();
  };

  return {
    success,
    error,
    info,
    warning,
    loading,
    promise,
    undoable,
    dismiss,
    dismissAll,
  };
}
