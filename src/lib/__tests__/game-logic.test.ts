import { describe, it, expect } from 'vitest';
import {
  completarConCeros,
  calcularPremioDeUnSorteo,
  calcularCostoTotal,
  type Jugada,
} from '../game-logic';

describe('completarConCeros', () => {
  it('rellena con ceros a la izquierda hasta alcanzar las cifras pedidas', () => {
    expect(completarConCeros(5, 3)).toBe('005');
    expect(completarConCeros(42, 3)).toBe('042');
    expect(completarConCeros(7, 2)).toBe('07');
  });

  it('no agrega ceros cuando el numero ya tiene la longitud correcta', () => {
    expect(completarConCeros(123, 3)).toBe('123');
    expect(completarConCeros(99, 2)).toBe('99');
    expect(completarConCeros(0, 1)).toBe('0');
  });
});

describe('calcularCostoTotal', () => {
  it('suma apuestas de todas las jugadas y multiplica por cantidad de sorteos', () => {
    const jugadas: Jugada[] = [
      { numero: 64, cifras: 2, cabeza: 100, cinco: 0, diez: 100 },
      { numero: 32, cifras: 2, cabeza: 100, cinco: 0, diez: 100 },
    ];
    // (100 + 0 + 100) * 2 jugadas = 400 por sorteo, * 3 sorteos = 1200
    expect(calcularCostoTotal(jugadas, 3)).toBe(1200);
  });

  it('devuelve 0 si no hay jugadas', () => {
    expect(calcularCostoTotal([], 5)).toBe(0);
  });
});

describe('calcularPremioDeUnSorteo', () => {
  it('acierto de cabeza en 3 cifras paga 600x la apuesta', () => {
    const jugadas: Jugada[] = [
      { numero: 677, cifras: 3, cabeza: 100, cinco: 0, diez: 0 },
    ];
    // El primer numero del sorteo es 677 → gana cabeza
    const sorteo = [677, 100, 200, 300, 400, 500, 600, 700, 800, 900];
    const { premio, aciertos } = calcularPremioDeUnSorteo(jugadas, sorteo);

    expect(premio).toBe(60000); // 100 * 600
    expect(aciertos).toHaveLength(1);
    expect(aciertos[0].tipo).toBe('Cabeza');
    expect(aciertos[0].numero).toBe('677');
  });

  it('sin aciertos devuelve premio 0 y lista de aciertos vacia', () => {
    const jugadas: Jugada[] = [
      { numero: 123, cifras: 3, cabeza: 100, cinco: 50, diez: 50 },
    ];
    // El numero 123 no aparece en el sorteo
    const sorteo = [456, 789, 321, 654, 987, 111, 222, 333, 444, 555];
    const { premio, aciertos } = calcularPremioDeUnSorteo(jugadas, sorteo);

    expect(premio).toBe(0);
    expect(aciertos).toHaveLength(0);
  });

  it('acierto "a los 5" en 2 cifras paga 14x la apuesta de cinco', () => {
    const jugadas: Jugada[] = [
      // El 67 aparece en posicion 3 del sorteo (dentro de los primeros 5)
      { numero: 67, cifras: 2, cabeza: 100, cinco: 200, diez: 0 },
    ];
    const sorteo = [100, 234, 167, 567, 267, 800, 900, 10, 20, 30];
    // sorteo % 100: [0, 34, 67, 67, 67, 0, 0, 10, 20, 30]
    // El 67 esta en indices 2,3,4 → está en los primeros 5 pero no es cabeza
    const { premio, aciertos } = calcularPremioDeUnSorteo(jugadas, sorteo);

    // No es cabeza (sorteo[0] % 100 = 0 ≠ 67)
    // Sí está en los primeros 5 → cobra cinco: 200 * 14 = 2800
    expect(premio).toBe(2800);
    expect(aciertos[0].tipo).toBe('A los 5');
  });

  it('acierto de cabeza en 2 cifras paga 70x la apuesta', () => {
    const jugadas: Jugada[] = [
      { numero: 64, cifras: 2, cabeza: 50, cinco: 0, diez: 0 },
    ];
    const sorteo = [764, 200, 300, 400, 500, 600, 700, 800, 900, 100];
    // sorteo[0] % 100 = 764 % 100 = 64 → cabeza en 2 cifras
    const { premio, aciertos } = calcularPremioDeUnSorteo(jugadas, sorteo);

    expect(premio).toBe(3500); // 50 * 70
    expect(aciertos[0].tipo).toBe('Cabeza');
  });

  it('numero de 1 cifra solo puede ganar cabeza, no a los 5 ni a los 10', () => {
    const jugadas: Jugada[] = [
      { numero: 7, cifras: 1, cabeza: 100, cinco: 999, diez: 999 },
    ];
    const sorteo = [7, 17, 27, 37, 47, 57, 67, 77, 87, 97];
    // El 7 es cabeza (sorteo[0] % 10 = 7)
    const { premio, aciertos } = calcularPremioDeUnSorteo(jugadas, sorteo);

    // Solo paga cabeza: 100 * 7 = 700. Las apuestas de cinco y diez se ignoran
    expect(premio).toBe(700);
    expect(aciertos).toHaveLength(1);
    expect(aciertos[0].tipo).toBe('Cabeza');
  });

  it('acierto "a los 10" en 3 cifras paga 50x la apuesta de diez', () => {
    const jugadas: Jugada[] = [
      { numero: 123, cifras: 3, cabeza: 0, cinco: 0, diez: 100 },
    ];
    // El 123 aparece en posicion 7 (dentro de los 10, fuera de los 5) → solo "a los 10"
    const sorteo = [456, 789, 321, 654, 987, 111, 222, 123, 444, 555];
    const { premio, aciertos } = calcularPremioDeUnSorteo(jugadas, sorteo);

    expect(premio).toBe(5000); // 100 * 50
    expect(aciertos).toHaveLength(1);
    expect(aciertos[0].tipo).toBe('A los 10');
  });

  it('varias jugadas acumulan el premio total y todos los aciertos correctamente', () => {
    const jugadas: Jugada[] = [
      // Jugada 1: gana cabeza en 3 cifras → 100 * 600 = 60000
      { numero: 100, cifras: 3, cabeza: 100, cinco: 0, diez: 0 },
      // Jugada 2: gana "a los 5" y "a los 10" en 2 cifras
      // sorteo % 100 = [0, 50, 50, 50, 50, 50, 50, 50, 50, 50]
      // cinco: 200 * 14 = 2800 | diez: 100 * 7 = 700
      { numero: 50, cifras: 2, cabeza: 0, cinco: 200, diez: 100 },
    ];
    const sorteo = [100, 150, 250, 350, 450, 550, 650, 750, 850, 950];
    const { premio, aciertos } = calcularPremioDeUnSorteo(jugadas, sorteo);

    expect(premio).toBe(63500); // 60000 + 2800 + 700
    expect(aciertos).toHaveLength(3);
  });
});
