import React from 'react';
import { Dialog, DialogContent, useTheme, useMediaQuery } from '@mui/material';
import EventForm from '../Event/EventForm';

interface EventDialogProps {
    open: boolean;
    onClose: () => void;
    onEventCreated: () => void;
}

const EventDialog: React.FC<EventDialogProps> = ({ open, onClose, onEventCreated }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
            fullScreen={isMobile}
        >
            <DialogContent>
                <EventForm
                    onClose={onClose}
                    onEventCreated={onEventCreated}
                    open={open}
                />
            </DialogContent>
        </Dialog>
    );
};

export default EventDialog;
