import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Button
} from '@mui/material';

interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    isAllDay: boolean;
    allDayDate: Date | null;
    startTime: Date | null;
    endTime: Date | null;
    recurring: boolean;
    location: string;
    reminders: { reminder_time: string; reminder_type: string }[];
    color: string;
}

const EventConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    onClose,
    onConfirm,
    title,
    isAllDay,
    allDayDate,
    startTime,
    endTime,
    recurring,
    location,
    reminders,
    color
}) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Typography variant="h6">Confirm Event Details</Typography>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" sx={{ mb: 1 }}>
                    Please confirm the details of your event:
                </Typography>
                <Typography variant="body2"><strong>Title:</strong> {title}</Typography>
                {isAllDay && allDayDate && (
                    <>
                        <Typography variant="body2"><strong>Date:</strong> {allDayDate.toLocaleDateString()}</Typography>
                        <Typography variant="body2"><strong>All Day:</strong> Yes</Typography>
                    </>
                )}
                {!isAllDay && (
                    <>
                        <Typography variant="body2"><strong>Starts:</strong> {startTime?.toLocaleString()}</Typography>
                        <Typography variant="body2"><strong>Ends:</strong> {endTime?.toLocaleString()}</Typography>
                        <Typography variant="body2"><strong>All Day:</strong> No</Typography>
                    </>
                )}
                <Typography variant="body2"><strong>Recurring:</strong> {recurring ? 'Yes' : 'No'}</Typography>
                <Typography variant="body2"><strong>Location:</strong> {location}</Typography>
                {reminders.length > 0 && (
                    <Typography variant="body2">
                        <strong>Reminders:</strong> {reminders.map(r => `${r.reminder_time} (${r.reminder_type})`).join(', ')}
                    </Typography>
                )}
                <Typography variant="body2"><strong>Color:</strong> {color}</Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" color="primary" onClick={onConfirm}>
                    Confirm
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EventConfirmDialog;
