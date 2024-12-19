import React, { useState, useMemo, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    useTheme
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
    differenceInMinutes,
    parseISO
} from 'date-fns';
import { Events } from '../../types/event';
import CalendarHeader from './CalendarHeader';
import DayView from './DayView';
import WeekView from './WeekView';
import MonthView from './MonthView';

type ViewType = 'day' | 'week' | 'month';

interface CalendarGlanceProps {
    events: Events[];
    height?: number | string;
}

interface ProcessedEvent extends Events {
    calculatedTop: number;
    calculatedHeight: number;
    calculatedLeft: number;
    calculatedWidth: number;
    displayStartTime: string;
    displayEndTime: string;
}

const HOUR_HEIGHT = 50;
const TIME_COLUMN_WIDTH = 60;
const EVENT_SPACING = 10;
const DAY_HEADER_HEIGHT = 28;
const MIN_EVENT_DURATION = 15;
const EVENT_WIDTH = 200;

const CalendarGlance: React.FC<CalendarGlanceProps> = ({ events, height }) => {
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [viewType, setViewType] = useState<ViewType>('week');
    const theme = useTheme();

    useEffect(() => {
        console.log(events);
    }, [events]);

    const handleViewChange = (newView: ViewType) => {
        setViewType(newView);
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

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const getTooltipTimeDisplay = (startTime: Date, endTime: Date, isRecurring: boolean = false, isAllDay = false) => {
        if (isAllDay) {
            return 'All Day';
        }

        if (isRecurring) {
            return `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')} (Recurring)`;
        }

        const isMultiDay = format(startTime, 'yyyy-MM-dd') !== format(endTime, 'yyyy-MM-dd');
        if (isMultiDay) {
            return `${format(startTime, 'MMM d, h:mm a')} - ${format(endTime, 'MMM d, h:mm a')}`;
        }
        return `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;
    };

    const isDateInRecurringRule = (date: Date, event: Events) => {
        const recurring = event.recurring || event.is_recurring;
        if (!recurring) return false;
        if (!event.recurrence_rule) {
            return true;
        }

        const { frequency, days_of_week, day_of_month, month_of_year } = event.recurrence_rule;
        if (!frequency) {
            return true;
        }

        if (event.recurrence_end_date) {
            const recurrenceEnd = parseISO(event.recurrence_end_date);
            if (date > recurrenceEnd) return false;
        }

        const checkDay = date.getDay();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDayName = dayNames[checkDay];

        switch (frequency) {
            case 'DAILY':
                return true;
            case 'WEEKLY':
                if (!days_of_week || days_of_week.length === 0) return true;
                return days_of_week.includes(currentDayName);
            case 'MONTHLY':
                if (!day_of_month) return true;
                return date.getDate() === day_of_month;
            case 'YEARLY':
                if (!day_of_month || !month_of_year) return true;
                return (date.getMonth() + 1 === month_of_year) && (date.getDate() === day_of_month);
            default:
                return true;
        }
    };

    const isSameDayUTC = (date1: Date, date2: Date) => {
        return (
            date1.getUTCFullYear() === date2.getUTCFullYear() &&
            date1.getUTCMonth() === date2.getUTCMonth() &&
            date1.getUTCDate() === date2.getUTCDate()
        );
    };

    const parseEventTimes = (event: Events, date: Date): { eventStart: Date; eventEnd: Date; displayStart: Date; displayEnd: Date } => {
        const recurring = event.recurring || event.is_recurring;
        const originalStart = parseISO(event.start_time);
        const originalEnd = parseISO(event.end_time);

        if (event.is_all_day) {
            const eventStart = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0));
            const eventEnd = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59));
            return {
                eventStart,
                eventEnd,
                displayStart: eventStart,
                displayEnd: eventEnd
            };
        }

        if (recurring) {
            const eventStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(),
                originalStart.getHours(), originalStart.getMinutes(), originalStart.getSeconds());
            const eventEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(),
                originalEnd.getHours(), originalEnd.getMinutes(), originalEnd.getSeconds());

            return {
                eventStart,
                eventEnd,
                displayStart: eventStart,
                displayEnd: eventEnd
            };
        } else {
            return { eventStart: originalStart, eventEnd: originalEnd, displayStart: originalStart, displayEnd: originalEnd };
        }
    };

    const processEventsForDay = (date: Date): ProcessedEvent[] => {
        const dayStart = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0));
        const dayEnd = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59));

        const relevantEvents = events
            .filter(event => {
                const { eventStart, eventEnd } = parseEventTimes(event, date);
                const recurring = event.recurring || event.is_recurring;

                if (recurring) {
                    if (!isDateInRecurringRule(date, event)) return false;
                    return (
                        (eventStart >= dayStart && eventStart <= dayEnd) ||
                        (eventEnd >= dayStart && eventEnd <= dayEnd) ||
                        (eventStart <= dayStart && eventEnd >= dayEnd)
                    );
                } else {
                    if (event.is_all_day) {
                        const originalStart = parseISO(event.start_time);
                        return isSameDayUTC(originalStart, date);
                    } else {
                        const originalStart = parseISO(event.start_time);
                        return isSameDayUTC(originalStart, date);
                    }
                }
            })
            .map(event => {
                const { eventStart, eventEnd, displayStart, displayEnd } = parseEventTimes(event, date);

                let renderStart = eventStart < dayStart ? dayStart : eventStart;
                let renderEnd = eventEnd > dayEnd ? dayEnd : eventEnd;

                return {
                    ...event,
                    start_time: renderStart.toISOString(),
                    end_time: renderEnd.toISOString(),
                    displayStartTime: displayStart.toISOString(),
                    displayEndTime: displayEnd.toISOString(),
                };
            })
            .filter((event, index, self) =>
                index === self.findIndex(e =>
                    e.id === event.id &&
                    e.start_time === event.start_time &&
                    e.end_time === event.end_time
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
            let duration = differenceInMinutes(eventEnd, eventStart);
            if (event.is_all_day) {
                duration = 24 * 60; // full day in minutes
            } else if (duration < MIN_EVENT_DURATION) {
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
            const minutes = event.is_all_day
                ? 0
                : (eventStart.getUTCHours() * 60 + eventStart.getUTCMinutes());

            const calculatedHeight = event.is_all_day
                ? (24 * HOUR_HEIGHT) // full day height in day view
                : ((duration / 60) * HOUR_HEIGHT - EVENT_SPACING);

            const processedEvent: ProcessedEvent = {
                ...event,
                calculatedTop: event.is_all_day ? 0 : (minutes / 60) * HOUR_HEIGHT,
                calculatedHeight,
                calculatedLeft: columnIndex * (100 / totalColumns) + EVENT_SPACING,
                calculatedWidth: (100 / totalColumns) - EVENT_SPACING * 2,
            };

            columns[columnIndex].push(processedEvent);
        });

        return columns.flat();
    };

    const processedDayEvents = useMemo(() => processEventsForDay(currentDate), [currentDate, events]);

    const eventColumns = useMemo(() => {
        if (viewType !== 'day') return [];
        const processedEvents = processedDayEvents;
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
    }, [viewType, processedDayEvents]);

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                height: height || '100%',
                overflow: 'hidden'
            }}
        >
            <CalendarHeader
                currentDate={currentDate}
                viewType={viewType}
                onViewChange={handleViewChange}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onToday={handleToday}
            />
            <Paper sx={{
                overflow: 'auto',
                flexGrow: 1,
                borderRadius: 1,
                boxShadow: theme.shadows[2]
            }}>
                <Box sx={{ p: 1 }}>
                    {viewType === 'day' && (
                        processedDayEvents.length === 0
                            ? <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', mt: 2 }}>No events</Typography>
                            : <DayView
                                currentDate={currentDate}
                                eventColumns={eventColumns}
                                HOUR_HEIGHT={HOUR_HEIGHT}
                                TIME_COLUMN_WIDTH={TIME_COLUMN_WIDTH}
                                EVENT_SPACING={EVENT_SPACING}
                                DAY_HEADER_HEIGHT={DAY_HEADER_HEIGHT}
                                MIN_EVENT_DURATION={MIN_EVENT_DURATION}
                                EVENT_WIDTH={EVENT_WIDTH}
                                getTooltipTimeDisplay={getTooltipTimeDisplay}
                            />
                    )}
                    {viewType === 'week' && (
                        <WeekView
                            currentDate={currentDate}
                            processEventsForDay={processEventsForDay}
                            getTooltipTimeDisplay={getTooltipTimeDisplay}
                        />
                    )}
                    {viewType === 'month' && (
                        <MonthView
                            currentDate={currentDate}
                            processEventsForDay={processEventsForDay}
                            getTooltipTimeDisplay={getTooltipTimeDisplay}
                        />
                    )}
                </Box>
            </Paper>
        </Box>
    );
};

export default CalendarGlance;
