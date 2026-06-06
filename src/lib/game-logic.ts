export interface Jugada {
  numero: number;
  cifras: number;
  cabeza: number;
  cinco: number;
  diez: number;
}

export interface Acierto {
  numero: string;
  tipo: string;
  importe: number;
  premio: number;
}

export interface ResultadoSorteo {
  premio: number;
  aciertos: Acierto[];
}

export function completarConCeros(numero: number, cifras: number): string {
  let texto = String(numero);
  while (texto.length < cifras) {
    texto = "0" + texto;
  }
  return texto;
}

export function calcularCostoTotal(jugadas: Jugada[], cantidadSorteos: number): number {
  let costoBoleta = 0;
  for (const j of jugadas) {
    costoBoleta += j.cabeza + j.cinco + j.diez;
  }
  return costoBoleta * cantidadSorteos;
}

export function calcularPremioDeUnSorteo(jugadas: Jugada[], sorteo: number[]): ResultadoSorteo {
  let premio = 0;
  const aciertos: Acierto[] = [];

  for (const j of jugadas) {
    let numComp: number;
    const sorteoComp: number[] = [];

    if (j.cifras === 1) numComp = j.numero % 10;
    else if (j.cifras === 2) numComp = j.numero % 100;
    else numComp = j.numero;

    for (const n of sorteo) {
      if (j.cifras === 1) sorteoComp.push(n % 10);
      else if (j.cifras === 2) sorteoComp.push(n % 100);
      else sorteoComp.push(n);
    }

    let pagaCabeza = 70, pagaCinco = 14, pagaDiez = 7;
    if (j.cifras === 1) { pagaCabeza = 7; pagaCinco = 0; pagaDiez = 0; }
    else if (j.cifras === 3) { pagaCabeza = 600; pagaCinco = 100; pagaDiez = 50; }

    if (j.cabeza > 0 && numComp === sorteoComp[0]) {
      const gana = j.cabeza * pagaCabeza;
      premio += gana;
      aciertos.push({ numero: completarConCeros(j.numero, j.cifras), tipo: "Cabeza", importe: j.cabeza, premio: gana });
    }

    const estaEnCinco = sorteoComp.slice(0, 5).includes(numComp);
    if (j.cifras !== 1 && j.cinco > 0 && estaEnCinco) {
      const gana = j.cinco * pagaCinco;
      premio += gana;
      aciertos.push({ numero: completarConCeros(j.numero, j.cifras), tipo: "A los 5", importe: j.cinco, premio: gana });
    }

    const estaEnDiez = sorteoComp.includes(numComp);
    if (j.cifras !== 1 && j.diez > 0 && estaEnDiez) {
      const gana = j.diez * pagaDiez;
      premio += gana;
      aciertos.push({ numero: completarConCeros(j.numero, j.cifras), tipo: "A los 10", importe: j.diez, premio: gana });
    }
  }

  return { premio, aciertos };
}
