import React from 'react';
import { Box, Typography } from '@mui/material';
import { format, isSameDay, setMinutes, setHours, differenceInMinutes, startOfDay } from 'date-fns';
import { Events } from '../../types/event';

interface DayViewProps {
    date: Date;
    events: Events[];
    maxHeight?: string;
}

const DayView: React.FC<DayViewProps> = ({ date, events, maxHeight = '600px' }) => {
    const startHour = 0;
    const endHour = 24;

    const renderHourRows = () => {
        const rows: JSX.Element[] = [];

        for (let hour = startHour; hour < endHour; hour++) {
            const rowStart = setHours(date, hour);
            const rowEnd = setHours(date, hour + 1);

            const hourEvents = events.filter((event) => {
                const eventStartTime = new Date(event.start_time);
                const eventEndTime = new Date(event.end_time);

                // Adjust event end time to be within the same day
                const adjustedEventEndTime = setHours(setMinutes(eventStartTime, eventEndTime.getMinutes()), eventEndTime.getHours());

                return (
                    isSameDay(date, eventStartTime) &&
                    (
                        (eventStartTime >= rowStart && eventStartTime < rowEnd) ||
                        (adjustedEventEndTime > rowStart && adjustedEventEndTime <= rowEnd) ||
                        (eventStartTime <= rowStart && adjustedEventEndTime >= rowEnd)
                    )
                );
            });

            const eventBlocks: JSX.Element[] = hourEvents.map((event) => {
                const eventStartTime = new Date(event.start_time);
                const eventEndTime = new Date(event.end_time);

                // Adjust event end time to be within the same day
                const adjustedEventEndTime = setHours(setMinutes(eventStartTime, eventEndTime.getMinutes()), eventEndTime.getHours());

                const eventStartMinute = differenceInMinutes(eventStartTime, startOfDay(date));
                const eventEndMinute = differenceInMinutes(adjustedEventEndTime, startOfDay(date));

                const startPosition = (eventStartMinute / (24 * 60)) * 100;
                const endPosition = (eventEndMinute / (24 * 60)) * 100;
                const widthPercentage = endPosition - startPosition;

                return (
                    <Box
                        key={event.id}
                        position="absolute"
                        left={`calc(${startPosition}% + 60px)`}
                        width={`${widthPercentage}%`}
                        bgcolor={event.color}
                        color="white"
                        p={1}
                        zIndex={1}
                    >
                        <Typography variant="body2">{event.title}</Typography>
                    </Box>
                );
            });

            rows.push(
                <Box key={hour} position="relative" height={60} display="flex" alignItems="center">
                    <Box width={60} flexShrink={0} textAlign="right" pr={1}>
                        <Typography variant="body2">{format(rowStart, 'h a')}</Typography>
                    </Box>
                    <Box flex={1} borderTop="1px solid #eee" position="relative">
                        {eventBlocks}
                    </Box>
                </Box>
            );
        }

        return rows;
    };

    return (
        <Box maxHeight={maxHeight} overflow="auto">
            <Typography variant="h6" align="center" mb={2}>
                {format(date, 'EEEE, MMMM d, yyyy')}
            </Typography>
            {renderHourRows()}
        </Box>
    );
};

export default DayView;