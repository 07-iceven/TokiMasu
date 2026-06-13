/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Calendar, 
  Settings, 
  Layout, 
  Type, 
  SlidersHorizontal, 
  RotateCcw, 
  FileText, 
  ChevronRight, 
  Info,
  Bookmark,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Copy,
  Link,
  Unlink
} from 'lucide-react';
import { CalendarSettings, DayInfo, GridShape, GridTextMode, GridOrientation, GridBorderStyle } from './types';
import logoUrl from '../Logo.svg';

// Helper to parse timezone-safe local dates
const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr || dateStr.trim() === '') return new Date(NaN);
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date(NaN);
  const [year, month, day] = parts.map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return new Date(NaN);
  return new Date(year, month - 1, day);
};

// Formatting local dates to "YYYY-MM-DD"
const formatDateLocal = (date: Date): string => {
  if (!date || isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const PAPER_PRESETS = [
  { id: 'A4', name: 'A4 纸张 (210 × 297 mm)', width: 210, height: 297 },
  { id: 'B5', name: 'B5 纸张 (176 × 250 mm)', width: 176, height: 250 },
  { id: 'A5', name: 'A5 纸张 (148 × 210 mm)', width: 148, height: 210 },
  { id: 'A6', name: 'A6 / 活页手帐 (105 × 148 mm)', width: 105, height: 148 },
  { id: 'custom', name: '自定义纸张尺寸...', width: 200, height: 200 }
];

// Removed PRESETS_SCHEMES

// Utility functions for config sharing: compresses and encodes settings to base64, also supports raw JSON parsing
const encodeSettingsText = (cfgSettings: any): string => {
  try {
    const minified = {
      v: 2, // updated version covering full types.ts definitions
      sDate: cfgSettings.startDate,
      eDate: cfgSettings.endDate,
      pType: cfgSettings.paperPreset,
      pW: cfgSettings.paperWidth,
      pH: cfgSettings.paperHeight,
      sT: cfgSettings.showTitle,
      tTxt: cfgSettings.titleText,
      subT: cfgSettings.subtitleText,
      tSz: cfgSettings.titleFontSize,
      tSp: cfgSettings.titleSpacing,
      gW: cfgSettings.gridWidth,
      gH: cfgSettings.gridHeight,
      sGS: cfgSettings.syncGridSize,
      gGp: cfgSettings.gridGap,
      gGpC: cfgSettings.gridGapCol,
      gGpR: cfgSettings.gridGapRow,
      nGG: cfgSettings.noGridGap,
      sG: cfgSettings.syncGaps,
      gSh: cfgSettings.gridShape,
      bRad: cfgSettings.borderRadius,
      bW: cfgSettings.borderWidth,
      bSt: cfgSettings.borderStyle,
      bCl: cfgSettings.borderColor,
      tMd: cfgSettings.textMode,
      mLng: cfgSettings.monthLanguage,
      iPat: cfgSettings.innerPattern,
      hWk: cfgSettings.highlightWeekends,
      sWkL: cfgSettings.showWeekendLabels,
      sWdH: cfgSettings.showWeekdayHeaders,
      wdLng: cfgSettings.weekdayLanguage,
      sWkN: cfgSettings.showWeekNumbers,
      sSt: cfgSettings.showStats,
      pPad: cfgSettings.paperPadding,
      fMd: cfgSettings.flowMode,
      gCPL: cfgSettings.gridCountPerLine,
      wPL: cfgSettings.weeksPerLine,
      wkSD: cfgSettings.weekStartDay,
      pOr: cfgSettings.paperOrientation,
      or: cfgSettings.orientation,
      bOM: cfgSettings.blackoutMode,
      bOD: cfgSettings.blackedOutDates,
      wdCl: cfgSettings.weekdayColors
    };
    return btoa(unescape(encodeURIComponent(JSON.stringify(minified))));
  } catch (err) {
    return JSON.stringify(cfgSettings);
  }
};

const decodeSettingsText = (text: string): any | null => {
  const clean = text.trim();
  if (!clean) return null;

  // Attempt raw JSON parse first
  if (clean.startsWith('{') && clean.endsWith('}')) {
    try {
      const parsed = JSON.parse(clean);
      if (parsed && typeof parsed === 'object') {
        return {
          ...parsed,
          noGridGap: parsed.noGridGap ?? true,
          showWeekendLabels: parsed.showWeekendLabels ?? parsed.highlightWeekends ?? false,
          showWeekdayHeaders: parsed.showWeekdayHeaders ?? true,
          weekdayLanguage: parsed.weekdayLanguage ?? (parsed.monthLanguage === 'zh' ? 'zh' : 'en'),
        };
      }
    } catch (e) {}
  }

  // Attempt base64 decode
  try {
    const decodedStr = decodeURIComponent(escape(atob(clean)));
    const parsed = JSON.parse(decodedStr);
    
    // Support version 2 full format (CalendarSettings complete properties mapping)
    if (parsed && parsed.v === 2) {
      return {
        startDate: parsed.sDate,
        endDate: parsed.eDate,
        paperPreset: parsed.pType,
        paperWidth: parsed.pW,
        paperHeight: parsed.pH,
        showTitle: parsed.sT,
        titleText: parsed.tTxt,
        subtitleText: parsed.subT,
        titleFontSize: parsed.tSz,
        titleSpacing: parsed.tSp,
        gridWidth: parsed.gW,
        gridHeight: parsed.gH,
        syncGridSize: parsed.sGS,
        gridGap: parsed.gGp,
        gridGapCol: parsed.gGpC,
        gridGapRow: parsed.gGpR,
        noGridGap: parsed.nGG ?? true,
        syncGaps: parsed.sG,
        gridShape: parsed.gSh,
        borderRadius: parsed.bRad,
        borderWidth: parsed.bW,
        borderStyle: parsed.bSt,
        borderColor: parsed.bCl,
        textMode: parsed.tMd,
        monthLanguage: parsed.mLng,
        innerPattern: parsed.iPat,
        highlightWeekends: parsed.hWk,
        showWeekendLabels: parsed.sWkL ?? parsed.hWk ?? false,
        showWeekdayHeaders: parsed.sWdH ?? true,
        weekdayLanguage: parsed.wdLng ?? (parsed.mLng === 'zh' ? 'zh' : 'en'),
        showWeekNumbers: parsed.sWkN,
        showStats: parsed.sSt,
        paperPadding: parsed.pPad,
        flowMode: parsed.fMd,
        gridCountPerLine: parsed.gCPL,
        weeksPerLine: parsed.wPL || 1,
        weekStartDay: parsed.wkSD,
        paperOrientation: parsed.pOr,
        orientation: parsed.or,
        blackoutMode: parsed.bOM || 'none',
        blackedOutDates: parsed.bOD || [],
        weekdayColors: parsed.wdCl || {}
      };
    }
    
    // Support legacy version 1 fallback mapping
    if (parsed && parsed.v === 1) {
      return {
        startDate: parsed.sDate,
        endDate: parsed.eDate,
        paperPreset: parsed.preset,
        paperWidth: parsed.w,
        paperHeight: parsed.h,
        showTitle: parsed.showT,
        titleText: parsed.tText,
        subtitleText: parsed.subText,
        titleFontSize: parsed.tSize,
        titleSpacing: parsed.tSpace,
        gridWidth: parsed.gW,
        gridHeight: parsed.gH,
        gridGap: parsed.gGp,
        noGridGap: parsed.noGridGap ?? true,
        gridShape: parsed.gShape,
        borderRadius: parsed.r,
        borderWidth: parsed.bW,
        borderStyle: parsed.bStyle,
        borderColor: parsed.bColor,
        innerPattern: parsed.inP,
        highlightWeekends: parsed.hW,
        showWeekendLabels: parsed.hW ?? false,
        showWeekdayHeaders: true,
        weekdayLanguage: 'zh',
        paperPadding: parsed.pPad,
        showWeekNumbers: parsed.weekN,
        showStats: parsed.stats,
        orientation: parsed.orient
      };
    }
    
    // Otherwise fallback direct mapping for legacy plain object imports
    if (parsed && typeof parsed === 'object') {
      return {
        ...parsed,
        noGridGap: parsed.noGridGap ?? true,
        showWeekendLabels: parsed.showWeekendLabels ?? parsed.highlightWeekends ?? false,
        showWeekdayHeaders: parsed.showWeekdayHeaders ?? true,
        weekdayLanguage: parsed.weekdayLanguage ?? (parsed.monthLanguage === 'zh' ? 'zh' : 'en'),
      };
    }
  } catch (e) {}

  return null;
};

export default function App() {
  const today = new Date();
  const defaultStartDate = formatDateLocal(today);
  // Add 99 days for exactly 100 days default range
  const futureDate = new Date(today.getTime() + 99 * 24 * 60 * 60 * 1000);
  const defaultEndDate = formatDateLocal(futureDate);

  // Core state settings
  const [settings, setSettings] = useState<CalendarSettings & { orientation: GridOrientation }>({
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    paperPreset: 'A4',
    paperWidth: 210,
    paperHeight: 297,
    showTitle: true,
    titleText: '时格 · TokiMasu',
    subtitleText: '笔落一格，度过一日。',
    titleFontSize: 18,
    titleSpacing: 12,
    gridWidth: 15,
    gridHeight: 15,
    syncGridSize: true,
    gridGap: 0,
    gridShape: 'square',
    borderRadius: 2,
    borderWidth: 0.5,
    borderStyle: 'solid',
    borderColor: '#171717',
    textMode: 'day-remain',
    monthLanguage: 'zh',
    innerPattern: 'empty',
    highlightWeekends: false,
    showWeekendLabels: false,
    showWeekdayHeaders: true,
    weekdayLanguage: 'zh',
    showWeekNumbers: false,
    showStats: false,
    paperPadding: 15,
    orientation: 'horizontal',
    flowMode: 'week-wrap',
    weeksPerLine: 1,
    blackoutMode: 'none',
    blackedOutDates: [],
    noGridGap: true,
    weekStartDay: 'monday',
    weekdayColors: {},
  });


  const [templateTab, setTemplateTab] = useState<'export' | 'import'>('export');
  const [activeSidebarTab, setActiveSidebarTab] = useState<'paper' | 'grid' | 'text'>('paper');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [isImportSuccess, setIsImportSuccess] = useState(false);
  const [isCopiedNotify, setIsCopiedNotify] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  // References
  const containerRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLTextAreaElement>(null);
  const importRef = useRef<HTMLTextAreaElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 600, height: 600 });
  const [zoom, setZoom] = useState<number>(0.85);
  const [isAutoFit, setIsAutoFit] = useState<boolean>(true);
  const [isEditingZoom, setIsEditingZoom] = useState<boolean>(false);
  const [tempZoomValue, setTempZoomValue] = useState<string>('');
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.innerWidth < 640;
  });
  const [isToolbarExpanded, setIsToolbarExpanded] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    return window.innerWidth >= 640;
  });

  // Auto-adjust textareas height to content
  useEffect(() => {
    if (templateTab === 'export' && exportRef.current) {
      exportRef.current.style.height = 'auto';
      exportRef.current.style.height = `${exportRef.current.scrollHeight}px`;
    }
  }, [settings, templateTab]);

  useEffect(() => {
    if (templateTab === 'import' && importRef.current) {
      importRef.current.style.height = 'auto';
      importRef.current.style.height = `${importRef.current.scrollHeight}px`;
    }
  }, [importText, templateTab]);

  useEffect(() => {
    const handleWindowResize = () => {
      setIsMobileViewport(window.innerWidth < 640);
    };

    handleWindowResize();
    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  // Browser native Fullscreen helpers and events listener
  const handleEnterFullscreen = () => {
    setIsFullScreen(true);
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => {
        console.warn("Fullscreen error:", err);
      });
    } else if ((elem as any).webkitRequestFullscreen) {
      (elem as any).webkitRequestFullscreen();
    }
  };

  const handleExitFullscreen = () => {
    setIsFullScreen(false);
    if (document.fullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.warn("Fullscreen exit error:", err);
        });
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFull = !!(
        document.fullscreenElement || 
        (document as any).webkitFullscreenElement || 
        (document as any).mozFullScreenElement
      );
      setIsFullScreen(isCurrentlyFull);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // ESC key keydown listener fallback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        handleExitFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullScreen]);

  const handleZoomSubmit = () => {
    let cleanVal = tempZoomValue.trim();
    if (!cleanVal) {
      setIsEditingZoom(false);
      return;
    }
    
    let hasPercent = false;
    if (cleanVal.endsWith('%')) {
      cleanVal = cleanVal.slice(0, -1);
      hasPercent = true;
    }
    
    let parsedNum = parseFloat(cleanVal);
    if (isNaN(parsedNum)) {
      setIsEditingZoom(false);
      return;
    }
    
    let finalZoom = parsedNum;
    // If input explicitly ends with % or is a whole number like 85, parse as fractional percentage.
    if (hasPercent || parsedNum > 3.0) {
      finalZoom = parsedNum / 100;
    }
    
    // Clamp to valid zoom boundaries [10% - 300%]
    finalZoom = Math.max(0.1, Math.min(3.0, finalZoom));
    
    setIsAutoFit(false);
    setZoom(parseFloat(finalZoom.toFixed(3)));
    setIsEditingZoom(false);
  };

  // Update workbench dimension measurements
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerSize({
          width: entry.contentRect.width || 600,
          height: entry.contentRect.height || 600,
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    
    // Initial size
    setContainerSize({
      width: containerRef.current.clientWidth || 600,
      height: containerRef.current.clientHeight || 600
    });

    return () => resizeObserver.disconnect();
  }, [containerRef]);

  // Auto-fit effect to scale paper inside available viewport size
  useEffect(() => {
    if (isAutoFit && containerSize.width > 0 && containerSize.height > 0) {
      const horizontalPadding = isFullScreen
        ? (isMobileViewport ? 32 : 96)
        : 96;
      const verticalPadding = isFullScreen
        ? (isMobileViewport ? 208 : 96)
        : 96;
      const availableWidth = Math.max(120, containerSize.width - horizontalPadding);
      const availableHeight = Math.max(120, containerSize.height - verticalPadding);
      const defaultScaleMmToPx = 3.7795275591;
      const paperWidthPx = settings.paperWidth * defaultScaleMmToPx;
      const paperHeightPx = settings.paperHeight * defaultScaleMmToPx;
      
      if (paperWidthPx > 0 && paperHeightPx > 0) {
        const ratioW = availableWidth / paperWidthPx;
        const ratioH = availableHeight / paperHeightPx;
        const fitZoom = Math.min(ratioW, ratioH);
        // Round to 3 decimal places to avoid floating point jitter, clamp between 0.1 and 3.0
        setZoom(parseFloat(Math.max(0.1, Math.min(3.0, fitZoom)).toFixed(3)));
      }
    }
  }, [containerSize, settings.paperWidth, settings.paperHeight, isAutoFit, isFullScreen, isMobileViewport]);

  // Calculate Days List
  const days: DayInfo[] = [];
  const start = parseLocalDate(settings.startDate);
  const end = parseLocalDate(settings.endDate);
  
  if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
    const current = new Date(start);
    let idx = 0;
    const seenMonths = new Set<string>();
    
    while (current <= end) {
      const year = current.getFullYear();
      const month = current.getMonth();
      const dayVal = current.getDate();
      const dayOfWeek = current.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      const key = `${year}-${month}`;
      const isFirstOfDayList = !seenMonths.has(key);
      seenMonths.add(key);
      
      const isFirstOfMonth = dayVal === 1;
      
      const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthNamesZh = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      const monthNamesNum = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
      const monthName = settings.monthLanguage === 'zh' 
        ? monthNamesZh[month] 
        : settings.monthLanguage === 'en' 
          ? monthNamesEn[month] 
          : monthNamesNum[month];
      
      days.push({
        date: new Date(current),
        dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(dayVal).padStart(2, '0')}`,
        dayNum: dayVal,
        monthNum: month,
        monthName,
        isFirstOfMonth,
        isFirstOfDayList,
        isWeekend,
        dayOfWeek,
        index: idx
      });
      
      current.setDate(current.getDate() + 1);
      idx++;
      if (idx > 10000) break; // Avoid crashes
    }
  }

  const totalDays = days.length;

  // Compute blacked-out grid progress ratios
  const blackedOutCount = days.filter(day => {
    if (settings.blackoutMode === 'yesterday') {
      const todayStr = formatDateLocal(new Date());
      return day.dateStr < todayStr;
    } else if (settings.blackoutMode === 'custom') {
      return settings.blackedOutDates?.includes(day.dateStr) || false;
    }
    return false;
  }).length;
  const progressPercent = totalDays > 0 ? Math.round((blackedOutCount / totalDays) * 100) : 0;

  // Constants and fallbacks for custom layouts (Requested Feature)
  const currentFlowMode = settings.flowMode || 'week-wrap';
  const customCountPerLine = settings.gridCountPerLine || 7;
  const customWeeksPerLine = Math.max(1, Math.floor(settings.weeksPerLine || 1));
  const currentWeekStartDay = settings.weekStartDay || 'monday';
  const currentWeekdayLanguage = settings.weekdayLanguage || (settings.monthLanguage === 'zh' ? 'zh' : 'en');
  const weekdayLabelSets = {
    zh: {
      monday: ['一', '二', '三', '四', '五', '六', '日'],
      sunday: ['日', '一', '二', '三', '四', '五', '六'],
    },
    ja: {
      monday: ['月', '火', '水', '木', '金', '土', '日'],
      sunday: ['日', '月', '火', '水', '木', '金', '土'],
    },
    en: {
      monday: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      sunday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    },
  };
  const weekdayLabels = weekdayLabelSets[currentWeekdayLanguage][currentWeekStartDay];
  const isSquareLikeGridShape =
    settings.gridShape === 'square' || settings.gridShape === 'rounded-square';

  const useSharedBorders =
    settings.noGridGap &&
    isSquareLikeGridShape;
  const gapCol = useSharedBorders
    ? 0
    : (settings.gridGapCol !== undefined ? settings.gridGapCol : settings.gridGap);
  const gapRow = useSharedBorders
    ? 0
    : (settings.gridGapRow !== undefined ? settings.gridGapRow : settings.gridGap);

  // Let's approximate margins/padding allocation to calculate auto-fill column counts
  const verticalTitleAlloc = settings.showTitle ? (settings.titleFontSize * 0.3527 + settings.titleSpacing + 12) : 0; // estimate title height in mm
  const footerAlloc = settings.showStats ? 12 : 0; // stats footer height estimate
  const innerPaperWidthMm = settings.paperWidth - 2 * settings.paperPadding;
  const innerPaperHeightMm = settings.paperHeight - 2 * settings.paperPadding - verticalTitleAlloc - footerAlloc;

  // 1. Calculate padded grid slots for rendering
  // In week-wrap mode, prepend placeholder slots so the first date aligns to its weekday.
  interface GridItem {
    type: 'day' | 'placeholder';
    dayInfo?: DayInfo;
    isWeekend: boolean;
    dayOfWeek?: number;
    label?: string;
  }
  const listItems: GridItem[] = [];

  if (currentFlowMode === 'week-wrap' && days.length > 0) {
    const firstDay = days[0];
    let startIdx = 0;
    if (currentWeekStartDay === 'monday') {
      startIdx = (firstDay.dayOfWeek + 6) % 7; // Sunday is 6, Monday is 0
    } else {
      startIdx = firstDay.dayOfWeek; // Sunday is 0
    }
    // Prepend startIdx placeholders
    for (let s = 0; s < startIdx; s++) {
      const mappedDayOfWeek = currentWeekStartDay === 'sunday' ? s : (s + 1) % 7;
      const isWeekendSpacer = mappedDayOfWeek === 0 || mappedDayOfWeek === 6;
      listItems.push({
        type: 'placeholder',
        isWeekend: isWeekendSpacer,
        dayOfWeek: mappedDayOfWeek,
      });
    }
  }

  // Then add the actual days
  days.forEach(day => {
    listItems.push({
      type: 'day',
      dayInfo: day,
      isWeekend: day.isWeekend,
      dayOfWeek: day.dayOfWeek,
    });
  });

  // Calculate layout dimensions
  let actualCols = 7;
  let actualRows = 1;

  if (settings.orientation === 'horizontal') {
    if (currentFlowMode === 'week-wrap') {
      actualCols = 7 * customWeeksPerLine;
    } else if (currentFlowMode === 'custom-count') {
      actualCols = customCountPerLine;
    } else if (currentFlowMode === 'auto-fill') {
      // Auto fill horizontal
      const colFit = Math.floor((innerPaperWidthMm + gapCol) / (settings.gridWidth + gapCol));
      actualCols = isFinite(colFit) && colFit > 0 ? colFit : 1;
    }
    actualRows = Math.ceil(listItems.length / actualCols);
  } else {
    // vertical
    if (currentFlowMode === 'week-wrap') {
      actualRows = 7 * customWeeksPerLine;
    } else if (currentFlowMode === 'custom-count') {
      actualRows = customCountPerLine;
    } else if (currentFlowMode === 'auto-fill') {
      // Auto fill vertical
      const rowFit = Math.floor((innerPaperHeightMm + gapRow) / (settings.gridHeight + gapRow));
      actualRows = isFinite(rowFit) && rowFit > 0 ? rowFit : 1;
    }
    actualCols = Math.ceil(listItems.length / actualRows);
  }

  // Dynamic grid metrics calculation (in millimeters)
  const gridTotalWidthMm = actualCols * settings.gridWidth + (actualCols - 1) * gapCol;
  const gridTotalHeightMm = actualRows * settings.gridHeight + (actualRows - 1) * gapRow;

  const isOverflowWidth = gridTotalWidthMm > innerPaperWidthMm;
  const isOverflowHeight = gridTotalHeightMm > innerPaperHeightMm;
  const isOverflow = isOverflowWidth || isOverflowHeight;

  // Real world px per mm at standard web resolution (approx 3.78)
  const defaultScaleMmToPx = 3.7795275591;
  const finalScale = defaultScaleMmToPx * zoom;

  // Preset Handlers removed applied preset schemas
  const setPaperPresetValue = (presetId: string) => {
    const item = PAPER_PRESETS.find(p => p.id === presetId);
    if (item && item.id !== 'custom') {
      setSettings(prev => ({
        ...prev,
        paperPreset: presetId,
        paperWidth: item.width,
        paperHeight: item.height,
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        paperPreset: 'custom',
      }));
    }
  };

  // Custom css print code block injected to page
  const printStyles = `
    @media print {
      html,
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        min-height: auto !important;
        height: auto !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #root,
      .print-app,
      .print-main,
      .print-workspace,
      .print-viewport {
        margin: 0 !important;
        padding: 0 !important;
        width: auto !important;
        height: auto !important;
        min-height: 0 !important;
        overflow: visible !important;
        background: #ffffff !important;
      }
      .print-main {
        display: block !important;
      }
      .print-workspace {
        display: block !important;
        position: static !important;
      }
      .print-viewport {
        display: block !important;
      }
      .no-print {
        display: none !important;
      }
      .print-box-wrapper {
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
        background: transparent !important;
        transform: none !important;
        position: static !important;
        display: block !important;
        width: ${settings.paperWidth}mm !important;
        height: ${settings.paperHeight}mm !important;
        overflow: visible !important;
      }
      @page {
        size: ${settings.paperWidth}mm ${settings.paperHeight}mm;
        margin: 0 !important;
      }
      #print-canvas {
        position: relative !important;
        left: auto !important;
        top: auto !important;
        width: ${settings.paperWidth}mm !important;
        height: ${settings.paperHeight}mm !important;
        margin: 0 !important;
        padding: ${settings.paperPadding}mm !important;
        box-shadow: none !important;
        border: none !important;
        box-sizing: border-box !important;
        background: #ffffff !important;
        display: flex !important;
        flex-direction: column !important;
        page-break-inside: avoid !important;
        page-break-before: avoid !important;
        overflow: hidden !important;
        transform: none !important;
      }
    }
  `;

  return (
    <div className="print-app min-h-screen lg:h-screen lg:overflow-hidden bg-[#f0f0f2] flex flex-col font-sans text-neutral-900 antialiased overflow-x-hidden">
      {/* Injecting dynamic styling for printing */}
      <style>{printStyles}</style>

      {/* Header bar */}
      {!isFullScreen && (
        <header className="no-print bg-white border-b border-[#e5e5e5] sticky top-0 z-30 px-6 py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <img
              src={logoUrl}
              alt="TokiMasu Logo"
              className="w-9 h-9 shrink-0 select-none"
              draggable={false}
            />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-neutral-900 flex items-center gap-1.5 font-serif">
                TokiMasu <span className="text-xs font-medium text-neutral-500 font-sans px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 rounded-xs">时格</span>
              </h1>
              <p className="text-[11px] text-neutral-500 font-medium">
                笔落一格，度过一日。
              </p>
            </div>
          </div>

          {/* Action center */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => window.print()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-black hover:bg-neutral-950 text-white font-semibold px-5 py-2 rounded-sm active:scale-95 transition-all duration-150 cursor-pointer text-xs uppercase tracking-wider"
            >
              <Printer className="w-4 h-4" />
              <span>打印</span>
            </button>
          </div>
        </header>
      )}

      {/* Main split work bench layout */}
      <main className="print-main flex-1 flex flex-col lg:flex-row min-h-0 w-full lg:overflow-hidden">
        
        {/* Left controlling board: Scrollable settings */}
        {!isFullScreen && (
          <section className="no-print w-full lg:w-[420px] xl:w-[460px] bg-[#fafafa] border-r border-[#e5e5e5] flex flex-col shrink-0 lg:h-full">
            
            {/* Sidebar quick switch top bar */}
            <div className="shrink-0 bg-white border-b border-[#e5e5e5] p-2.5 grid grid-cols-3 gap-1 shadow-xs z-10">
              <button
                type="button"
                onClick={() => setActiveSidebarTab('paper')}
                className={`py-2 px-1 rounded-sm border text-center font-bold text-[11px] sm:text-xs flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                  activeSidebarTab === 'paper'
                    ? 'bg-black border-black text-white shadow-2xs font-extrabold'
                    : 'bg-transparent border-transparent text-neutral-500 hover:text-black hover:bg-neutral-50/60'
                }`}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                <span>日期纸张</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSidebarTab('grid')}
                className={`py-2 px-1 rounded-sm border text-center font-bold text-[11px] sm:text-xs flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                  activeSidebarTab === 'grid'
                    ? 'bg-black border-black text-white shadow-2xs font-extrabold'
                    : 'bg-transparent border-transparent text-neutral-500 hover:text-black hover:bg-neutral-50/60'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 shrink-0" />
                <span>格子</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSidebarTab('text')}
                className={`py-2 px-1 rounded-sm border text-center font-bold text-[11px] sm:text-xs flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                  activeSidebarTab === 'text'
                    ? 'bg-black border-black text-white shadow-2xs font-extrabold'
                    : 'bg-transparent border-transparent text-neutral-500 hover:text-black hover:bg-neutral-50/60'
                }`}
              >
                <Type className="w-4 h-4 shrink-0" />
                <span>文本</span>
              </button>
            </div>
          
          {/* Form wrapper */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
            
            {/* Tab 1: Date & Paper settings */}
            {activeSidebarTab === 'paper' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center gap-2 pb-1.5 border-b-2 border-neutral-800">
                  <Calendar className="w-4 h-4 text-black" />
                  <h2 className="text-sm font-bold text-neutral-900 font-sans">1. 日期纸张</h2>
                </div>
                
                {/* Section A: Date range selection */}
                <div className="bg-white rounded-sm p-5 border border-[#e5e5e5] space-y-4 shadow-2xs">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-neutral-100">
                    <Calendar className="w-4 h-4 text-black" />
                    <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wide">1.1 日期范围</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 tracking-wider uppercase mb-1.5">开始日期</label>
                      <input
                        type="date"
                        value={settings.startDate}
                        onChange={(e) => setSettings(p => ({ ...p, startDate: e.target.value }))}
                        onClick={(e) => {
                          try {
                            e.currentTarget.showPicker();
                          } catch (err) {}
                        }}
                        className="w-full text-xs bg-white border border-[#e5e5e5] rounded-sm p-2 font-mono text-neutral-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 tracking-wider uppercase mb-1.5">结束日期</label>
                      <input
                        type="date"
                        value={settings.endDate}
                        onChange={(e) => setSettings(p => ({ ...p, endDate: e.target.value }))}
                        onClick={(e) => {
                          try {
                            e.currentTarget.showPicker();
                          } catch (err) {}
                        }}
                        className="w-full text-xs bg-white border border-[#e5e5e5] rounded-sm p-2 font-mono text-neutral-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black cursor-pointer"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-neutral-400 tracking-wider uppercase mb-1.5">格子数</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="5000"
                          value={totalDays}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                            const startD = parseLocalDate(settings.startDate);
                            if (startD && !isNaN(startD.getTime())) {
                              const endD = new Date(startD.getTime() + (val - 1) * 24 * 60 * 60 * 1000);
                              setSettings(p => ({ ...p, endDate: formatDateLocal(endD) }));
                            }
                          }}
                          className="w-full text-xs font-mono bg-white border border-[#e5e5e5] rounded-sm p-2 text-neutral-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                          placeholder="输入天数"
                        />
                        <span className="text-[11px] text-neutral-500 font-bold shrink-0">天</span>
                      </div>
                      <p className="mt-1 text-[10px] text-neutral-400">输入天数后自动计算结束日期。</p>
                    </div>
                  </div>
                </div>
 
                {/* Section B: Dimension sizes */}
                <div className="bg-white rounded-sm p-5 border border-[#e5e5e5] space-y-4 shadow-2xs">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-neutral-100">
                    <FileText className="w-4 h-4 text-black" />
                    <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wide">1.2 纸张</h3>
                  </div>
 
                  {/* Paper presets */}
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 tracking-wider uppercase mb-1.5">纸张预设</label>
                    <select
                      value={settings.paperPreset}
                      onChange={(e) => setPaperPresetValue(e.target.value)}
                      className="w-full bg-white border border-[#e5e5e5] rounded-sm px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-black font-medium"
                    >
                      {PAPER_PRESETS.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Paper Orientation (Requested Feature: 纸张也支持选择纵向 and 横向) */}
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-300 tracking-wider uppercase mb-2">纸张排版方向 Paper Orientation</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const w = settings.paperWidth;
                          const h = settings.paperHeight;
                          if (w > h) {
                            setSettings(p => ({ ...p, paperWidth: h, paperHeight: w, paperPreset: 'custom' }));
                          }
                        }}
                        className={`py-1.5 px-3 rounded-sm border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          settings.paperWidth <= settings.paperHeight
                            ? 'bg-neutral-900 border-neutral-900 text-white shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 text-current" />
                        纵向
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const w = settings.paperWidth;
                          const h = settings.paperHeight;
                          if (w < h) {
                            setSettings(p => ({ ...p, paperWidth: h, paperHeight: w, paperPreset: 'custom' }));
                          }
                        }}
                        className={`py-1.5 px-3 rounded-sm border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          settings.paperWidth > settings.paperHeight
                            ? 'bg-neutral-900 border-neutral-900 text-white shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 rotate-90 text-current" />
                        横向
                      </button>
                    </div>
                  </div>

                  {/* Custom millimeter control (Requested Mandatory Feature) */}
                  <div className="space-y-3 pt-1">
                    <span className="block text-[10px] font-bold text-neutral-400 tracking-wider uppercase">📏 自定义尺寸规格 (毫米/mm)</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 tracking-wider uppercase mb-1">纸张宽度</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={settings.paperWidth}
                            onChange={(e) => setSettings(p => ({
                              ...p,
                              paperWidth: e.target.value === '' ? 0 : Number(e.target.value),
                              paperPreset: 'custom'
                            }))}
                            className="w-full text-xs font-mono bg-white border border-[#e5e5e5] rounded-sm p-2 focus:outline-none focus:border-black text-right"
                          />
                          <span className="text-[10px] text-neutral-400 font-mono font-bold">mm</span>
                        </div>
                      </div>
 
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 tracking-wider uppercase mb-1">纸张高度</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={settings.paperHeight}
                            onChange={(e) => setSettings(p => ({
                              ...p,
                              paperHeight: e.target.value === '' ? 0 : Number(e.target.value),
                              paperPreset: 'custom'
                            }))}
                            className="w-full text-xs font-mono bg-white border border-[#e5e5e5] rounded-sm p-2 focus:outline-none focus:border-black text-right"
                          />
                          <span className="text-[10px] text-neutral-400 font-mono font-bold">mm</span>
                        </div>
                      </div>
                    </div>
 

                  </div>
 
                  {/* Paper padding controller */}
                  <div className="pt-1">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold text-neutral-400 tracking-wider uppercase">
                        页边距
                      </label>
                      <span className="text-xs font-mono text-black font-bold">{settings.paperPadding} mm</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="40"
                      step="1"
                      value={settings.paperPadding}
                      onChange={(e) => setSettings(p => ({ ...p, paperPadding: Number(e.target.value) }))}
                      className="w-full accent-black cursor-pointer h-1.5 bg-neutral-200 rounded-lg appearance-none"
                    />
                    <div className="flex justify-between text-[9px] text-neutral-400 pt-1 font-mono">
                      <span>2 mm (窄)</span>
                      <span>40 mm (宽)</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Tab 2: Grid and Shape Styles */}
            {activeSidebarTab === 'grid' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center gap-2 pb-1.5 border-b-2 border-neutral-800">
                  <SlidersHorizontal className="w-4 h-4 text-black" />
                  <h2 className="text-sm font-bold text-neutral-900 font-sans">2. 格子</h2>
                </div>
                
                {/* Section C: Arrangement Switch */}
                <div className="bg-white rounded-sm p-5 border border-[#e5e5e5] space-y-4 shadow-2xs">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-neutral-100">
                    <Layout className="w-4 h-4 text-black" />
                    <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wide">2.1 排版</h3>
                  </div>

                  {/* Orientation/Flow Direction Toggle */}
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 tracking-wider uppercase mb-1.5">排列方向</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSettings(p => ({ ...p, orientation: 'horizontal' }))}
                        className={`py-2 px-3 rounded-sm border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          settings.orientation === 'horizontal'
                            ? 'bg-black border-black text-white shadow-sm'
                            : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        <span className="block w-2.5 h-1.5 bg-current opacity-75 rounded-2xs"></span>
                        横向
                      </button>

                      <button
                        type="button"
                        onClick={() => setSettings(p => ({ ...p, orientation: 'vertical' }))}
                        className={`py-2 px-3 rounded-sm border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          settings.orientation === 'vertical'
                            ? 'bg-black border-black text-white shadow-sm'
                            : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        <span className="block w-1.5 h-2.5 bg-current opacity-75 rounded-2xs"></span>
                        纵向
                      </button>
                    </div>
                  </div>

                  {/* Flow Mode selection (Week wrap / Custom / Auto Fit) */}
                  <div className="pt-1">
                    <label className="block text-[10px] font-bold text-neutral-400 tracking-wider uppercase mb-1.5">排版模式</label>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { id: 'week-wrap', label: '按周换行', desc: '按 7 天对齐' },
                        { id: 'custom-count', label: '自定义数量', desc: '手动设置每行或每列格子数' },
                        { id: 'auto-fill', label: '自动排满', desc: '按纸张空间自动计算' }
                      ].map((item) => (
                        <label 
                          key={item.id} 
                          className={`flex items-start gap-2.5 p-2.5 border rounded-sm cursor-pointer transition-all ${
                            currentFlowMode === item.id 
                              ? 'bg-neutral-50 border-black/80 ring-1 ring-black/10' 
                              : 'bg-white border-neutral-200 hover:bg-neutral-50/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="flowMode"
                            checked={currentFlowMode === item.id}
                            onChange={() => setSettings(p => ({ ...p, flowMode: item.id as any }))}
                            className="mt-0.5 accent-black"
                          />
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-neutral-800">{item.label}</span>
                            <span className="text-[10px] text-neutral-400 select-none leading-tight">{item.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Mode-specific Context Options */}
                  {currentFlowMode === 'week-wrap' && (
                    <div className="p-3 bg-neutral-50 border border-neutral-150 rounded-sm space-y-3 animate-fadeIn">
                      {/* Weeks Per Line selection (New Feature support: 按星期换行 支持单行显示多个星期) */}
                      <div className="pt-1">
                        <label className="block text-[9.5px] font-bold text-neutral-700 uppercase font-sans">
                          每行周数
                        </label>
                        <div className="grid grid-cols-4 gap-1 mt-2">
                          {[1, 2, 3, 4].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setSettings(p => ({ ...p, weeksPerLine: num }))}
                              className={`py-1 text-xs font-bold rounded-sm border cursor-pointer transition-all ${
                                customWeeksPerLine === num
                                  ? 'bg-black border-black text-white'
                                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                              }`}
                            >
                              {num} 周
                            </button>
                          ))}
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="1"
                          value={customWeeksPerLine > 10 ? 10 : customWeeksPerLine}
                          onChange={(e) => setSettings(p => ({ ...p, weeksPerLine: Number(e.target.value) }))}
                          className="w-full mt-2 accent-black cursor-pointer h-1.5 bg-neutral-200 rounded-lg appearance-none"
                        />
                        <div className="flex justify-between text-[9px] font-mono text-neutral-400 mt-0.5">
                          <span>1 周</span>
                          <span>10 周</span>
                        </div>
                      </div>

                      <div className="pt-1 border-t border-neutral-200">
                        <label className="flex items-center justify-between cursor-pointer py-1">
                          <span className="text-xs font-semibold text-neutral-700">显示顶部星期提示</span>
                          <input
                            type="checkbox"
                            checked={settings.showWeekdayHeaders ?? true}
                            onChange={(e) => setSettings(p => ({ ...p, showWeekdayHeaders: e.target.checked }))}
                            className="accent-black h-4 w-4 border-neutral-300 rounded-sm"
                          />
                        </label>

                        {settings.showWeekdayHeaders && (
                          <div className="pt-1">
                            <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-1.5">星期提示语言</label>
                            <div className="grid grid-cols-3 gap-1.5">
                              {[
                                { id: 'zh', label: '中文' },
                                { id: 'ja', label: '日本語' },
                                { id: 'en', label: 'English' },
                              ].map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => setSettings(p => ({ ...p, weekdayLanguage: item.id as 'zh' | 'ja' | 'en' }))}
                                  className={`py-1 px-1 text-[10px] font-bold rounded-sm border cursor-pointer transition-all ${
                                    currentWeekdayLanguage === item.id
                                      ? 'bg-white border-neutral-900 text-neutral-900 shadow-2xs'
                                      : 'bg-transparent border-neutral-200 text-neutral-500 hover:text-neutral-700'
                                  }`}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* First day of week option */}
                      <div className="pt-1 border-t border-neutral-200">
                        <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-1.5">每周起始日</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setSettings(p => ({ ...p, weekStartDay: 'monday' }))}
                            className={`py-1 px-2 text-[11px] font-bold rounded-sm border cursor-pointer transition-all ${
                              currentWeekStartDay === 'monday'
                                ? 'bg-white border-neutral-900 text-neutral-900 shadow-2xs'
                                : 'bg-transparent border-neutral-200 text-neutral-500 hover:text-neutral-700'
                            }`}
                          >
                            周一
                          </button>
                          <button
                            type="button"
                            onClick={() => setSettings(p => ({ ...p, weekStartDay: 'sunday' }))}
                            className={`py-1 px-2 text-[11px] font-bold rounded-sm border cursor-pointer transition-all ${
                              currentWeekStartDay === 'sunday'
                                ? 'bg-white border-neutral-900 text-neutral-900 shadow-2xs'
                                : 'bg-transparent border-neutral-200 text-neutral-500 hover:text-neutral-700'
                            }`}
                          >
                            周日
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentFlowMode === 'custom-count' && (
                    <div className="p-3 bg-neutral-50 border border-neutral-150 rounded-sm space-y-2.5 animate-fadeIn">
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase">
                          每行/列格子数
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            value={customCountPerLine}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              setSettings(p => ({ ...p, gridCountPerLine: val }));
                            }}
                            className="w-16 text-center text-xs font-bold font-mono bg-white border border-neutral-300 rounded-xs px-1.5 py-1 focus:outline-none focus:border-black"
                          />
                          <span className="text-[10px] font-medium text-neutral-500">格</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        step="1"
                        value={customCountPerLine > 100 ? 100 : customCountPerLine}
                        onChange={(e) => setSettings(p => ({ ...p, gridCountPerLine: Number(e.target.value) }))}
                        className="w-full accent-black cursor-pointer h-1.5 bg-neutral-200 rounded-lg appearance-none"
                      />
                      <div className="flex justify-between text-[9px] font-mono text-neutral-400 mt-0.5">
                        <span>1 格</span>
                        <span>100 格（可手动输入更大值）</span>
                      </div>
                    </div>
                  )}

                  {currentFlowMode === 'auto-fill' && (
                    <div className="p-3 bg-neutral-50 border border-neutral-110 rounded-sm text-neutral-500 text-[11px] space-y-1 animate-fadeIn leading-normal">
                      <span className="font-bold text-neutral-700 block">自动排满</span>
                      <span>
                        可用区域： <strong>{innerPaperWidthMm.toFixed(0)} × {innerPaperHeightMm.toFixed(0)} mm</strong>
                      </span>
                      <span>
                        当前设置下，每排最多 <strong>{actualCols}</strong> 格。
                      </span>
                    </div>
                  )}
                </div>
                {/* 2.2 Grid shape and size selection */}
                <div className="bg-white rounded-sm p-5 border border-[#e5e5e5] space-y-4 shadow-2xs">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-neutral-100">
                    <Layout className="w-4 h-4 text-black" />
                    <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wide">2.2 格子形状</h3>
                  </div>

                  {/* Grid Shape Selector */}
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 tracking-wider uppercase mb-2">形状</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'rounded-square', label: '方形', desc: '支持圆角' },
                        { id: 'circle', label: '圆形', desc: '简洁' }
                      ].map((item) => (
                        (() => {
                          const isSelected =
                            item.id === 'rounded-square'
                              ? isSquareLikeGridShape
                              : settings.gridShape === item.id;

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                const w = settings.gridWidth;
                                const h = settings.gridHeight;
                                const maxRadius = Math.min(w, h) / 2;
                                let radius = 0;
                                if (item.id === 'rounded-square') radius = Math.min(1.5, maxRadius);
                                if (item.id === 'circle') radius = w / 2;
                                setSettings(prev => ({
                                  ...prev,
                                  gridShape: item.id as GridShape,
                                  borderRadius: radius,
                                  ...(item.id === 'circle' ? { gridHeight: w, syncGridSize: true } : {})
                                }));
                              }}
                              className={`py-2 px-1 rounded-sm border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-black border-black text-white'
                                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                              }`}
                            >
                              <div className={`w-4 h-4 border ${isSelected ? 'border-white' : 'border-neutral-700'} ${
                            item.id === 'circle' ? 'rounded-full' : 'rounded-2xs'
                              }`} />
                              <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
                            </button>
                          );
                        })()
                      ))}
                    </div>
                  </div>

                  {/* No spacing gap option (Only for rectangle) */}
                  {isSquareLikeGridShape && (
                    <div className="pt-2 pb-1 border-t border-neutral-100 mt-2">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.noGridGap || false}
                          onChange={(e) =>
                            setSettings(p => ({
                              ...p,
                              noGridGap: e.target.checked,
                              // Legacy `square` state behaves like the square preset.
                              // When shared borders are turned off, switch to the
                              // rounded-square implementation so radius controls work.
                              gridShape: !e.target.checked && p.gridShape === 'square'
                                ? 'rounded-square'
                                : p.gridShape,
                            }))
                          }
                          className="accent-black rounded-sm h-4 w-4 cursor-pointer shrink-0"
                        />
                        <div className="flex flex-col select-none leading-tight font-sans">
                          <span className="text-xs font-bold text-neutral-800">共边框</span>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* Custom Border Radius Slider for Rounded Square */}
                  {isSquareLikeGridShape && !settings.noGridGap && (() => {
                    const maxBorderRadius = Math.max(0, Number((Math.min(settings.gridWidth, settings.gridHeight) / 2).toFixed(1)));
                    const displayRadius = Math.min(settings.borderRadius, maxBorderRadius);
                    return (
                      <div className="pt-1">
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[10px] font-bold text-neutral-400 tracking-wider uppercase mb-1">
                            圆角弧度 Radius
                          </label>
                          <span className="text-xs font-mono text-black font-bold">{displayRadius.toFixed(1)} mm</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={maxBorderRadius}
                          step="0.1"
                          value={displayRadius}
                          onChange={(e) => setSettings(p => {
                            const val = Number(e.target.value);
                            return { ...p, borderRadius: val > maxBorderRadius ? maxBorderRadius : val };
                          })}
                          className="w-full accent-black cursor-pointer h-1.5 bg-neutral-200 rounded-lg appearance-none"
                        />
                        <div className="flex justify-between text-[9px] text-neutral-450 pt-1 font-mono">
                          <span>0 mm (直角)</span>
                          <span>上限 (小值的一半): {maxBorderRadius} mm</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Grid sizes (Width and Height in mm) with linking capabilities */}
                  {settings.gridShape === 'circle' ? (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold text-neutral-400 tracking-wider uppercase">正圆形半径 Circle Radius</label>
                        <span className="text-xs font-mono text-black font-bold">{(settings.gridWidth / 2).toFixed(1)} mm</span>
                      </div>
                      <input
                        type="number"
                        step="0.5"
                        value={settings.gridWidth / 2}
                        onChange={(e) => {
                          const r = e.target.value === '' ? 0 : Number(e.target.value);
                          const d = r * 2;
                          setSettings(p => ({
                            ...p,
                            gridWidth: d,
                            gridHeight: d,
                            borderRadius: r
                          }));
                        }}
                        className="w-full text-xs font-mono bg-white border border-[#e5e5e5] rounded-sm p-2 text-right focus:outline-none focus:border-black"
                      />
                    </div>
                  ) : (
                    <div className="flex items-end gap-2.5">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[10px] font-bold text-neutral-400 tracking-wider uppercase">格子物理宽度</label>
                          <span className="text-xs font-mono text-black font-bold">{settings.gridWidth} mm</span>
                        </div>
                        <input
                          type="number"
                          step="0.5"
                          value={settings.gridWidth}
                          onChange={(e) => {
                            const w = e.target.value === '' ? 0 : Number(e.target.value);
                            const isSynced = settings.syncGridSize !== false;
                            const newHeight = isSynced ? w : settings.gridHeight;
                            setSettings(p => {
                              let nextRadius = p.borderRadius;
                              if (p.gridShape === 'circle') {
                                nextRadius = w / 2;
                              } else {
                                const maxRadius = Math.min(w, newHeight) / 2;
                                if (nextRadius > maxRadius) nextRadius = maxRadius;
                              }
                              return {
                                ...p,
                                gridWidth: w,
                                gridHeight: newHeight,
                                borderRadius: nextRadius
                              };
                            });
                          }}
                          className="w-full text-xs font-mono bg-white border border-[#e5e5e5] rounded-sm p-2 text-right focus:outline-none focus:border-black"
                        />
                      </div>

                      <div className="flex flex-col items-center justify-center pb-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const isSynced = settings.syncGridSize !== false;
                            const nextSynced = !isSynced;
                            setSettings(p => {
                              const newHeight = nextSynced ? p.gridWidth : p.gridHeight;
                              let nextRadius = p.borderRadius;
                              if (p.gridShape === 'circle') {
                                nextRadius = p.gridWidth / 2;
                              } else {
                                const maxRadius = Math.min(p.gridWidth, newHeight) / 2;
                                if (nextRadius > maxRadius) nextRadius = maxRadius;
                              }
                              return {
                                ...p,
                                syncGridSize: nextSynced,
                                gridHeight: newHeight,
                                borderRadius: nextRadius
                              };
                            });
                          }}
                          className={`p-2 rounded-sm border cursor-pointer transition-all ${
                            settings.syncGridSize !== false
                              ? 'bg-black border-black text-white hover:bg-neutral-800'
                              : 'bg-white border-neutral-200 text-neutral-500 hover:text-black hover:bg-neutral-50'
                          }`}
                          title={settings.syncGridSize !== false ? '已链接：同步宽高' : '未链接：各自自定义'}
                        >
                          {settings.syncGridSize !== false ? (
                            <Link className="w-3.5 h-3.5" />
                          ) : (
                            <Unlink className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[10px] font-bold text-neutral-400 tracking-wider uppercase">格子物理高度</label>
                          <span className="text-xs font-mono text-black font-bold">{settings.gridHeight} mm</span>
                        </div>
                        <input
                          type="number"
                          step="0.5"
                          value={settings.gridHeight}
                          onChange={(e) => {
                            const h = e.target.value === '' ? 0 : Number(e.target.value);
                            const isSynced = settings.syncGridSize !== false;
                            const newWidth = isSynced ? h : settings.gridWidth;
                            setSettings(p => {
                              let nextRadius = p.borderRadius;
                              if (p.gridShape === 'circle') {
                                nextRadius = newWidth / 2;
                              } else {
                                const maxRadius = Math.min(newWidth, h) / 2;
                                if (nextRadius > maxRadius) nextRadius = maxRadius;
                              }
                              return {
                                ...p,
                                gridHeight: h,
                                gridWidth: newWidth,
                                borderRadius: nextRadius
                              };
                            });
                          }}
                          className="w-full text-xs font-mono bg-white border border-[#e5e5e5] rounded-sm p-2 text-right focus:outline-none focus:border-black disabled:opacity-40 disabled:bg-neutral-100"
                        />
                      </div>
                    </div>
                  )}

                  {/* Spacing Gap controls (Required Feature) */}
                  {!settings.noGridGap && (
                    <div className="pt-1 space-y-3">
                      <div className="flex justify-between items-center pb-1.5 border-b border-neutral-100">
                        <span className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase">
                          间距定制配置 Spacing Gaps
                        </span>
                      </div>

                      <div className="flex items-end gap-2.5">
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-[10px] font-bold text-neutral-400 tracking-wider uppercase">横向列间距</label>
                            <span className="text-xs font-mono text-black font-bold">{(settings.gridGapCol !== undefined ? settings.gridGapCol : settings.gridGap)} mm</span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            value={settings.gridGapCol !== undefined ? settings.gridGapCol : settings.gridGap}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              const isSynced = settings.syncGaps !== false;
                              setSettings(p => ({
                                ...p,
                                gridGapCol: val,
                                gridGap: val,
                                ...(isSynced ? { gridGapRow: val } : {})
                              }));
                            }}
                            className="w-full text-xs font-mono bg-white border border-[#e5e5e5] rounded-sm p-2 text-right focus:outline-none focus:border-black"
                          />
                        </div>

                        <div className="flex flex-col items-center justify-center pb-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const isSynced = settings.syncGaps !== false;
                              const nextSynced = !isSynced;
                              setSettings(p => {
                                const curCol = p.gridGapCol !== undefined ? p.gridGapCol : p.gridGap;
                                return {
                                  ...p,
                                  syncGaps: nextSynced,
                                  gridGapCol: curCol,
                                  gridGapRow: nextSynced ? curCol : (p.gridGapRow !== undefined ? p.gridGapRow : p.gridGap),
                                  gridGap: curCol
                                };
                              });
                            }}
                            className={`p-2 rounded-sm border cursor-pointer transition-all ${
                              settings.syncGaps !== false
                                ? 'bg-black border-black text-white hover:bg-neutral-800'
                                : 'bg-white border-neutral-200 text-neutral-500 hover:text-black hover:bg-neutral-50'
                            }`}
                            title={settings.syncGaps !== false ? '已链接：同步行列间距' : '未链接：各自自定义'}
                          >
                            {settings.syncGaps !== false ? (
                              <Link className="w-3.5 h-3.5" />
                            ) : (
                              <Unlink className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-[10px] font-bold text-neutral-400 tracking-wider uppercase">纵向行间距</label>
                            <span className="text-xs font-mono text-black font-bold">{(settings.gridGapRow !== undefined ? settings.gridGapRow : settings.gridGap)} mm</span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            value={settings.gridGapRow !== undefined ? settings.gridGapRow : settings.gridGap}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              const isSynced = settings.syncGaps !== false;
                              setSettings(p => ({
                                ...p,
                                gridGapRow: val,
                                gridGap: isSynced ? val : p.gridGap,
                                ...(isSynced ? { gridGapCol: val } : {})
                              }));
                            }}
                            className="w-full text-xs font-mono bg-white border border-[#e5e5e5] rounded-sm p-2 text-right focus:outline-none focus:border-black"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2.3 Grid Background Color (Newly moved here) */}
                <div className="bg-white rounded-sm p-5 border border-[#e5e5e5] space-y-4 shadow-2xs">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-neutral-100">
                    <SlidersHorizontal className="w-4 h-4 text-black" />
                    <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wide">2.3 格子背景颜色</h3>
                  </div>

                  <div className="flex flex-col gap-3">
                    {(settings.weekStartDay === 'sunday' ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6, 0]).map((dayIdx) => {
                        const labels = weekdayLabelSets['zh'][settings.weekStartDay || 'monday'];
                        const labelIdx = settings.weekStartDay === 'sunday' ? dayIdx : (dayIdx === 0 ? 6 : dayIdx - 1);
                        const currentColor = settings.weekdayColors?.[dayIdx] || '#ffffff';

                      return (
                        <div key={dayIdx} className="space-y-1.5">
                          <span className="block text-[10px] font-bold text-neutral-500 uppercase">星期{labels[labelIdx]}</span>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-wrap gap-2">
                              {[
                                { color: '#ffffff', label: '无' },
                                { color: '#f5f5f5', label: '浅灰' },
                                { color: '#fee2e2', label: '淡粉' },
                                { color: '#fef3c7', label: '浅橙' },
                                { color: '#ecfdf5', label: '薄荷' },
                                { color: '#eff6ff', label: '天蓝' },
                                { color: '#faf5ff', label: '丁香' },
                              ].map((item) => (
                                <button
                                  key={item.color}
                                  type="button"
                                  onClick={() => {
                                    setSettings(p => ({
                                      ...p,
                                      weekdayColors: {
                                        ...(p.weekdayColors || {}),
                                        [dayIdx]: item.color === '#ffffff' ? undefined : item.color
                                      }
                                    }));
                                  }}
                                  style={{ backgroundColor: item.color }}
                                  className={`w-6.5 h-6.5 shrink-0 rounded-sm border flex items-center justify-center transition-all cursor-pointer ${
                                    currentColor.toLowerCase() === item.color.toLowerCase()
                                      ? 'border-yellow-400 scale-110 shadow-sm ring-2 ring-black'
                                      : 'border-white hover:scale-105'
                                  }`}
                                  title={item.label}
                                >
                                  {currentColor.toLowerCase() === item.color.toLowerCase() && item.color !== '#ffffff' && (
                                    <Check className="w-3.5 h-3.5 text-white mix-blend-difference" />
                                  )}
                                  {item.color === '#ffffff' && currentColor === '#ffffff' && (
                                    <div className="w-2.5 h-[1px] bg-neutral-300 rotate-45" />
                                  )}
                                </button>
                              ))}
                            </div>

                            {/* HEX custom color picker - aligned with swatches */}
                            <input
                              type="text"
                              maxLength={7}
                              value={currentColor}
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                              onChange={(e) => {
                                const newColor = e.target.value;
                                setSettings(p => ({
                                  ...p,
                                  weekdayColors: {
                                    ...(p.weekdayColors || {}),
                                    [dayIdx]: newColor.toLowerCase() === '#ffffff' || newColor === '' ? undefined : newColor
                                  }
                                }));
                              }}
                              className="w-16 h-6.5 shrink-0 font-mono text-[10px] bg-white border border-neutral-200 rounded-sm px-1.5 uppercase text-center focus:border-neutral-400 focus:outline-none transition-colors ml-auto"
                              placeholder="#FFFFFF"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2.4 Border customizer */}
                <div className="bg-white rounded-sm p-5 border border-[#e5e5e5] space-y-4 shadow-2xs">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-neutral-100">
                    <SlidersHorizontal className="w-4 h-4 text-black" />
                    <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wide">2.4 物理边框微调</h3>
                  </div>

                  {/* Border Width (in mm, highly exact for printing) */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold text-neutral-400 tracking-wider uppercase">
                        边线粗细 Width (mm)
                      </label>
                      <span className="text-xs font-mono text-black font-bold">{settings.borderWidth} mm</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="3.0"
                      step="0.1"
                      value={settings.borderWidth}
                      onChange={(e) => setSettings(p => ({ ...p, borderWidth: Number(e.target.value) }))}
                      className="w-full accent-black cursor-pointer h-1.5 bg-neutral-200 rounded-lg appearance-none"
                    />
                    <div className="flex justify-between text-[9px] text-neutral-400 pt-1 font-mono">
                      <span>极细毛发 (0.1 mm)</span>
                      <span>细黑厚重 (3.0 mm)</span>
                    </div>
                  </div>

                  {/* Border Styles */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'solid', label: '实线 Solid' },
                      { id: 'dashed', label: '虚线 Dash' },
                      { id: 'dotted', label: '点线 Dot' }
                    ].map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setSettings(p => ({ ...p, borderStyle: style.id as GridBorderStyle }))}
                        className={`py-1.5 rounded-sm border text-center text-[10px] font-bold cursor-pointer transition-all ${
                          settings.borderStyle === style.id
                            ? 'bg-black border-black text-white shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>

                  {/* Border Palette Colors */}
                  <div className="pt-1">
                    <label className="block text-[10px] font-bold text-neutral-400 tracking-wider uppercase mb-2">边框墨水色彩</label>
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="flex flex-wrap gap-2">
                        {[
                          { color: '#171717', label: '深炭墨' },
                          { color: '#525252', label: '中铅灰' },
                          { color: '#a3a3a3', label: '浅木铅' },
                          { color: '#b91c1c', label: '印泥红' },
                          { color: '#1d4ed8', label: '群青蓝' },
                          { color: '#047857', label: '松针绿' },
                          { color: '#b45309', label: '复古赭' },
                        ].map((item) => (
                          <button
                            key={item.color}
                            type="button"
                            onClick={() => setSettings(p => ({ ...p, borderColor: item.color }))}
                            style={{ backgroundColor: item.color }}
                            className={`w-6.5 h-6.5 shrink-0 rounded-sm border flex items-center justify-center transition-all cursor-pointer ${
                              settings.borderColor.toLowerCase() === item.color.toLowerCase()
                                ? 'border-yellow-400 scale-110 shadow-sm ring-2 ring-black'
                                : 'border-white hover:scale-105'
                            }`}
                            title={item.label}
                          >
                            {settings.borderColor.toLowerCase() === item.color.toLowerCase() && (
                              <Check className="w-3.5 h-3.5 text-white mix-blend-difference" />
                            )}
                          </button>
                        ))}
                      </div>
                      
                      {/* HEX custom color picker - aligned with swatches */}
                      <input
                          type="text"
                          maxLength={7}
                          value={settings.borderColor}
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                          onChange={(e) => setSettings(p => ({ ...p, borderColor: e.target.value }))}
                          className="w-16 h-6.5 shrink-0 font-mono text-[10px] bg-white border border-neutral-200 rounded-sm px-1.5 uppercase text-center focus:border-neutral-400 focus:outline-none transition-colors ml-auto"
                          placeholder="#000000"
                        />
                    </div>
                  </div>


                </div>
              </div>
            )}

            {/* Tab 3: Text labels and Header systems */}
            {activeSidebarTab === 'text' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center gap-2 pb-1.5 border-b-2 border-neutral-800">
                  <Type className="w-4 h-4 text-black" />
                  <h2 className="text-sm font-bold text-neutral-900 font-sans">3. 文本与细节</h2>
                </div>
                
                {/* 3.1 Custom Grid inner Text Strategy (Mandatory Feature) */}
                <div className="bg-white rounded-sm p-5 border border-[#e5e5e5] space-y-4 shadow-2xs">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-neutral-100">
                    <Type className="w-4 h-4 text-black" />
                    <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wide">3.1 格内文字</h3>
                  </div>

                   {/* Expanded Button Option Grid mode selector (Requested style change to match 1.3 style) */}
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 tracking-wider uppercase mb-1.5 font-sans">文字模式</label>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { value: 'none', label: '不显示', desc: '格子留白。' },
                        { value: 'date-dd', label: '日期', desc: '显示 01-31。' },
                        { value: 'month-mm', label: '月标', desc: '仅在月初显示。' },
                        { value: 'day-num', label: '累计天数', desc: '显示 1, 2, 3...' },
                        { value: 'day-remain', label: '剩余天数', desc: '显示倒计时。' },
                      ].map((item) => (
                        <label 
                          key={item.value} 
                          className={`flex items-start gap-2.5 p-2.5 border rounded-sm cursor-pointer transition-all ${
                            settings.textMode === item.value 
                              ? 'bg-neutral-50 border-black/80 ring-1 ring-black/10' 
                              : 'bg-white border-neutral-200 hover:bg-neutral-50/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="textMode"
                            checked={settings.textMode === item.value}
                            onChange={() => setSettings(p => ({ ...p, textMode: item.value as GridTextMode }))}
                            className="mt-0.5 accent-black"
                          />
                          <div className="flex flex-col gap-0.5 font-sans">
                            <span className="text-xs font-bold text-neutral-800">{item.label}</span>
                            <span className="text-[10px] text-neutral-400 select-none leading-tight">{item.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Month names language controller */}
                  {settings.textMode === 'month-mm' && (
                    <div className="pt-1">
                      <label className="block text-[10px] font-bold text-neutral-400 tracking-wider uppercase mb-1.5 font-sans">月份样式</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setSettings(p => ({ ...p, monthLanguage: 'num' }))}
                          className={`py-1.5 rounded-sm border text-[10px] font-bold cursor-pointer transition-all ${
                            settings.monthLanguage === 'num'
                              ? 'bg-black border-black text-white'
                              : 'bg-white border-neutral-200 text-neutral-600'
                          }`}
                        >
                          纯数字
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettings(p => ({ ...p, monthLanguage: 'zh' }))}
                          className={`py-1.5 rounded-sm border text-[10px] font-bold cursor-pointer transition-all ${
                            settings.monthLanguage === 'zh'
                              ? 'bg-black border-black text-white'
                              : 'bg-white border-neutral-200 text-neutral-600'
                          }`}
                        >
                          汉字
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettings(p => ({ ...p, monthLanguage: 'en' }))}
                          className={`py-1.5 rounded-sm border text-[10px] font-bold cursor-pointer transition-all ${
                            settings.monthLanguage === 'en'
                              ? 'bg-black border-black text-white'
                              : 'bg-white border-neutral-200 text-neutral-600'
                          }`}
                        >
                          英文缩写
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3.2 Flexible title settings (Mandatory Feature) */}
                <div className="bg-white rounded-sm p-5 border border-[#e5e5e5] space-y-4 shadow-2xs">
                  <div className="flex justify-between items-center pb-2.5 border-b border-neutral-100">
                    <div className="flex items-center gap-2">
                      <Layout className="w-4 h-4 text-black" />
                    <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wide">3.2 标题</h3>
                    </div>
                    {/* Toggle check */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showTitle}
                        onChange={(e) => setSettings(p => ({ ...p, showTitle: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-neutral-200 rounded-sm peer peer-checked:bg-black relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-2xs after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4"></div>
                      <span className="ml-2 text-[10px] font-bold text-neutral-700 tracking-wider uppercase">
                        {settings.showTitle ? '显示' : '隐藏'}
                      </span>
                    </label>
                  </div>

                  {settings.showTitle ? (
                    <div className="space-y-4 pt-1 animate-slideDown">
                      {/* Title Text input */}
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 tracking-wider uppercase mb-1">主标题</label>
                        <input
                          type="text"
                          value={settings.titleText}
                          onChange={(e) => setSettings(p => ({ ...p, titleText: e.target.value }))}
                          className="w-full text-xs bg-white border border-[#e5e5e5] rounded-sm px-3 py-2 focus:outline-none focus:border-black text-neutral-950 font-bold"
                          placeholder="输入标题"
                        />
                      </div>

                      {/* Subtitle text */}
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 tracking-wider uppercase mb-1">副标题（选填）</label>
                        <textarea
                          rows={2}
                          value={settings.subtitleText}
                          onChange={(e) => setSettings(p => ({ ...p, subtitleText: e.target.value }))}
                          className="w-full text-xs bg-white border border-[#e5e5e5] rounded-sm p-2 focus:outline-none focus:border-black text-neutral-600 font-medium resize-none"
                          placeholder="输入副标题"
                        />
                      </div>

                      {/* Font size control */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-[10px] font-bold text-neutral-400 tracking-wider uppercase">主字号 (pt)</label>
                            <span className="text-xs font-mono font-bold text-black">{settings.titleFontSize} pt</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="36"
                            step="1"
                            value={settings.titleFontSize}
                            onChange={(e) => setSettings(p => ({ ...p, titleFontSize: Number(e.target.value) }))}
                            className="w-full accent-black cursor-pointer h-1 bg-neutral-200 rounded-lg appearance-none"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-[10px] font-bold text-neutral-400 tracking-wider uppercase">标题间距 (mm)</label>
                            <span className="text-xs font-mono font-bold text-black">{settings.titleSpacing} mm</span>
                          </div>
                          <input
                            type="range"
                            min="2"
                            max="30"
                            step="1"
                            value={settings.titleSpacing}
                            onChange={(e) => setSettings(p => ({ ...p, titleSpacing: Number(e.target.value) }))}
                            className="w-full accent-black cursor-pointer h-1 bg-neutral-200 rounded-lg appearance-none"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-neutral-50 border border-neutral-150 rounded-sm text-neutral-400 text-[10px] font-bold uppercase tracking-wider text-center leading-relaxed">
                      标题已隐藏。
                    </div>
                  )}
                </div>

                {/* 3.3 Extras / Addons (Weekends, statistics footer, etc.) */}
                <div className="bg-white rounded-sm p-5 border border-[#e5e5e5] space-y-3 shadow-2xs">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-neutral-100">
                    <SlidersHorizontal className="w-4 h-4 text-black" />
                    <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wide">3.3 标记</h3>
                  </div>

                  {/* Weekend differentiation toggles */}
                  {settings.textMode !== 'month-mm' && (
                    <label className="flex items-center justify-between cursor-pointer py-1">
                      <span className="text-xs font-semibold text-neutral-700">突出周末颜色</span>
                      <input
                        type="checkbox"
                        checked={settings.highlightWeekends}
                        onChange={(e) => setSettings(p => ({ ...p, highlightWeekends: e.target.checked }))}
                        className="accent-black h-4 w-4 border-neutral-300 rounded-sm"
                      />
                    </label>
                  )}

                  <label className="flex items-center justify-between cursor-pointer py-1">
                    <span className="text-xs font-semibold text-neutral-700">显示 Sa/Su 标注</span>
                    <input
                      type="checkbox"
                      checked={settings.showWeekendLabels}
                      onChange={(e) => setSettings(p => ({ ...p, showWeekendLabels: e.target.checked }))}
                      className="accent-black h-4 w-4 border-neutral-300 rounded-sm"
                    />
                  </label>

                  {/* Show summary stats toggle */}
                  <label className="flex items-center justify-between cursor-pointer py-1">
                    <span className="text-xs font-semibold text-neutral-700">显示底部统计</span>
                    <input
                      type="checkbox"
                      checked={settings.showStats}
                      onChange={(e) => setSettings(p => ({ ...p, showStats: e.target.checked }))}
                      className="accent-black h-4 w-4 border-neutral-300 rounded-sm"
                    />
                  </label>
                </div>

                {/* 3.4 Blackout / Filling Strategy (New Feature) */}
                <div className="bg-white rounded-sm p-4.5 border border-[#e5e5e5] space-y-3 shadow-2xs">
                  <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                    <SlidersHorizontal className="w-4 h-4 text-black" />
                    <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wide">3.4 填充</h3>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-neutral-400 tracking-wider uppercase">填充模式</label>
                    <div className="flex flex-col gap-1.5 font-sans">
                      {[
                        { id: 'none', label: '不填充', desc: '保持空白。' },
                        { id: 'yesterday', label: '填充到昨天', desc: '按今天自动填充。' },
                        { id: 'custom', label: '手动填充', desc: '点击预览区格子切换。' }
                      ].map((item) => (
                        <label 
                          key={item.id} 
                          className={`flex items-start gap-2.5 p-2 border rounded-sm cursor-pointer transition-all ${
                            (settings.blackoutMode || 'none') === item.id 
                              ? 'bg-neutral-50 border-black/80 ring-1 ring-black/5' 
                              : 'bg-white border-neutral-200 hover:bg-neutral-50/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="blackoutMode"
                            checked={(settings.blackoutMode || 'none') === item.id}
                            onChange={() => setSettings(p => ({ ...p, blackoutMode: item.id as any }))}
                            className="mt-0.5 accent-black font-sans"
                          />
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-neutral-800">{item.label}</span>
                            <span className="text-[9.5px] text-neutral-400 leading-tight">{item.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {settings.blackoutMode === 'custom' && (
                    <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-sm space-y-2 animate-fadeIn font-sans">
                      <p className="text-[10px] text-neutral-500 leading-normal">
                        已启用手动填充。点击右侧预览区格子即可切换。
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSettings(prev => ({ ...prev, blackedOutDates: [] }));
                        }}
                        className="w-full text-center text-[10px] uppercase font-bold py-1.5 border border-red-200 bg-red-50/40 text-red-600 hover:bg-red-50 rounded-sm active:scale-95 cursor-pointer transition-all"
                      >
                        清空手动填充
                      </button>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Template engine block (Senior addition) */}
            <div id="template-sharing-block" className="bg-white rounded-sm p-5 border border-[#e5e5e5] space-y-4 mt-6 shadow-2xs">
              <div className="flex items-center gap-2 pb-2.5 border-b border-neutral-100">
                <Bookmark className="w-4 h-4 text-black" />
                <h3 className="flex items-center gap-2 text-xs font-bold text-neutral-800 tracking-wide">
                  <span>配置共享</span>
                  <span className="rounded-sm border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-700">
                    Beta
                  </span>
                </h3>
              </div>

              {/* Tab Selector */}
              <div className="grid grid-cols-2 gap-1.5 bg-neutral-100 p-1 rounded-sm text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setTemplateTab('export');
                    setImportError('');
                    setIsImportSuccess(false);
                  }}
                  className={`py-1.5 rounded-sm transition-all cursor-pointer text-center ${templateTab === 'export' ? 'bg-white text-black shadow-3xs' : 'text-neutral-500 hover:text-black'}`}
                >
                  📤 导出
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTemplateTab('import');
                    setImportError('');
                    setIsImportSuccess(false);
                  }}
                  className={`py-1.5 rounded-sm transition-all cursor-pointer text-center ${templateTab === 'import' ? 'bg-white text-black shadow-3xs' : 'text-neutral-500 hover:text-black'}`}
                >
                  📥 导入
                </button>
              </div>

              {templateTab === 'export' ? (
                <div className="space-y-3.5 animate-fadeIn">
                  <p className="text-[10px] text-neutral-400 leading-normal">
                    复制后可直接分享当前配置。
                  </p>
                  
                  <div className="space-y-3 animate-fadeIn">
                    <textarea
                      ref={exportRef}
                      readOnly
                      value={encodeSettingsText(settings)}
                      onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                      className="w-full text-[10px] font-mono p-2.5 bg-neutral-50 border border-[#e5e5e5] rounded-sm text-neutral-600 focus:outline-none min-h-[46px] resize-none overflow-hidden break-all whitespace-pre-wrap select-all cursor-pointer"
                      title="点击全选配置"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const code = encodeSettingsText(settings);
                        navigator.clipboard.writeText(code).then(() => {
                          setIsCopiedNotify(true);
                          setTimeout(() => setIsCopiedNotify(false), 2000);
                        }).catch(() => {
                          alert(`由于部分浏览器安全规范限制，请直接双击或点击上方输入框手动全选并复制配置代码！\n\n您的配置代码为：\n${code}`);
                        });
                      }}
                      className={`w-full py-2.5 rounded-sm font-bold text-xs shadow-xs transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer border ${
                        isCopiedNotify
                          ? 'bg-green-600 border-green-600 text-white'
                          : 'bg-black hover:bg-neutral-800 border-black text-white hover:shadow-sm'
                      }`}
                    >
                      {isCopiedNotify ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>复制配置</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5 animate-fadeIn">
                  <p className="text-[10px] text-neutral-400 leading-normal">
                    粘贴共享码后即可恢复配置。
                  </p>
                  <div>
                    <textarea
                      ref={importRef}
                      placeholder="粘贴共享码"
                      value={importText}
                      onChange={(e) => {
                        setImportText(e.target.value);
                        setImportError('');
                        setIsImportSuccess(false);
                      }}
                      className="w-full text-[10px] font-mono p-2.5 bg-neutral-50 border border-[#e5e5e5] rounded-sm text-neutral-800 placeholder:text-neutral-450 focus:outline-none focus:border-neutral-500 min-h-[46px] resize-none overflow-hidden break-all whitespace-pre-wrap"
                    />
                  </div>

                  {importError && (
                    <div className="text-[10px] text-red-600 bg-red-50 p-2 rounded-sm text-center font-bold border border-red-200 leading-tight">
                      导入失败：{importError}
                    </div>
                  )}

                  {isImportSuccess && (
                    <div className="text-[10px] text-green-600 bg-green-50/60 border border-green-200 p-2 rounded-sm text-center font-bold">
                      导入成功。
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const decoded = decodeSettingsText(importText);
                      if (decoded) {
                        setSettings(decoded);
                        setIsImportSuccess(true);
                        setImportError('');
                        setImportText('');
                      } else {
                        setImportError('格式不正确，请检查共享码。');
                        setIsImportSuccess(false);
                      }
                    }}
                    disabled={!importText.trim()}
                    className={`w-full text-center text-xs py-2 rounded-sm font-bold transition-all shadow-sm ${importText.trim() ? 'bg-black hover:bg-neutral-800 text-white cursor-pointer active:scale-95' : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'}`}
                  >
                    导入配置
                  </button>
                </div>
              )}
            </div>

            {/* Simple Reset settings trigger */}
            <div className="pt-2">
              <button
                onClick={() => {
                  if (confirm('确定恢复默认设置吗？')) {
                    setSettings({
                      startDate: defaultStartDate,
                      endDate: defaultEndDate,
                      paperPreset: 'A4',
                      paperWidth: 210,
                      paperHeight: 297,
                      showTitle: true,
                      titleText: '时格 · TokiMasu',
                      subtitleText: '笔落一格，度过一日。',
                      titleFontSize: 18,
                      titleSpacing: 12,
                      gridWidth: 15,
                      gridHeight: 15,
                      syncGridSize: true,
                      gridGap: 0,
                      gridShape: 'square',
                      borderRadius: 2,
                      borderWidth: 0.5,
                      borderStyle: 'solid',
                      borderColor: '#171717',
                      textMode: 'day-remain',
                      monthLanguage: 'zh',
                      innerPattern: 'empty',
                      highlightWeekends: false,
                      showWeekendLabels: false,
                      showWeekdayHeaders: true,
                      weekdayLanguage: 'zh',
                      showWeekNumbers: false,
                      showStats: false,
                      paperPadding: 15,
                      orientation: 'horizontal',
                      flowMode: 'week-wrap',
                      weeksPerLine: 1,
                      blackoutMode: 'none',
                      blackedOutDates: [],
                      noGridGap: true,
                      weekStartDay: 'monday',
                    });
                  }
                }}
                className="w-full border border-neutral-300 hover:bg-neutral-50 hover:text-black text-neutral-500 text-xs py-2 px-3 rounded-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer font-bold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>恢复默认</span>
              </button>
              <p className="mt-2 text-center text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                Built by iceven
              </p>
            </div>

          </div>
        </section>
        )}

        {/* Right workspace: Scaled Virtual Paper Sheet and Desk Background */}
        <section 
          ref={containerRef}
          className={`print-workspace flex-1 relative select-none min-h-[500px] lg:h-full overflow-hidden transition-all duration-300 ${
            isFullScreen 
              ? 'fixed inset-0 z-[9999] bg-[#0c0c0e] p-3 sm:p-6' 
              : 'bg-[#e2e2e5]'
          }`}
        >
          {isFullScreen && (
            <div className="no-print absolute top-3 left-1/2 -translate-x-1/2 sm:top-5 z-50 bg-neutral-900/88 backdrop-blur-md px-2 py-2 rounded-full border border-white/10 shadow-xl flex items-center gap-2 text-[11px] select-none animate-fadeIn font-sans">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-neutral-200 hover:text-white cursor-pointer transition-all active:scale-95 px-3 py-1.5 rounded-full hover:bg-white/10"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>打印</span>
              </button>
              <button
                type="button"
                onClick={handleExitFullscreen}
                className="flex items-center gap-1.5 text-red-100 bg-red-500/20 border border-red-400/20 hover:bg-red-500/30 hover:text-white cursor-pointer transition-all active:scale-95 px-3 py-1.5 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>退出</span>
              </button>
            </div>
          )}

          {/* Real scrollable workspace viewport */}
          <div
            className={`print-viewport w-full h-full overflow-auto flex ${
              isFullScreen
                ? (isMobileViewport ? 'px-4 pt-20 pb-32 items-start justify-center' : 'p-12')
                : 'p-12'
            }`}
          >
            {/* Virtual desktop ambient wrapper */}
            <div 
              className={`relative flex items-center justify-center print-box-wrapper shrink-0 shadow-[0_10px_30px_rgba(0,0,0,0.1),_0_1px_3px_rgba(0,0,0,0.05)] ${
                isFullScreen && isMobileViewport ? 'mx-auto my-0' : 'm-auto'
              }`}
              style={{
                width: `${settings.paperWidth * finalScale}px`,
                height: `${settings.paperHeight * finalScale}px`,
              }}
            >
              {/* Alert centered consistently with the wrapper/paper */}
              {(settings.paperWidth === 0 || settings.paperHeight === 0 || settings.gridWidth === 0 || settings.gridHeight === 0) && (
                <div 
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none select-none z-50 w-max"
                >
                  <div className="text-red-600 font-bold bg-white/95 px-5 py-4 rounded-lg shadow-xl backdrop-blur-sm border border-red-200 text-sm animate-fadeIn text-center flex flex-col gap-2 min-w-[240px]">
                    <AlertTriangle className="w-6 h-6 mx-auto text-red-500 mb-1" />
                    <span>尺寸设置提示</span>
                    <span className="text-xs text-neutral-500 font-normal">纸张或格子的物理尺寸不能为 0，请在左侧面板重新调整参数。</span>
                  </div>
                </div>
              )}

            {/* Real 1:1 millimetric DOM Canvas */}
            <div
              id="print-canvas"
              className="bg-white border border-neutral-300 absolute left-0 top-0 select-text origin-top-left flex flex-col"
              style={{
                width: `${settings.paperWidth}mm`,
                height: `${settings.paperHeight}mm`,
                padding: `${settings.paperPadding}mm`,
                boxSizing: 'border-box',
                transform: `scale(${zoom})`,
                display: (settings.paperWidth === 0 || settings.paperHeight === 0) ? 'none' : 'flex'
              }}
            >
              {/* Actual paper layout inside */}
              {!(settings.paperWidth === 0 || settings.paperHeight === 0 || settings.gridWidth === 0 || settings.gridHeight === 0) && (
                <div className="flex flex-col h-full w-full justify-between select-text text-neutral-900">
                
                {/* Upper paper elements and grid layout */}
                <div className="flex-1 flex flex-col">
                  
                  {/* Flexible editable Header title (Mandatory Feature) */}
                  {settings.showTitle && (
                    <header 
                      className="mb-6 block border-b border-black/80"
                      style={{ 
                        paddingBottom: '2.5mm',
                        marginBottom: `${settings.titleSpacing}mm`,
                        textAlign: 'left'
                      }}
                    >
                      <h2 
                        className="font-bold tracking-tight text-neutral-950 font-serif leading-none"
                        style={{ fontSize: `${settings.titleFontSize}pt` }}
                      >
                        {settings.titleText || '时格'}
                      </h2>
                      {settings.subtitleText && (
                        <p 
                          className="text-neutral-500 font-normal mt-1.5 whitespace-pre-line tracking-wide"
                          style={{ fontSize: `${settings.titleFontSize * 0.52}pt` }}
                        >
                          {settings.subtitleText}
                        </p>
                      )}
                    </header>
                  )}

                  {/* Calendar core Grid representation */}
                  {days.length > 0 ? (
                    <div 
                      className="w-full flex-grow flex flex-col items-center justify-center"
                    >
                      {/* Optional Weekday Headers (for 'week-wrap' mode) */}
                      {currentFlowMode === 'week-wrap' && (settings.showWeekdayHeaders ?? true) && settings.orientation === 'horizontal' && (
                        <div 
                          style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${7 * customWeeksPerLine}, ${settings.gridWidth}mm)`,
                            columnGap: `${Math.max(0, gapCol)}mm`,
                            width: 'max-content',
                            marginBottom: `${Math.max(0, gapRow)}mm`,
                          }}
                          className="select-none"
                        >
                          {Array.from({ length: customWeeksPerLine }).flatMap((_, wIdx) => {
                            return weekdayLabels.map((label, lIdx) => ({ label, key: `${wIdx}-${lIdx}` }));
                          }).map(({ label, key }) => (
                            <div 
                              key={key} 
                              style={{ width: `${settings.gridWidth}mm` }}
                              className="text-[9px] font-bold text-center text-neutral-400 select-none uppercase tracking-wider font-sans"
                            >
                              {label}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-row items-center justify-center">
                        {/* Vertical Weekday labels */}
                        {currentFlowMode === 'week-wrap' && (settings.showWeekdayHeaders ?? true) && settings.orientation === 'vertical' && (
                          <div 
                            style={{
                              display: 'grid',
                              gridTemplateRows: `repeat(${7 * customWeeksPerLine}, ${settings.gridHeight}mm)`,
                              rowGap: `${Math.max(0, gapRow)}mm`,
                              marginRight: `${Math.max(0, gapCol)}mm`,
                              height: 'max-content',
                              paddingTop: '0.2mm',
                            }}
                            className="select-none"
                          >
                            {Array.from({ length: customWeeksPerLine }).flatMap((_, wIdx) => {
                              return weekdayLabels.map((label, lIdx) => ({ label, key: `${wIdx}-${lIdx}` }));
                            }).map(({ label, key }) => (
                              <div 
                                key={key} 
                                style={{ height: `${settings.gridHeight}mm` }}
                                className="text-[9px] font-bold text-right text-neutral-400 select-none uppercase tracking-wider font-sans pr-1.5 flex items-center justify-end"
                              >
                                {label}
                              </div>
                            ))}
                          </div>
                        )}

                        <div 
                          style={{
                            display: 'grid',
                            gridTemplateColumns: settings.orientation === 'horizontal' 
                              ? `repeat(${actualCols}, ${settings.gridWidth}mm)` 
                              : undefined,
                            gridTemplateRows: settings.orientation === 'vertical' 
                              ? `repeat(${actualRows}, ${settings.gridHeight}mm)` 
                              : undefined,
                            gridAutoFlow: settings.orientation === 'vertical' 
                              ? 'column' 
                              : 'row',
                            columnGap: `${Math.max(0, gapCol)}mm`,
                            rowGap: `${Math.max(0, gapRow)}mm`,
                            width: 'max-content',
                            maxWidth: '100%',
                            margin: '0 auto',
                          }}
                          className="transition-all"
                        >
                             {listItems.map((item, itemIdx) => {
                            const isVertical = settings.orientation === 'vertical';
                            const getItemAt = (c: number, r: number) => {
                              if (c < 0 || c >= actualCols || r < 0 || r >= actualRows) return null;
                              const idx = isVertical ? (c * actualRows + r) : (r * actualCols + c);
                              return listItems[idx] || null;
                            };

                            const colIdx = isVertical
                              ? Math.floor(itemIdx / actualRows)
                              : itemIdx % actualCols;

                            const rowIdx = isVertical
                              ? itemIdx % actualRows
                              : Math.floor(itemIdx / actualCols);

                            let bTop = `${settings.borderWidth}mm`;
                            let bRight = `${settings.borderWidth}mm`;
                            let bBottom = `${settings.borderWidth}mm`;
                            let bLeft = `${settings.borderWidth}mm`;

                            let placeholderColor = 'transparent';
                            let tColor = item.type === 'placeholder' ? placeholderColor : settings.borderColor;
                            let rColor = item.type === 'placeholder' ? placeholderColor : settings.borderColor;
                            let bColor = item.type === 'placeholder' ? placeholderColor : settings.borderColor;
                            let lColor = item.type === 'placeholder' ? placeholderColor : settings.borderColor;

                            if (useSharedBorders) {
                              if (colIdx > 0) bLeft = '0px';
                              if (rowIdx > 0) bTop = '0px';

                              if (item.type === 'placeholder') {
                                const rightItem = getItemAt(colIdx + 1, rowIdx);
                                if (rightItem && rightItem.type === 'day') {
                                  rColor = settings.borderColor;
                                }
                                const bottomItem = getItemAt(colIdx, rowIdx + 1);
                                if (bottomItem && bottomItem.type === 'day') {
                                  bColor = settings.borderColor;
                                }
                              }
                            }

                            if (item.type === 'placeholder') {
                              if (tColor === placeholderColor) bTop = '0px';
                              if (rColor === placeholderColor) bRight = '0px';
                              if (bColor === placeholderColor) bBottom = '0px';
                              if (lColor === placeholderColor) bLeft = '0px';

                              const baseStyles: React.CSSProperties = {
                                width: `${settings.gridWidth}mm`,
                                height: `${settings.gridHeight}mm`,
                                boxSizing: 'border-box',
                                borderTopWidth: bTop,
                                borderRightWidth: bRight,
                                borderBottomWidth: bBottom,
                                borderLeftWidth: bLeft,
                                borderTopColor: tColor,
                                borderRightColor: rColor,
                                borderBottomColor: bColor,
                                borderLeftColor: lColor,
                                borderTopStyle: settings.borderStyle,
                                borderRightStyle: settings.borderStyle,
                                borderBottomStyle: settings.borderStyle,
                                borderLeftStyle: settings.borderStyle,
                                position: 'relative',
                                zIndex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              };
  
                              // Rounded geometry configurations
                              if (settings.gridShape === 'square') {
                                baseStyles.borderRadius = '0';
                              } else if (settings.gridShape === 'rounded-square') {
                                baseStyles.borderRadius = `${settings.noGridGap ? 0 : settings.borderRadius}mm`;
                              } else if (settings.gridShape === 'circle') {
                                baseStyles.borderRadius = '50%';
                              }
  
                              return (
                                <div 
                                  key={`placeholder-${itemIdx}`}
                                  style={baseStyles}
                                  className="select-none pointer-events-none"
                                />
                              );
                            }
  
                            const day = item.dayInfo!;
  
                            // Dynamic rendering styling properties based on shape, border and sizes
                            const baseStyles: React.CSSProperties = {
                              width: `${settings.gridWidth}mm`,
                              height: `${settings.gridHeight}mm`,
                              boxSizing: 'border-box',
                              borderTopWidth: bTop,
                              borderRightWidth: bRight,
                              borderBottomWidth: bBottom,
                              borderLeftWidth: bLeft,
                              borderTopColor: tColor,
                              borderRightColor: rColor,
                              borderBottomColor: bColor,
                              borderLeftColor: lColor,
                              borderStyle: settings.borderStyle,
                              position: 'relative',
                              zIndex: 10,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'border-color 0.15s',
                            };
  
                            // Rounded geometry configurations
                            if (settings.gridShape === 'square') {
                              baseStyles.borderRadius = '0';
                            } else if (settings.gridShape === 'rounded-square') {
                              baseStyles.borderRadius = `${settings.noGridGap ? 0 : settings.borderRadius}mm`;
                            } else if (settings.gridShape === 'circle') {
                              baseStyles.borderRadius = '50%';
                            }

                            // Weekend styling is split into independent color and label toggles.
                            const shouldHighlightWeekend = settings.highlightWeekends && day.isWeekend && settings.textMode !== 'month-mm';
                            const shouldShowWeekendLabel = settings.showWeekendLabels && day.isWeekend;
                            
                            // Blackout mode calculation
                            let isBlackedOut = false;
                            if (settings.blackoutMode === 'yesterday') {
                              const todayStr = formatDateLocal(new Date());
                              isBlackedOut = day.dateStr < todayStr;
                            } else if (settings.blackoutMode === 'custom') {
                              isBlackedOut = settings.blackedOutDates?.includes(day.dateStr) || false;
                            }

                            const fontColorClass = isBlackedOut
                              ? 'text-white font-bold opacity-90'
                              : (shouldHighlightWeekend
                                ? (day.dayOfWeek === 0 ? 'text-red-500 font-bold' : 'text-blue-500 font-bold') 
                                : 'text-neutral-600');
                            
                            // Slight dotted borders for weekends if normal border is solid for gorgeous look
                            if (shouldHighlightWeekend) {
                              if (settings.borderStyle === 'solid') {
                                baseStyles.borderStyle = 'solid';
                              }
                            }

                            // Scale grid fonts elegantly so they NEVER overflow
                            const gridSideLen = Math.min(settings.gridWidth, settings.gridHeight);
                            const fontMmSize = gridSideLen * 0.35; // 35% of minimal side
                            
                            // Determine grid text layout
                            let textToRender = '';
                            if (settings.textMode === 'date-dd') {
                              textToRender = String(day.dayNum).padStart(2, '0');
                            } else if (settings.textMode === 'month-mm') {
                              if (day.isFirstOfMonth || day.isFirstOfDayList) {
                                textToRender = day.monthName;
                              }
                            } else if (settings.textMode === 'day-num') {
                              textToRender = String(day.index + 1);
                            } else if (settings.textMode === 'day-remain') {
                              textToRender = String(totalDays - day.index);
                            }

                            // Render Weekend background color securely (avoid shorthand conflicts)
                            let backgroundStyle: string | undefined = undefined;
                            if (isBlackedOut) {
                              backgroundStyle = settings.borderColor;
                            } else if (settings.weekdayColors?.[day.dayOfWeek]) {
                              backgroundStyle = settings.weekdayColors[day.dayOfWeek];
                            }

                            const handleCellClick = () => {
                              if (settings.blackoutMode === 'custom') {
                                const currentDates = settings.blackedOutDates || [];
                                let newDates = [];
                                if (currentDates.includes(day.dateStr)) {
                                  newDates = currentDates.filter(d => d !== day.dateStr);
                                } else {
                                  newDates = [...currentDates, day.dateStr];
                                }
                                setSettings(prev => ({
                                  ...prev,
                                  blackedOutDates: newDates
                                }));
                              }
                            };

                            return (
                              <div 
                                key={day.index}
                                style={{ ...baseStyles, background: backgroundStyle }}
                                onClick={handleCellClick}
                                className={`group select-none transition-all ${
                                  settings.blackoutMode === 'custom' 
                                    ? 'cursor-pointer hover:opacity-80 active:scale-95 shadow-sm hover:border-black/50' 
                                    : ''
                                }`}
                                title={`日期: ${day.dateStr} (周${['日','一','二','三','四','五','六'][day.dayOfWeek]})`}
                              >
                                {/* Inner patterns: always empty/blank now */}

                                {/* Weekend day corner superscript label (very elegant planner touch) */}
                                {shouldShowWeekendLabel && !isBlackedOut && gridSideLen >= 9 && (
                                  <span 
                                    style={{ 
                                      fontSize: `${gridSideLen * 0.2}mm`, 
                                      borderStyle: 'none',
                                      top: '0.6mm',
                                      right: '0.8mm'
                                    }}
                                    className="absolute opacity-40 text-[9px] font-mono select-none"
                                  >
                                    {day.dayOfWeek === 0 ? 'Su' : 'Sa'}
                                  </span>
                                )}

                                {/* Primary characters inside grid */}
                                {textToRender && !isBlackedOut && (
                                  <span 
                                    style={{ 
                                      fontSize: `${fontMmSize}mm`,
                                      lineHeight: 1,
                                      letterSpacing: '-0.3px'
                                    }}
                                    className={`pointer-events-none grid-number-font tracking-tighter ${fontColorClass}`}
                                  >
                                    {textToRender}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-grow flex items-center justify-center border-2 border-dashed border-neutral-200 rounded-xl p-12 text-center text-neutral-400">
                      请选择合法的日期范围生成打卡时间格。
                    </div>
                  )}

                </div>

                {/* Flexible exact footer metadata block */}
                {settings.showStats && (
                  <footer 
                    style={{ fontSize: '7.5pt' }}
                    className="mt-6 pt-4 border-t border-dotted border-neutral-300 flex justify-between text-neutral-400 font-mono tracking-normal leading-relaxed print:mt-12"
                  >
                    <span>起止: {settings.startDate} 至 {settings.endDate}</span>
                    <span className="font-bold text-neutral-500">
                        共计 {totalDays} 个物理时间格 ({actualRows} 行 × {actualCols} 列) · TOKIMASU
                    </span>
                  </footer>
                )}

              </div>
              )}
            </div>
          </div>
          </div>

          {/* Floated Zoom Control Panel */}
          <div className="no-print absolute bottom-4 left-4 right-4 sm:right-auto z-20 max-w-[calc(100%-2rem)] bg-white/96 backdrop-blur-md px-3 py-3 sm:px-3.5 sm:py-2.5 border border-neutral-200/90 shadow-lg rounded-2xl flex flex-col sm:flex-row sm:flex-nowrap sm:items-center gap-3 sm:gap-2 select-none">
            <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setIsAutoFit(false);
                  setZoom(prev => parseFloat(Math.max(0.1, prev - 0.05).toFixed(3)));
                }}
                className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-600 hover:text-black cursor-pointer transition-all duration-150 active:scale-95 flex items-center justify-center border border-neutral-200"
                title="缩小 Zoom Out -5%"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              {!isEditingZoom ? (
                <button
                  type="button"
                  onClick={() => {
                    setTempZoomValue(Math.round(zoom * 100).toString());
                    setIsEditingZoom(true);
                  }}
                  className="text-xs font-mono font-bold text-neutral-800 px-2.5 py-1.5 text-center min-w-[62px] bg-neutral-100/70 hover:bg-neutral-100 rounded-lg border border-neutral-200 cursor-pointer outline-none hover:text-black transition-all hover:border-neutral-300"
                  title="点击输入自定义比例 Click to input custom zoom"
                >
                  {Math.round(zoom * 100)}%
                </button>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={tempZoomValue}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^0-9.%]/g, '');
                      setTempZoomValue(cleaned);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleZoomSubmit();
                      } else if (e.key === 'Escape') {
                        setIsEditingZoom(false);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        handleZoomSubmit();
                      }, 120);
                    }}
                    autoFocus
                    onFocus={(e) => e.target.select()}
                    className="text-xs font-mono font-bold text-neutral-800 px-1 py-1.5 text-center w-[62px] bg-white rounded-lg border border-neutral-400 outline-none focus:border-black"
                    style={{ textAlign: 'center' }}
                    title="输入百分比并按回车确认 (例如: 85)"
                  />

                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 bg-white border border-neutral-200 rounded-lg shadow-md py-1 flex flex-col min-w-[65px]">
                    <div className="px-1.5 py-0.5 text-[8px] text-neutral-400 font-mono text-center border-b border-neutral-100 mb-1 font-bold select-none">
                      快速预设
                    </div>
                    {['25', '50', '75', '100', '125', '150', '200'].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const val = parseFloat(pct) / 100;
                          setIsAutoFit(false);
                          setZoom(val);
                          setIsEditingZoom(false);
                        }}
                        className="w-full text-center py-0.5 text-[10px] font-mono text-neutral-600 hover:bg-neutral-100 hover:text-black font-semibold transition-colors duration-100 cursor-pointer"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsAutoFit(false);
                  setZoom(prev => parseFloat(Math.min(3.0, prev + 0.05).toFixed(3)));
                }}
                className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-600 hover:text-black cursor-pointer transition-all duration-150 active:scale-95 flex items-center justify-center border border-neutral-200 animate-fadeIn"
                title="放大 Zoom In +5%"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <div className="hidden sm:block w-[1px] h-4 bg-neutral-200 mx-1"></div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2 flex-1">
              <button
                type="button"
                onClick={() => {
                  setIsAutoFit(true);
                }}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-bold rounded-xl sm:rounded-sm border transition-all duration-150 active:scale-95 cursor-pointer hover:shadow-2xs flex-1 sm:flex-none min-w-[96px] ${
                  isAutoFit 
                    ? 'bg-neutral-900 border-neutral-900 text-white shadow-xs' 
                    : 'bg-white border-neutral-350 text-neutral-700 hover:bg-neutral-50 hover:text-black'
                }`}
                title="点击恢复纸张画布自适应窗口大小 Fit viewport"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>自适应</span>
              </button>

              {!isFullScreen && (
                <button
                  type="button"
                  onClick={handleEnterFullscreen}
                  className="bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:text-black hover:border-neutral-450 px-3 py-2 sm:py-1.5 text-xs font-bold rounded-xl sm:rounded-sm border transition-all duration-150 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 flex-1 sm:flex-none min-w-[110px]"
                  title="进入全屏沉浸预览模式 (按 Esc 退出)"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="sm:hidden">全屏预览</span>
                  <span className="hidden sm:inline">全屏预览</span>
                </button>
              )}
            </div>
          </div>

          {/* Floated Toolbar: Real-scale dimensions readouts and overflow alerts */}
          <div
            className={`no-print absolute left-4 right-4 bottom-36 sm:left-auto sm:right-4 sm:bottom-4 bg-white/96 rounded-2xl border border-neutral-200/90 shadow-lg select-text z-20 overflow-hidden transition-[width,padding,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isToolbarExpanded ? 'p-4 w-auto sm:w-80 shadow-lg' : 'p-2.5 w-auto sm:w-32 hover:bg-neutral-50'
            }`}
          >
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => setIsToolbarExpanded(prev => !prev)}
                className="group flex items-center justify-between gap-2 w-full text-left font-sans cursor-pointer"
                title={isToolbarExpanded ? '收起' : '展开'}
              >
                <span
                  className={`text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-sans flex items-center gap-1 whitespace-nowrap transition-opacity duration-200 ${
                    isToolbarExpanded ? 'opacity-100' : 'opacity-90 group-hover:opacity-100'
                  }`}
                >
                  {isToolbarExpanded ? '📐 尺寸' : '📐 尺寸'}
                </span>
                <ChevronRight
                  className={`shrink-0 text-neutral-400 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:text-black ${
                    isToolbarExpanded ? 'w-4 h-4 rotate-90' : 'w-3.5 h-3.5 rotate-0'
                  }`}
                />
              </button>

              <div
                className={`overflow-hidden transition-[max-height,opacity,transform,margin-top] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isToolbarExpanded ? 'max-h-80 opacity-100 translate-y-0 mt-3.5' : 'max-h-0 opacity-0 -translate-y-1 mt-0'
                }`}
                aria-hidden={!isToolbarExpanded}
              >
                <div className="w-full sm:w-[282px] shrink-0 flex flex-col gap-3.5">
                  {/* Real scale dimensions read out */}
                  <div className="flex flex-col gap-1 pr-1">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs font-sans">
                      <span className="text-neutral-500 font-medium font-sans">纸张:</span>
                      <span className="font-bold text-neutral-800 text-right font-sans">{settings.paperWidth} × {settings.paperHeight} mm</span>
                      <span className="text-neutral-500 font-medium font-sans">格子:</span>
                      <span className="font-bold text-neutral-800 text-right font-sans">{gridTotalWidthMm.toFixed(1)} × {gridTotalHeightMm.toFixed(1)} mm</span>
                      <span className="text-neutral-500 font-medium font-sans">可用:</span>
                      <span className="font-mono text-neutral-800 text-right font-sans">{innerPaperWidthMm.toFixed(1)} × {innerPaperHeightMm.toFixed(1)} mm</span>
                    </div>
                  </div>

                  {/* Warning: If Grid overflows the Paper page! (Amazing craftsman check) */}
                  {isOverflow && (
                    <div className="p-2.5 bg-amber-50 text-amber-800 rounded-sm text-[10px] border border-amber-200 flex items-center gap-1.5 leading-relaxed font-sans">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <span className="font-bold">元素可能超过纸张范围。</span>
                        请注意检查。
                      </div>
                    </div>
                  )}

                  {/* Helpful sandbox warning about sandboxed browsers */}
                  <div className="text-[9px] text-neutral-400 bg-neutral-50 border border-neutral-150 p-2 rounded-sm leading-relaxed font-sans">
                    打印时建议开启<b>背景图形</b>，并将<b>边距</b>设为无。
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
