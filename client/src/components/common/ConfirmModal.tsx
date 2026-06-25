import { Button, Group, Modal, Text } from "@mantine/core";

interface ConfirmModalProps {
  opened: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  opened,
  title,
  message,
  confirmLabel = "Confirm",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onCancel}
      title={title}
      centered
      aria-labelledby="confirm-modal-title"
    >
      <Text fz="sm" mb="xl">
        {message}
      </Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button color="red" onClick={onConfirm} loading={isLoading}>
          {confirmLabel}
        </Button>
      </Group>
    </Modal>
  );
}
