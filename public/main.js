let sorteosGlobal = [];
let jugadasGlobal = [];

let historialSorteos = [];
let frecuencia2Cifras = [];
let frecuencia3Cifras = [];

for (let i = 0; i < 100; i++) {
    frecuencia2Cifras.push(0);
}

for (let i = 0; i < 1000; i++) {
    frecuencia3Cifras.push(0);
}

let resumenGeneral = {
    boletasJugadas: 0,
    dineroGastado: 0,
    dineroGanado: 0
};

document.addEventListener("DOMContentLoaded", function () {
    // Inicia el tema, carga los datos guardados, arma la tabla inicial
    // y actualiza la vista de la boleta y asigna los eventos a los botones
    iniciarTema();
    cargarDatos();
    crearTabla();
    actualizarPreview();

    let cantidadSorteos = document.getElementById("cantidadSorteos");
    if (cantidadSorteos) {
        cantidadSorteos.addEventListener("input", function () {
            actualizarPreview();
        });
    }

    let luckyBtn = document.getElementById("luckySpinBtn");
    if (luckyBtn) {
        luckyBtn.addEventListener("click", function () {
            girarNumeroSuerte();
        });
    }
});

function iniciarTema() {
    // Lee el tema guardado y lo aplica.
    let guardado = localStorage.getItem("instantanea_tema");

    if (guardado === "dark") {
        document.body.classList.add("dark");
    }

    actualizarIconoTema();

    let toggle = document.getElementById("themeToggle");
    if (toggle) {
        toggle.addEventListener("click", function () {
            document.body.classList.toggle("dark");

            if (document.body.classList.contains("dark")) {
                localStorage.setItem("instantanea_tema", "dark");
            } else {
                localStorage.setItem("instantanea_tema", "light");
            }

            actualizarIconoTema();
        });
    }
}

function actualizarIconoTema() {
    // Cambia el texto del boton segun el tema.
    let toggle = document.getElementById("themeToggle");

    if (toggle) {
        if (document.body.classList.contains("dark")) {
            toggle.textContent = "Claro";
        } else {
            toggle.textContent = "Oscuro";
        }
    }
}

function mostrarMensaje(texto, tipo) {
    // Muestra un mensaje arriba de la pagina.
    if (!tipo) {
        tipo = "info";
    }

    let box = document.getElementById("messageBox");

    if (!box) {
        box = document.createElement("div");
        box.id = "messageBox";
        box.className = "messageBox";

        let contenedor = document.querySelector(".container");
        if (contenedor) {
            if (contenedor.firstChild) {
                contenedor.insertBefore(box, contenedor.firstChild);
            } else {
                contenedor.appendChild(box);
            }
        }
    }

    box.className = "messageBox " + tipo;
    box.textContent = texto;
}

function guardarDatos() {
    // Guarda historial, frecuencias y resumen general.
    localStorage.setItem("instantanea_historialSorteos", JSON.stringify(historialSorteos));
    localStorage.setItem("instantanea_frecuencia2", JSON.stringify(frecuencia2Cifras));
    localStorage.setItem("instantanea_frecuencia3", JSON.stringify(frecuencia3Cifras));
    localStorage.setItem("instantanea_resumenGeneral", JSON.stringify(resumenGeneral));
}

function cargarDatos() {
    // Recupera lo que ya estaba guardado.
    let h = localStorage.getItem("instantanea_historialSorteos");
    let f2 = localStorage.getItem("instantanea_frecuencia2");
    let f3 = localStorage.getItem("instantanea_frecuencia3");
    let rg = localStorage.getItem("instantanea_resumenGeneral");

    if (h) {
        historialSorteos = JSON.parse(h);
    }

    if (f2) {
        frecuencia2Cifras = JSON.parse(f2);
    }

    if (f3) {
        frecuencia3Cifras = JSON.parse(f3);
    }

    if (rg) {
        resumenGeneral = JSON.parse(rg);
    }
}

function formatearDinero(n) {
    return "$" + Number(n || 0).toLocaleString("es-AR");
}

function completarConCeros(numero, cifras) {
    // Completa con ceros a la izquierda.
    let texto = String(numero);

    while (texto.length < cifras) {
        texto = "0" + texto;
    }

    return texto;
}

function crearFilaHTML(index, data) {
    // Arma una fila de la tabla de jugadas.
    if (!data) {
        data = {};
    }

    let numero = "";
    let cifras = 3;
    let cabeza = 0;
    let cinco = 0;
    let diez = 0;

    if (data.numero !== undefined) {
        numero = data.numero;
    }

    if (data.cifras !== undefined) {
        cifras = data.cifras;
    }

    if (data.cabeza !== undefined) {
        cabeza = data.cabeza;
    }

    if (data.cinco !== undefined) {
        cinco = data.cinco;
    }

    if (data.diez !== undefined) {
        diez = data.diez;
    }

    let placeholderNumero = "67";
    if (cifras === 2) {
        placeholderNumero = "677";
    }

    return `
        <tr>
            <td><strong>${index + 1}</strong></td>
            <td>
                <input type="number" class="numero numInput" min="0" max="999" value="${numero}" placeholder="${placeholderNumero}" oninput="ajustarSegunCifras(this); actualizarPreview();">
            </td>
            <td>
                <input type="hidden" class="cifras" value="${cifras}">
                <button type="button" class="smallInput cifrasBtn" onclick="alternarCifras(this)">${cifras}</button>
            </td>
            <td><input type="number" class="cabeza smallInput" min="0" value="${cabeza}" oninput="actualizarPreview()"></td>
            <td><input type="number" class="cinco smallInput" min="0" value="${cinco}" oninput="actualizarPreview()"></td>
            <td><input type="number" class="diez smallInput" min="0" value="${diez}" oninput="actualizarPreview()"></td>
        </tr>
    `;
}

function crearTabla() {
    // Crea la cantidad de filas pedida por el usuario.
    let cantidad = parseInt(document.getElementById("cantidad").value);
    if (!cantidad || cantidad < 1) {
        cantidad = 3;
    }

    let tbody = document.querySelector("#tabla tbody");
    tbody.innerHTML = "";

    for (let i = 0; i < cantidad; i++) {
        tbody.innerHTML += crearFilaHTML(i);
    }

    reindexarFilas();
    actualizarPreview();
}

function alternarCifras(boton) {
    // Cambia una fila entre 2 y 3 cifras.
    let fila = boton.closest("tr");
    let inputCifras = fila.querySelector(".cifras");
    let inputNumero = fila.querySelector(".numero");

    if (inputCifras.value === "3") {
        inputCifras.value = "2";
        boton.textContent = "2";
        inputNumero.placeholder = "67";
    } else {
        inputCifras.value = "3";
        boton.textContent = "3";
        inputNumero.placeholder = "677";
    }

    ajustarSegunCifras(inputNumero);
    actualizarPreview();
}

function cargarJugadaClasica() {
    // Carga una jugada ejemplo ya armada.
    let tbody = document.querySelector("#tabla tbody");

    let clasica = [
        { numero: 64, cifras: 2, cabeza: 100, cinco: 0, diez: 100 },
        { numero: 32, cifras: 2, cabeza: 100, cinco: 0, diez: 100 },
        { numero: 86, cifras: 2, cabeza: 100, cinco: 0, diez: 100 }
    ];

    tbody.innerHTML = "";

    for (let i = 0; i < clasica.length; i++) {
        tbody.innerHTML += crearFilaHTML(i, clasica[i]);
    }

    document.getElementById("cantidad").value = 3;
    actualizarPreview();
    mostrarMensaje("Se cargo la jugada clasica.", "success");
}

function reindexarFilas() {
    // Reacomoda la numeracion de las filas.
    let filas = document.querySelectorAll("#tabla tbody tr");

    for (let i = 0; i < filas.length; i++) {
        filas[i].children[0].innerHTML = "<strong>" + (i + 1) + "</strong>";
    }

    document.getElementById("cantidad").value = filas.length;
}

function limpiarJugadas() {
    // Limpia toda la boleta actual.
    let filas = document.querySelectorAll("#tabla tbody tr");

    for (let i = 0; i < filas.length; i++) {
        let tr = filas[i];

        tr.querySelector(".numero").value = "";
        tr.querySelector(".cifras").value = "3";
        tr.querySelector(".cifrasBtn").textContent = "3";
        tr.querySelector(".numero").placeholder = "677";
        tr.querySelector(".cabeza").value = 0;
        tr.querySelector(".cinco").value = 0;
        tr.querySelector(".diez").value = 0;
        ajustarSegunCifras(tr.querySelector(".numero"));
    }

    sorteosGlobal = [];
    document.getElementById("sorteo").classList.add("hide");
    document.getElementById("resultado").classList.add("hide");
    actualizarPreview();
    mostrarMensaje("La boleta fue limpiada.", "info");
}

function vaciarMontos() {
    // Pone en cero todos los importes.
    let inputs = document.querySelectorAll(".cabeza, .cinco, .diez");

    for (let i = 0; i < inputs.length; i++) {
        inputs[i].value = 0;
    }

    actualizarPreview();
    mostrarMensaje("Los montos fueron vaciados.", "info");
}

function setMontoRapido(valor) {
    // Carga un valor rapido en el input general.
    document.getElementById("montoMasivo").value = valor;
}

function aplicarMontoMasivo(tipo) {
    // Copia el mismo monto en una columna o en todas.
    let monto = parseInt(document.getElementById("montoMasivo").value);
    if (!monto) {
        monto = 0;
    }

    let filas = document.querySelectorAll("#tabla tbody tr");

    for (let i = 0; i < filas.length; i++) {
        let fila = filas[i];

        if (tipo === "cabeza" || tipo === "todos") {
            fila.querySelector(".cabeza").value = monto;
        }

        if (tipo === "cinco" || tipo === "todos") {
            fila.querySelector(".cinco").value = monto;
        }

        if (tipo === "diez" || tipo === "todos") {
            fila.querySelector(".diez").value = monto;
        }
    }

    actualizarPreview();
}

function ajustarSegunCifras(inputNumero) {
    // Limita el numero segun se juegue a 2 o 3 cifras.
    let fila = inputNumero.closest("tr");
    let cifras = parseInt(fila.querySelector(".cifras").value);

    if (cifras === 2) {
        inputNumero.max = 99;
    } else {
        inputNumero.max = 999;
    }

    if (inputNumero.value !== "") {
        let valor = parseInt(inputNumero.value);
        if (!valor) {
            valor = 0;
        }

        if (cifras === 2 && valor > 99) {
            valor = valor % 100;
        }

        if (cifras === 3 && valor > 999) {
            valor = valor % 1000;
        }

        inputNumero.value = valor;
    }
}

function obtenerJugadasDesdeTabla() {
    // Lee la tabla y arma el arreglo de jugadas validas.
    let filas = document.querySelectorAll("#tabla tbody tr");
    let jugadas = [];

    for (let i = 0; i < filas.length; i++) {
        let fila = filas[i];
        let numeroRaw = fila.querySelector(".numero").value;
        let cifras = parseInt(fila.querySelector(".cifras").value);
        let cabeza = parseInt(fila.querySelector(".cabeza").value) || 0;
        let cinco = parseInt(fila.querySelector(".cinco").value) || 0;
        let diez = parseInt(fila.querySelector(".diez").value) || 0;

        if (numeroRaw !== "") {
            let numero = parseInt(numeroRaw);

            if (!isNaN(numero)) {
                if (cifras === 2) {
                    numero = numero % 100;
                }

                if (cifras === 3) {
                    numero = numero % 1000;
                }

                if (cabeza > 0 || cinco > 0 || diez > 0) {
                    jugadas.push({
                        numero: numero,
                        cifras: cifras,
                        cabeza: cabeza,
                        cinco: cinco,
                        diez: diez
                    });
                }
            }
        }
    }

    return jugadas;
}

function actualizarPreview() {
    // Actualiza el resumen de la boleta antes de jugar.
    jugadasGlobal = obtenerJugadasDesdeTabla();

    let cantidadSorteos = parseInt(document.getElementById("cantidadSorteos").value);
    if (!cantidadSorteos || cantidadSorteos < 1) {
        cantidadSorteos = 1;
    }

    document.getElementById("numerosBoleta").textContent = jugadasGlobal.length;
    document.getElementById("sorteosBoleta").textContent = cantidadSorteos;

    let totalBoleta = 0;

    for (let i = 0; i < jugadasGlobal.length; i++) {
        totalBoleta += jugadasGlobal[i].cabeza;
        totalBoleta += jugadasGlobal[i].cinco;
        totalBoleta += jugadasGlobal[i].diez;
    }

    let totalFinal = totalBoleta * cantidadSorteos;
    document.getElementById("totalApostado").textContent = formatearDinero(totalFinal);

    let cont = document.getElementById("ticketContenido");

    if (jugadasGlobal.length === 0) {
        cont.className = "empty";
        cont.innerHTML = "Carga tus numeros y montos para ver la boleta.";
        return;
    }

    let filasHTML = "";

    for (let i = 0; i < jugadasGlobal.length; i++) {
        let j = jugadasGlobal[i];

        filasHTML += `
            <tr>
                <td><strong>${completarConCeros(j.numero, j.cifras)}</strong></td>
                <td>${j.cifras}</td>
                <td>${formatearDinero(j.cabeza)}</td>
                <td>${formatearDinero(j.cinco)}</td>
                <td>${formatearDinero(j.diez)}</td>
            </tr>
        `;
    }

    cont.className = "";
    cont.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Numero</th>
                    <th>Cifras</th>
                    <th>Cabeza</th>
                    <th>A los 5</th>
                    <th>A los 10</th>
                </tr>
            </thead>
            <tbody>
                ${filasHTML}
            </tbody>
        </table>

        <div style="margin-top:12px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px;">
            <div><strong>Esta boleta se jugara en:</strong> ${cantidadSorteos} sorteo(s)</div>
            <div><strong>Total final:</strong> ${formatearDinero(totalFinal)}</div>
        </div>
    `;
}

function generarSorteo() {
    // Genera 10 numeros distintos entre 000 y 999.
    let nums = [];

    while (nums.length < 10) {
        let n = Math.floor(Math.random() * 1000);

        if (nums.indexOf(n) === -1) {
            nums.push(n);
        }
    }

    return nums;
}

function actualizarHistorialFrecuencias(sorteo) {
    // Suma el sorteo al historial y actualiza frecuencias.
    historialSorteos.push(sorteo);

    for (let i = 0; i < sorteo.length; i++) {
        let num = sorteo[i];
        frecuencia3Cifras[num]++;
        frecuencia2Cifras[num % 100]++;
    }
}

function mostrarSorteos() {
    // Muestra en pantalla los sorteos generados.
    let box = document.getElementById("sorteo");
    let lista = document.getElementById("sorteosLista");

    box.classList.remove("hide");

    let html = "";

    for (let idx = 0; idx < sorteosGlobal.length; idx++) {
        let sorteo = sorteosGlobal[idx];
        let bolillas = "";

        for (let i = 0; i < sorteo.length; i++) {
            bolillas += `
                <div class="bolilla">
                    <span>${i + 1}°</span>
                    <span>${completarConCeros(sorteo[i], 3)}</span>
                </div>
            `;
        }

        html += `
            <div class="sorteoItem">
                <h4>Sorteo ${idx + 1}</h4>
                <div class="bolillasGrid">
                    ${bolillas}
                </div>
            </div>
        `;
    }

    lista.innerHTML = html;
}

function calcularPremioDeUnSorteo(jugadas, sorteo) {
    // Calcula cuanto gano la boleta en un solo sorteo.
    let premio = 0;
    let aciertos = [];

    for (let i = 0; i < jugadas.length; i++) {
        let j = jugadas[i];
        let numComp;
        let sorteoComp = [];

        if (j.cifras === 2) {
            numComp = j.numero % 100;
        } else {
            numComp = j.numero;
        }

        for (let k = 0; k < sorteo.length; k++) {
            if (j.cifras === 2) {
                sorteoComp.push(sorteo[k] % 100);
            } else {
                sorteoComp.push(sorteo[k]);
            }
        }

        // VERIFICAR SI GANO A LA CABEZA
        if (j.cabeza > 0 && numComp === sorteoComp[0]) {
            let gana = j.cabeza * 70;
            premio += gana;
            aciertos.push({
                numero: completarConCeros(j.numero, j.cifras),
                tipo: "Cabeza",
                importe: j.cabeza,
                premio: gana
            });
        }

        let estaEnCinco = false;
        for (let a = 0; a < 5; a++) {
            if (sorteoComp[a] === numComp) {
                estaEnCinco = true;
                break;
            }
        }

        // VERIFICAR SI GANO A LOS 5
        if (j.cinco > 0 && estaEnCinco) {
            let gana = j.cinco * 14;
            premio += gana;
            aciertos.push({
                numero: completarConCeros(j.numero, j.cifras),
                tipo: "A los 5",
                importe: j.cinco,
                premio: gana
            });
        }

        let estaEnDiez = false;
        for (let b = 0; b < sorteoComp.length; b++) {
            if (sorteoComp[b] === numComp) {
                estaEnDiez = true;
                break;
            }
        }

        // VERIFICAR SI GANO A LOS 10
        if (j.diez > 0 && estaEnDiez) {
            let gana = j.diez * 7;
            premio += gana;
            aciertos.push({
                numero: completarConCeros(j.numero, j.cifras),
                tipo: "A los 10",
                importe: j.diez,
                premio: gana
            });
        }
    }

    return {
        premio: premio,
        aciertos: aciertos
    };
}

function jugar() {
    // Toma la boleta cargada, genera los sorteos, calcula premios
    // y actualiza el historial general.
    actualizarPreview();
    jugadasGlobal = obtenerJugadasDesdeTabla();

    if (jugadasGlobal.length === 0) {
        mostrarMensaje("Carga al menos un numero con algun importe.", "error");
        return;
    }

    let cantidadSorteos = parseInt(document.getElementById("cantidadSorteos").value);
    if (!cantidadSorteos || cantidadSorteos < 1) {
        cantidadSorteos = 1;
    }

    let costoBoleta = 0;
    for (let i = 0; i < jugadasGlobal.length; i++) {
        costoBoleta += jugadasGlobal[i].cabeza;
        costoBoleta += jugadasGlobal[i].cinco;
        costoBoleta += jugadasGlobal[i].diez;
    }

    let costoTotal = costoBoleta * cantidadSorteos;

    sorteosGlobal = [];
    let premioTotal = 0;
    let todosLosAciertos = [];

    for (let i = 0; i < cantidadSorteos; i++) {
        let sorteo = generarSorteo();
        sorteosGlobal.push(sorteo);
        actualizarHistorialFrecuencias(sorteo);

        let resultado = calcularPremioDeUnSorteo(jugadasGlobal, sorteo);
        premioTotal += resultado.premio;

        for (let j = 0; j < resultado.aciertos.length; j++) {
            let acierto = resultado.aciertos[j];
            todosLosAciertos.push({
                numero: acierto.numero,
                tipo: acierto.tipo,
                importe: acierto.importe,
                premio: acierto.premio,
                sorteo: i + 1
            });
        }
    }

    resumenGeneral.boletasJugadas += cantidadSorteos;
    resumenGeneral.dineroGastado += costoTotal;
    resumenGeneral.dineroGanado += premioTotal;

    guardarDatos();
    mostrarSorteos();
    mostrarResultadoFinal(cantidadSorteos, costoTotal, premioTotal, todosLosAciertos);

    if (premioTotal > 0) {
        mostrarMensaje("Se jugo la boleta y hubo aciertos.", "success");
    } else {
        mostrarMensaje("Se jugo la boleta. Esta vez no hubo aciertos.", "info");
    }
}

function mostrarResultadoFinal(cantidadSorteos, costoTotal, premioTotal, todosLosAciertos) {
    // Muestra el resultado final de la jugada.
    let res = document.getElementById("resultado");
    res.classList.remove("hide");

    if (premioTotal > 0) {
        let htmlAciertos = "";

        for (let i = 0; i < todosLosAciertos.length; i++) {
            let a = todosLosAciertos[i];

            htmlAciertos += `
                <div class="hit">
                    <div>
                        <strong>Sorteo ${a.sorteo}</strong> — ${a.numero} — ${a.tipo}
                        <br><small>Apostado: ${formatearDinero(a.importe)}</small>
                    </div>
                    <div><strong>${formatearDinero(a.premio)}</strong></div>
                </div>
            `;
        }

        res.className = "resultados";
        res.innerHTML = `
            <div class="resultadoTop">
                <div>
                    <h3>Resultado ganador</h3>
                    <div>Boleta jugada en <strong>${cantidadSorteos}</strong> sorteo(s) distintos.</div>
                </div>
                <div class="ganancia win">${formatearDinero(premioTotal)}</div>
            </div>

            <div style="margin-top:10px;">
                <strong>Gastado:</strong> ${formatearDinero(costoTotal)} &nbsp; | &nbsp;
                <strong>Ganado:</strong> ${formatearDinero(premioTotal)} &nbsp; | &nbsp;
                <strong>Balance:</strong> ${formatearDinero(premioTotal - costoTotal)}
            </div>

            <div class="aciertosList">
                ${htmlAciertos}
            </div>
        `;
    } else {
        res.className = "resultados perdedor";
        res.innerHTML = `
            <div class="resultadoTop">
                <div>
                    <h3>Sin aciertos</h3>
                    <div>Boleta jugada en <strong>${cantidadSorteos}</strong> sorteo(s) distintos.</div>
                </div>
                <div class="ganancia loss">${formatearDinero(0)}</div>
            </div>

            <div style="margin-top:10px;">
                <strong>Gastado:</strong> ${formatearDinero(costoTotal)} &nbsp; | &nbsp;
                <strong>Balance:</strong> ${formatearDinero(-costoTotal)}
            </div>
        `;
    }
}

function topFrecuentes(arr, cantidad, cifras, asc) {
    // Ordena los numeros por cantidad de apariciones y arma el ranking visual.
    if (asc === undefined) {
        asc = false;
    }

    let lista = [];

    for (let i = 0; i < arr.length; i++) {
        lista.push({
            numero: i,
            veces: arr[i]
        });
    }

    lista.sort(function (a, b) {
        if (asc) {
            return a.veces - b.veces;
        } else {
            return b.veces - a.veces;
        }
    });

    let maximo = 1;
    for (let i = 0; i < lista.length; i++) {
        if (lista[i].veces > maximo) {
            maximo = lista[i].veces;
        }
    }

    let html = "";
    let limite = cantidad;

    if (lista.length < cantidad) {
        limite = lista.length;
    }

    for (let i = 0; i < limite; i++) {
        let e = lista[i];
        let n = completarConCeros(e.numero, cifras);
        let porcentaje = (e.veces / maximo) * 100;

        if (porcentaje < 4) {
            porcentaje = 4;
        }

        let textoVeces = "veces";
        if (e.veces === 1) {
            textoVeces = "vez";
        }

        html += `
            <div class="rankItem">
                <div class="rankTop">
                    <span>${n}</span>
                    <span>${e.veces} ${textoVeces}</span>
                </div>
                <div class="barraWrap">
                    <div class="barra" style="width:${porcentaje}%"></div>
                </div>
            </div>
        `;
    }

    return html;
}

function verHistorial() {
    // Actualiza la tarjeta de estadisticas con los datos acumulados.
    let div = document.getElementById("estadisticas");
    document.getElementById("estadisticasCard").classList.remove("hide");

    let top2 = topFrecuentes(frecuencia2Cifras, 10, 2, false);
    let top3 = topFrecuentes(frecuencia3Cifras, 10, 3, false);
    let frios2 = topFrecuentes(frecuencia2Cifras, 10, 2, true);
    let frios3 = topFrecuentes(frecuencia3Cifras, 10, 3, true);

    let balance = resumenGeneral.dineroGanado - resumenGeneral.dineroGastado;

    let textoTop = "-";
    if (historialSorteos.length > 0) {
        textoTop = "Top 10";
    }

    div.innerHTML = `
        <div class="statCards" style="margin-bottom:14px;">
            <div class="stat">
                <span>Boletas jugadas</span>
                <strong>${resumenGeneral.boletasJugadas}</strong>
            </div>
            <div class="stat">
                <span>Dinero gastado</span>
                <strong>${formatearDinero(resumenGeneral.dineroGastado)}</strong>
            </div>
            <div class="stat">
                <span>Dinero ganado</span>
                <strong>${formatearDinero(resumenGeneral.dineroGanado)}</strong>
            </div>
            <div class="stat">
                <span>Balance</span>
                <strong>${formatearDinero(balance)}</strong>
            </div>
            <div class="stat">
                <span>Calientes 2 cifras</span>
                <strong>${textoTop}</strong>
            </div>
            <div class="stat">
                <span>Calientes 3 cifras</span>
                <strong>${textoTop}</strong>
            </div>
        </div>

        <div class="columns2">
            <div class="statsBox">
                <h4>Calientes 2 cifras</h4>
                <div class="rankList">${top2}</div>
            </div>

            <div class="statsBox">
                <h4>Calientes 3 cifras</h4>
                <div class="rankList">${top3}</div>
            </div>

            <div class="statsBox">
                <h4>Frios 2 cifras</h4>
                <div class="rankList">${frios2}</div>
            </div>

            <div class="statsBox">
                <h4>Frios 3 cifras</h4>
                <div class="rankList">${frios3}</div>
            </div>
        </div>
    `;
}

function resetearHistorial() {
    // Borra el historial completo y reinicia los contadores.
    historialSorteos = [];
    frecuencia2Cifras = [];
    frecuencia3Cifras = [];

    for (let i = 0; i < 100; i++) {
        frecuencia2Cifras.push(0);
    }

    for (let i = 0; i < 1000; i++) {
        frecuencia3Cifras.push(0);
    }

    resumenGeneral = {
        boletasJugadas: 0,
        dineroGastado: 0,
        dineroGanado: 0
    };

    guardarDatos();
    document.getElementById("estadisticasCard").classList.add("hide");
    document.getElementById("estadisticas").innerHTML = "";
    mostrarMensaje("Historial y balance borrados.", "success");
}

function hayHistorial3Cifras() {
    // Detecta si ya hubo sorteos guardados.
    for (let i = 0; i < frecuencia3Cifras.length; i++) {
        if (frecuencia3Cifras[i] > 0) {
            return true;
        }
    }

    return false;
}

function elegirNumeroSuerte() {
    // Si hay historial, toma uno al azar entre los 20 mas salidores.
    // Si no hay historial, genera uno aleatorio.
    let huboHistorial = hayHistorial3Cifras();

    if (huboHistorial) {
        let lista = [];

        for (let i = 0; i < frecuencia3Cifras.length; i++) {
            lista.push({
                numero: i,
                veces: frecuencia3Cifras[i]
            });
        }

        lista.sort(function (a, b) {
            return b.veces - a.veces;
        });

        let top = [];
        for (let i = 0; i < 20 && i < lista.length; i++) {
            top.push(lista[i]);
        }

        let posicion = Math.floor(Math.random() * top.length);
        let elegido = top[posicion];

        if (elegido) {
            return elegido.numero;
        } else {
            return Math.floor(Math.random() * 1000);
        }
    }

    return Math.floor(Math.random() * 1000);
}

function girarNumeroSuerte() {
    // Hace la animacion del numero de la suerte y muestra el resultado final.
    let box = document.getElementById("luckyBox");
    let label = document.getElementById("luckyLabel");
    let btn = document.getElementById("luckySpinBtn");

    if (!box || !label || !btn) {
        return;
    }

    btn.disabled = true;
    box.classList.add("spinning");
    label.textContent = "Girando...";

    let contador = 0;

    let intervalo = setInterval(function () {
        let random = Math.floor(Math.random() * 1000);
        box.textContent = completarConCeros(random, 3);
        contador++;
    }, 70);

    setTimeout(function () {
        clearInterval(intervalo);

        let finalNum = elegirNumeroSuerte();
        box.classList.remove("spinning");
        box.textContent = completarConCeros(finalNum, 3);

        let origen = "";
        if (hayHistorial3Cifras()) {
            origen = "Recomendado a partir de tus sorteos guardados.";
        } else {
            origen = "Recomendacion aleatoria porque todavia no hay historial.";
        }

        label.textContent = origen;
        btn.disabled = false;
    }, 1600);
}