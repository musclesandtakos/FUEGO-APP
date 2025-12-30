'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ArrowDownIcon } from 'lucide-react';

interface ConversationContextValue {
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

const ConversationContext = React.createContext<ConversationContextValue | null>(null);

const useConversationContext = () => {
  const context = React.useContext(ConversationContext);
  if (!context) {
    throw new Error('Conversation components must be used within Conversation');
  }
  return context;
};

interface ConversationProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Conversation({ children, className, ...props }: ConversationProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  return (
    <ConversationContext.Provider value={{ scrollContainerRef }}>
      <div className={cn('relative flex flex-col', className)} {...props}>
        {children}
      </div>
    </ConversationContext.Provider>
  );
}

interface ConversationContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ConversationContent({ children, className, ...props }: ConversationContentProps) {
  const { scrollContainerRef } = useConversationContext();
  
  React.useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [children, scrollContainerRef]);

  return (
    <div
      ref={scrollContainerRef}
      className={cn('flex-1 overflow-y-auto space-y-4 p-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface ConversationScrollButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function ConversationScrollButton({ className, ...props }: ConversationScrollButtonProps) {
  const { scrollContainerRef } = useConversationContext();
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsVisible(!isNearBottom);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [scrollContainerRef]);

  const scrollToBottom = () => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToBottom}
      className={cn(
        'absolute bottom-20 right-4 rounded-full p-2 bg-white shadow-lg border hover:bg-gray-50',
        className
      )}
      {...props}
    >
      <ArrowDownIcon className="size-4" />
    </button>
  );
}
