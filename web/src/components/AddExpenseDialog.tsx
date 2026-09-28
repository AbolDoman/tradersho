import { useId } from "react";
import { ExpenseForm } from "./ExpenseForm";
import { Modal } from "./Modal";

interface AddExpenseDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AddExpenseDialog({ open, onClose }: AddExpenseDialogProps) {
  const titleId = useId();

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId}>
      <ExpenseForm titleId={titleId} onDone={onClose} />
    </Modal>
  );
}
