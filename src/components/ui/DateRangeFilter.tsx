import React, { useState } from "react";
import { Calendar as CalendarIcon, ChevronDown, X, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/LanguageProvider";

interface DateRangeFilterProps {
    dateFilter: string;
    dateRange: { from: Date | undefined; to: Date | undefined };
    onFilterChange: (key: string, value: any) => void;
    accentColor?: "indigo" | "blue" | "teal" | "emerald" | "purple" | "amber" | "rose";
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
    dateFilter,
    dateRange,
    onFilterChange,
    accentColor = "indigo"
}) => {
    const { t } = useLanguage();
    const [tempRange, setTempRange] = useState<DateRange | undefined>({
        from: dateRange.from,
        to: dateRange.to
    });

    const accentStyles = {
        indigo: {
            bg: "bg-indigo-50",
            text: "text-indigo-700",
            border: "border-indigo-200",
            shadow: "shadow-indigo-100/50",
            icon: "text-indigo-600",
            hoverBorder: "hover:border-indigo-200"
        },
        blue: {
            bg: "bg-blue-50",
            text: "text-blue-700",
            border: "border-blue-200",
            shadow: "shadow-blue-100/50",
            icon: "text-blue-600",
            hoverBorder: "hover:border-blue-200"
        },
        teal: {
            bg: "bg-teal-50",
            text: "text-teal-700",
            border: "border-teal-200",
            shadow: "shadow-teal-100/50",
            icon: "text-teal-600",
            hoverBorder: "hover:border-teal-200"
        },
        emerald: {
            bg: "bg-emerald-50",
            text: "text-emerald-700",
            border: "border-emerald-200",
            shadow: "shadow-emerald-100/50",
            icon: "text-emerald-600",
            hoverBorder: "hover:border-emerald-200"
        },
        purple: {
            bg: "bg-purple-50",
            text: "text-purple-700",
            border: "border-purple-200",
            shadow: "shadow-purple-100/50",
            icon: "text-purple-600",
            hoverBorder: "hover:border-purple-200"
        },
        amber: {
            bg: "bg-amber-50",
            text: "text-amber-700",
            border: "border-amber-200",
            shadow: "shadow-amber-100/50",
            icon: "text-amber-600",
            hoverBorder: "hover:border-amber-200"
        },
        rose: {
            bg: "bg-rose-50",
            text: "text-rose-700",
            border: "border-rose-200",
            shadow: "shadow-rose-100/50",
            icon: "text-rose-600",
            hoverBorder: "hover:border-rose-200"
        }
    };

    const currentStyles = accentStyles[accentColor];
    const isActive = dateFilter !== 'all' || (dateRange.from || dateRange.to);

    const getDisplayText = () => {
        if (dateRange.from && dateRange.to) {
            if (format(dateRange.from, 'yyyy-MM-dd') === format(dateRange.to, 'yyyy-MM-dd')) {
                return format(dateRange.from, 'MMM dd');
            }
            return `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd')}`;
        } else if (dateRange.from) {
            return `${format(dateRange.from, 'MMM dd')} - ...`;
        }

        switch (dateFilter) {
            case 'today': return t('today');
            case 'week': return t('week');
            case 'month': return t('month');
            case 'year': return t('year');
            default: return t('date');
        }
    };

    const handleApply = () => {
        if (tempRange) {
            onFilterChange('dateRange', { from: tempRange.from, to: tempRange.to });
            onFilterChange('date', 'custom');
        }
    };

    const handlePreset = (preset: string) => {
        onFilterChange('date', preset);
        onFilterChange('dateRange', { from: undefined, to: undefined });
        setTempRange({ from: undefined, to: undefined });
    };

    const presets = [
        { value: 'all', label: t('allDates') || 'All Dates' },
        { value: 'today', label: t('today') },
        { value: 'week', label: t('week') },
        { value: 'month', label: t('month') },
        { value: 'year', label: t('year') }
    ];

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "h-12 min-w-[140px] max-w-[200px] border border-slate-100 shadow-sm rounded-2xl gap-2 transition-all duration-300 flex-shrink-0 font-bold text-xs uppercase tracking-tight px-4",
                        isActive
                            ? `${currentStyles.bg} ${currentStyles.text} ${currentStyles.border} ${currentStyles.shadow}`
                            : `bg-slate-50/50 hover:bg-white ${currentStyles.hoverBorder} hover:shadow-md text-slate-600`
                    )}
                >
                    <CalendarIcon className={cn("h-4 w-4 flex-shrink-0", isActive ? currentStyles.icon : "text-slate-400")} />
                    <span className="truncate">{getDisplayText()}</span>
                    <ChevronDown className={cn("h-3 w-3 opacity-50 ml-auto flex-shrink-0", isActive ? currentStyles.icon : "text-slate-400")} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden bg-white" align="start">
                <div className="flex flex-col md:flex-row">
                    {/* Presets Sidebar */}
                    <div className="p-2 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-100 flex md:flex-col gap-1 overflow-x-auto no-scrollbar min-w-[120px]">
                        {presets.map((p) => (
                            <button
                                key={p.value}
                                onClick={() => handlePreset(p.value)}
                                className={cn(
                                    "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-tight transition-all",
                                    dateFilter === p.value && !dateRange.from
                                        ? `${currentStyles.bg} ${currentStyles.text}`
                                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                )}
                            >
                                {p.label}
                                {dateFilter === p.value && !dateRange.from && <Check className="h-3 w-3" />}
                            </button>
                        ))}
                    </div>

                    <div className="p-3">
                        <div className="flex flex-col gap-3">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={tempRange?.from}
                                selected={tempRange}
                                onSelect={setTempRange}
                                numberOfMonths={1}
                                className="rounded-2xl"
                            />
                            <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex flex-col px-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('from') || 'From'}</span>
                                    <span className="text-xs font-bold text-slate-700">
                                        {tempRange?.from ? format(tempRange.from, 'MMM dd, yyyy') : '...'}
                                    </span>
                                </div>
                                <div className="h-8 w-px bg-slate-200" />
                                <div className="flex flex-col px-2 text-right">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('to') || 'To'}</span>
                                    <span className="text-xs font-bold text-slate-700">
                                        {tempRange?.to ? format(tempRange.to, 'MMM dd, yyyy') : '...'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    className={cn(
                                        "flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all",
                                        tempRange?.from
                                            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
                                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    )}
                                    onClick={handleApply}
                                    disabled={!tempRange?.from}
                                >
                                    <Check className="mr-2 h-3.5 w-3.5" /> {t('apply') || 'Apply'}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-12 w-12 rounded-2xl border-slate-100 bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition-all p-0"
                                    onClick={() => {
                                        handlePreset('all');
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default DateRangeFilter;
