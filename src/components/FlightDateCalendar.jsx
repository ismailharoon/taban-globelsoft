import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plane, X } from 'lucide-react';

const MONTH_NAMES = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER'
];

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function toYmd(year, monthIndex, day) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDisplayDate(ymd) {
  if (!ymd) return '';
  const parts = ymd.split('-');
  if (parts.length !== 3) return ymd;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export default function FlightDateCalendar({
  label,
  value,
  onChange,
  availableDates = [],
  disabled = false,
  placeholder = 'Any Date',
  compact = false
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const availableSet = useMemo(() => new Set(availableDates), [availableDates]);

  const initialViewDate = useMemo(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number);
      if (y && m) return { year: y, month: m - 1 };
    }
    if (availableDates.length > 0) {
      const sorted = [...availableDates].sort();
      const [y, m] = sorted[0].split('-').map(Number);
      if (y && m) return { year: y, month: m - 1 };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }, [value, availableDates]);

  const [viewYear, setViewYear] = useState(initialViewDate.year);
  const [viewMonth, setViewMonth] = useState(initialViewDate.month);

  useEffect(() => {
    if (open) {
      setViewYear(initialViewDate.year);
      setViewMonth(initialViewDate.month);
    }
  }, [open, initialViewDate]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Monday-first calendar cells
  const cells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    // JS getDay(): 0=Sun..6=Sat -> convert to Monday=0..Sunday=6
    const startOffset = (firstDay.getDay() + 6) % 7;

    const grid = [];
    for (let i = 0; i < startOffset; i++) {
      grid.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      grid.push(d);
    }
    return grid;
  }, [viewYear, viewMonth]);

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
        className={`${
          compact ? 'p-2.5 rounded-lg' : 'px-3.5 py-2.5 rounded-xl'
        } border flex items-center justify-between transition ${
          disabled
            ? 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
            : open
            ? 'border-[#1B3664] bg-white ring-2 ring-[#1B3664]/15 cursor-pointer'
            : 'border-slate-200 hover:border-[#1B3664] bg-white cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <Calendar className="w-4 h-4 text-[#1B3664] shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {label}
            </div>
            <div className="text-xs font-medium text-slate-800 truncate mt-0.5">
              {value ? formatDisplayDate(value) : placeholder}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!disabled && availableDates.length > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-50 text-[#B91C1C] border border-red-200 text-[10px] font-semibold">
              <Plane className="w-2.5 h-2.5" />
              {availableDates.length}
            </span>
          )}
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="text-[11px] text-slate-400 hover:text-red-600 px-1 cursor-pointer"
              title="Clear Date"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {open && !disabled && (
        <div className="absolute left-0 top-full mt-2 z-50 w-[300px] sm:w-[320px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 select-none">
          {/* Month / Year Header */}
          <div className="flex items-center justify-between mb-3.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-[#1B3664] transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="font-display font-bold text-sm tracking-wider text-[#1B3664]">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-[#1B3664] transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {WEEKDAYS.map((wd, idx) => (
              <div key={idx} className="text-[11px] font-semibold text-slate-400 py-1">
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
            {cells.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="h-9" />;
              }
              const ymd = toYmd(viewYear, viewMonth, day);
              const hasFlight = availableSet.has(ymd);
              const isSelected = value === ymd;

              return (
                <div key={ymd} className="flex items-center justify-center h-9">
                  <button
                    type="button"
                    onClick={() => {
                      onChange(ymd);
                      setOpen(false);
                    }}
                    title={hasFlight ? 'Flights Available on this date' : 'Select date'}
                    className={`relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition cursor-pointer ${
                      hasFlight
                        ? isSelected
                          ? 'bg-[#991B1B] text-white ring-2 ring-offset-2 ring-[#1B3664] shadow-sm'
                          : 'bg-[#B91C1C] hover:bg-[#991B1B] text-white shadow-xs'
                        : isSelected
                        ? 'bg-[#1B3664] text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{day}</span>
                    {hasFlight && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center">
                        <Plane className="w-2 h-2 text-[#1B3664] rotate-45" />
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Legend & Clear */}
          <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#B91C1C] inline-block" />
              <span className="font-medium text-slate-700">Tickets Available</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="font-semibold text-[#1B3664] hover:underline cursor-pointer"
            >
              Any Date
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
