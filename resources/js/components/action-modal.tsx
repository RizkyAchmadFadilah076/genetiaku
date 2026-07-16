import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface ActionModalProps {
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    showCancel?: boolean;
    confirmVariant?: 'default' | 'destructive';
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}

export function ActionModal({
    open,
    title,
    description,
    confirmLabel = 'Lanjutkan',
    cancelLabel = 'Batal',
    showCancel = true,
    confirmVariant = 'default',
    onOpenChange,
    onConfirm,
}: ActionModalProps) {
    const handleConfirm = () => {
        onConfirm();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    {showCancel ? (
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                {cancelLabel}
                            </Button>
                        </DialogClose>
                    ) : null}
                    <Button
                        type="button"
                        variant={confirmVariant}
                        onClick={handleConfirm}
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
