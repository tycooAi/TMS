import React from 'react';
import { Check } from './Icons';

interface StepperProps {
  steps: string[];
  currentStep: number;
  onStepClick?: (index: number) => void;
}

export function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <nav aria-label="Progress" className="my-6 overflow-x-auto pb-2">
      <ol className="flex items-center gap-2 min-w-max">
        {steps.map((label, index) => {
          const isDone = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <li key={label} className="flex items-center">
              <button
                type="button"
                disabled={!isDone || !onStepClick}
                onClick={() => isDone && onStepClick?.(index)}
                className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                  isCurrent
                    ? 'text-[#16425B] font-bold'
                    : isDone
                    ? 'text-[#2F668F] cursor-pointer hover:underline'
                    : 'text-[#8898aa] cursor-not-allowed'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                    isDone
                      ? 'bg-[#2F668F] text-white border-[#2F668F]'
                      : isCurrent
                      ? 'border-[#2F668F] text-[#2F668F] bg-[#e8f1f5]'
                      : 'border-[#D9DBD6] text-[#8898aa] bg-white'
                  }`}
                >
                  {isDone ? <Check size={13} /> : index + 1}
                </span>
                <span>{label}</span>
              </button>
              {index < steps.length - 1 && (
                <span className="mx-2 text-[#c1c7cf] text-sm font-light">›</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
