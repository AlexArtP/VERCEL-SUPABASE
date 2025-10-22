'use client';

import React, { useState } from 'react';
import { Clock } from 'lucide-react';

interface TimePickerClockProps {
  value: string; // formato HH:MM
  onChange: (time: string) => void;
  label?: string;
}

export const TimePickerClock: React.FC<TimePickerClockProps> = ({ value, onChange, label = "Hora" }) => {
  const [showClock, setShowClock] = useState(false);
  const [hours, setHours] = useState(parseInt(value.split(':')[0]) || 8);
  const [minutes, setMinutes] = useState(parseInt(value.split(':')[1]) || 0);

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const h = Math.min(23, Math.max(0, parseInt(e.target.value) || 0));
    setHours(h);
    updateTime(h, minutes);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const m = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
    setMinutes(m);
    updateTime(hours, m);
  };

  const updateTime = (h: number, m: number) => {
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    onChange(timeStr);
  };

  const handleClockClick = (angle: number) => {
    // Convertir ángulo a hora (0-360 grados = 0-24 horas)
    const hour = Math.round((angle / 360) * 24) % 24;
    setHours(hour);
    updateTime(hour, minutes);
  };

  const handleMinuteClockClick = (angle: number) => {
    // Convertir ángulo a minuto (0-360 grados = 0-60 minutos)
    const minute = Math.round((angle / 360) * 60) % 60;
    setMinutes(minute);
    updateTime(hours, minute);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex gap-2">
        <div className="flex-1 flex gap-1 items-center">
          <input
            type="number"
            min="0"
            max="23"
            value={String(hours).padStart(2, '0')}
            onChange={handleHourChange}
            className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center"
          />
          <span className="text-lg font-semibold">:</span>
          <input
            type="number"
            min="0"
            max="59"
            value={String(minutes).padStart(2, '0')}
            onChange={handleMinuteChange}
            className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowClock(!showClock)}
          className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-1"
        >
          <Clock className="w-4 h-4" />
        </button>
      </div>

      {showClock && (
        <div className="mt-3 p-4 bg-gray-50 border border-gray-300 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            {/* Reloj de horas */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Horas</p>
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Círculo */}
                  <circle cx="50" cy="50" r="48" fill="none" stroke="#ddd" strokeWidth="0.5" />
                  
                  {/* Números de horas */}
                  {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => {
                    const angle = (h / 24) * 2 * Math.PI;
                    const x = 50 + 38 * Math.sin(angle);
                    const y = 50 - 38 * Math.cos(angle);
                    return (
                      <text
                        key={h}
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-semibold cursor-pointer hover:font-bold"
                        onClick={() => handleClockClick((h / 24) * 360)}
                      >
                        {h}
                      </text>
                    );
                  })}

                  {/* Aguja de hora */}
                  <line
                    x1="50"
                    y1="50"
                    x2={50 + 25 * Math.sin((hours / 24) * 2 * Math.PI)}
                    y2={50 - 25 * Math.cos((hours / 24) * 2 * Math.PI)}
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                  {/* Centro */}
                  <circle cx="50" cy="50" r="2" fill="#3b82f6" />
                </svg>
              </div>
            </div>

            {/* Reloj de minutos */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Minutos</p>
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Círculo */}
                  <circle cx="50" cy="50" r="48" fill="none" stroke="#ddd" strokeWidth="0.5" />
                  
                  {/* Números de minutos */}
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => {
                    const angle = (m / 60) * 2 * Math.PI;
                    const x = 50 + 38 * Math.sin(angle);
                    const y = 50 - 38 * Math.cos(angle);
                    return (
                      <text
                        key={m}
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs cursor-pointer hover:font-bold"
                        onClick={() => handleMinuteClockClick((m / 60) * 360)}
                      >
                        {String(m).padStart(2, '0')}
                      </text>
                    );
                  })}

                  {/* Aguja de minuto */}
                  <line
                    x1="50"
                    y1="50"
                    x2={50 + 30 * Math.sin((minutes / 60) * 2 * Math.PI)}
                    y2={50 - 30 * Math.cos((minutes / 60) * 2 * Math.PI)}
                    stroke="#ef4444"
                    strokeWidth="2"
                  />
                  {/* Centro */}
                  <circle cx="50" cy="50" r="2" fill="#ef4444" />
                </svg>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowClock(false)}
            className="w-full mt-3 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Aceptar
          </button>
        </div>
      )}
    </div>
  );
};
