import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    IconButton,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Paper,
    useTheme,
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    ViewDay,
    ViewWeek,
    ViewModule,
} from '@mui/icons-material';
import {
    addDays,
    subDays,
    addWeeks,
    subWeeks,
    addMonths,
    subMonths,
    format,
    parseISO,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    startOfWeek,
    endOfWeek,
    isWithinInterval,
    endOfDay,
    startOfDay,
    differenceInMinutes,
} from 'date-fns';
import { Events } from '../../types/event';

type ViewType = 'day' | 'week' | 'month';

interface CalendarGlanceProps {
    events: Events[];
}

interface ProcessedEvent extends Events {
    calculatedTop: number;
    calculatedHeight: number;
    calculatedLeft: number;
    calculatedWidth: number;
}

const HOUR_HEIGHT = 60;
const TIME_COLUMN_WIDTH = 80;
const EVENT_SPACING = 4;
const DAY_HEADER_HEIGHT = 32;
const MIN_EVENT_DURATION = 15;

const CalendarGlance: React.FC<CalendarGlanceProps> = ({ events }) => {
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [viewType, setViewType] = useState<ViewType>('week');
    const theme = useTheme();

    const handleViewChange = (event: React.MouseEvent<HTMLElement>, newView: ViewType | null) => {
        if (newView !== null) setViewType(newView);
    };

    const handlePrevious = () => {
        setCurrentDate(date => {
            switch (viewType) {
                case 'day': return subDays(date, 1);
                case 'week': return subWeeks(date, 1);
                case 'month': return subMonths(date, 1);
            }
        });
    };

    const handleNext = () => {
        setCurrentDate(date => {
            switch (viewType) {
                case 'day': return addDays(date, 1);
                case 'week': return addWeeks(date, 1);
                case 'month': return addMonths(date, 1);
            }
        });
    };

    const processEventsForDay = (date: Date) => {
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        const relevantEvents = events
            .filter(event => {
                let eventStart = parseISO(event.start_time);
                let eventEnd = parseISO(event.end_time);

                if (event.recurring && !event.recurrenceend_date) {
                    const adjustedStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), eventStart.getHours(), eventStart.getMinutes());
                    const adjustedEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), eventEnd.getHours(), eventEnd.getMinutes());
                    if (adjustedEnd < adjustedStart) adjustedEnd.setHours(adjustedEnd.getHours() + 24);
                    return true;
                }

                return (
                    (eventStart >= dayStart && eventStart <= dayEnd) ||
                    (eventEnd >= dayStart && eventEnd <= dayEnd) ||
                    (eventStart <= dayStart && eventEnd >= dayEnd)
                );
            })
            .map(event => {
                let eventStart = parseISO(event.start_time);
                let eventEnd = parseISO(event.end_time);

                if (event.recurring && !event.recurrenceend_date) {
                    eventStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), eventStart.getHours(), eventStart.getMinutes());
                    eventEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), eventEnd.getHours(), eventEnd.getMinutes());

                    if (eventEnd < eventStart) eventEnd.setHours(eventEnd.getHours() + 24);
                } else {
                    if (eventStart < dayStart) eventStart = dayStart;
                    if (eventEnd > dayEnd) eventEnd = dayEnd;
                }

                return {
                    ...event,
                    start_time: eventStart.toISOString(),
                    end_time: eventEnd.toISOString(),
                };
            })
            .filter((event, index, self) =>
                index === self.findIndex(e =>
                    e.id === event.id &&
                    ((!e.recurring && !event.recurring) ||
                        (e.recurring && event.recurring &&
                            e.start_time === event.start_time))
                )
            )
            .sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime());

        const columns: ProcessedEvent[][] = [];

        relevantEvents.forEach(event => {
            const eventStart = parseISO(event.start_time);
            const eventEnd = parseISO(event.end_time);
            const minutes = eventStart.getHours() * 60 + eventStart.getMinutes();
            let duration = differenceInMinutes(eventEnd, eventStart);

            if (duration < MIN_EVENT_DURATION) {
                duration = MIN_EVENT_DURATION;
            }

            let columnIndex = 0;
            let foundSlot = false;

            while (!foundSlot) {
                if (!columns[columnIndex]) {
                    columns[columnIndex] = [];
                    foundSlot = true;
                } else {
                    const conflicting = columns[columnIndex].some(existingEvent => {
                        const existingStart = parseISO(existingEvent.start_time);
                        const existingEnd = parseISO(existingEvent.end_time);
                        return !(eventEnd <= existingStart || eventStart >= existingEnd);
                    });

                    if (!conflicting) {
                        foundSlot = true;
                    } else {
                        columnIndex++;
                    }
                }
            }

            const processedEvent: ProcessedEvent = {
                ...event,
                calculatedTop: (minutes / 60) * HOUR_HEIGHT,
                calculatedHeight: (duration / 60) * HOUR_HEIGHT,
                calculatedLeft: columnIndex * (100 / (columns.length + 1)),
                calculatedWidth: 100 / (columns.length + 1),
            };

            columns[columnIndex].push(processedEvent);
        });

        return columns.flat();
    };

    const renderEventBlock = (event: ProcessedEvent, showTime: boolean = true) => (
        <Tooltip
            key={`${event.id}-${event.start_time}`}
            title={`${event.title}: ${format(parseISO(event.start_time), 'h:mm a')} - ${format(parseISO(event.end_time), 'h:mm a')}`}
        >
            <Box
                sx={{
                    position: 'absolute',
                    left: `${event.calculatedLeft}%`,
                    width: `${event.calculatedWidth}%`,
                    top: event.calculatedTop,
                    height: event.calculatedHeight,
                    backgroundColor: event.color || theme.palette.primary.main,
                    color: theme.palette.getContrastText(event.color || theme.palette.primary.main),
                    borderRadius: 1,
                    padding: 1,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    zIndex: 1,
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                        filter: 'brightness(0.9)',
                    },
                }}
            >
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                    {event.title}
                </Typography>
                {showTime && (
                    <Typography variant="caption">
                        {format(parseISO(event.start_time), 'h:mm a')} - {format(parseISO(event.end_time), 'h:mm a')}
                    </Typography>
                )}
            </Box>
        </Tooltip>
    );

    const renderTimeGrid = () => (
        <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: TIME_COLUMN_WIDTH, borderRight: 1, borderColor: 'divider', bgcolor: 'background.paper', zIndex: 2 }}>
            {Array.from({ length: 24 }, (_, hour) => (
                <Box
                    key={hour}
                    sx={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: hour * HOUR_HEIGHT,
                        height: HOUR_HEIGHT,
                        borderTop: 1,
                        borderColor: 'divider',
                        padding: '4px 8px',
                    }}
                >
                    <Typography variant="caption">
                        {format(new Date().setHours(hour, 0), 'h a')}
                    </Typography>
                </Box>
            ))}
        </Box>
    );

    const renderDayView = () => {
        const processedEvents = processEventsForDay(currentDate);

        return (
            <Box sx={{ height: 24 * HOUR_HEIGHT + DAY_HEADER_HEIGHT, position: 'relative' }}>
                <Box sx={{ height: DAY_HEADER_HEIGHT, borderBottom: 1, borderColor: 'divider', px: 2 }}>
                    <Typography variant="subtitle1">
                        {format(currentDate, 'EEEE, MMMM d')}
                    </Typography>
                </Box>
                <Box sx={{ position: 'relative', height: 24 * HOUR_HEIGHT }}>
                    {renderTimeGrid()}
                    <Box sx={{ ml: `${TIME_COLUMN_WIDTH}px`, height: '100%', position: 'relative' }}>
                        {Array.from({ length: 24 }, (_, hour) => (
                            <Box
                                key={hour}
                                sx={{
                                    position: 'absolute',
                                    left: 0,
                                    right: 0,
                                    top: hour * HOUR_HEIGHT,
                                    height: HOUR_HEIGHT,
                                    borderTop: 1,
                                    borderColor: 'divider',
                                    bgcolor: hour % 2 === 0 ? 'background.default' : 'background.paper',
                                }}
                            />
                        ))}
                        {processedEvents.map(event => renderEventBlock(event))}
                    </Box>
                </Box>
            </Box>
        );
    };

    const renderTimelineDay = (date: Date) => {
        const processedEvents = processEventsForDay(date);
        const dayStart = startOfDay(date);

        return (
            <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider', p: 1 }}>
                    <Typography variant="subtitle1" sx={{ width: TIME_COLUMN_WIDTH }}>
                        {format(date, 'EEE, MMM d')}
                    </Typography>
                    <Box sx={{ flex: 1, position: 'relative', minHeight: processedEvents.length > 0 ? 80 : 40 }}>
                        {processedEvents.map(event => (
                            <Tooltip
                                key={`${event.id}-${event.start_time}`}
                                title={`${event.title}: ${format(parseISO(event.start_time), 'h:mm a')} - ${format(parseISO(event.end_time), 'h:mm a')}`}
                            >
                                <Box
                                    sx={{
                                        margin: '4px',
                                        padding: '8px',
                                        backgroundColor: event.color || theme.palette.primary.main,
                                        color: theme.palette.getContrastText(event.color || theme.palette.primary.main),
                                        borderRadius: 1,
                                        flex: 1,
                                        cursor: 'pointer',
                                        '&:hover': {
                                            filter: 'brightness(0.9)',
                                        },
                                    }}
                                >
                                    <Typography variant="body2">
                                        {format(parseISO(event.start_time), 'h:mm a')} - {event.title}
                                    </Typography>
                                </Box>
                            </Tooltip>
                        ))}
                    </Box>
                </Box>
            </Box>
        );
    };

    const renderWeekView = () => {
        const weekStart = startOfWeek(currentDate);
        const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

        return (
            <Box>
                {weekDays.map(day => renderTimelineDay(day))}
            </Box>
        );
    };

    const renderMonthView = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

        return (
            <Box>
                {monthDays.map(day => renderTimelineDay(day))}
            </Box>
        );
    };

    return (
        <Box>
            <Paper sx={{ p: 2, mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Calendar at a Glance</Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                        <ToggleButtonGroup value={viewType} exclusive onChange={handleViewChange} size="small">
                            <ToggleButton value="day"><ViewDay /></ToggleButton>
                            <ToggleButton value="week"><ViewWeek /></ToggleButton>
                            <ToggleButton value="month"><ViewModule /></ToggleButton>
                        </ToggleButtonGroup>
                        <Box display="flex" alignItems="center">
                            <IconButton onClick={handlePrevious}><ChevronLeft /></IconButton>
                            <Typography variant="subtitle1" sx={{ px: 2 }}>
                                {format(currentDate, viewType === 'month' ? 'MMMM yyyy' : 'MMM d, yyyy')}
                            </Typography>
                            <IconButton onClick={handleNext}><ChevronRight /></IconButton>
                        </Box>
                    </Box>
                </Box>
            </Paper>

            <Paper sx={{ overflow: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
                <Box sx={{ p: 2 }}>
                    {viewType === 'day' && renderDayView()}
                    {viewType === 'week' && renderWeekView()}
                    {viewType === 'month' && renderMonthView()}
                </Box>
            </Paper>
        </Box>
    );
};

export default CalendarGlance;
