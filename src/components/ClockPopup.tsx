import { useState, useCallback } from 'react';
import { X, CloudSun, AlarmClock, Calendar, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getWeatherIcon } from '@/hooks/useWeather';
import { AnimatePresence, motion } from 'framer-motion';
import { weatherScenes } from '@/data/weatherScenes';
import WeatherVideoBackground from '@/components/WeatherVideoBackground';

interface Alarm {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
}

const defaultAlarms: Alarm[] = [
  { id: '1', time: '06:30', label: 'Wake Up', enabled: true },
  { id: '2', time: '08:00', label: 'Morning Routine', enabled: false },
  { id: '3', time: '12:00', label: 'Lunch Break', enabled: true },
];

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function ClockPopup({ onClose, defaultTab = 'weather' }: { onClose: () => void; defaultTab?: 'weather' | 'alarm' | 'calendar' }) {
  const [tab, setTab] = useState<'weather' | 'alarm' | 'calendar'>(defaultTab);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [alarms, setAlarms] = useState<Alarm[]>(defaultAlarms);
  const [editingAlarm, setEditingAlarm] = useState<string | null>(null);

  const scene = weatherScenes[sceneIndex];

  // Tap the weather area to cycle through scenes (demo mode)
  const cycleScene = useCallback(() => {
    setSceneIndex((prev) => (prev + 1) % weatherScenes.length);
  }, []);

  // Calendar state
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  const toggleAlarm = (id: string) =>
    setAlarms((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));

  const removeAlarm = (id: string) => setAlarms((prev) => prev.filter((a) => a.id !== id));

  const addAlarm = () => {
    const newAlarm: Alarm = {
      id: Date.now().toString(),
      time: '07:00',
      label: 'New Alarm',
      enabled: true,
    };
    setAlarms((prev) => [...prev, newAlarm]);
    setEditingAlarm(newAlarm.id);
  };

  const updateAlarmTime = (id: string, time: string) =>
    setAlarms((prev) => prev.map((a) => (a.id === id ? { ...a, time } : a)));

  const updateAlarmLabel = (id: string, label: string) =>
    setAlarms((prev) => prev.map((a) => (a.id === id ? { ...a, label } : a)));

  // Calendar helpers
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  const goToToday = () => {
    setCalMonth(today.getMonth());
    setCalYear(today.getFullYear());
  };

  const tabs = [
    { key: 'weather' as const, label: 'Weather', icon: CloudSun },
    { key: 'alarm' as const, label: 'Alarm', icon: AlarmClock },
    { key: 'calendar' as const, label: 'Calendar', icon: Calendar },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-[380px] rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
        style={{ maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video Background - visible on weather tab */}
        {tab === 'weather' && (
          <WeatherVideoBackground videoUrl={scene.videoUrl} videoKey={scene.id} />
        )}

        {/* Fallback glass background for non-weather tabs */}
        {tab !== 'weather' && (
          <div className="absolute inset-0 bg-white/10 backdrop-blur-2xl" />
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Header */}
        <div className="relative px-6 pt-6 pb-3">
          <h2 className="text-white font-light text-lg tracking-wide drop-shadow-lg">Clock & Utilities</h2>
        </div>

        {/* Tab Bar */}
        <div className="relative flex mx-6 mb-4 rounded-2xl bg-black/20 p-1 gap-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-light transition-all ${
                tab === key ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/70'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="relative px-6 pb-6 overflow-y-auto" style={{ maxHeight: '60vh' }}>
          <AnimatePresence mode="wait">
            {/* ===== WEATHER TAB ===== */}
            {tab === 'weather' && (
              <motion.div
                key={`weather-${scene.id}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {/* Tappable weather display */}
                <div className="text-center py-4 cursor-pointer select-none" onClick={cycleScene}>
                  <motion.div
                    key={scene.icon}
                    initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    className="text-6xl mb-2 drop-shadow-lg"
                  >
                    {scene.icon}
                  </motion.div>
                  <motion.div
                    key={`temp-${scene.id}`}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-5xl font-extralight text-white tracking-tight drop-shadow-lg"
                  >
                    {scene.temperature}°
                  </motion.div>
                  <motion.div
                    key={`label-${scene.id}`}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-white/70 text-sm font-light mt-1 drop-shadow"
                  >
                    {scene.label}
                  </motion.div>
                  <div className="text-white/40 text-[10px] mt-2 font-light">Tap to change weather</div>
                </div>

                {/* Weather details */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Humidity', value: `${scene.humidity}%` },
                    { label: 'Wind', value: `${scene.windSpeed} km/h` },
                    { label: 'Feels', value: `${scene.temperature + (scene.humidity > 80 ? 3 : -2)}°` },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl bg-black/30 backdrop-blur-sm p-3 text-center border border-white/10">
                      <div className="text-white/50 text-[10px] font-light uppercase tracking-wider">{item.label}</div>
                      <div className="text-white text-sm font-light mt-1 drop-shadow">{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* 7-Day Forecast */}
                <div className="rounded-2xl bg-black/30 backdrop-blur-sm p-4 border border-white/10">
                  <div className="text-white/50 text-[10px] font-light uppercase tracking-wider mb-3">7-Day Forecast</div>
                  <div className="flex justify-between">
                    {scene.forecast.map((day) => (
                      <div key={day.dayName} className="text-center flex-1">
                        <div className="text-white/50 text-[10px] font-light">{day.dayName}</div>
                        <div className="text-base my-1">{getWeatherIcon(day.weatherCode)}</div>
                        <div className="text-white text-[10px] font-light drop-shadow">{day.tempMax}°</div>
                        <div className="text-white/40 text-[9px] font-light">{day.tempMin}°</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scene indicator dots */}
                <div className="flex justify-center gap-1.5 pt-1">
                  {weatherScenes.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={(e) => { e.stopPropagation(); setSceneIndex(i); }}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        i === sceneIndex ? 'bg-white w-4' : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* ===== ALARM TAB ===== */}
            {tab === 'alarm' && (
              <motion.div
                key="alarm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                {alarms.map((alarm) => (
                  <div
                    key={alarm.id}
                    className="flex items-center justify-between rounded-2xl bg-white/5 p-4"
                  >
                    <div className="flex-1 min-w-0">
                      {editingAlarm === alarm.id ? (
                        <div className="space-y-2">
                          <input
                            type="time"
                            value={alarm.time}
                            onChange={(e) => updateAlarmTime(alarm.id, e.target.value)}
                            className="bg-white/10 text-white text-xl font-extralight rounded-lg px-2 py-1 border border-white/20 outline-none w-full"
                          />
                          <input
                            type="text"
                            value={alarm.label}
                            onChange={(e) => updateAlarmLabel(alarm.id, e.target.value)}
                            onBlur={() => setEditingAlarm(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingAlarm(null)}
                            className="bg-white/10 text-white/70 text-xs font-light rounded-lg px-2 py-1 border border-white/20 outline-none w-full"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div onClick={() => setEditingAlarm(alarm.id)} className="cursor-pointer">
                          <div className="text-white text-2xl font-extralight">{alarm.time}</div>
                          <div className="text-white/40 text-xs font-light">{alarm.label}</div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <button
                        onClick={() => removeAlarm(alarm.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-white/30" />
                      </button>
                      <button
                        onClick={() => toggleAlarm(alarm.id)}
                        className={`w-11 h-6 rounded-full transition-all relative ${
                          alarm.enabled ? 'bg-white/30' : 'bg-white/10'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                            alarm.enabled ? 'left-[22px]' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addAlarm}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors p-4 text-white/50 text-sm font-light"
                >
                  <Plus className="w-4 h-4" />
                  Add Alarm
                </button>
              </motion.div>
            )}

            {/* ===== CALENDAR TAB ===== */}
            {tab === 'calendar' && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-white/60" />
                  </button>
                  <div className="text-center">
                    <span className="text-white font-light text-sm">
                      {monthNames[calMonth]} {calYear}
                    </span>
                    {(calMonth !== today.getMonth() || calYear !== today.getFullYear()) && (
                      <button
                        onClick={goToToday}
                        className="block mx-auto text-[10px] text-white/40 hover:text-white/70 transition-colors mt-0.5"
                      >
                        Go to today
                      </button>
                    )}
                  </div>
                  <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                    <ChevronRight className="w-4 h-4 text-white/60" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                  {weekDays.map((d) => (
                    <div key={d} className="text-white/30 text-[10px] font-light uppercase tracking-wider py-1">{d}</div>
                  ))}
                  {calendarDays.map((day, i) => {
                    const isToday =
                      day === today.getDate() &&
                      calMonth === today.getMonth() &&
                      calYear === today.getFullYear();
                    return (
                      <div
                        key={i}
                        className={`aspect-square flex items-center justify-center rounded-xl text-xs font-light transition-colors ${
                          day === null
                            ? ''
                            : isToday
                            ? 'bg-white/20 text-white ring-1 ring-white/30'
                            : 'text-white/60 hover:bg-white/10 cursor-pointer'
                        }`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => setCalYear(calYear - 1)}
                    className="text-white/30 hover:text-white/60 text-[10px] font-light transition-colors px-2 py-1"
                  >
                    ‹ {calYear - 1}
                  </button>
                  <span className="text-white/50 text-[10px] font-light">{calYear}</span>
                  <button
                    onClick={() => setCalYear(calYear + 1)}
                    className="text-white/30 hover:text-white/60 text-[10px] font-light transition-colors px-2 py-1"
                  >
                    {calYear + 1} ›
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
