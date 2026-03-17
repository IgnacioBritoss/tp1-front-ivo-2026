let sorteosGlobal = [];
let jugadasGlobal = [];

let historialSorteos = [];
let frecuencia2Cifras = Array(100).fill(0);
let frecuencia3Cifras = Array(1000).fill(0);

let resumenGeneral = {
    boletasJugadas: 0,
    dineroGastado: 0,
    dineroGanado: 0
};

document.addEventListener("DOMContentLoaded", () => {
    iniciarTema();
    cargarDatos();
    crearTabla();
    actualizarPreview();

    const cantidadSorteos = document.getElementById("cantidadSorteos");
    if (cantidadSorteos) {
        cantidadSorteos.addEventListener("input", actualizarPreview);
    }

    const luckyBtn = document.getElementById("luckySpinBtn");
    if (luckyBtn) {
        luckyBtn.addEventListener("click", girarNumeroSuerte);
    }
});

function iniciarTema(){
    const guardado = localStorage.getItem("instantanea_tema");
    if(guardado === "dark"){
        document.body.classList.add("dark");
    }
    actualizarIconoTema();

    const toggle = document.getElementById("themeToggle");
    if(toggle){
        toggle.addEventListener("click", () => {
            document.body.classList.toggle("dark");
            localStorage.setItem(
                "instantanea_tema",
                document.body.classList.contains("dark") ? "dark" : "light"
            );
            actualizarIconoTema();
        });
    }
}

function actualizarIconoTema(){
    const toggle = document.getElementById("themeToggle");
    if(toggle){
        toggle.textContent = document.body.classList.contains("dark") ? "Claro" : "Oscuro";
    }
}

function mostrarMensaje(texto, tipo = "info"){
    let box = document.getElementById("messageBox");

    if(!box){
        box = document.createElement("div");
        box.id = "messageBox";
        box.className = "messageBox";
        const contenedor = document.querySelector(".container");
        if(contenedor){
            contenedor.prepend(box);
        }
    }

    box.className = `messageBox ${tipo}`;
    box.textContent = texto;
}

function guardarDatos(){
    localStorage.setItem("instantanea_historialSorteos", JSON.stringify(historialSorteos));
    localStorage.setItem("instantanea_frecuencia2", JSON.stringify(frecuencia2Cifras));
    localStorage.setItem("instantanea_frecuencia3", JSON.stringify(frecuencia3Cifras));
    localStorage.setItem("instantanea_resumenGeneral", JSON.stringify(resumenGeneral));
}

function cargarDatos(){
    const h = localStorage.getItem("instantanea_historialSorteos");
    const f2 = localStorage.getItem("instantanea_frecuencia2");
    const f3 = localStorage.getItem("instantanea_frecuencia3");
    const rg = localStorage.getItem("instantanea_resumenGeneral");

    if(h) historialSorteos = JSON.parse(h);
    if(f2) frecuencia2Cifras = JSON.parse(f2);
    if(f3) frecuencia3Cifras = JSON.parse(f3);
    if(rg) resumenGeneral = JSON.parse(rg);
}

function formatearDinero(n){
    return "$" + Number(n || 0).toLocaleString("es-AR");
}

function padNumero(numero, cifras){
    return String(numero).padStart(cifras, "0");
}

function crearFilaHTML(index, data = {}){
    const numero = data.numero ?? "";
    const cifras = data.cifras ?? 3;
    const cabeza = data.cabeza ?? 0;
    const cinco = data.cinco ?? 0;
    const diez = data.diez ?? 0;

    return `
        <tr>
            <td><strong>${index + 1}</strong></td>
            <td>
                <input type="number" class="numero numInput" min="0" max="999" value="${numero}" placeholder="Ej: 777" oninput="ajustarSegunCifras(this); actualizarPreview();">
            </td>
            <td>
                <select class="cifras smallInput" onchange="ajustarSegunCifras(this.closest('tr').querySelector('.numero')); actualizarPreview();">
                    <option value="3" ${cifras == 3 ? "selected" : ""}>3</option>
                    <option value="2" ${cifras == 2 ? "selected" : ""}>2</option>
                </select>
            </td>
            <td><input type="number" class="cabeza smallInput" min="0" value="${cabeza}" oninput="actualizarPreview()"></td>
            <td><input type="number" class="cinco smallInput" min="0" value="${cinco}" oninput="actualizarPreview()"></td>
            <td><input type="number" class="diez smallInput" min="0" value="${diez}" oninput="actualizarPreview()"></td>
        </tr>
    `;
}

function crearTabla(){
    const cantidad = parseInt(document.getElementById("cantidad").value) || 3;
    const tbody = document.querySelector("#tabla tbody");
    tbody.innerHTML = "";

    for(let i = 0; i < cantidad; i++){
        tbody.innerHTML += crearFilaHTML(i);
    }

    reindexarFilas();
    actualizarPreview();
}

function cargarJugadaClasica(){
    const tbody = document.querySelector("#tabla tbody");
    const clasica = [
        { numero: 64, cifras: 2, cabeza: 100, cinco: 0, diez: 100 },
        { numero: 32, cifras: 2, cabeza: 100, cinco: 0, diez: 100 },
        { numero: 86, cifras: 2, cabeza: 100, cinco: 0, diez: 100 }
    ];

    tbody.innerHTML = "";
    clasica.forEach((fila, i) => {
        tbody.innerHTML += crearFilaHTML(i, fila);
    });

    document.getElementById("cantidad").value = 3;
    actualizarPreview();
    mostrarMensaje("Se cargó la jugada clásica.", "success");
}

function reindexarFilas(){
    document.querySelectorAll("#tabla tbody tr").forEach((tr, i) => {
        tr.children[0].innerHTML = `<strong>${i + 1}</strong>`;
    });
    document.getElementById("cantidad").value = document.querySelectorAll("#tabla tbody tr").length;
}

function limpiarJugadas(){
    document.querySelectorAll("#tabla tbody tr").forEach(tr => {
        tr.querySelector(".numero").value = "";
        tr.querySelector(".cifras").value = "3";
        tr.querySelector(".cabeza").value = 0;
        tr.querySelector(".cinco").value = 0;
        tr.querySelector(".diez").value = 0;
    });

    sorteosGlobal = [];
    document.getElementById("sorteo").classList.add("hide");
    document.getElementById("resultado").classList.add("hide");
    actualizarPreview();
    mostrarMensaje("La boleta fue limpiada.", "info");
}

function vaciarMontos(){
    document.querySelectorAll(".cabeza, .cinco, .diez").forEach(inp => inp.value = 0);
    actualizarPreview();
    mostrarMensaje("Los montos fueron vaciados.", "info");
}

function setMontoRapido(valor){
    document.getElementById("montoMasivo").value = valor;
}

function aplicarMontoMasivo(tipo){
    const monto = parseInt(document.getElementById("montoMasivo").value) || 0;
    const filas = document.querySelectorAll("#tabla tbody tr");

    filas.forEach(fila => {
        if(tipo === "cabeza" || tipo === "todos") fila.querySelector(".cabeza").value = monto;
        if(tipo === "cinco" || tipo === "todos") fila.querySelector(".cinco").value = monto;
        if(tipo === "diez" || tipo === "todos") fila.querySelector(".diez").value = monto;
    });

    actualizarPreview();
}

function ajustarSegunCifras(inputNumero){
    const fila = inputNumero.closest("tr");
    const cifras = parseInt(fila.querySelector(".cifras").value);

    inputNumero.max = cifras === 2 ? 99 : 999;

    if(inputNumero.value !== ""){
        let valor = parseInt(inputNumero.value) || 0;
        if(cifras === 2 && valor > 99) valor = valor % 100;
        if(cifras === 3 && valor > 999) valor = valor % 1000;
        inputNumero.value = valor;
    }
}

function obtenerJugadasDesdeTabla(){
    const filas = document.querySelectorAll("#tabla tbody tr");
    const jugadas = [];

    filas.forEach(fila => {
        const numeroRaw = fila.querySelector(".numero").value;
        const cifras = parseInt(fila.querySelector(".cifras").value);
        const cabeza = parseInt(fila.querySelector(".cabeza").value) || 0;
        const cinco = parseInt(fila.querySelector(".cinco").value) || 0;
        const diez = parseInt(fila.querySelector(".diez").value) || 0;

        if(numeroRaw !== ""){
            let numero = parseInt(numeroRaw);
            if(!isNaN(numero)){
                if(cifras === 2) numero = numero % 100;
                if(cifras === 3) numero = numero % 1000;

                if(cabeza > 0 || cinco > 0 || diez > 0){
                    jugadas.push({ numero, cifras, cabeza, cinco, diez });
                }
            }
        }
    });

    return jugadas;
}

function actualizarPreview(){
    jugadasGlobal = obtenerJugadasDesdeTabla();
    const cantidadSorteos = Math.max(1, parseInt(document.getElementById("cantidadSorteos").value) || 1);

    document.getElementById("numerosBoleta").textContent = jugadasGlobal.length;
    document.getElementById("sorteosBoleta").textContent = cantidadSorteos;

    let totalBoleta = 0;
    jugadasGlobal.forEach(j => totalBoleta += j.cabeza + j.cinco + j.diez);

    const totalFinal = totalBoleta * cantidadSorteos;
    document.getElementById("totalApostado").textContent = formatearDinero(totalFinal);

    const cont = document.getElementById("ticketContenido");

    if(jugadasGlobal.length === 0){
        cont.className = "empty";
        cont.innerHTML = "Cargá tus números y montos para ver la boleta.";
        return;
    }

    cont.className = "";
    cont.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Número</th>
                    <th>Cifras</th>
                    <th>Cabeza</th>
                    <th>A los 5</th>
                    <th>A los 10</th>
                </tr>
            </thead>
            <tbody>
                ${jugadasGlobal.map(j => `
                    <tr>
                        <td><strong>${padNumero(j.numero, j.cifras)}</strong></td>
                        <td>${j.cifras}</td>
                        <td>${formatearDinero(j.cabeza)}</td>
                        <td>${formatearDinero(j.cinco)}</td>
                        <td>${formatearDinero(j.diez)}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>

        <div style="margin-top:12px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px;">
            <div><strong>Esta boleta se jugará en:</strong> ${cantidadSorteos} sorteo(s)</div>
            <div><strong>Total final:</strong> ${formatearDinero(totalFinal)}</div>
        </div>
    `;
}

function generarSorteo(){
    const nums = [];
    while(nums.length < 10){
        const n = Math.floor(Math.random() * 1000);
        if(!nums.includes(n)) nums.push(n);
    }
    return nums;
}

function actualizarHistorialFrecuencias(sorteo){
    historialSorteos.push(sorteo);

    sorteo.forEach(num => {
        frecuencia3Cifras[num]++;
        frecuencia2Cifras[num % 100]++;
    });
}

function mostrarSorteos(){
    const box = document.getElementById("sorteo");
    const lista = document.getElementById("sorteosLista");
    box.classList.remove("hide");

    lista.innerHTML = sorteosGlobal.map((sorteo, idx) => `
        <div class="sorteoItem">
            <h4>Sorteo ${idx + 1}</h4>
            <div class="bolillasGrid">
                ${sorteo.map((num, i) => `
                    <div class="bolilla">
                        <span>${i + 1}°</span>
                        <span>${String(num).padStart(3, "0")}</span>
                    </div>
                `).join("")}
            </div>
        </div>
    `).join("");
}

function calcularPremioDeUnSorteo(jugadas, sorteo){
    let premio = 0;
    let aciertos = [];

    jugadas.forEach(j => {
        const numComp = j.cifras === 2 ? j.numero % 100 : j.numero;
        const sorteoComp = sorteo.map(n => j.cifras === 2 ? n % 100 : n);

        if(j.cabeza > 0 && numComp === sorteoComp[0]){
            const gana = j.cabeza * 70;
            premio += gana;
            aciertos.push({
                numero: padNumero(j.numero, j.cifras),
                tipo: "Cabeza",
                importe: j.cabeza,
                premio: gana
            });
        }

        if(j.cinco > 0 && sorteoComp.slice(0,5).includes(numComp)){
            const gana = j.cinco * 14;
            premio += gana;
            aciertos.push({
                numero: padNumero(j.numero, j.cifras),
                tipo: "A los 5",
                importe: j.cinco,
                premio: gana
            });
        }

        if(j.diez > 0 && sorteoComp.includes(numComp)){
            const gana = j.diez * 7;
            premio += gana;
            aciertos.push({
                numero: padNumero(j.numero, j.cifras),
                tipo: "A los 10",
                importe: j.diez,
                premio: gana
            });
        }
    });

    return { premio, aciertos };
}

function jugar(){
    actualizarPreview();
    jugadasGlobal = obtenerJugadasDesdeTabla();

    if(jugadasGlobal.length === 0){
        mostrarMensaje("Cargá al menos un número con algún importe.", "error");
        return;
    }

    const cantidadSorteos = Math.max(1, parseInt(document.getElementById("cantidadSorteos").value) || 1);

    let costoBoleta = 0;
    jugadasGlobal.forEach(j => costoBoleta += j.cabeza + j.cinco + j.diez);
    const costoTotal = costoBoleta * cantidadSorteos;

    sorteosGlobal = [];
    let premioTotal = 0;
    let todosLosAciertos = [];

    for(let i = 0; i < cantidadSorteos; i++){
        const sorteo = generarSorteo();
        sorteosGlobal.push(sorteo);
        actualizarHistorialFrecuencias(sorteo);

        const resultado = calcularPremioDeUnSorteo(jugadasGlobal, sorteo);
        premioTotal += resultado.premio;

        resultado.aciertos.forEach(a => {
            todosLosAciertos.push({
                ...a,
                sorteo: i + 1
            });
        });
    }

    resumenGeneral.boletasJugadas += cantidadSorteos;
    resumenGeneral.dineroGastado += costoTotal;
    resumenGeneral.dineroGanado += premioTotal;

    guardarDatos();
    mostrarSorteos();
    mostrarResultadoFinal(cantidadSorteos, costoTotal, premioTotal, todosLosAciertos);

    if(premioTotal > 0){
        mostrarMensaje("Se jugó la boleta y hubo aciertos.", "success");
    } else {
        mostrarMensaje("Se jugó la boleta. Esta vez no hubo aciertos.", "info");
    }
}

function mostrarResultadoFinal(cantidadSorteos, costoTotal, premioTotal, todosLosAciertos){
    const res = document.getElementById("resultado");
    res.classList.remove("hide");

    if(premioTotal > 0){
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
                ${todosLosAciertos.map(a => `
                    <div class="hit">
                        <div>
                            <strong>Sorteo ${a.sorteo}</strong> — ${a.numero} — ${a.tipo}
                            <br><small>Apostado: ${formatearDinero(a.importe)}</small>
                        </div>
                        <div><strong>${formatearDinero(a.premio)}</strong></div>
                    </div>
                `).join("")}
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

function topFrecuentes(arr, cantidad, cifras, asc = false){
    const lista = arr.map((v, i) => ({ numero: i, veces: v }));
    lista.sort((a, b) => asc ? a.veces - b.veces : b.veces - a.veces);
    const maximo = Math.max(...lista.map(x => x.veces), 1);

    return lista.slice(0, cantidad).map(e => {
        const n = String(e.numero).padStart(cifras, "0");
        const porcentaje = Math.max(4, (e.veces / maximo) * 100);

        return `
            <div class="rankItem">
                <div class="rankTop">
                    <span>${n}</span>
                    <span>${e.veces} vez${e.veces === 1 ? "" : "es"}</span>
                </div>
                <div class="barraWrap">
                    <div class="barra" style="width:${porcentaje}%"></div>
                </div>
            </div>
        `;
    }).join("");
}

function verHistorial(){
    const div = document.getElementById("estadisticas");
    document.getElementById("estadisticasCard").classList.remove("hide");

    const top2 = topFrecuentes(frecuencia2Cifras, 10, 2, false);
    const top3 = topFrecuentes(frecuencia3Cifras, 10, 3, false);
    const frios2 = topFrecuentes(frecuencia2Cifras, 10, 2, true);
    const frios3 = topFrecuentes(frecuencia3Cifras, 10, 3, true);

    const balance = resumenGeneral.dineroGanado - resumenGeneral.dineroGastado;

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
                <strong>${historialSorteos.length ? "Top 10" : "-"}</strong>
            </div>
            <div class="stat">
                <span>Calientes 3 cifras</span>
                <strong>${historialSorteos.length ? "Top 10" : "-"}</strong>
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
                <h4>Fríos 2 cifras</h4>
                <div class="rankList">${frios2}</div>
            </div>

            <div class="statsBox">
                <h4>Fríos 3 cifras</h4>
                <div class="rankList">${frios3}</div>
            </div>
        </div>
    `;
}

function resetearHistorial(){
    historialSorteos = [];
    frecuencia2Cifras = Array(100).fill(0);
    frecuencia3Cifras = Array(1000).fill(0);
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

function elegirNumeroSuerte(){
    const huboHistorial = frecuencia3Cifras.some(v => v > 0);

    if(huboHistorial){
        const top = frecuencia3Cifras
            .map((veces, numero) => ({ numero, veces }))
            .sort((a, b) => b.veces - a.veces)
            .slice(0, 20);

        const elegido = top[Math.floor(Math.random() * Math.max(top.length, 1))];
        return elegido ? elegido.numero : Math.floor(Math.random() * 1000);
    }

    return Math.floor(Math.random() * 1000);
}

function girarNumeroSuerte(){
    const box = document.getElementById("luckyBox");
    const label = document.getElementById("luckyLabel");
    const btn = document.getElementById("luckySpinBtn");

    if(!box || !label || !btn) return;

    btn.disabled = true;
    box.classList.add("spinning");
    label.textContent = "Girando...";

    let contador = 0;
    const intervalo = setInterval(() => {
        const random = Math.floor(Math.random() * 1000);
        box.textContent = String(random).padStart(3, "0");
        contador++;
    }, 70);

    setTimeout(() => {
        clearInterval(intervalo);
        const finalNum = elegirNumeroSuerte();
        box.classList.remove("spinning");
        box.textContent = String(finalNum).padStart(3, "0");

        const origen = frecuencia3Cifras.some(v => v > 0)
            ? "Recomendado a partir de tus sorteos guardados."
            : "Recomendación aleatoria porque todavía no hay historial.";

        label.textContent = origen;
        btn.disabled = false;
    }, 1600);
}

window.crearTabla = crearTabla;
window.limpiarJugadas = limpiarJugadas;
window.cargarJugadaClasica = cargarJugadaClasica;
window.aplicarMontoMasivo = aplicarMontoMasivo;
window.vaciarMontos = vaciarMontos;
window.setMontoRapido = setMontoRapido;
window.ajustarSegunCifras = ajustarSegunCifras;
window.jugar = jugar;
window.verHistorial = verHistorial;
window.resetearHistorial = resetearHistorial;
window.actualizarPreview = actualizarPreview;