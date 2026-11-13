import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

export default function ConfirmActionModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'OK, Confirm',
  cancelLabel = 'Cancel',
  variant = 'navy', // 'navy' | 'danger' | 'emerald'
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null;

  const confirmBtnClass =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : variant === 'emerald'
      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
      : 'bg-[#1B3664] hover:bg-[#0F172A] text-white';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        <div className="bg-[#0F172A] text-white px-5 py-3.5 flex items-center justify-between">
          <h5 className="font-semibold text-sm flex items-center gap-2">
            {variant === 'danger' ? (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{title}</span>
          </h5>
          <button
            type="button"
            onClick={onCancel}
            className="text-white/70 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{message}</p>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${confirmBtnClass}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
