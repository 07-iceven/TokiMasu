/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GridShape = 'square' | 'rounded-square' | 'circle';
export type GridTextMode = 'none' | 'date-dd' | 'month-mm' | 'day-num' | 'day-remain';
export type GridOrientation = 'horizontal' | 'vertical';
export type GridBorderStyle = 'solid' | 'dashed' | 'dotted';

export interface CalendarSettings {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  paperWidth: number; // in mm
  paperHeight: number; // in mm
  paperPreset: string; // e.g., 'A4', 'A5', 'US-Letter', 'custom'
  
  showTitle: boolean;
  titleText: string;
  subtitleText: string;
  titleFontSize: number; // pt or rem
  titleSpacing: number; // mm
  
  gridWidth: number; // mm
  gridHeight: number; // mm
  syncGridSize?: boolean; // sync grid width and height
  gridGap: number; // mm
  gridGapCol?: number; // mm
  gridGapRow?: number; // mm
  syncGaps?: boolean; // sync row & col gaps
  gridShape: GridShape;
  borderRadius: number; // mm, active if shape is rounded-square
  
  borderWidth: number; // mm
  borderStyle: GridBorderStyle;
  borderColor: string;
  
  textMode: GridTextMode;
  monthLanguage: 'zh' | 'en' | 'num';
  
  innerPattern: 'empty' | 'center-dot' | 'slash' | 'cross';
  highlightWeekends: boolean;
  showWeekendLabels: boolean;
  showWeekNumbers: boolean;
  showStats: boolean;
  paperPadding: number; // mm (margin from edge of paper)
  
  // Layout Flow options (User selection feedback additions)
  flowMode?: 'week-wrap' | 'custom-count' | 'auto-fill';
  gridCountPerLine?: number;
  weeksPerLine?: number; // Supports wrapping with multiple weeks per line
  weekStartDay?: 'monday' | 'sunday';
  paperOrientation?: 'portrait' | 'landscape';

  // Blackout strategy
  blackoutMode?: 'none' | 'yesterday' | 'custom';
  blackedOutDates?: string[]; // list of formatted YYYY-MM-DD strings for custom blackouts
  noGridGap?: boolean; // Whether to collapse grid gaps to the negative border thickness
}

export interface DayInfo {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayNum: number;  // 1-31
  monthNum: number; // 0-11
  monthName: string; // "1" or "Jan"
  isFirstOfMonth: boolean;
  isFirstOfDayList: boolean;
  isWeekend: boolean;
  dayOfWeek: number; // 0-6
  index: number;
}
