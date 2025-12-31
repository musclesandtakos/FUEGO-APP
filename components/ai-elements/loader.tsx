'use client';

import { Loader2Icon } from 'lucide-react';

export function Loader() {
  return (
    <div className="flex items-center gap-2 text-gray-500">
      <Loader2Icon className="size-4 animate-spin" />
      <span>Thinking...</span>
    </div>
  );
}
