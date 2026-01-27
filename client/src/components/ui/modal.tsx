// components/ui/modal.tsx
import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";

export const Modal = ({ isOpen, onClose, children }: any) => (
  <Dialog.Root open={isOpen} onOpenChange={onClose}>
    <Dialog.Overlay className="fixed inset-0 bg-black/50" />
    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-md">
      {children}
    </Dialog.Content>
  </Dialog.Root>
);
