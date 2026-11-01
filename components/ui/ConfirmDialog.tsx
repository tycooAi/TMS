import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from './Icons';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} maxWidth="max-w-md">
      <div className="flex gap-4">
        {isDestructive && (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm text-[#41474e] leading-relaxed">{message}</p>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#D9DBD6]">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-semibold text-[#16425B] bg-white border border-[#D9DBD6] rounded-md hover:bg-[#f8faf5] transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`px-4 py-2 text-xs font-semibold rounded-md text-white transition-colors ${
            isDestructive
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-[#2F668F] hover:bg-[#265375]'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
