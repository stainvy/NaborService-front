import { useRef, type PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';

interface SignaturePadProps {
  // Appelé avec le data URL base64 à chaque fin de tracé, '' après effacement.
  onChange: (dataUrl: string) => void;
  width?: number;
  height?: number;
}

// Canvas de signature manuscrite (souris + tactile via Pointer Events).
export function SignaturePad({ onChange, width = 320, height = 160 }: SignaturePadProps) {
  const { t } = useTranslation('listings');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  const point = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    // Le canvas peut être rendu à une taille CSS différente de sa résolution
    // interne (width/height attributs) : sans ce facteur d'échelle, le tracé
    // dérive du curseur à mesure qu'on s'éloigne du coin haut-gauche.
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const start = (e: PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    last.current = point(e);
  };

  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !last.current) return;
    const p = point(e);
    ctx.strokeStyle = '#0F2A5E';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    try {
      const url = canvasRef.current?.toDataURL('image/png') ?? '';
      onChange(url);
    } catch {
      // canvas non supporté (env de test) : on ignore.
    }
  };

  const clear = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    onChange('');
  };

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="touch-none rounded-md border border-gray bg-surface"
      />
      <Button type="button" variant="secondary" onClick={clear}>
        {t('sign.clear')}
      </Button>
    </div>
  );
}
