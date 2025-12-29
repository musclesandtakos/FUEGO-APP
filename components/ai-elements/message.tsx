'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  from: 'user' | 'assistant';
  children: React.ReactNode;
}

export function Message({ from, children, className, ...props }: MessageProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 max-w-3xl',
        from === 'user' ? 'ml-auto items-end' : 'items-start',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface MessageContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function MessageContent({ children, className, ...props }: MessageContentProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)} {...props}>
      {children}
    </div>
  );
}

interface MessageResponseProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function MessageResponse({ children, className, ...props }: MessageResponseProps) {
  return (
    <div
      className={cn(
        'rounded-lg px-4 py-2 bg-gray-100 whitespace-pre-wrap',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface MessageActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function MessageActions({ children, className, ...props }: MessageActionsProps) {
  return (
    <div className={cn('flex gap-2 items-center', className)} {...props}>
      {children}
    </div>
  );
}

interface MessageActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  children: React.ReactNode;
}

export function MessageAction({ label, children, className, ...props }: MessageActionProps) {
  return (
    <button
      className={cn(
        'p-2 rounded hover:bg-gray-100 transition-colors',
        className
      )}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
}
