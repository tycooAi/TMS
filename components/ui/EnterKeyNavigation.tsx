'use client';

import { useEffect } from 'react';

function getFormContainer(element: HTMLElement): HTMLElement {
  // 1. Closest <form> tag
  const form = element.closest('form');
  if (form) return form;

  // 2. Closest modal or dialog
  const modal = element.closest<HTMLElement>('[role="dialog"], [aria-modal="true"], .fixed.inset-0');
  if (modal) return modal;

  // 3. Closest step or card container
  const stepOrCard = element.closest<HTMLElement>('.space-y-4, .space-y-5, .space-y-6, .bg-white.rounded-lg');
  if (stepOrCard) return stepOrCard;

  // 4. Fallback to main or document.body
  return element.closest('main') || document.body;
}

function isFieldEditable(el: HTMLElement): boolean {
  if ((el as any).disabled) return false;

  if (el instanceof HTMLInputElement) {
    if (el.readOnly) return false;
    const type = (el.type || 'text').toLowerCase();
    if (['hidden', 'button', 'submit', 'reset', 'file', 'image'].includes(type)) {
      return false;
    }
  }

  if (el instanceof HTMLTextAreaElement) {
    if (el.readOnly) return false;
  }

  // Check visibility: skip hidden or display:none elements
  if (el.offsetParent === null && window.getComputedStyle(el).position !== 'fixed') {
    return false;
  }
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }

  return true;
}

export function EnterKeyNavigation() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle plain Enter key (not Shift+Enter, Ctrl+Enter, Alt+Enter, or IME composition)
      if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey || e.isComposing) {
        return;
      }

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const tagName = target.tagName;

      // Dropdowns, searchable selects, textareas, and buttons retain their normal keyboard behaviour
      if (tagName === 'TEXTAREA' || tagName === 'BUTTON' || tagName === 'SELECT') {
        return;
      }

      // Only intercept input fields
      if (tagName !== 'INPUT') {
        return;
      }

      const input = target as HTMLInputElement;
      const inputType = (input.type || 'text').toLowerCase();

      // Don't intercept button/submit/reset/hidden/checkbox/radio
      if (['button', 'submit', 'reset', 'hidden', 'checkbox', 'radio'].includes(inputType)) {
        return;
      }

      // Skip disabled or read-only fields
      if (input.disabled || input.readOnly) {
        return;
      }

      const container = getFormContainer(input);
      const allElements = Array.from(container.querySelectorAll<HTMLElement>('input, select, textarea'));
      const editableFields = allElements.filter(isFieldEditable);

      const currentIndex = editableFields.indexOf(input);
      if (currentIndex === -1) return;

      if (currentIndex < editableFields.length - 1) {
        // Move focus sequentially to the next editable field
        e.preventDefault();
        const nextField = editableFields[currentIndex + 1];
        nextField.focus();
        if (nextField instanceof HTMLInputElement && typeof nextField.select === 'function') {
          nextField.select();
        }
      } else {
        // Final field: preserve existing form submission behavior
        const enclosingForm = input.closest('form');
        if (!enclosingForm) {
          // If not in a <form> tag, trigger primary submit button in the container if present
          const submitBtn = container.querySelector<HTMLButtonElement>('button[type="submit"], button.btn-primary');
          if (submitBtn && !submitBtn.disabled) {
            e.preventDefault();
            submitBtn.click();
          }
        }
        // If enclosingForm exists, standard browser form submission triggers without duplicate submission
      }
    };

    document.addEventListener('keydown', handleKeyDown, false);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, false);
    };
  }, []);

  return null;
}
