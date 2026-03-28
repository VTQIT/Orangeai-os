import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeftRight, ChevronDown } from 'lucide-react';

type CalcMode = 'standard' | 'scientific' | 'currency' | 'unit';
type UnitCategory = 'temperature' | 'mass' | 'volume' | 'speed' | 'distance' | 'weight' | 'area' | 'time' | 'pressure' | 'energy';

const unitCategories: { key: UnitCategory; label: string }[] = [
  { key: 'temperature', label: 'Temperature' },
  { key: 'mass', label: 'Mass' },
  { key: 'volume', label: 'Volume' },
  { key: 'speed', label: 'Speed' },
  { key: 'distance', label: 'Distance' },
  { key: 'weight', label: 'Weight' },
  { key: 'area', label: 'Area' },
  { key: 'time', label: 'Time' },
  { key: 'pressure', label: 'Pressure' },
  { key: 'energy', label: 'Energy' },
];

const unitData: Record<UnitCategory, { units: string[]; toBase: Record<string, (v: number) => number>; fromBase: Record<string, (v: number) => number> }> = {
  temperature: {
    units: ['°C', '°F', 'K'],
    toBase: { '°C': v => v, '°F': v => (v - 32) * 5 / 9, 'K': v => v - 273.15 },
    fromBase: { '°C': v => v, '°F': v => v * 9 / 5 + 32, 'K': v => v + 273.15 },
  },
  mass: {
    units: ['kg', 'g', 'mg', 'lb', 'oz', 'ton'],
    toBase: { kg: v => v, g: v => v / 1000, mg: v => v / 1e6, lb: v => v * 0.453592, oz: v => v * 0.0283495, ton: v => v * 907.185 },
    fromBase: { kg: v => v, g: v => v * 1000, mg: v => v * 1e6, lb: v => v / 0.453592, oz: v => v / 0.0283495, ton: v => v / 907.185 },
  },
  volume: {
    units: ['L', 'mL', 'gal', 'qt', 'pt', 'cup', 'fl oz'],
    toBase: { L: v => v, mL: v => v / 1000, gal: v => v * 3.78541, qt: v => v * 0.946353, pt: v => v * 0.473176, cup: v => v * 0.236588, 'fl oz': v => v * 0.0295735 },
    fromBase: { L: v => v, mL: v => v * 1000, gal: v => v / 3.78541, qt: v => v / 0.946353, pt: v => v / 0.473176, cup: v => v / 0.236588, 'fl oz': v => v / 0.0295735 },
  },
  speed: {
    units: ['m/s', 'km/h', 'mph', 'knot', 'ft/s'],
    toBase: { 'm/s': v => v, 'km/h': v => v / 3.6, mph: v => v * 0.44704, knot: v => v * 0.514444, 'ft/s': v => v * 0.3048 },
    fromBase: { 'm/s': v => v, 'km/h': v => v * 3.6, mph: v => v / 0.44704, knot: v => v / 0.514444, 'ft/s': v => v / 0.3048 },
  },
  distance: {
    units: ['m', 'km', 'mi', 'ft', 'in', 'yd', 'cm', 'mm'],
    toBase: { m: v => v, km: v => v * 1000, mi: v => v * 1609.34, ft: v => v * 0.3048, in: v => v * 0.0254, yd: v => v * 0.9144, cm: v => v / 100, mm: v => v / 1000 },
    fromBase: { m: v => v, km: v => v / 1000, mi: v => v / 1609.34, ft: v => v / 0.3048, in: v => v / 0.0254, yd: v => v / 0.9144, cm: v => v * 100, mm: v => v * 1000 },
  },
  weight: {
    units: ['N', 'kN', 'lbf', 'kgf', 'dyn'],
    toBase: { N: v => v, kN: v => v * 1000, lbf: v => v * 4.44822, kgf: v => v * 9.80665, dyn: v => v * 0.00001 },
    fromBase: { N: v => v, kN: v => v / 1000, lbf: v => v / 4.44822, kgf: v => v / 9.80665, dyn: v => v / 0.00001 },
  },
  area: {
    units: ['m²', 'km²', 'ft²', 'mi²', 'acre', 'ha'],
    toBase: { 'm²': v => v, 'km²': v => v * 1e6, 'ft²': v => v * 0.092903, 'mi²': v => v * 2.59e6, acre: v => v * 4046.86, ha: v => v * 10000 },
    fromBase: { 'm²': v => v, 'km²': v => v / 1e6, 'ft²': v => v / 0.092903, 'mi²': v => v / 2.59e6, acre: v => v / 4046.86, ha: v => v / 10000 },
  },
  time: {
    units: ['s', 'ms', 'min', 'hr', 'day', 'week', 'year'],
    toBase: { s: v => v, ms: v => v / 1000, min: v => v * 60, hr: v => v * 3600, day: v => v * 86400, week: v => v * 604800, year: v => v * 31557600 },
    fromBase: { s: v => v, ms: v => v * 1000, min: v => v / 60, hr: v => v / 3600, day: v => v / 86400, week: v => v / 604800, year: v => v / 31557600 },
  },
  pressure: {
    units: ['Pa', 'kPa', 'bar', 'psi', 'atm', 'mmHg'],
    toBase: { Pa: v => v, kPa: v => v * 1000, bar: v => v * 100000, psi: v => v * 6894.76, atm: v => v * 101325, mmHg: v => v * 133.322 },
    fromBase: { Pa: v => v, kPa: v => v / 1000, bar: v => v / 100000, psi: v => v / 6894.76, atm: v => v / 101325, mmHg: v => v / 133.322 },
  },
  energy: {
    units: ['J', 'kJ', 'cal', 'kcal', 'Wh', 'kWh', 'BTU'],
    toBase: { J: v => v, kJ: v => v * 1000, cal: v => v * 4.184, kcal: v => v * 4184, Wh: v => v * 3600, kWh: v => v * 3.6e6, BTU: v => v * 1055.06 },
    fromBase: { J: v => v, kJ: v => v / 1000, cal: v => v / 4.184, kcal: v => v / 4184, Wh: v => v / 3600, kWh: v => v / 3.6e6, BTU: v => v / 1055.06 },
  },
};

// Static PHP/USD rate (can be replaced with API)
const PHP_USD_RATE = 56.5;

interface CalculatorAppProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CalculatorApp({ isOpen, onClose }: CalculatorAppProps) {
  const [mode, setMode] = useState<CalcMode>('standard');
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [resetNext, setResetNext] = useState(false);
  const [memory, setMemory] = useState(0);

  // Scientific
  const [isDeg, setIsDeg] = useState(true);
  const [isSecond, setIsSecond] = useState(false);

  // Currency
  const [currFrom, setCurrFrom] = useState('PHP');
  const [currTo, setCurrTo] = useState('USD');
  const [currAmount, setCurrAmount] = useState('0');

  // Unit
  const [unitCat, setUnitCat] = useState<UnitCategory>('temperature');
  const [unitFrom, setUnitFrom] = useState(unitData.temperature.units[0]);
  const [unitTo, setUnitTo] = useState(unitData.temperature.units[1]);
  const [unitAmount, setUnitAmount] = useState('0');
  const [showCatPicker, setShowCatPicker] = useState(false);

  const clear = useCallback(() => { setDisplay('0'); setPrev(null); setOp(null); setResetNext(false); }, []);

  const inputDigit = useCallback((d: string) => {
    if (resetNext) { setDisplay(d); setResetNext(false); }
    else setDisplay(display === '0' && d !== '.' ? d : display + d);
  }, [display, resetNext]);

  const inputOp = useCallback((nextOp: string) => {
    const curr = parseFloat(display);
    if (prev !== null && op && !resetNext) {
      let result = prev;
      switch (op) {
        case '+': result = prev + curr; break;
        case '−': result = prev - curr; break;
        case '×': result = prev * curr; break;
        case '÷': result = curr !== 0 ? prev / curr : 0; break;
      }
      setDisplay(String(result));
      setPrev(result);
    } else {
      setPrev(curr);
    }
    setOp(nextOp);
    setResetNext(true);
  }, [display, prev, op, resetNext]);

  const calculate = useCallback(() => {
    if (prev === null || !op) return;
    const curr = parseFloat(display);
    let result = prev;
    switch (op) {
      case '+': result = prev + curr; break;
      case '−': result = prev - curr; break;
      case '×': result = prev * curr; break;
      case '÷': result = curr !== 0 ? prev / curr : 0; break;
    }
    setDisplay(String(parseFloat(result.toFixed(10))));
    setPrev(null);
    setOp(null);
    setResetNext(true);
  }, [display, prev, op]);

  const handlePercent = useCallback(() => {
    setDisplay(String(parseFloat(display) / 100));
  }, [display]);

  const handleSign = useCallback(() => {
    setDisplay(String(-parseFloat(display)));
  }, [display]);

  const sciFunc = useCallback((fn: string) => {
    const v = parseFloat(display);
    const toRad = isDeg ? (x: number) => x * Math.PI / 180 : (x: number) => x;
    const fromRad = isDeg ? (x: number) => x * 180 / Math.PI : (x: number) => x;
    let r = 0;
    switch (fn) {
      case 'sin': r = Math.sin(toRad(v)); break;
      case 'cos': r = Math.cos(toRad(v)); break;
      case 'tan': r = Math.tan(toRad(v)); break;
      case 'asin': r = fromRad(Math.asin(v)); break;
      case 'acos': r = fromRad(Math.acos(v)); break;
      case 'atan': r = fromRad(Math.atan(v)); break;
      case 'sinh': r = Math.sinh(v); break;
      case 'cosh': r = Math.cosh(v); break;
      case 'tanh': r = Math.tanh(v); break;
      case 'ln': r = Math.log(v); break;
      case 'log': r = Math.log10(v); break;
      case 'log2': r = Math.log2(v); break;
      case '√': r = Math.sqrt(v); break;
      case '∛': r = Math.cbrt(v); break;
      case 'x²': r = v * v; break;
      case 'x³': r = v * v * v; break;
      case 'eˣ': r = Math.exp(v); break;
      case '10ˣ': r = Math.pow(10, v); break;
      case '1/x': r = 1 / v; break;
      case 'x!': r = factorial(v); break;
      case 'π': r = Math.PI; break;
      case 'e': r = Math.E; break;
      case 'rand': r = Math.random(); break;
    }
    setDisplay(String(parseFloat(r.toFixed(10))));
    setResetNext(true);
  }, [display, isDeg]);

  const convertCurrency = useCallback(() => {
    const amt = parseFloat(currAmount) || 0;
    if (currFrom === currTo) return amt.toFixed(2);
    if (currFrom === 'PHP') return (amt / PHP_USD_RATE).toFixed(2);
    return (amt * PHP_USD_RATE).toFixed(2);
  }, [currAmount, currFrom, currTo]);

  const convertUnit = useCallback(() => {
    const amt = parseFloat(unitAmount) || 0;
    const cat = unitData[unitCat];
    const base = cat.toBase[unitFrom](amt);
    const result = cat.fromBase[unitTo](base);
    return parseFloat(result.toFixed(8)).toString();
  }, [unitAmount, unitCat, unitFrom, unitTo]);

  const swapCurrency = () => { setCurrFrom(currTo); setCurrTo(currFrom); };
  const swapUnit = () => { setUnitFrom(unitTo); setUnitTo(unitFrom); };

  const handleUnitCatChange = (cat: UnitCategory) => {
    setUnitCat(cat);
    setUnitFrom(unitData[cat].units[0]);
    setUnitTo(unitData[cat].units[1]);
    setUnitAmount('0');
    setShowCatPicker(false);
  };

  const formatDisplay = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    if (val.includes('.') && !resetNext) return val;
    if (Math.abs(num) >= 1e12) return num.toExponential(4);
    return num.toLocaleString('en-US', { maximumFractionDigits: 8 });
  };

  const displayFontSize = display.length > 12 ? 'text-2xl' : display.length > 8 ? 'text-3xl' : 'text-5xl';

  const modes: { key: CalcMode; label: string }[] = [
    { key: 'standard', label: 'Standard' },
    { key: 'scientific', label: 'Scientific' },
    { key: 'currency', label: 'Currency' },
    { key: 'unit', label: 'Unit' },
  ];

  // Converter number pad
  const converterPad = (value: string, setValue: (v: string) => void) => (
    <div className="grid grid-cols-3 gap-2 px-4 pb-4">
      {['7','8','9','4','5','6','1','2','3','C','0','.'].map(k => (
        <button
          key={k}
          onClick={() => {
            if (k === 'C') setValue('0');
            else if (k === '.' && value.includes('.')) return;
            else setValue(value === '0' && k !== '.' ? k : value + k);
          }}
          className="h-12 rounded-full font-light text-lg transition-all active:scale-95"
          style={{
            background: k === 'C' ? 'hsla(0, 0%, 100%, 0.15)' : 'hsla(0, 0%, 100%, 0.08)',
            color: k === 'C' ? 'hsl(0, 0%, 100%)' : 'hsl(0, 0%, 100%)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {k}
        </button>
      ))}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ maxWidth: 428, margin: '0 auto' }}
        >
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <motion.div
            className="relative w-full h-full flex flex-col overflow-hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              background: 'linear-gradient(180deg, hsla(0,0%,0%,0.92) 0%, hsla(0,0%,0%,0.97) 100%)',
              backdropFilter: 'blur(40px)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-12 pb-2">
              <h2 className="text-white/90 font-light text-lg tracking-wide">Calculator</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <X size={16} className="text-white/80" />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex gap-1 mx-4 p-1 rounded-full" style={{ background: 'hsla(0,0%,100%,0.06)' }}>
              {modes.map(m => (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={`flex-1 py-1.5 rounded-full text-xs font-light tracking-wide transition-all ${
                    mode === m.key ? 'bg-white/15 text-white' : 'text-white/50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-end">
              {mode === 'standard' && (
                <>
                  <div className="px-6 pb-4 text-right">
                    {op && prev !== null && (
                      <div className="text-white/40 font-light text-sm mb-1">
                        {prev.toLocaleString()} {op}
                      </div>
                    )}
                    <div className={`text-white font-extralight ${displayFontSize} tracking-tight`}>
                      {formatDisplay(display)}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 px-4 pb-6">
                    {[
                      { l: 'AC', t: 'func', action: clear },
                      { l: '±', t: 'func', action: handleSign },
                      { l: '%', t: 'func', action: handlePercent },
                      { l: '÷', t: 'op', action: () => inputOp('÷') },
                      { l: '7', t: 'num' }, { l: '8', t: 'num' }, { l: '9', t: 'num' },
                      { l: '×', t: 'op', action: () => inputOp('×') },
                      { l: '4', t: 'num' }, { l: '5', t: 'num' }, { l: '6', t: 'num' },
                      { l: '−', t: 'op', action: () => inputOp('−') },
                      { l: '1', t: 'num' }, { l: '2', t: 'num' }, { l: '3', t: 'num' },
                      { l: '+', t: 'op', action: () => inputOp('+') },
                      { l: '0', t: 'num', wide: true }, { l: '.', t: 'num' },
                      { l: '=', t: 'op', action: calculate },
                    ].map((btn, i) => (
                      <button
                        key={i}
                        onClick={btn.action || (() => inputDigit(btn.l))}
                        className={`${btn.wide ? 'col-span-2' : ''} aspect-square flex items-center justify-center font-light text-2xl transition-all active:scale-90 active:opacity-80`}
                        style={{
                          borderRadius: btn.wide ? '9999px' : '50%',
                          aspectRatio: btn.wide ? 'auto' : '1',
                          height: btn.wide ? undefined : undefined,
                          background:
                            btn.t === 'op'
                              ? 'hsl(30, 100%, 50%)'
                              : btn.t === 'func'
                              ? 'hsla(0, 0%, 100%, 0.2)'
                              : 'hsla(0, 0%, 100%, 0.08)',
                          color:
                            btn.t === 'func'
                              ? 'hsl(0, 0%, 0%)'
                              : 'hsl(0, 0%, 100%)',
                          ...(btn.wide ? { height: 64, paddingLeft: 28, justifyContent: 'flex-start' } : { width: 64, height: 64 }),
                        }}
                      >
                        {btn.l}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {mode === 'scientific' && (
                <>
                  <div className="px-6 pb-2 text-right">
                    <div className={`text-white font-extralight ${displayFontSize} tracking-tight`}>
                      {formatDisplay(display)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 pb-2">
                    <button onClick={() => setIsDeg(!isDeg)} className="text-xs font-light text-orange-400 px-3 py-1 rounded-full bg-white/5">
                      {isDeg ? 'DEG' : 'RAD'}
                    </button>
                    <button onClick={() => setIsSecond(!isSecond)} className="text-xs font-light text-orange-400 px-3 py-1 rounded-full bg-white/5">
                      2nd
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 px-2 pb-2">
                    {(isSecond
                      ? ['asin','acos','atan','sinh','cosh','tanh','log2','eˣ','10ˣ','∛']
                      : ['sin','cos','tan','ln','log','√','x²','x³','1/x','x!']
                    ).map(fn => (
                      <button
                        key={fn}
                        onClick={() => sciFunc(fn)}
                        className="h-9 rounded-full text-xs font-light text-white/90 active:scale-90 transition-all"
                        style={{ background: 'hsla(0,0%,100%,0.08)' }}
                      >
                        {fn}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 px-2 pb-1">
                    {['π','e','rand'].map(fn => (
                      <button
                        key={fn}
                        onClick={() => sciFunc(fn)}
                        className="h-9 rounded-full text-xs font-light text-white/90 active:scale-90 transition-all"
                        style={{ background: 'hsla(0,0%,100%,0.08)' }}
                      >
                        {fn}
                      </button>
                    ))}
                    <button onClick={() => setMemory(memory + parseFloat(display))} className="h-9 rounded-full text-xs font-light text-white/90 active:scale-90" style={{ background: 'hsla(0,0%,100%,0.08)' }}>M+</button>
                    <button onClick={() => { setDisplay(String(memory)); setResetNext(true); }} className="h-9 rounded-full text-xs font-light text-white/90 active:scale-90" style={{ background: 'hsla(0,0%,100%,0.08)' }}>MR</button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 px-3 pb-4">
                    {[
                      { l: 'AC', t: 'func', action: clear },
                      { l: '±', t: 'func', action: handleSign },
                      { l: '%', t: 'func', action: handlePercent },
                      { l: '÷', t: 'op', action: () => inputOp('÷') },
                      { l: '7', t: 'num' }, { l: '8', t: 'num' }, { l: '9', t: 'num' },
                      { l: '×', t: 'op', action: () => inputOp('×') },
                      { l: '4', t: 'num' }, { l: '5', t: 'num' }, { l: '6', t: 'num' },
                      { l: '−', t: 'op', action: () => inputOp('−') },
                      { l: '1', t: 'num' }, { l: '2', t: 'num' }, { l: '3', t: 'num' },
                      { l: '+', t: 'op', action: () => inputOp('+') },
                      { l: '0', t: 'num', wide: true }, { l: '.', t: 'num' },
                      { l: '=', t: 'op', action: calculate },
                    ].map((btn, i) => (
                      <button
                        key={i}
                        onClick={btn.action || (() => inputDigit(btn.l))}
                        className={`${btn.wide ? 'col-span-2' : ''} flex items-center justify-center font-light text-xl transition-all active:scale-90`}
                        style={{
                          width: btn.wide ? '100%' : 56, height: 56,
                          borderRadius: btn.wide ? 9999 : '50%',
                          background: btn.t === 'op' ? 'hsl(30, 100%, 50%)' : btn.t === 'func' ? 'hsla(0,0%,100%,0.2)' : 'hsla(0,0%,100%,0.08)',
                          color: btn.t === 'func' ? 'hsl(0,0%,0%)' : 'hsl(0,0%,100%)',
                          ...(btn.wide ? { paddingLeft: 22, justifyContent: 'flex-start' } : {}),
                        }}
                      >
                        {btn.l}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {mode === 'currency' && (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="px-4 pt-4 space-y-4 flex-1">
                    <div className="rounded-2xl p-4" style={{ background: 'hsla(0,0%,100%,0.06)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/50 text-xs font-light">From</span>
                        <span className="text-orange-400 text-sm font-light">{currFrom === 'PHP' ? '🇵🇭 PHP' : '🇺🇸 USD'}</span>
                      </div>
                      <div className="text-white font-extralight text-3xl tracking-tight">
                        {currFrom === 'PHP' ? '₱' : '$'}{parseFloat(currAmount || '0').toLocaleString()}
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <button onClick={swapCurrency} className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center active:scale-90 transition-all">
                        <ArrowLeftRight size={16} className="text-white" />
                      </button>
                    </div>
                    <div className="rounded-2xl p-4" style={{ background: 'hsla(0,0%,100%,0.06)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/50 text-xs font-light">To</span>
                        <span className="text-orange-400 text-sm font-light">{currTo === 'PHP' ? '🇵🇭 PHP' : '🇺🇸 USD'}</span>
                      </div>
                      <div className="text-white font-extralight text-3xl tracking-tight">
                        {currTo === 'PHP' ? '₱' : '$'}{parseFloat(convertCurrency()).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-center text-white/30 text-xs font-light">
                      1 USD = ₱{PHP_USD_RATE}
                    </div>
                  </div>
                  {converterPad(currAmount, setCurrAmount)}
                </div>
              )}

              {mode === 'unit' && (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="px-4 pt-4 space-y-3 flex-1">
                    {/* Category Picker */}
                    <div className="relative">
                      <button
                        onClick={() => setShowCatPicker(!showCatPicker)}
                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-full text-sm font-light text-white/90"
                        style={{ background: 'hsla(0,0%,100%,0.08)' }}
                      >
                        {unitCategories.find(c => c.key === unitCat)?.label}
                        <ChevronDown size={14} className="text-white/50" />
                      </button>
                      <AnimatePresence>
                        {showCatPicker && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="absolute top-12 left-0 right-0 z-10 rounded-2xl overflow-hidden max-h-48 overflow-y-auto"
                            style={{ background: 'hsla(0,0%,10%,0.95)', backdropFilter: 'blur(20px)' }}
                          >
                            {unitCategories.map(c => (
                              <button
                                key={c.key}
                                onClick={() => handleUnitCatChange(c.key)}
                                className={`w-full text-left px-4 py-2.5 text-sm font-light transition-colors ${
                                  unitCat === c.key ? 'text-orange-400 bg-white/5' : 'text-white/70'
                                }`}
                              >
                                {c.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* From */}
                    <div className="rounded-2xl p-4" style={{ background: 'hsla(0,0%,100%,0.06)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/50 text-xs font-light">From</span>
                        <select
                          value={unitFrom}
                          onChange={e => setUnitFrom(e.target.value)}
                          className="bg-transparent text-orange-400 text-sm font-light outline-none"
                        >
                          {unitData[unitCat].units.map(u => <option key={u} value={u} className="bg-black text-white">{u}</option>)}
                        </select>
                      </div>
                      <div className="text-white font-extralight text-3xl tracking-tight">
                        {parseFloat(unitAmount || '0').toLocaleString()} <span className="text-lg text-white/40">{unitFrom}</span>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <button onClick={swapUnit} className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center active:scale-90 transition-all">
                        <ArrowLeftRight size={16} className="text-white" />
                      </button>
                    </div>

                    {/* To */}
                    <div className="rounded-2xl p-4" style={{ background: 'hsla(0,0%,100%,0.06)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/50 text-xs font-light">To</span>
                        <select
                          value={unitTo}
                          onChange={e => setUnitTo(e.target.value)}
                          className="bg-transparent text-orange-400 text-sm font-light outline-none"
                        >
                          {unitData[unitCat].units.map(u => <option key={u} value={u} className="bg-black text-white">{u}</option>)}
                        </select>
                      </div>
                      <div className="text-white font-extralight text-3xl tracking-tight">
                        {convertUnit()} <span className="text-lg text-white/40">{unitTo}</span>
                      </div>
                    </div>
                  </div>
                  {converterPad(unitAmount, setUnitAmount)}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function factorial(n: number): number {
  if (n < 0) return NaN;
  if (n <= 1) return 1;
  if (n > 170) return Infinity;
  let r = 1;
  for (let i = 2; i <= Math.floor(n); i++) r *= i;
  return r;
}
