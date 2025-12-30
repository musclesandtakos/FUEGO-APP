'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDownIcon, Loader2Icon } from 'lucide-react';

interface ReasoningContextValue {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isStreaming: boolean;
}

const ReasoningContext = React.createContext<ReasoningContextValue | null>(null);

const useReasoningContext = () => {
  const context = React.useContext(ReasoningContext);
  if (!context) {
    throw new Error('Reasoning components must be used within Reasoning');
  }
  return context;
};

interface ReasoningProps extends React.HTMLAttributes<HTMLDivElement> {
  isStreaming?: boolean;
  children: React.ReactNode;
}

export function Reasoning({ isStreaming = false, children, className, ...props }: ReasoningProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <ReasoningContext.Provider value={{ isOpen, setIsOpen, isStreaming }}>
      <div className={cn('border rounded-lg', className)} {...props}>
        {children}
      </div>
    </ReasoningContext.Provider>
  );
}

interface ReasoningTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function ReasoningTrigger({ className, ...props }: ReasoningTriggerProps) {
  const { isOpen, setIsOpen, isStreaming } = useReasoningContext();

  return (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        'w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors',
        className
      )}
      {...props}
    >
      <span className="flex items-center gap-2 text-sm font-medium">
        {isStreaming && <Loader2Icon className="size-4 animate-spin" />}
        Reasoning
      </span>
      <ChevronDownIcon
        className={cn(
          'size-4 transition-transform',
          isOpen && 'transform rotate-180'
        )}
      />
    </button>
  );
}

interface ReasoningContentProps {
  children: React.ReactNode;
}

export function ReasoningContent({ children }: ReasoningContentProps) {
  const { isOpen } = useReasoningContext();

  if (!isOpen) return null;

  return (
    <div className="p-3 border-t bg-gray-50 whitespace-pre-wrap text-sm">
      {children}
    </div>
  );
}
