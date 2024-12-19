import React from 'react';
import { Box, Typography, Tooltip, useTheme } from '@mui/material';
import { parseISO, differenceInMinutes, format } from 'date-fns';
import { Clock } from 'lucide-react';
import { Events } from '../../types/event';

type ProcessedEvent = Events & {
    calculatedTop: number;
    calculatedHeight: number;
    calculatedLeft: number;
    calculatedWidth: number;
    displayStartTime: string;
    displayEndTime: string;
};

interface DayViewProps {
    currentDate: Date;
    eventColumns: ProcessedEvent[][];
    HOUR_HEIGHT: number;
    TIME_COLUMN_WIDTH: number;
    EVENT_SPACING: number;
    DAY_HEADER_HEIGHT: number;
    MIN_EVENT_DURATION: number;
    EVENT_WIDTH: number;
    getTooltipTimeDisplay: (startTime: Date, endTime: Date, isRecurring?: boolean, isAllDay?: boolean) => string;
}

const DayView: React.FC<DayViewProps> = ({
    currentDate,
    eventColumns,
    HOUR_HEIGHT,
    TIME_COLUMN_WIDTH,
    EVENT_SPACING,
    DAY_HEADER_HEIGHT,
    MIN_EVENT_DURATION,
    EVENT_WIDTH,
    getTooltipTimeDisplay
}) => {
    const theme = useTheme();

    const renderCurrentTimeLine = () => {
        const CURRENT_TIME_HEIGHT = 2;
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
                    gap: 1
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
            boxShadow: theme.shadows[2]
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
                        alignItems: 'center',
                        background: hour === new Date().getHours() ? theme.palette.action.hover : 'transparent'
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

    const contentWidth = Math.max(
        600,
        TIME_COLUMN_WIDTH + (eventColumns.length * EVENT_WIDTH)
    );

    return (
        <Box sx={{
            height: 24 * HOUR_HEIGHT + DAY_HEADER_HEIGHT + 20,
            position: 'relative',
            borderRadius: 1,
            overflow: 'hidden',
            background: theme.palette.mode === 'dark' ? theme.palette.background.default : '#f9f9f9'
        }}>
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
                height: 24 * HOUR_HEIGHT + 20,
                overflowX: 'auto',
                overflowY: 'hidden'
            }}>
                <Box sx={{
                    position: 'relative',
                    width: contentWidth,
                    height: '100%',
                    paddingBottom: '20px',
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
                                bgcolor: hour % 2 === 0 ? 'background.default' : 'action.hover',
                                zIndex: 0,
                                transition: 'background 0.3s'
                            }}
                        />
                    ))}

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
                            {column.map(event => {
                                const displayStart = parseISO(event.displayStartTime);
                                const displayEnd = parseISO(event.displayEndTime);
                                const eventStart = parseISO(event.start_time);
                                const topPosition = event.is_all_day
                                    ? 0
                                    : (eventStart.getHours() * 60 + eventStart.getMinutes()) / 60 * HOUR_HEIGHT;

                                const eventEnd = parseISO(event.end_time);
                                let duration = differenceInMinutes(eventEnd, eventStart);
                                if (event.is_all_day) {
                                    duration = 24 * 60; // full day
                                } else if (duration < MIN_EVENT_DURATION) {
                                    duration = MIN_EVENT_DURATION;
                                }

                                const height = event.is_all_day
                                    ? (24 * HOUR_HEIGHT) // span entire day
                                    : Math.max((duration / 60) * HOUR_HEIGHT - EVENT_SPACING, MIN_EVENT_DURATION);

                                return (
                                    <Tooltip
                                        key={`${event.id}-${event.start_time}`}
                                        title={
                                            <Box sx={{ p: 2 }}>
                                                <Typography sx={{ fontWeight: 'bold', mb: 1 }}>
                                                    {event.title}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.75rem' }}>
                                                    <Clock style={{ width: 12, height: 12 }} />
                                                    <Typography variant="caption">
                                                        {getTooltipTimeDisplay(displayStart, displayEnd, event.recurring || event.is_recurring, event.is_all_day)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        }
                                    >
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                width: EVENT_WIDTH - 8,
                                                top: topPosition,
                                                height: height,
                                                backgroundColor: theme.palette.background.paper,
                                                borderRadius: 1,
                                                p: '4px',
                                                overflow: 'hidden',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                gap: 1,
                                                border: `1px solid ${theme.palette.divider}`,
                                                boxShadow: theme.shadows[1],
                                                transition: 'all 0.2s',
                                                '&:hover': {
                                                    boxShadow: theme.shadows[3],
                                                    backgroundColor: theme.palette.action.hover,
                                                    transform: 'scale(1.01)'
                                                }
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: '4px',
                                                    height: '100%',
                                                    backgroundColor: event.color || theme.palette.primary.main,
                                                    borderRadius: '2px',
                                                    flexShrink: 0
                                                }}
                                            />
                                            <Box sx={{
                                                flex: 1,
                                                overflow: 'hidden',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 0.5
                                            }}>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: theme.palette.text.primary,
                                                        lineHeight: 1,
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}
                                                >
                                                    {event.title}
                                                </Typography>
                                                {!event.is_all_day && height >= 40 && (
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            color: theme.palette.text.secondary,
                                                            lineHeight: 1,
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}
                                                    >
                                                        {getTooltipTimeDisplay(displayStart, displayEnd, event.recurring || event.is_recurring, event.is_all_day)}
                                                    </Typography>
                                                )}
                                                {event.is_all_day && (
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            color: theme.palette.text.secondary,
                                                            lineHeight: 1,
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}
                                                    >
                                                        All Day
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </Tooltip>
                                );
                            })}
                        </Box>
                    ))}
                    {renderTimeGrid()}
                    {renderCurrentTimeLine()}
                </Box>
            </Box>
        </Box>
    );
};

export default DayView;
