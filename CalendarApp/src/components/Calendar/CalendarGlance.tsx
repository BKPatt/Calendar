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
    isSameDay,
} from 'date-fns';
import { Clock, MapPin, CalendarClock } from 'lucide-react';
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

const HOUR_HEIGHT = 50;
const TIME_COLUMN_WIDTH = 60;
const EVENT_SPACING = 10;
const DAY_HEADER_HEIGHT = 28;
const MIN_EVENT_DURATION = 15;
const EVENT_WIDTH = 200;
const CURRENT_TIME_HEIGHT = 2;

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
            .sort((a, b) => {
                const aStart = parseISO(a.start_time);
                const aEnd = parseISO(a.end_time);
                const bStart = parseISO(b.start_time);
                const bEnd = parseISO(b.end_time);

                const aDuration = differenceInMinutes(aEnd, aStart);
                const bDuration = differenceInMinutes(bEnd, bStart);

                if (bDuration !== aDuration) {
                    return bDuration - aDuration;
                }

                return aStart.getTime() - bStart.getTime();
            });

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

            const totalColumns = columns.length + 1;
            const processedEvent: ProcessedEvent = {
                ...event,
                calculatedTop: (minutes / 60) * HOUR_HEIGHT,
                calculatedHeight: (duration / 60) * HOUR_HEIGHT - EVENT_SPACING,
                calculatedLeft: columnIndex * (100 / totalColumns) + EVENT_SPACING,
                calculatedWidth: (100 / totalColumns) - EVENT_SPACING * 2,
            };

            columns[columnIndex].push(processedEvent);
        });

        return columns.flat();
    };

    const renderEventBlock = (event: ProcessedEvent, showTime: boolean = true) => {
        const eventStart = parseISO(event.start_time);
        const eventEnd = parseISO(event.end_time);
        const isMultiDay = !isSameDay(eventStart, eventEnd);

        return (
            <Tooltip
                key={`${event.id}-${event.start_time}`}
                title={
                    <Box className="p-2">
                        <Typography className="font-semibold mb-1">{event.title}</Typography>
                        <div className="flex items-center gap-2 text-xs">
                            <Clock className="w-3 h-3" />
                            <span>
                                {format(eventStart, 'h:mm a')} - {format(eventEnd, 'h:mm a')}
                                {isMultiDay && ' (Continues)'}
                            </span>
                        </div>
                        {event.location && (
                            <div className="flex items-center gap-2 text-xs mt-1">
                                <MapPin className="w-3 h-3" />
                                <span>{event.location}</span>
                            </div>
                        )}
                    </Box>
                }
            >
                <Box
                    className="absolute rounded-lg shadow-sm transition-all duration-200 
                        hover:shadow-md hover:translate-y-[-1px] cursor-pointer overflow-hidden"
                    style={{
                        left: `${event.calculatedLeft}%`,
                        width: `${event.calculatedWidth}%`,
                        top: event.calculatedTop,
                        height: event.calculatedHeight,
                    }}
                >
                    <Box
                        className="h-full flex gap-2 p-2"
                        style={{
                            backgroundColor: event.color ? `${event.color}15` : 'rgb(var(--primary-50))',
                        }}
                    >
                        <div
                            className="w-1 h-full rounded-full flex-shrink-0"
                            style={{ backgroundColor: event.color || 'rgb(var(--primary))' }}
                        />

                        <Box className="flex-1 min-w-0 flex flex-col gap-1">
                            <Typography
                                className="font-medium text-sm line-clamp-1"
                                style={{ color: event.color || 'rgb(var(--foreground))' }}
                            >
                                {event.title}
                            </Typography>

                            {showTime && event.calculatedHeight >= 40 && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    <Typography className="text-xs truncate">
                                        {format(eventStart, 'h:mm a')}
                                    </Typography>
                                </div>
                            )}

                            {event.location && event.calculatedHeight >= 60 && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <MapPin className="w-3 h-3" />
                                    <Typography className="text-xs truncate">
                                        {event.location}
                                    </Typography>
                                </div>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Tooltip>
        );
    };

    const renderTimeGrid = () => (
        <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: TIME_COLUMN_WIDTH,
            borderRight: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            zIndex: 2,
            boxShadow: theme.shadows[1]
        }}>
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
                        padding: '2px 6px',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            color: hour === new Date().getHours()
                                ? 'primary.main'
                                : 'text.secondary'
                        }}
                    >
                        {format(new Date().setHours(hour, 0), 'h a')}
                    </Typography>
                </Box>
            ))}
        </Box>
    );

    const eventColumns = useMemo(() => {
        if (viewType !== 'day') return [];
        const processedEvents = processEventsForDay(currentDate);

        const columns: ProcessedEvent[][] = [];
        processedEvents.forEach(event => {
            let columnIndex = 0;
            let foundSlot = false;

            while (!foundSlot) {
                if (!columns[columnIndex]) {
                    columns[columnIndex] = [];
                    foundSlot = true;
                } else {
                    const conflicting = columns[columnIndex].some(existingEvent => {
                        const eventStart = parseISO(event.start_time);
                        const eventEnd = parseISO(event.end_time);
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

            columns[columnIndex] = [...(columns[columnIndex] || []), event];
        });

        return columns;
    }, [currentDate, events, viewType]);

    const renderDayView = () => {
        const processedEvents = processEventsForDay(currentDate);
        const currentHour = new Date().getHours();

        const contentWidth = Math.max(
            600, // Minimum width
            TIME_COLUMN_WIDTH + (eventColumns.length * EVENT_WIDTH)
        );

        return (
            <Box sx={{ height: 24 * HOUR_HEIGHT + DAY_HEADER_HEIGHT, position: 'relative' }}>
                <Box sx={{
                    height: DAY_HEADER_HEIGHT,
                    borderBottom: 1,
                    borderColor: 'divider',
                    px: 2,
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: 'background.paper',
                    position: 'sticky',
                    top: 0,
                    zIndex: 4,
                    width: '100%'
                }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {format(currentDate, 'EEEE, MMMM d')}
                    </Typography>
                </Box>

                <Box sx={{
                    position: 'relative',
                    height: 24 * HOUR_HEIGHT,
                    overflowX: 'auto',
                    overflowY: 'hidden'
                }}>
                    <Box sx={{
                        position: 'relative',
                        width: contentWidth,
                        height: '100%'
                    }}>
                        {/* Grid lines */}
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
                                    zIndex: 0
                                }}
                            />
                        ))}

                        {/* Events */}
                        {eventColumns.map((column, columnIndex) => (
                            <Box
                                key={columnIndex}
                                sx={{
                                    position: 'absolute',
                                    left: TIME_COLUMN_WIDTH + (columnIndex * EVENT_WIDTH),
                                    width: EVENT_WIDTH,
                                    height: '100%',
                                    zIndex: 1
                                }}
                            >
                                {column.map(event => (
                                    <Tooltip
                                        key={`${event.id}-${event.start_time}`}
                                        title={`${event.title}\n${format(parseISO(event.start_time), 'h:mm a')} - ${format(parseISO(event.end_time), 'h:mm a')}`}
                                    >
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                width: EVENT_WIDTH - 8,
                                                top: (parseISO(event.start_time).getHours() * 60 + parseISO(event.start_time).getMinutes()) / 60 * HOUR_HEIGHT,
                                                height: event.calculatedHeight,
                                                backgroundColor: theme.palette.background.paper,
                                                borderRadius: 1,
                                                padding: '4px',
                                                overflow: 'hidden',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                gap: 1,
                                                border: `1px solid ${theme.palette.divider}`,
                                                boxShadow: theme.shadows[1],
                                                '&:hover': {
                                                    boxShadow: theme.shadows[2],
                                                    backgroundColor: theme.palette.action.hover,
                                                },
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: '4px',
                                                    height: '100%',
                                                    backgroundColor: event.color || theme.palette.primary.main,
                                                    borderRadius: '2px',
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <Box sx={{
                                                flex: 1,
                                                overflow: 'hidden',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 0.5,
                                            }}>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        fontWeight: 500,
                                                        color: theme.palette.text.primary,
                                                        lineHeight: 1,
                                                    }}
                                                    noWrap
                                                >
                                                    {event.title}
                                                </Typography>
                                                {event.calculatedHeight >= 40 && (
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            color: theme.palette.text.secondary,
                                                            lineHeight: 1,
                                                        }}
                                                        noWrap
                                                    >
                                                        {format(parseISO(event.start_time), 'h:mm a')} -
                                                        {format(parseISO(event.end_time), 'h:mm a')}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </Tooltip>
                                ))}
                            </Box>
                        ))}

                        {renderTimeGrid()}
                        {renderCurrentTimeLine()}
                    </Box>
                </Box>
            </Box>
        );
    };

    const renderCurrentTimeLine = () => {
        const now = new Date();
        const minutes = now.getHours() * 60 + now.getMinutes();
        const top = (minutes / 60) * HOUR_HEIGHT;

        return (
            <Box
                sx={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: top - CURRENT_TIME_HEIGHT / 2,
                    zIndex: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                }}
            >
                <Box
                    sx={{
                        width: TIME_COLUMN_WIDTH - 8,
                        height: CURRENT_TIME_HEIGHT,
                        bgcolor: 'primary.main',
                        ml: 1,
                    }}
                />
                <Box
                    sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        transform: 'translateX(-50%)',
                    }}
                />
                <Box
                    sx={{
                        flex: 1,
                        height: CURRENT_TIME_HEIGHT,
                        bgcolor: 'primary.main',
                    }}
                />
            </Box>
        );
    };

    const renderTimelineDay = (date: Date, processedEvents: ProcessedEvent[]) => {
        const sortedEvents = processedEvents.sort((a, b) => {
            const aStart = parseISO(a.start_time);
            const aEnd = parseISO(a.end_time);
            const bStart = parseISO(b.start_time);
            const bEnd = parseISO(b.end_time);

            const aMultiDay = !isSameDay(aStart, aEnd);
            const bMultiDay = !isSameDay(bStart, bEnd);

            if (aMultiDay !== bMultiDay) return aMultiDay ? 1 : -1;
            return aStart.getTime() - bStart.getTime();
        });

        return (
            <Box className="mb-1">
                <Box className="flex border-b border-border p-3">
                    <Typography className="w-[60px] font-medium text-sm">
                        {format(date, 'EEE')}
                        <span className="block text-xs text-muted-foreground">
                            {format(date, 'MMM d')}
                        </span>
                    </Typography>

                    <Box className="flex-1 flex flex-col gap-1 min-h-[32px]">
                        {sortedEvents.map((event) => {
                            const eventStart = parseISO(event.start_time);
                            const eventEnd = parseISO(event.end_time);
                            const isMultiDay = !isSameDay(eventStart, eventEnd);

                            return (
                                <Tooltip
                                    key={`${event.id}-${event.start_time}`}
                                    title={
                                        <Box className="p-2">
                                            <Typography className="font-semibold mb-1">
                                                {event.title}
                                            </Typography>
                                            <div className="flex items-center gap-2 text-xs">
                                                <Clock className="w-3 h-3" />
                                                <span>
                                                    {format(eventStart, 'h:mm a')} - {format(eventEnd, 'h:mm a')}
                                                </span>
                                            </div>
                                        </Box>
                                    }
                                >
                                    <Box
                                        className="rounded px-2 py-1 cursor-pointer transition-colors 
                                 hover:opacity-90 flex items-center gap-1"
                                        style={{
                                            backgroundColor: event.color || 'rgb(var(--primary))',
                                            color: 'white',
                                            height: isMultiDay ? '40px' : '24px',
                                        }}
                                    >
                                        {isMultiDay && <CalendarClock className="w-3 h-3" />}
                                        <Typography className="text-xs font-medium truncate">
                                            {event.title}
                                        </Typography>
                                    </Box>
                                </Tooltip>
                            );
                        })}
                    </Box>
                </Box>
            </Box>
        );
    };

    const renderWeekView = (currentDate: Date, processedEvents: ProcessedEvent[]) => {
        const weekStart = startOfWeek(currentDate);
        const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

        return (
            <Box className="space-y-1">
                {weekDays.map(day => renderTimelineDay(day, processEventsForDay(day)))}
            </Box>
        );
    };

    const renderMonthView = (currentDate: Date, processedEvents: ProcessedEvent[]) => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

        return (
            <Box className="space-y-1">
                {monthDays.map(day => renderTimelineDay(day, processEventsForDay(day)))}
            </Box>
        );
    };

    return (
        <Box>
            <Paper sx={{ p: 1, mb: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Calendar</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                        <ToggleButtonGroup value={viewType} exclusive onChange={handleViewChange} size="small">
                            <ToggleButton value="day"><ViewDay /></ToggleButton>
                            <ToggleButton value="week"><ViewWeek /></ToggleButton>
                            <ToggleButton value="month"><ViewModule /></ToggleButton>
                        </ToggleButtonGroup>
                        <Box display="flex" alignItems="center">
                            <IconButton onClick={handlePrevious} size="small"><ChevronLeft /></IconButton>
                            <Typography variant="body2" sx={{ px: 1 }}>
                                {format(currentDate, viewType === 'month' ? 'MMM yyyy' : 'MMM d, yyyy')}
                            </Typography>
                            <IconButton onClick={handleNext} size="small"><ChevronRight /></IconButton>
                        </Box>
                    </Box>
                </Box>
            </Paper>

            <Paper sx={{ overflow: 'auto', maxHeight: 'calc(100vh - 160px)' }}>
                <Box sx={{ p: 1 }}>
                    {viewType === 'day' && renderDayView()}
                    {viewType === 'week' && renderWeekView(currentDate, processEventsForDay(currentDate))}
                    {viewType === 'month' && renderMonthView(currentDate, processEventsForDay(currentDate))}
                </Box>
            </Paper>
        </Box>
    );
};

export default CalendarGlance;
