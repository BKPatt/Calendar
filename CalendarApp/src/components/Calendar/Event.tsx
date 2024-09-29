import React from 'react';
import { Typography, Box, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { AccessTime, Room } from '@mui/icons-material';
import { format } from 'date-fns';
import { Events } from '../../types/event';

interface EventProps {
    event: Events;
    onClick?: (event: Events) => void;
}

const EventContainer = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    boxShadow: theme.shadows[1],
    '&:hover': {
        boxShadow: theme.shadows[3],
    },
}));

const EventHeader = styled(Box)({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
});

const EventDetails = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    marginTop: theme.spacing(1),
    '& > *': {
        marginRight: theme.spacing(2),
    },
}));

const Event: React.FC<EventProps> = ({ event, onClick }) => {
    const handleClick = () => {
        if (onClick) {
            onClick(event);
        }
    };

    return (
        <EventContainer onClick={handleClick}>
            <EventHeader>
                <Typography variant="h6">{event.title}</Typography>
                <Chip
                    label={event.eventType}
                    color={event.eventType === 'meeting' ? 'primary' : 'secondary'}
                    size="small"
                />
            </EventHeader>
            <Typography variant="body2" color="text.secondary">
                {event.description}
            </Typography>
            <EventDetails>
                <Box display="flex" alignItems="center">
                    <AccessTime fontSize="small" color="action" />
                    <Typography variant="body2" ml={1}>
                        {format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
                    </Typography>
                </Box>
                {event.location && (
                    <Box display="flex" alignItems="center">
                        <Room fontSize="small" color="action" />
                        <Typography variant="body2" ml={1}>
                            {event.location}
                        </Typography>
                    </Box>
                )}
            </EventDetails>
        </EventContainer>
    );
};

export default Event;
