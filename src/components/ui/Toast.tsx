import { Toaster as Sonner, toast } from 'sonner';

export const Toaster = () => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-900 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl',
          description: 'group-[.toast]:text-slate-500',
          actionButton:
            'group-[.toast]:bg-indigo-600 group-[.toast]:text-white group-[.toast]:rounded-lg',
          cancelButton:
            'group-[.toast]:bg-slate-100 group-[.toast]:text-slate-600 group-[.toast]:rounded-lg',
        },
      }}
    />
  );
};

export { toast };
