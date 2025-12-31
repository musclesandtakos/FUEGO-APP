'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ExternalLinkIcon } from 'lucide-react';

interface SourcesContextValue {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SourcesContext = React.createContext<SourcesContextValue | null>(null);

const useSourcesContext = () => {
  const context = React.useContext(SourcesContext);
  if (!context) {
    throw new Error('Sources components must be used within Sources');
  }
  return context;
};

interface SourcesProps {
  children: React.ReactNode;
}

export function Sources({ children }: SourcesProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <SourcesContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="mb-2">{children}</div>
    </SourcesContext.Provider>
  );
}

interface SourcesTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  count: number;
}

export function SourcesTrigger({ count, className, ...props }: SourcesTriggerProps) {
  const { isOpen, setIsOpen } = useSourcesContext();

  return (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        'text-sm text-blue-600 hover:underline flex items-center gap-1',
        className
      )}
      {...props}
    >
      <ExternalLinkIcon className="size-3" />
      {count} {count === 1 ? 'source' : 'sources'}
    </button>
  );
}

interface SourcesContentProps {
  children: React.ReactNode;
}

export function SourcesContent({ children }: SourcesContentProps) {
  const { isOpen } = useSourcesContext();

  if (!isOpen) return null;

  return <div className="mt-2 space-y-1">{children}</div>;
}

interface SourceProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  title: string;
}

export function Source({ title, className, ...props }: SourceProps) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'text-sm text-blue-600 hover:underline flex items-center gap-1',
        className
      )}
      {...props}
    >
      <ExternalLinkIcon className="size-3" />
      {title}
    </a>
  );
}
