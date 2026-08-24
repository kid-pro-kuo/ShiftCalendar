import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, ScrollView } from 'react-native';
import { format, startOfWeek, addDays, subDays, parseISO } from 'date-fns';
import { ShiftType } from '../constants/shifts';
import { CalendarInfo } from '../hooks/useShiftData';

interface Props {
  currentDate: Date;
  weekStart: 0 | 1;
  allCalendarsShiftData: Record<string, Record<string, string>>;
  selectedCalendarIds: string[];
  calendars: CalendarInfo[];
  notesData: Record<string, string>;
  overtimeData: Record<string, number>;
  getShiftByCode: (code: string) => ShiftType | undefined;
  onDayPress: (dateString: string, calendarId: string) => void;
  selectedDate: string | null;
  colors: {
    text: string;
    textSecondary: string;
    surface: string;
    surfaceVariant: string;
    border: string;
    primary: string;
    background: string;
  };
}

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export const WeekView = React.memo(function WeekView({
  currentDate,
  weekStart,
  allCalendarsShiftData,
  selectedCalendarIds,
  calendars,
  notesData,
  overtimeData,
  getShiftByCode,
  onDayPress,
  selectedDate,
  colors,
}: Props) {
  const { width } = useWindowDimensions();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Compute the 7 days of the active week
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: weekStart });
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(start, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      return {
        date,
        dateStr,
        dayName: format(date, 'EEE'),
        dayNum: format(date, 'd'),
        monthName: format(date, 'MMM'),
        isToday: dateStr === todayStr,
      };
    });
  }, [currentDate, weekStart, todayStr]);

  const weekLabel = `${format(weekDays[0].date, 'MMM d')} - ${format(weekDays[6].date, 'MMM d, yyyy')}`;

  // Helper to parse blocks for a specific cell (calendar + date)
  const getCellBlocks = (dateStr: string, calId: string) => {
    const blocks: Array<{
      code: string;
      color: string;
      startPercent: number;
      endPercent: number;
      timeLabel: string;
      hasTimes: boolean;
    }> = [];

    // 1. Shift assigned to today
    const code = allCalendarsShiftData[calId]?.[dateStr];
    if (code) {
      const shift = getShiftByCode(code);
      if (shift) {
        if (shift.startTime && shift.endTime) {
          const startMin = timeToMinutes(shift.startTime);
          const endMin = timeToMinutes(shift.endTime);
          if (endMin > startMin) {
            // Normal shift
            blocks.push({
              code,
              color: shift.color,
              startPercent: (startMin / 1440) * 100,
              endPercent: (endMin / 1440) * 100,
              timeLabel: `${shift.startTime}-${shift.endTime}`,
              hasTimes: true,
            });
          } else {
            // Overnight shift starting today: draw from startTime to 24:00
            blocks.push({
              code,
              color: shift.color,
              startPercent: (startMin / 1440) * 100,
              endPercent: 100,
              timeLabel: `${shift.startTime}-${shift.endTime}`,
              hasTimes: true,
            });
          }
        } else {
          // Shift without time (e.g. OFF)
          blocks.push({
            code,
            color: shift.color,
            startPercent: 0,
            endPercent: 100,
            timeLabel: shift.label,
            hasTimes: false,
          });
        }
      }
    }

    // 2. Spillover shift from yesterday
    try {
      const parsedDate = parseISO(dateStr);
      const prevDateStr = format(subDays(parsedDate, 1), 'yyyy-MM-dd');
      const prevCode = allCalendarsShiftData[calId]?.[prevDateStr];
      if (prevCode) {
        const prevShift = getShiftByCode(prevCode);
        if (prevShift && prevShift.startTime && prevShift.endTime) {
          const startMin = timeToMinutes(prevShift.startTime);
          const endMin = timeToMinutes(prevShift.endTime);
          if (endMin <= startMin) {
            // Yesterday's overnight shift spills into today from 00:00 to endMin
            blocks.push({
              code: prevCode,
              color: prevShift.color,
              startPercent: 0,
              endPercent: (endMin / 1440) * 100,
              timeLabel: `${prevShift.startTime}-${prevShift.endTime}`,
              hasTimes: true,
            });
          }
        }
      }
    } catch (e) {
      console.error('Error computing spillover shift:', e);
    }

    return blocks;
  };

  // Dimensions
  const labelColWidth = 110;
  const dayColWidth = 140;

  return (
    <View style={styles.container}>
      <Text style={[styles.weekLabel, { color: colors.textSecondary }]}>{weekLabel}</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.gridContainer}>
          {/* Header Row */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.headerLabelCell, { width: labelColWidth }]}>
              <Text style={[styles.colHeaderText, { color: colors.textSecondary }]}>Calendars</Text>
            </View>
            
            {weekDays.map((day) => (
              <View
                key={day.dateStr}
                style={[
                  styles.headerDayCell,
                  { width: dayColWidth },
                  day.isToday && { borderBottomWidth: 3, borderBottomColor: colors.primary }
                ]}
              >
                <Text style={[styles.dayNameText, { color: day.isToday ? colors.primary : colors.textSecondary }]}>
                  {day.dayName}
                </Text>
                <View style={[styles.dayNumBadge, day.isToday && { backgroundColor: colors.primary }]}>
                  <Text style={[styles.dayNumText, { color: day.isToday ? '#FFF' : colors.text }]}>
                    {day.dayNum}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Rows for each calendar */}
          {selectedCalendarIds.map((calId) => {
            const cal = calendars.find((c) => c.id === calId);
            if (!cal) return null;

            return (
              <View key={cal.id} style={[styles.row, { borderBottomColor: colors.border }]}>
                {/* Calendar identifier cell */}
                <View style={[styles.rowLabelCell, { width: labelColWidth }]}>
                  <View style={[styles.colorDot, { backgroundColor: cal.color }]} />
                  <Text style={[styles.rowLabelText, { color: colors.text }]} numberOfLines={1}>
                    {cal.name}
                  </Text>
                </View>

                {/* Day intersection cells */}
                {weekDays.map((day) => {
                  const blocks = getCellBlocks(day.dateStr, cal.id);
                  const isSelected = day.dateStr === selectedDate;
                  const hasNote = !!notesData[day.dateStr];
                  const otHours = overtimeData[day.dateStr] || 0;

                  return (
                    <TouchableOpacity
                      key={day.dateStr}
                      style={[
                        styles.cell,
                        {
                          width: dayColWidth,
                          borderColor: colors.border,
                          backgroundColor: isSelected ? colors.primary + '12' : 'transparent',
                        },
                      ]}
                      onPress={() => onDayPress(day.dateStr, cal.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.timelineContainer}>
                        {/* 6am, 12pm, 6pm vertical dotted indicators */}
                        <View style={[styles.indicatorLine, { left: '25%', borderColor: colors.border + '50' }]} />
                        <View style={[styles.indicatorLine, { left: '50%', borderColor: colors.border + '50' }]} />
                        <View style={[styles.indicatorLine, { left: '75%', borderColor: colors.border + '50' }]} />

                        {/* Shift blocks */}
                        {blocks.map((block, index) => {
                          if (block.hasTimes) {
                            return (
                              <View
                                key={index}
                                style={[
                                  styles.timeBlock,
                                  {
                                    left: `${block.startPercent}%`,
                                    width: `${Math.max(block.endPercent - block.startPercent, 8)}%`, // min 8% width for visibility
                                    backgroundColor: block.color,
                                  },
                                ]}
                              >
                                <Text style={styles.timeBlockText} numberOfLines={1}>
                                  {block.code}
                                </Text>
                              </View>
                            );
                          } else {
                            // Full-day timeblock with transparent fill
                            return (
                              <View
                                key={index}
                                style={[
                                  styles.fullBlock,
                                  {
                                    backgroundColor: block.color + '20',
                                    borderColor: block.color + '60',
                                  },
                                ]}
                              >
                                <Text style={[styles.fullBlockText, { color: block.color }]} numberOfLines={1}>
                                  {block.code}
                                </Text>
                              </View>
                            );
                          }
                        })}
                      </View>

                      {/* Notes / Overtime badges */}
                      <View style={styles.badgeContainer}>
                        {hasNote && <View style={[styles.noteDot, { backgroundColor: '#F59E0B' }]} />}
                        {otHours > 0 && (
                          <View style={styles.otBadge}>
                            <Text style={styles.otText}>+{otHours}h</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    flex: 1,
  },
  weekLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  gridContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    paddingBottom: 6,
  },
  headerLabelCell: {
    paddingLeft: 12,
    justifyContent: 'center',
  },
  colHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerDayCell: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayNameText: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  dayNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumText: {
    fontSize: 13,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    height: 64,
  },
  rowLabelCell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    gap: 8,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rowLabelText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  cell: {
    height: '100%',
    borderRightWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 6,
    position: 'relative',
  },
  timelineContainer: {
    height: 32,
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
  },
  indicatorLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    borderStyle: 'dashed',
    borderLeftWidth: 1,
  },
  timeBlock: {
    position: 'absolute',
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  timeBlockText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  fullBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullBlockText: {
    fontSize: 9,
    fontWeight: '800',
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 3,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noteDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  otBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 3,
    paddingVertical: 0.5,
    borderRadius: 3,
  },
  otText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
  },
});
