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

document.addEventListener("DOMContentLoaded", async function () {
    iniciarTema();
    await cargarDatos();
    crearTabla();
    actualizarPreview();

    if (window.USER_LOGUEADO) {
        cargarHistorialBoletas();
        actualizarBotonesFavorita();
        cargarPerfil();  // ← NUEVO: sincronizar avatar y nombre al cargar
    }

    // NUEVO: botón "Mi perfil"
    const btnEditarPerfil = document.getElementById("btnEditarPerfil");
    if (btnEditarPerfil) {
        btnEditarPerfil.addEventListener("click", abrirModalPerfil);
    }

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
    if (!tipo) tipo = "info";
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

async function guardarDatos() {
    if (!window.USER_LOGUEADO) {
        localStorage.setItem("instantanea_historialSorteos", JSON.stringify(historialSorteos));
        localStorage.setItem("instantanea_frecuencia2", JSON.stringify(frecuencia2Cifras));
        localStorage.setItem("instantanea_frecuencia3", JSON.stringify(frecuencia3Cifras));
        localStorage.setItem("instantanea_resumenGeneral", JSON.stringify(resumenGeneral));
        return;
    }

    try {
        await fetch("/api/stats", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                boletas_jugadas: resumenGeneral.boletasJugadas,
                dinero_gastado: resumenGeneral.dineroGastado,
                dinero_ganado: resumenGeneral.dineroGanado,
                frecuencia_2_cifras: frecuencia2Cifras,
                frecuencia_3_cifras: frecuencia3Cifras
            })
        });
    } catch (err) {
        console.error("Error al guardar en el servidor:", err);
    }
}

async function cargarDatos() {
    if (!window.USER_LOGUEADO) {
        let h = localStorage.getItem("instantanea_historialSorteos");
        let f2 = localStorage.getItem("instantanea_frecuencia2");
        let f3 = localStorage.getItem("instantanea_frecuencia3");
        let rg = localStorage.getItem("instantanea_resumenGeneral");
        if (h) historialSorteos = JSON.parse(h);
        if (f2) frecuencia2Cifras = JSON.parse(f2);
        if (f3) frecuencia3Cifras = JSON.parse(f3);
        if (rg) resumenGeneral = JSON.parse(rg);
        return;
    }

    try {
        const res = await fetch("/api/stats");
        if (!res.ok) return;
        const data = await res.json();

        resumenGeneral = {
            boletasJugadas: Number(data.boletas_jugadas ?? 0),
            dineroGastado: Number(data.dinero_gastado ?? 0),
            dineroGanado: Number(data.dinero_ganado ?? 0)
        };

        if (Array.isArray(data.frecuencia_2_cifras) && data.frecuencia_2_cifras.length === 100) {
            frecuencia2Cifras = data.frecuencia_2_cifras;
        }
        if (Array.isArray(data.frecuencia_3_cifras) && data.frecuencia_3_cifras.length === 1000) {
            frecuencia3Cifras = data.frecuencia_3_cifras;
        }
    } catch (err) {
        console.error("Error al cargar del servidor:", err);
    }
}

function formatearDinero(n) {
    return "$" + Number(n || 0).toLocaleString("es-AR");
}

function completarConCeros(numero, cifras) {
    let texto = String(numero);
    while (texto.length < cifras) {
        texto = "0" + texto;
    }
    return texto;
}

function crearFilaHTML(index, data) {
    if (!data) data = {};
    let numero = data.numero !== undefined ? data.numero : "";
    let cifras = data.cifras !== undefined ? data.cifras : 3;
    let cabeza = data.cabeza !== undefined ? data.cabeza : 0;
    let cinco = data.cinco !== undefined ? data.cinco : 0;
    let diez = data.diez !== undefined ? data.diez : 0;

    let placeholderNumero = "7";
    if (cifras === 2) placeholderNumero = "67";
    if (cifras === 3) placeholderNumero = "677";

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
<td><input type="number" class="cabeza smallInput" min="0" max="50000" value="${cabeza}" oninput="actualizarPreview()"></td>
<td><input type="number" class="cinco smallInput" min="0" max="50000" value="${cinco}" oninput="actualizarPreview()"></td>
<td><input type="number" class="diez smallInput" min="0" max="50000" value="${diez}" oninput="actualizarPreview()"></td>
        </tr>
    `;
}

function crearTabla() {
    let cantidad = parseInt(document.getElementById("cantidad").value);
    if (!cantidad || cantidad < 1) cantidad = 3;
    if (cantidad > 15) cantidad = 15;
    let tbody = document.querySelector("#tabla tbody");
    tbody.innerHTML = "";

    for (let i = 0; i < cantidad; i++) {
        tbody.innerHTML += crearFilaHTML(i);
    }

    let filas = document.querySelectorAll("#tabla tbody tr");
    for (let i = 0; i < filas.length; i++) {
        actualizarEstadoApuestasFila(filas[i]);
    }

    reindexarFilas();
    actualizarPreview();
}

function actualizarEstadoApuestasFila(fila) {
    let cifras = parseInt(fila.querySelector(".cifras").value);
    let inputCinco = fila.querySelector(".cinco");
    let inputDiez = fila.querySelector(".diez");

    if (cifras === 1) {
        inputCinco.value = 0;
        inputDiez.value = 0;
        inputCinco.disabled = true;
        inputDiez.disabled = true;
    } else {
        inputCinco.disabled = false;
        inputDiez.disabled = false;
    }
}

function alternarCifras(boton) {
    let fila = boton.closest("tr");
    let inputCifras = fila.querySelector(".cifras");
    let inputNumero = fila.querySelector(".numero");

    if (inputCifras.value === "3") {
        inputCifras.value = "2";
        boton.textContent = "2";
        inputNumero.placeholder = "67";
    } else if (inputCifras.value === "2") {
        inputCifras.value = "1";
        boton.textContent = "1";
        inputNumero.placeholder = "7";
    } else {
        inputCifras.value = "3";
        boton.textContent = "3";
        inputNumero.placeholder = "677";
    }

    ajustarSegunCifras(inputNumero);
    actualizarEstadoApuestasFila(fila);
    actualizarPreview();
}

function cargarJugadaClasica() {
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

    let filas = document.querySelectorAll("#tabla tbody tr");
    for (let i = 0; i < filas.length; i++) {
        actualizarEstadoApuestasFila(filas[i]);
    }

    document.getElementById("cantidad").value = 3;
    actualizarPreview();
    mostrarMensaje("Se cargo la jugada clasica.", "success");
}

function reindexarFilas() {
    let filas = document.querySelectorAll("#tabla tbody tr");
    for (let i = 0; i < filas.length; i++) {
        filas[i].children[0].innerHTML = "<strong>" + (i + 1) + "</strong>";
    }
    document.getElementById("cantidad").value = filas.length;
}

function limpiarJugadas() {
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
        actualizarEstadoApuestasFila(tr);
    }

    sorteosGlobal = [];
    document.getElementById("sorteo").classList.add("hide");
    document.getElementById("resultado").classList.add("hide");
    actualizarPreview();
    mostrarMensaje("La boleta fue limpiada.", "info");
}

function vaciarMontos() {
    let inputs = document.querySelectorAll(".cabeza, .cinco, .diez");
    for (let i = 0; i < inputs.length; i++) {
        inputs[i].value = 0;
    }
    actualizarPreview();
    mostrarMensaje("Los montos fueron vaciados.", "info");
}

function setMontoRapido(valor) {
    document.getElementById("montoMasivo").value = valor;
}

function aplicarMontoMasivo(tipo) {
    let monto = parseInt(document.getElementById("montoMasivo").value);
    if (!monto) monto = 0;

    let filas = document.querySelectorAll("#tabla tbody tr");
    for (let i = 0; i < filas.length; i++) {
        let fila = filas[i];
        let cifras = parseInt(fila.querySelector(".cifras").value);

        if (tipo === "cabeza" || tipo === "todos") {
            fila.querySelector(".cabeza").value = monto;
        }
        if ((tipo === "cinco" || tipo === "todos") && cifras !== 1) {
            fila.querySelector(".cinco").value = monto;
        }
        if ((tipo === "diez" || tipo === "todos") && cifras !== 1) {
            fila.querySelector(".diez").value = monto;
        }
    }
    actualizarPreview();
}

function ajustarSegunCifras(inputNumero) {
    let fila = inputNumero.closest("tr");
    let cifras = parseInt(fila.querySelector(".cifras").value);

    if (cifras === 1) inputNumero.max = 9;
    else if (cifras === 2) inputNumero.max = 99;
    else inputNumero.max = 999;

    if (inputNumero.value !== "") {
        let valor = parseInt(inputNumero.value);
        if (!valor) valor = 0;

        if (cifras === 1 && valor > 9) valor = valor % 10;
        if (cifras === 2 && valor > 99) valor = valor % 100;
        if (cifras === 3 && valor > 999) valor = valor % 1000;

        inputNumero.value = valor;
    }
}

function obtenerJugadasDesdeTabla() {
    let filas = document.querySelectorAll("#tabla tbody tr");
    let jugadas = [];

    const MONTO_MAX = 50000;

    for (let i = 0; i < filas.length; i++) {
        let fila = filas[i];
        let numeroRaw = fila.querySelector(".numero").value;
        let cifras = parseInt(fila.querySelector(".cifras").value);
        let cabeza = parseInt(fila.querySelector(".cabeza").value) || 0;
        let cinco = parseInt(fila.querySelector(".cinco").value) || 0;
        let diez = parseInt(fila.querySelector(".diez").value) || 0;

        // Capamos montos al máximo permitido
        if (cabeza > MONTO_MAX) cabeza = MONTO_MAX;
        if (cinco > MONTO_MAX) cinco = MONTO_MAX;
        if (diez > MONTO_MAX) diez = MONTO_MAX;

        // También sincronizamos el valor visible del input
        fila.querySelector(".cabeza").value = cabeza;
        fila.querySelector(".cinco").value = cinco;
        fila.querySelector(".diez").value = diez;

        if (numeroRaw !== "") {
            let numero = parseInt(numeroRaw);
            if (!isNaN(numero)) {
                if (cifras === 1) numero = numero % 10;
                if (cifras === 2) numero = numero % 100;
                if (cifras === 3) numero = numero % 1000;

                if (cabeza > 0 || cinco > 0 || diez > 0) {
                    jugadas.push({ numero, cifras, cabeza, cinco, diez });
                }
            }
        }
    }
    return jugadas;
}

function actualizarPreview() {
    jugadasGlobal = obtenerJugadasDesdeTabla();

    let cantidadSorteos = parseInt(document.getElementById("cantidadSorteos").value);
    if (!cantidadSorteos || cantidadSorteos < 1) cantidadSorteos = 1;

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
                    <th>Numero</th><th>Cifras</th><th>Cabeza</th><th>A los 5</th><th>A los 10</th>
                </tr>
            </thead>
            <tbody>${filasHTML}</tbody>
        </table>
        <div style="margin-top:12px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px;">
            <div><strong>Esta boleta se jugara en:</strong> ${cantidadSorteos} sorteo(s)</div>
            <div><strong>Total final:</strong> ${formatearDinero(totalFinal)}</div>
        </div>
    `;
}

function generarSorteo() {
    let nums = [];
    while (nums.length < 10) {
        let n = Math.floor(Math.random() * 1000);
        nums.push(n);
    }
    return nums;
}

function actualizarHistorialFrecuencias(sorteo) {
    historialSorteos.push(sorteo);
    for (let i = 0; i < sorteo.length; i++) {
        let num = sorteo[i];
        frecuencia3Cifras[num]++;
        frecuencia2Cifras[num % 100]++;
    }
}

function mostrarSorteos() {
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
                <div class="bolillasGrid">${bolillas}</div>
            </div>
        `;
    }
    lista.innerHTML = html;
}

function calcularPremioDeUnSorteo(jugadas, sorteo) {
    let premio = 0;
    let aciertos = [];

    for (let i = 0; i < jugadas.length; i++) {
        let j = jugadas[i];
        let numComp;
        let sorteoComp = [];

        if (j.cifras === 1) numComp = j.numero % 10;
        else if (j.cifras === 2) numComp = j.numero % 100;
        else numComp = j.numero;

        for (let k = 0; k < sorteo.length; k++) {
            if (j.cifras === 1) sorteoComp.push(sorteo[k] % 10);
            else if (j.cifras === 2) sorteoComp.push(sorteo[k] % 100);
            else sorteoComp.push(sorteo[k]);
        }

        let pagaCabeza = 70, pagaCinco = 14, pagaDiez = 7;
        if (j.cifras === 1) { pagaCabeza = 7; pagaCinco = 0; pagaDiez = 0; }
        else if (j.cifras === 2) { pagaCabeza = 70; pagaCinco = 14; pagaDiez = 7; }
        else if (j.cifras === 3) { pagaCabeza = 600; pagaCinco = 100; pagaDiez = 50; }

        if (j.cabeza > 0 && numComp === sorteoComp[0]) {
            let gana = j.cabeza * pagaCabeza;
            premio += gana;
            aciertos.push({ numero: completarConCeros(j.numero, j.cifras), tipo: "Cabeza", importe: j.cabeza, premio: gana });
        }

        let estaEnCinco = false;
        for (let a = 0; a < 5; a++) {
            if (sorteoComp[a] === numComp) { estaEnCinco = true; break; }
        }
        if (j.cifras !== 1 && j.cinco > 0 && estaEnCinco) {
            let gana = j.cinco * pagaCinco;
            premio += gana;
            aciertos.push({ numero: completarConCeros(j.numero, j.cifras), tipo: "A los 5", importe: j.cinco, premio: gana });
        }

        let estaEnDiez = false;
        for (let b = 0; b < sorteoComp.length; b++) {
            if (sorteoComp[b] === numComp) { estaEnDiez = true; break; }
        }
        if (j.cifras !== 1 && j.diez > 0 && estaEnDiez) {
            let gana = j.diez * pagaDiez;
            premio += gana;
            aciertos.push({ numero: completarConCeros(j.numero, j.cifras), tipo: "A los 10", importe: j.diez, premio: gana });
        }
    }

    return { premio, aciertos };
}

async function jugar() {
    actualizarPreview();
    jugadasGlobal = obtenerJugadasDesdeTabla();

    if (jugadasGlobal.length === 0) {
        mostrarMensaje("Carga al menos un numero con algun importe.", "error");
        return;
    }

    let cantidadSorteos = parseInt(document.getElementById("cantidadSorteos").value);
    if (!cantidadSorteos || cantidadSorteos < 1) cantidadSorteos = 1;

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

    await guardarDatos();

    if (window.USER_LOGUEADO) {
        try {
            await fetch("/api/boletas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jugadas: jugadasGlobal,
                    sorteos: sorteosGlobal,
                    cantidadSorteos: cantidadSorteos,
                    costoTotal: costoTotal,
                    premioTotal: premioTotal,
                    aciertos: todosLosAciertos
                })
            });
        } catch (err) {
            console.error("Error al guardar boleta:", err);
        }
    }

    mostrarSorteos();
    mostrarResultadoFinal(cantidadSorteos, costoTotal, premioTotal, todosLosAciertos);

    if (premioTotal > 0) {
        mostrarMensaje("Se jugo la boleta y hubo aciertos.", "success");
    } else {
        mostrarMensaje("Se jugo la boleta. Esta vez no hubo aciertos.", "info");
    }
     verHistorial();
     if (window.USER_LOGUEADO) {
        cargarHistorialBoletas();
    }
}


function mostrarResultadoFinal(cantidadSorteos, costoTotal, premioTotal, todosLosAciertos) {
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
            <div class="aciertosList">${htmlAciertos}</div>
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
    if (asc === undefined) asc = false;

    let lista = [];
    for (let i = 0; i < arr.length; i++) {
        lista.push({ numero: i, veces: arr[i] });
    }

    lista.sort(function (a, b) {
        if (asc) return a.veces - b.veces;
        return b.veces - a.veces;
    });

    let maximo = 1;
    for (let i = 0; i < lista.length; i++) {
        if (lista[i].veces > maximo) maximo = lista[i].veces;
    }

    let html = "";
    let limite = cantidad;
    if (lista.length < cantidad) limite = lista.length;

    for (let i = 0; i < limite; i++) {
        let e = lista[i];
        let n = completarConCeros(e.numero, cifras);
        let porcentaje = (e.veces / maximo) * 100;
        if (porcentaje < 4) porcentaje = 4;

        let textoVeces = e.veces === 1 ? "vez" : "veces";

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
    let div = document.getElementById("estadisticas");
    document.getElementById("estadisticasCard").classList.remove("hide");

    let top2 = topFrecuentes(frecuencia2Cifras, 10, 2, false);
    let top3 = topFrecuentes(frecuencia3Cifras, 10, 3, false);
    let frios2 = topFrecuentes(frecuencia2Cifras, 10, 2, true);
    let frios3 = topFrecuentes(frecuencia3Cifras, 10, 3, true);

    let balance = resumenGeneral.dineroGanado - resumenGeneral.dineroGastado;
    let textoTop = historialSorteos.length > 0 ? "Top 10" : "-";

    div.innerHTML = `
        <div class="statCards" style="margin-bottom:14px;">
            <div class="stat"><span>Boletas jugadas</span><strong>${resumenGeneral.boletasJugadas}</strong></div>
            <div class="stat"><span>Dinero gastado</span><strong>${formatearDinero(resumenGeneral.dineroGastado)}</strong></div>
            <div class="stat"><span>Dinero ganado</span><strong>${formatearDinero(resumenGeneral.dineroGanado)}</strong></div>
            <div class="stat"><span>Balance</span><strong>${formatearDinero(balance)}</strong></div>
            <div class="stat"><span>Calientes 2 cifras</span><strong>${textoTop}</strong></div>
            <div class="stat"><span>Calientes 3 cifras</span><strong>${textoTop}</strong></div>
        </div>
        <div class="columns2">
            <div class="statsBox"><h4>Calientes 2 cifras</h4><div class="rankList">${top2}</div></div>
            <div class="statsBox"><h4>Calientes 3 cifras</h4><div class="rankList">${top3}</div></div>
            <div class="statsBox"><h4>Frios 2 cifras</h4><div class="rankList">${frios2}</div></div>
            <div class="statsBox"><h4>Frios 3 cifras</h4><div class="rankList">${frios3}</div></div>
        </div>
    `;
}

async function resetearHistorial() {
    const ok = await confirmarModal(
        "Reset de estadísticas",
        "¿Querés borrar TODAS tus estadísticas e historial? Esta acción no se puede deshacer.",
        "Borrar todo"
    );
    if (!ok) return;

    historialSorteos = [];
    frecuencia2Cifras = [];
    frecuencia3Cifras = [];

    for (let i = 0; i < 100; i++) frecuencia2Cifras.push(0);
    for (let i = 0; i < 1000; i++) frecuencia3Cifras.push(0);

    resumenGeneral = { boletasJugadas: 0, dineroGastado: 0, dineroGanado: 0 };

    if (window.USER_LOGUEADO) {
        try {
            await fetch("/api/stats", { method: "DELETE" });
        } catch (err) {
            console.error("Error al resetear:", err);
        }
    } else {
        localStorage.removeItem("instantanea_historialSorteos");
        localStorage.removeItem("instantanea_frecuencia2");
        localStorage.removeItem("instantanea_frecuencia3");
        localStorage.removeItem("instantanea_resumenGeneral");
    }

    document.getElementById("estadisticasCard").classList.add("hide");
    document.getElementById("estadisticas").innerHTML = "";
    document.getElementById("historialCard").classList.add("hide");
    document.getElementById("historialContenido").innerHTML = "";
    mostrarMensaje("Historial y balance borrados.", "success");
}



function hayHistorial3Cifras() {
    for (let i = 0; i < frecuencia3Cifras.length; i++) {
        if (frecuencia3Cifras[i] > 0) return true;
    }
    return false;
}

function elegirNumeroSuerte() {
    let huboHistorial = hayHistorial3Cifras();

    if (huboHistorial) {
        let lista = [];
        for (let i = 0; i < frecuencia3Cifras.length; i++) {
            lista.push({ numero: i, veces: frecuencia3Cifras[i] });
        }
        lista.sort(function (a, b) { return b.veces - a.veces; });

        let top = [];
        for (let i = 0; i < 20 && i < lista.length; i++) top.push(lista[i]);

        let posicion = Math.floor(Math.random() * top.length);
        let elegido = top[posicion];
        if (elegido) return elegido.numero;
        return Math.floor(Math.random() * 1000);
    }
    return Math.floor(Math.random() * 1000);
}

function girarNumeroSuerte() {
    let box = document.getElementById("luckyBox");
    let label = document.getElementById("luckyLabel");
    let btn = document.getElementById("luckySpinBtn");

    if (!box || !label || !btn) return;

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

        let origen = hayHistorial3Cifras()
            ? "Recomendado a partir de tus sorteos guardados."
            : "Recomendacion aleatoria porque todavia no hay historial.";

        label.textContent = origen;
        btn.disabled = false;
    }, 1600);
}

async function cargarHistorialBoletas() {
    if (!window.USER_LOGUEADO) {
        return;
    }

    const card = document.getElementById("historialCard");
    const cont = document.getElementById("historialContenido");

    card.classList.remove("hide");
    cont.innerHTML = "Cargando...";

    try {
        const res = await fetch("/api/boletas");
        if (!res.ok) {
            cont.innerHTML = "<p>No se pudo cargar el historial.</p>";
            return;
        }

        const boletas = await res.json();

        if (!Array.isArray(boletas) || boletas.length === 0) {
            cont.innerHTML = "<p>Todavía no jugaste ninguna boleta.</p>";
            return;
        }

        cont.innerHTML = renderizarHistorialBoletas(boletas);
    } catch (err) {
        console.error("Error al cargar historial:", err);
        cont.innerHTML = "<p>Error al cargar el historial.</p>";
    }
}

function renderizarHistorialBoletas(boletas) {
    let html = '<div class="historialGrid">';

    for (let i = 0; i < boletas.length; i++) {
        const b = boletas[i];
        const costo = Number(b.costo_total);
        const premio = Number(b.premio_total);
        const balance = premio - costo;

        const fecha = new Date(b.created_at).toLocaleString("es-AR", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit"
        });

        const jugadas = Array.isArray(b.jugadas) ? b.jugadas : [];
        const aciertos = Array.isArray(b.aciertos) ? b.aciertos : [];

        let numerosHtml = "";
        for (let j = 0; j < jugadas.length; j++) {
            const jg = jugadas[j];
            numerosHtml += `<span class="numeroChip">${completarConCeros(jg.numero, jg.cifras)}</span>`;
        }

        const claseBalance = balance > 0 ? "win" : (balance < 0 ? "loss" : "");
        const textoBalance = (balance >= 0 ? "+" : "") + formatearDinero(balance);

        const hayAciertos = aciertos.length > 0;

        html += `
            <div class="historialItem ${hayAciertos ? 'conAciertos' : ''}">
                <div class="historialHeader">
                    <span class="historialFecha">${fecha}</span>
                    <span class="ganancia ${claseBalance}">${textoBalance}</span>
                </div>
                <div class="historialNumeros">
                    ${numerosHtml}
                </div>
                <div class="historialDetalle">
                    <span>${b.cantidad_sorteos} sorteo(s)</span>
                    <span>Apostado: ${formatearDinero(costo)}</span>
                    <span>Premio: ${formatearDinero(premio)}</span>
                    <span>${aciertos.length} acierto(s)</span>
                </div>
            </div>
        `;
    }

    html += '</div>';
    return html;
}

function guardarJugadaFavorita() {
    if (!window.USER_LOGUEADO) return;

    const jugadas = obtenerJugadasDesdeTabla();
    if (jugadas.length === 0) {
        mostrarMensaje("Carga al menos un numero con algun importe para guardar.", "error");
        return;
    }

    // Abrimos el modal, consultando primero si ya hay una favorita
    abrirModalFavorita(jugadas);
}

async function abrirModalFavorita(jugadas) {
    const modal = document.getElementById("favoritaModal");
    const input = document.getElementById("favoritaNombre");
    const titulo = document.getElementById("favoritaModalTitulo");
    const desc = document.getElementById("favoritaModalDesc");
    const btnOk = document.getElementById("btnModalConfirmar");
    const btnCancel = document.getElementById("btnModalCancelar");

    // Consultamos si ya hay una favorita guardada
    let nombreActual = "";
    let existeFavorita = false;
    try {
        const res = await fetch("/api/favorita");
        if (res.ok) {
            const data = await res.json();
            if (data && data.nombre) {
                nombreActual = data.nombre;
                existeFavorita = true;
            }
        }
    } catch (err) {
        // Si falla la consulta, seguimos como si no existiera
    }

    if (existeFavorita) {
        titulo.textContent = "Reemplazar jugada favorita";
        desc.textContent = `Ya tenés una favorita guardada ("${nombreActual}"). Si confirmás, se va a reemplazar por la jugada actual.`;
        input.value = nombreActual;
    } else {
        titulo.textContent = "Guardar jugada favorita";
        desc.textContent = "Poné un nombre para identificar esta jugada.";
        input.value = "Mi jugada favorita";
    }

    modal.classList.remove("hide");
    setTimeout(() => input.focus(), 50);

    // Limpiar handlers previos (por si se abrió varias veces)
    const nuevoBtnOk = btnOk.cloneNode(true);
    btnOk.parentNode.replaceChild(nuevoBtnOk, btnOk);

    const nuevoBtnCancel = btnCancel.cloneNode(true);
    btnCancel.parentNode.replaceChild(nuevoBtnCancel, btnCancel);

    function cerrarModal() {
        modal.classList.add("hide");
        document.removeEventListener("keydown", onKeyDown);
        modal.removeEventListener("click", onOverlayClick);
    }

    function onKeyDown(e) {
        if (e.key === "Escape") cerrarModal();
        if (e.key === "Enter") confirmar();
    }

    function onOverlayClick(e) {
        // Solo cerrar si clickeó el fondo, no el contenido
        if (e.target === modal) cerrarModal();
    }

    async function confirmar() {
        const nombre = input.value.trim();
        if (nombre.length === 0) {
            input.focus();
            return;
        }

        cerrarModal();

        try {
            const res = await fetch("/api/favorita", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre, jugadas })
            });

            if (res.ok) {
                mostrarMensaje(existeFavorita
                    ? `Jugada favorita reemplazada: "${nombre}".`
                    : `Jugada favorita guardada: "${nombre}".`,
                    "success");
                actualizarBotonesFavorita();
            } else {
                const err = await res.json().catch(() => ({}));
                mostrarMensaje("No se pudo guardar: " + (err.error ?? "error desconocido"), "error");
            }
        } catch (err) {
            console.error("Error al guardar favorita:", err);
            mostrarMensaje("Error al guardar la favorita.", "error");
        }
    }

    nuevoBtnOk.addEventListener("click", confirmar);
    nuevoBtnCancel.addEventListener("click", cerrarModal);
    document.addEventListener("keydown", onKeyDown);
    modal.addEventListener("click", onOverlayClick);
}

async function cargarJugadaFavorita() {
    if (!window.USER_LOGUEADO) return;

    try {
        const res = await fetch("/api/favorita");
        if (!res.ok) {
            mostrarMensaje("No se pudo cargar la favorita.", "error");
            return;
        }

        const data = await res.json();
        if (!data || !Array.isArray(data.jugadas) || data.jugadas.length === 0) {
            mostrarMensaje("Todavía no tenés jugada favorita guardada.", "info");
            return;
        }

        const tbody = document.querySelector("#tabla tbody");
        tbody.innerHTML = "";

        for (let i = 0; i < data.jugadas.length; i++) {
            tbody.innerHTML += crearFilaHTML(i, data.jugadas[i]);
        }

        const filas = document.querySelectorAll("#tabla tbody tr");
        for (let i = 0; i < filas.length; i++) {
            actualizarEstadoApuestasFila(filas[i]);
        }

        document.getElementById("cantidad").value = data.jugadas.length;
        actualizarPreview();
        mostrarMensaje(`Se cargó "${data.nombre ?? 'Mi jugada favorita'}".`, "success");
    } catch (err) {
        console.error("Error al cargar favorita:", err);
        mostrarMensaje("Error al cargar la favorita.", "error");
    }
}

async function borrarJugadaFavorita() {
    if (!window.USER_LOGUEADO) return;

    const ok = await confirmarModal(
        "Borrar jugada favorita",
        "¿Querés borrar tu jugada favorita guardada? Esta acción no se puede deshacer.",
        "Borrar"
    );
    if (!ok) return;

    try {
        const res = await fetch("/api/favorita", { method: "DELETE" });
        if (res.ok) {
            mostrarMensaje("Jugada favorita borrada.", "success");
            actualizarBotonesFavorita();
        } else {
            mostrarMensaje("No se pudo borrar.", "error");
        }
    } catch (err) {
        console.error("Error al borrar favorita:", err);
        mostrarMensaje("Error al borrar la favorita.", "error");
    }
}

async function actualizarBotonesFavorita() {
    // Actualiza el texto de los botones Cargar/Borrar favorita
    // para mostrar el nombre guardado, o el texto genérico si no hay.
    const btnCargar = document.getElementById("btnCargarFavorita");
    const btnBorrar = document.getElementById("btnBorrarFavorita");

    if (!btnCargar || !btnBorrar) return;

    if (!window.USER_LOGUEADO) {
        btnCargar.textContent = "Cargar favorita";
        btnBorrar.textContent = "Borrar favorita";
        return;
    }

    try {
        const res = await fetch("/api/favorita");
        if (!res.ok) {
            btnCargar.textContent = "Cargar favorita";
            btnBorrar.textContent = "Borrar favorita";
            return;
        }

        const data = await res.json();
        if (data && data.nombre) {
            const nombreCorto = data.nombre.length > 20
                ? data.nombre.slice(0, 20) + "…"
                : data.nombre;
            btnCargar.textContent = "Cargar " + nombreCorto;
            btnBorrar.textContent = "Borrar " + nombreCorto;
        } else {
            btnCargar.textContent = "Cargar favorita";
            btnBorrar.textContent = "Borrar favorita";
        }
    } catch (err) {
        btnCargar.textContent = "Cargar favorita";
        btnBorrar.textContent = "Borrar favorita";
    }
}

// ======================================
// Perfil del usuario
// ======================================

async function cargarPerfil() {
    if (!window.USER_LOGUEADO) return;

    try {
        const res = await fetch("/api/me");
        if (!res.ok) return;
        const data = await res.json();

        // Aplicar nombre personalizado al header
        const userNombreEl = document.getElementById("userNombre");
        if (userNombreEl) {
            userNombreEl.textContent = data.displayName ?? data.name ?? data.email;
        }

        // Aplicar avatar
        const userAvatarEl = document.getElementById("userAvatar");
        if (userAvatarEl) {
            userAvatarEl.src = data.avatarUrl ?? data.googleImage ?? "";
        }

        return data;
    } catch (err) {
        console.error("Error cargando perfil:", err);
    }
}

async function abrirModalPerfil() {
    if (!window.USER_LOGUEADO) return;

    const modal = document.getElementById("perfilModal");
    const inputNombre = document.getElementById("perfilNombre");
    const grid = document.getElementById("avatarsGrid");
    const btnGuardar = document.getElementById("btnPerfilGuardar");
    const btnCancelar = document.getElementById("btnPerfilCancelar");

    // Cargar datos actuales
    const data = await cargarPerfil();
    if (!data) return;

    inputNombre.value = data.displayName ?? data.name ?? "";

    // Render de avatars
    let avatarElegido = data.avatarUrl ?? null;
    grid.innerHTML = "";

    for (let i = 0; i < data.avatarsDisponibles.length; i++) {
        const url = data.avatarsDisponibles[i];
        const div = document.createElement("div");
        div.className = "avatarOption" + (url === avatarElegido ? " selected" : "");
        div.innerHTML = `<img src="${url}" alt="Avatar ${i + 1}" />`;
        div.addEventListener("click", function () {
            avatarElegido = url;
            grid.querySelectorAll(".avatarOption").forEach(el => el.classList.remove("selected"));
            div.classList.add("selected");
        });
        grid.appendChild(div);
    }

    modal.classList.remove("hide");
    setTimeout(() => inputNombre.focus(), 50);

    // Limpiar handlers previos
    const nuevoBtnOk = btnGuardar.cloneNode(true);
    btnGuardar.parentNode.replaceChild(nuevoBtnOk, btnGuardar);
    const nuevoBtnCancel = btnCancelar.cloneNode(true);
    btnCancelar.parentNode.replaceChild(nuevoBtnCancel, btnCancelar);

    function cerrarModal() {
        modal.classList.add("hide");
        document.removeEventListener("keydown", onKeyDown);
        modal.removeEventListener("click", onOverlayClick);
    }

    function onKeyDown(e) {
        if (e.key === "Escape") cerrarModal();
    }

    function onOverlayClick(e) {
        if (e.target === modal) cerrarModal();
    }

    async function guardar() {
        const nombre = inputNombre.value.trim();
        if (nombre.length === 0) {
            inputNombre.focus();
            return;
        }

        try {
            const res = await fetch("/api/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ displayName: nombre, avatarUrl: avatarElegido })
            });

            if (res.ok) {
                cerrarModal();
                mostrarMensaje("Perfil actualizado.", "success");
                await cargarPerfil();
            } else {
                const err = await res.json().catch(() => ({}));
                mostrarMensaje("No se pudo guardar: " + (err.error ?? "error desconocido"), "error");
            }
        } catch (err) {
            console.error("Error al guardar perfil:", err);
            mostrarMensaje("Error al guardar el perfil.", "error");
        }
    }

    nuevoBtnOk.addEventListener("click", guardar);
    nuevoBtnCancel.addEventListener("click", cerrarModal);
    document.addEventListener("keydown", onKeyDown);
    modal.addEventListener("click", onOverlayClick);
}

// Modal de confirmación genérico. Devuelve Promise<boolean>.
function confirmarModal(titulo, mensaje, textoAceptar) {
    if (!textoAceptar) textoAceptar = "Aceptar";

    return new Promise(function (resolve) {
        const modal = document.getElementById("confirmModal");
        const tituloEl = document.getElementById("confirmModalTitulo");
        const descEl = document.getElementById("confirmModalDesc");
        const btnOk = document.getElementById("btnConfirmAceptar");
        const btnCancel = document.getElementById("btnConfirmCancelar");

        tituloEl.textContent = titulo;
        descEl.textContent = mensaje;
        btnOk.textContent = textoAceptar;

        modal.classList.remove("hide");

        // Reemplazar botones para limpiar handlers previos
        const nuevoBtnOk = btnOk.cloneNode(true);
        btnOk.parentNode.replaceChild(nuevoBtnOk, btnOk);
        const nuevoBtnCancel = btnCancel.cloneNode(true);
        btnCancel.parentNode.replaceChild(nuevoBtnCancel, btnCancel);

        function cerrar(resultado) {
            modal.classList.add("hide");
            document.removeEventListener("keydown", onKey);
            modal.removeEventListener("click", onOverlay);
            resolve(resultado);
        }

        function onKey(e) {
            if (e.key === "Escape") cerrar(false);
            if (e.key === "Enter") cerrar(true);
        }

        function onOverlay(e) {
            if (e.target === modal) cerrar(false);
        }

        nuevoBtnOk.addEventListener("click", function () { cerrar(true); });
        nuevoBtnCancel.addEventListener("click", function () { cerrar(false); });
        document.addEventListener("keydown", onKey);
        modal.addEventListener("click", onOverlay);
    });
}