'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from '@/components/ui/button';
import * as Select from '@radix-ui/react-select';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { SendIcon, PaperclipIcon, XIcon, ChevronDownIcon, CheckIcon, Loader2Icon } from 'lucide-react';

export interface PromptInputMessage {
  text?: string;
  files?: File[];
}

interface PromptInputContextValue {
  message: PromptInputMessage;
  setMessage: React.Dispatch<React.SetStateAction<PromptInputMessage>>;
  onSubmit: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  globalDrop?: boolean;
  multiple?: boolean;
}

const PromptInputContext = React.createContext<PromptInputContextValue | null>(null);

const usePromptInputContext = () => {
  const context = React.useContext(PromptInputContext);
  if (!context) {
    throw new Error('PromptInput components must be used within PromptInput');
  }
  return context;
};

interface PromptInputProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit'> {
  onSubmit: (message: PromptInputMessage) => void;
  globalDrop?: boolean;
  multiple?: boolean;
}

export function PromptInput({ 
  onSubmit, 
  children, 
  className,
  globalDrop = false,
  multiple = false,
  ...props 
}: PromptInputProps) {
  const [message, setMessage] = React.useState<PromptInputMessage>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    onSubmit(message);
    setMessage({});
  };

  React.useEffect(() => {
    if (!globalDrop) return;

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.files) {
        const filesArray = Array.from(e.dataTransfer.files);
        setMessage(prev => ({
          ...prev,
          files: multiple ? [...(prev.files || []), ...filesArray] : filesArray
        }));
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener('drop', handleDrop);
    window.addEventListener('dragover', handleDragOver);

    return () => {
      window.removeEventListener('drop', handleDrop);
      window.removeEventListener('dragover', handleDragOver);
    };
  }, [globalDrop, multiple]);

  return (
    <PromptInputContext.Provider 
      value={{ message, setMessage, onSubmit: handleSubmit, fileInputRef, globalDrop, multiple }}
    >
      <div className={cn('border rounded-lg bg-white', className)} {...props}>
        {children}
      </div>
    </PromptInputContext.Provider>
  );
}

interface PromptInputHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function PromptInputHeader({ children, className, ...props }: PromptInputHeaderProps) {
  return (
    <div className={cn('p-2 border-b', className)} {...props}>
      {children}
    </div>
  );
}

interface PromptInputBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export function PromptInputBody({ children, className, ...props }: PromptInputBodyProps) {
  return (
    <div className={cn('p-2', className)} {...props}>
      {children}
    </div>
  );
}

interface PromptInputFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function PromptInputFooter({ children, className, ...props }: PromptInputFooterProps) {
  return (
    <div className={cn('p-2 border-t flex justify-between items-center', className)} {...props}>
      {children}
    </div>
  );
}

interface PromptInputToolsProps extends React.HTMLAttributes<HTMLDivElement> {}

export function PromptInputTools({ children, className, ...props }: PromptInputToolsProps) {
  return (
    <div className={cn('flex gap-2 items-center', className)} {...props}>
      {children}
    </div>
  );
}

interface PromptInputTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function PromptInputTextarea({ className, ...props }: PromptInputTextareaProps) {
  const { setMessage, onSubmit } = usePromptInputContext();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [props.value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
    props.onKeyDown?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(prev => ({ ...prev, text: e.target.value }));
    props.onChange?.(e);
  };

  return (
    <textarea
      ref={textareaRef}
      className={cn(
        'w-full resize-none border-0 outline-none focus:ring-0 min-h-[60px] max-h-[200px]',
        className
      )}
      placeholder="Type a message..."
      onKeyDown={handleKeyDown}
      onChange={handleChange}
      {...props}
    />
  );
}

interface PromptInputSubmitProps extends ButtonProps {
  status?: string;
}

export function PromptInputSubmit({ className, status, ...props }: PromptInputSubmitProps) {
  const { onSubmit, message } = usePromptInputContext();

  return (
    <Button
      onClick={onSubmit}
      className={cn('rounded-full', className)}
      size="icon"
      disabled={!message.text && !message.files?.length}
      {...props}
    >
      {status === 'streaming' || status === 'submitted' ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <SendIcon className="size-4" />
      )}
    </Button>
  );
}

interface PromptInputAttachmentsProps {
  children: (attachment: File) => React.ReactNode;
}

export function PromptInputAttachments({ children }: PromptInputAttachmentsProps) {
  const { message, setMessage } = usePromptInputContext();

  if (!message.files?.length) return null;

  const removeFile = (index: number) => {
    setMessage(prev => ({
      ...prev,
      files: prev.files?.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="flex flex-wrap gap-2">
      {message.files.map((file, index) => (
        <div key={index} className="relative">
          {children(file)}
          <button
            onClick={() => removeFile(index)}
            className="absolute -top-2 -right-2 rounded-full bg-red-500 text-white p-1"
          >
            <XIcon className="size-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

interface PromptInputAttachmentProps {
  data: File;
}

export function PromptInputAttachment({ data }: PromptInputAttachmentProps) {
  return (
    <div className="flex items-center gap-2 rounded bg-gray-100 px-3 py-2 text-sm">
      <PaperclipIcon className="size-4" />
      <span>{data.name}</span>
    </div>
  );
}

export function PromptInputActionAddAttachments() {
  const { fileInputRef, setMessage, multiple } = usePromptInputContext();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setMessage(prev => ({
        ...prev,
        files: multiple ? [...(prev.files || []), ...filesArray] : filesArray
      }));
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded w-full text-left"
      >
        <PaperclipIcon className="size-4" />
        <span>Add attachments</span>
      </button>
    </>
  );
}

interface PromptInputActionMenuProps {
  children: React.ReactNode;
}

export function PromptInputActionMenu({ children }: PromptInputActionMenuProps) {
  return <DropdownMenu.Root>{children}</DropdownMenu.Root>;
}

export function PromptInputActionMenuTrigger() {
  return (
    <DropdownMenu.Trigger asChild>
      <Button variant="ghost" size="icon">
        <PaperclipIcon className="size-4" />
      </Button>
    </DropdownMenu.Trigger>
  );
}

interface PromptInputActionMenuContentProps {
  children: React.ReactNode;
}

export function PromptInputActionMenuContent({ children }: PromptInputActionMenuContentProps) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        className="min-w-[200px] bg-white rounded-md shadow-lg border p-1"
        sideOffset={5}
      >
        {children}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );
}

interface PromptInputButtonProps extends ButtonProps {}

export function PromptInputButton({ children, className, ...props }: PromptInputButtonProps) {
  return (
    <Button variant="ghost" className={cn('gap-2', className)} {...props}>
      {children}
    </Button>
  );
}

interface PromptInputSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export function PromptInputSelect({ value, onValueChange, children }: PromptInputSelectProps) {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      {children}
    </Select.Root>
  );
}

export function PromptInputSelectTrigger({ children }: { children: React.ReactNode }) {
  return (
    <Select.Trigger asChild>
      <Button variant="ghost" className="gap-2">
        {children}
        <ChevronDownIcon className="size-4" />
      </Button>
    </Select.Trigger>
  );
}

export function PromptInputSelectValue() {
  return <Select.Value />;
}

export function PromptInputSelectContent({ children }: { children: React.ReactNode }) {
  return (
    <Select.Portal>
      <Select.Content className="bg-white rounded-md shadow-lg border overflow-hidden">
        <Select.Viewport className="p-1">
          {children}
        </Select.Viewport>
      </Select.Content>
    </Select.Portal>
  );
}

interface PromptInputSelectItemProps {
  value: string;
  children: React.ReactNode;
}

export function PromptInputSelectItem({ value, children }: PromptInputSelectItemProps) {
  return (
    <Select.Item
      value={value}
      className="relative flex items-center px-8 py-2 rounded hover:bg-gray-100 cursor-pointer outline-none"
    >
      <Select.ItemIndicator className="absolute left-2">
        <CheckIcon className="size-4" />
      </Select.ItemIndicator>
      <Select.ItemText>{children}</Select.ItemText>
    </Select.Item>
  );
}
