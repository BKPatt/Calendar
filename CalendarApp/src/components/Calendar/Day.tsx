import React from 'react';
import { Typography, Box } from '@mui/material';
import { styled } from '@mui/system';
import { format } from 'date-fns';
import { Events } from '../../types/event';

interface DayProps {
    date: Date;
    events: Events[];
    isToday: boolean;
    isSelected: boolean;
    isCurrentMonth: boolean;
    onSelect: (date: Date) => void;
}

const DayContainer = styled(Box)<{
    isToday: boolean;
    isSelected: boolean;
    isCurrentMonth: boolean;
}>(({ theme, isToday, isSelected, isCurrentMonth }) => ({
    width: '100%',
    aspectRatio: '1 / 1',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    cursor: 'pointer',
    backgroundColor: isSelected
        ? theme.palette.primary.main
        : isToday
            ? theme.palette.primary.light
            : theme.palette.background.paper,
    opacity: isCurrentMonth ? 1 : 0.5,
    '&:hover': {
        backgroundColor: isSelected
            ? theme.palette.primary.dark
            : theme.palette.action.hover,
    },
}));

const DateNumber = styled(Typography)<{ isSelected: boolean }>(
    ({ theme, isSelected }) => ({
        fontWeight: 'bold',
        color: isSelected ? theme.palette.primary.contrastText : 'inherit',
    })
);

const EventDot = styled(Box)(({ theme }) => ({
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: theme.palette.secondary.main,
    marginRight: 4,
}));

const EventsContainer = styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    marginTop: 4,
    overflow: 'hidden',
});

const Day: React.FC<DayProps> = ({
    date,
    events,
    isToday,
    isSelected,
    isCurrentMonth,
    onSelect
}) => {
    const handleClick = () => {
        onSelect(date);
    };

    return (
        <DayContainer
            isToday={isToday}
            isSelected={isSelected}
            isCurrentMonth={isCurrentMonth}
            onClick={handleClick}
        >
            <DateNumber variant="body2" isSelected={isSelected}>
                {format(date, 'd')}
            </DateNumber>
            <EventsContainer>
                {events.slice(0, 3).map((event, index) => (
                    <Box key={index} display="flex" alignItems="center">
                        <EventDot />
                        <Typography variant="caption" noWrap>
                            {event.title}
                        </Typography>
                    </Box>
                ))}
                {events.length > 3 && (
                    <Typography variant="caption">{`+${events.length - 3} more`}</Typography>
                )}
            </EventsContainer>
        </DayContainer>
    );
};

export default Day;