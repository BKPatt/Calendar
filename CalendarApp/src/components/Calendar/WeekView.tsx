import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { eachDayOfInterval, startOfWeek, endOfWeek, format, isWithinInterval, isSameDay } from 'date-fns';
import { Events } from '../../types/event';

interface WeekViewProps {
    currentDate: Date;
    events: Events[];
    maxHeight?: string;
    onSelect: (date: Date) => void;
}

const WeekView: React.FC<WeekViewProps> = ({ currentDate, events, maxHeight = '600px', onSelect }) => {
    const days = eachDayOfInterval({
        start: startOfWeek(currentDate),
        end: endOfWeek(currentDate),
    });

    const getEventsForDay = (day: Date) => {
        return events.filter(event => {
            const startTime = new Date(event.start_time);
            const endTime = new Date(event.end_time);
            return isWithinInterval(day, { start: startTime, end: endTime }) || isSameDay(day, startTime);
        });
    };

    return (
        <Box sx={{ height: maxHeight, overflowY: 'auto' }}>
            <Typography variant="h6" gutterBottom>
                Week of {format(days[0], 'MMMM d')} - {format(days[6], 'MMMM d, yyyy')}
            </Typography>
            {days.map((day, index) => (
                <Box
                    key={index}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        borderBottom: '1px solid lightgray',
                        height: 60,
                        position: 'relative',
                    }}
                >
                    <Typography
                        sx={{
                            width: 60,
                            textAlign: 'right',
                            paddingRight: 2,
                            color: 'gray',
                            fontWeight: 'bold',
                        }}
                    >
                        {format(day, 'EEE d')}
                    </Typography>

                    <Box
                        sx={{
                            flex: 1,
                            position: 'relative',
                            display: 'flex',
                            overflowX: 'auto',
                        }}
                    >
                        {getEventsForDay(day).map((event, eventIndex) => {
                            const startTime = new Date(event.start_time);
                            const endTime = new Date(event.end_time);
                            const eventDurationInHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
                            const eventTopOffset = startTime.getMinutes();
                            const eventHeight = eventDurationInHours * 60 - eventTopOffset;

                            return (
                                <Paper
                                    key={eventIndex}
                                    sx={{
                                        position: 'relative',
                                        width: '150px',
                                        marginLeft: 1,
                                        height: `${eventHeight}px`,
                                        top: `${eventTopOffset}px`,
                                        backgroundColor: event.color || 'blue',
                                        color: 'white',
                                        padding: 1,
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    <Typography variant="caption" noWrap>
                                        {event.title} ({format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')})
                                    </Typography>
                                </Paper>
                            );
                        })}
                    </Box>
                </Box>
            ))}
        </Box>
    );
};

export default WeekView;
