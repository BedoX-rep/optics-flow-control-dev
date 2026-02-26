import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

interface SwipeToSaveProps {
    onSave: () => void;
    isLoading?: boolean;
}

const SwipeToSave: React.FC<SwipeToSaveProps> = ({ onSave, isLoading }) => {
    const { translate: t } = useLanguage();
    const [complete, setComplete] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);

    // Transform x position to various styles
    const opacity = useTransform(x, [0, 150], [1, 0]);
    const scale = useTransform(x, [0, 150], [1, 1.1]);
    const bgOpacity = useTransform(x, [0, 200], [0.1, 1]);

    const handleDragEnd = (_: any, info: any) => {
        const containerWidth = containerRef.current?.offsetWidth || 300;
        const threshold = containerWidth * 0.7;

        if (info.offset.x > threshold && !isLoading) {
            setComplete(true);
            animate(x, containerWidth - 60, { type: 'spring', stiffness: 300, damping: 30 });
            onSave();
        } else {
            animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
        }
    };

    useEffect(() => {
        if (!isLoading && complete) {
            // If saving failed or was cancelled, we might need to reset
            // but usually the page navigates away on success
        }
    }, [isLoading, complete]);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-16 bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-200 flex items-center p-1.5"
        >
            {/* Background fill that appears as you swipe */}
            <motion.div
                style={{ width: x, opacity: bgOpacity }}
                className="absolute left-0 top-0 bottom-0 bg-emerald-500 rounded-l-xl"
            />

            {/* Track text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.span
                    style={{ opacity }}
                    className="text-slate-500 font-bold text-sm tracking-wide uppercase"
                >
                    {isLoading ? (t('saving') || 'Saving...') : (t('swipeToSave') || 'Swipe to Save')}
                </motion.span>
            </div>

            {/* Swipe handle */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 250 }} // Will be adjusted by container
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                style={{ x }}
                className={`relative z-10 w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing border-2 ${complete ? 'border-emerald-500' : 'border-slate-100'
                    }`}
            >
                {complete ? (
                    <Check className="w-6 h-6 text-emerald-600" />
                ) : (
                    <ChevronRight className={`w-6 h-6 ${isLoading ? 'animate-pulse text-slate-300' : 'text-teal-600'}`} />
                )}
            </motion.div>

            {/* Success state - can be more elaborate */}
            {complete && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-emerald-500 flex items-center justify-center pointer-events-none"
                >
                    <span className="text-white font-black uppercase tracking-widest flex items-center gap-2">
                        <Check className="w-5 h-5" /> {t('saving') || 'Saving...'}
                    </span>
                </motion.div>
            )}
        </div>
    );
};

export default SwipeToSave;
