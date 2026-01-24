import React, { useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'global_clock_offset_minutes';
const POSITION_KEY = 'global_clock_position';

const offsetOptions = [
    -720, -660, -600, -540, -480, -420, -360, -300, -240, -210, -180, -120, -60,
    0, 60, 120, 180, 210, 240, 270, 300, 330, 360, 390, 420, 480, 540, 600, 660,
    720, 780, 840
];

const formatOffsetLabel = (offsetMinutes: number) => {
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMinutes);
    const hours = String(Math.floor(abs / 60)).padStart(2, '0');
    const minutes = String(abs % 60).padStart(2, '0');
    return `UTC${sign}${hours}:${minutes}`;
};

const getLocalOffsetMinutes = () => -new Date().getTimezoneOffset();

export const GlobalClock: React.FC = () => {
    const [offsetMinutes, setOffsetMinutes] = useState<number>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = Number(saved);
            if (!Number.isNaN(parsed)) return parsed;
        }
        return getLocalOffsetMinutes();
    });
    const [now, setNow] = useState(new Date());
    const [position, setPosition] = useState<{ x: number; y: number }>(() => {
        const saved = localStorage.getItem(POSITION_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as { x: number; y: number };
                if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
                    return parsed;
                }
            } catch {
                // ignore invalid data
            }
        }
        return { x: 0, y: 0 };
    });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, String(offsetMinutes));
    }, [offsetMinutes]);

    useEffect(() => {
        localStorage.setItem(POSITION_KEY, JSON.stringify(position));
    }, [position]);

    useEffect(() => {
        if (position.x !== 0 || position.y !== 0) {
            return;
        }
        const width = containerRef.current?.offsetWidth || 240;
        const height = containerRef.current?.offsetHeight || 96;
        setPosition({
            x: Math.max(16, window.innerWidth - width - 32),
            y: Math.max(16, window.innerHeight - height - 32)
        });
    }, [position.x, position.y]);

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!isDragging) return;
        const onMove = (event: MouseEvent) => {
            const width = containerRef.current?.offsetWidth || 240;
            const height = containerRef.current?.offsetHeight || 96;
            const nextX = event.clientX - dragOffset.current.x;
            const nextY = event.clientY - dragOffset.current.y;
            const clampedX = Math.max(8, Math.min(window.innerWidth - width - 8, nextX));
            const clampedY = Math.max(8, Math.min(window.innerHeight - height - 8, nextY));
            setPosition({ x: clampedX, y: clampedY });
        };
        const onUp = () => setIsDragging(false);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [isDragging]);

    const displayTime = useMemo(() => {
        const adjusted = new Date(now.getTime() + offsetMinutes * 60 * 1000);
        const hours = String(adjusted.getUTCHours()).padStart(2, '0');
        const minutes = String(adjusted.getUTCMinutes()).padStart(2, '0');
        const seconds = String(adjusted.getUTCSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }, [now, offsetMinutes]);

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        dragOffset.current = {
            x: event.clientX - position.x,
            y: event.clientY - position.y
        };
    };

    return (
        <div
            className="fixed z-50 select-none"
            style={{ left: `${position.x}px`, top: `${position.y}px` }}
        >
            <div
                ref={containerRef}
                className="bg-slate-900/70 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl px-4 py-3 flex items-center space-x-4"
            >
                <div onMouseDown={handleMouseDown} className="cursor-move">
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Global Time</div>
                    <div className="text-xl font-black text-white tracking-widest">{displayTime}</div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-indigo-400">{formatOffsetLabel(offsetMinutes)}</div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                    <select
                        value={offsetMinutes}
                        onChange={(event) => setOffsetMinutes(Number(event.target.value))}
                        className="px-2 py-1 text-[9px] font-black uppercase tracking-widest bg-white/5 border border-white/10 rounded-md text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    >
                        {offsetOptions.map((value) => (
                            <option key={value} value={value} className="bg-slate-900">
                                {formatOffsetLabel(value)}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={() => setOffsetMinutes(getLocalOffsetMinutes())}
                        className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                    >
                        Reset to Local
                    </button>
                </div>
            </div>
        </div>
    );
};
