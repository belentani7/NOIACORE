/**
 * NOIACORE LAB / fallback
 * La ausencia también pertenece al campo: negro absoluto, tipografía mineral y una única salida.
 */
import { useLocation } from 'wouter';
import { MinimalSymbol } from '@/components/MinimalSymbol';

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <main className="noia-spatial-root noia-fallback">
      <div className="spatial-atmosphere" aria-hidden="true" />
      <div className="spatial-grain" aria-hidden="true" />
      <section className="fallback-field" aria-labelledby="fallback-title">
        <MinimalSymbol size={46} glow={false} />
        <span className="stage-eyebrow">NOIACORE LAB / UNMAPPED FIELD</span>
        <h1 id="fallback-title">Esta coordenada<br /><i>no existe.</i></h1>
        <p>El recorrido no encontró una cámara con ese nombre. La fábrica sigue abierta en su origen.</p>
        <button className="text-gesture" type="button" onClick={() => setLocation('/')}>
          <span>Volver al origen</span>
          <i aria-hidden="true" />
        </button>
      </section>
    </main>
  );
}
