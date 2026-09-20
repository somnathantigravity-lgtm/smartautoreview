"use client";

import React from "react";
import { LogOut, X, AlertTriangle } from "lucide-react";

interface SignoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userEmail?: string;
}

export const SignoutConfirmModal: React.FC<SignoutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userEmail
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 font-sans animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Heading */}
        <div className="flex items-start space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
            <LogOut className="w-5 h-5" />
          </div>
          <div className="space-y-1 pr-6">
            <h3 className="text-base font-extrabold text-slate-900">
              Confirm Sign Out
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to end your active session{userEmail ? ` for ${userEmail}` : ""}? You will need to log in again to access live recommendations and portfolio execution.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm shadow-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Yes, Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
