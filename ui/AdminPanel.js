// Panel de administrador: crear vuelos (directos o con escalas opcionales), listar y cambiar estados

class AdminPanel {
  constructor(manager) {
    this.manager = manager;
    this.container = null;
    this.escalasTemporales = []; // Solo las escalas intermedias (opcionales)
  }

  render(contenedorPadre) {
    this.container = document.createElement('div');
    this.container.id = 'adminPanel';
    this.container.className = 'panel active';

    // --- Formulario de creación de vuelo ---
    const cardForm = document.createElement('div');
    cardForm.className = 'card';
    cardForm.innerHTML = `<h2 style="margin-bottom:1.2rem;">➕ Programar nuevo vuelo</h2>`;

    // Campos principales (obligatorios)
    const gridPrincipal = document.createElement('div');
    gridPrincipal.className = 'form-grid';
    gridPrincipal.style.marginBottom = '1.5rem';
    gridPrincipal.innerHTML = `
      <div class="form-group">
        <label>📍 Origen</label>
        <input type="text" id="origenPrincipal" placeholder="Ej. Caracas" list="aeropuertosList" required>
      </div>
      <div class="form-group">
        <label>📍 Destino final</label>
        <input type="text" id="destinoPrincipal" placeholder="Ej. Miami" list="aeropuertosList" required>
      </div>
      <div class="form-group">
        <label>📅 Fecha del vuelo</label>
        <input type="date" id="fechaInput" required>
      </div>
      <div class="form-group">
        <label>🕐 Hora de salida</label>
        <input type="time" id="horaSalida" value="08:00" required>
      </div>
      <div class="form-group">
        <label>⏱️ Duración total (minutos)</label>
        <input type="number" id="duracionTotal" value="180" min="30" max="1500" required>
      </div>
    `;
    cardForm.appendChild(gridPrincipal);

    // Sección de escalas (opcional)
    const escalasSection = document.createElement('div');
    escalasSection.id = 'escalasSection';
    escalasSection.style.borderTop = '1px solid #e2e8f0';
    escalasSection.style.paddingTop = '1.2rem';
    escalasSection.style.marginBottom = '1rem';
    escalasSection.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.8rem;">
        <h3 style="margin:0;color:#334155;">🛬 Escalas</h3>
        <span style="color:#94a3b8;font-size:0.85rem;">— Solo si el vuelo no es directo</span>
      </div>
    `;

    // Contenedor de escalas agregadas
    const escalasContainer = document.createElement('div');
    escalasContainer.id = 'escalasContainer';
    escalasContainer.innerHTML = '<p style="color:#94a3b8;font-size:0.9rem;">Sin escalas — Vuelo directo</p>';
    escalasSection.appendChild(escalasContainer);

    // Formulario para agregar escala
    const addEscalaForm = document.createElement('div');
    addEscalaForm.className = 'form-grid';
    addEscalaForm.style.marginTop = '0.8rem';
    addEscalaForm.innerHTML = `
      <div class="form-group">
        <label>Aeropuerto de escala</label>
        <input type="text" id="escalaInput" placeholder="Ej. Panamá" list="aeropuertosList">
      </div>
      <div class="form-group" style="justify-content:flex-end;">
        <button id="addEscalaBtn" class="secondary">➕ Agregar escala</button>
      </div>
    `;
    escalasSection.appendChild(addEscalaForm);
    cardForm.appendChild(escalasSection);

    // Resumen de la ruta
    const resumenDiv = document.createElement('div');
    resumenDiv.id = 'resumenRuta';
    resumenDiv.style.marginTop = '1rem';
    resumenDiv.style.padding = '0.8rem';
    resumenDiv.style.background = '#f8fafc';
    resumenDiv.style.borderRadius = '0.8rem';
    resumenDiv.style.fontSize = '0.9rem';
    resumenDiv.style.color = '#64748b';
    resumenDiv.textContent = 'Completa los campos para ver el resumen de la ruta';
    cardForm.appendChild(resumenDiv);

    // Botón para crear vuelo
    const crearBtnDiv = document.createElement('div');
    crearBtnDiv.style.marginTop = '1.5rem';
    crearBtnDiv.innerHTML = '<button id="createFlightBtn" style="width:100%;">✅ Crear vuelo</button>';
    cardForm.appendChild(crearBtnDiv);

    // Datalist para sugerencias de aeropuertos
    const datalist = document.createElement('datalist');
    datalist.id = 'aeropuertosList';
    cardForm.appendChild(datalist);

    this.container.appendChild(cardForm);

    // --- Lista de vuelos ---
    const cardList = document.createElement('div');
    cardList.className = 'card';
    cardList.innerHTML = `<h2 style="margin-bottom:1rem;">📋 Vuelos programados</h2><div id="adminFlightsTable"></div>`;
    this.container.appendChild(cardList);

    contenedorPadre.appendChild(this.container);

    // Eventos
    document.getElementById('addEscalaBtn').addEventListener('click', () => this.agregarEscala());
    document.getElementById('createFlightBtn').addEventListener('click', () => this.crearVuelo());
    
    // Actualizar resumen en tiempo real
    ['origenPrincipal', 'destinoPrincipal', 'horaSalida', 'duracionTotal'].forEach(id => {
      document.getElementById(id).addEventListener('input', () => this.actualizarResumen());
    });
    
    // Fecha por defecto: mañana
    const hoy = new Date();
    hoy.setDate(hoy.getDate() + 1);
    document.getElementById('fechaInput').value = hoy.toISOString().split('T')[0];

    this.actualizarDatalist();
    this.actualizarTabla();
  }

  actualizarDatalist() {
    const datalist = document.getElementById('aeropuertosList');
    const aeropuertos = this.manager.getAeropuertosDisponibles();
    // Agregar algunos aeropuertos comunes si no hay en el sistema
    const comunes = ['Caracas', 'Miami', 'Panamá', 'Bogotá', 'Lima', 'Madrid', 'México DF', 'Buenos Aires'];
    const todos = [...new Set([...comunes, ...aeropuertos])];
    datalist.innerHTML = todos.map(a => `<option value="${a}">`).join('');
  }

  agregarEscala() {
      if (this.escalasTemporales.length >= 2) {
      alert('Límite alcanzado: los vuelos comerciales permiten un máximo de 2 escalas.');
      return;
    }

    const escala = document.getElementById('escalaInput').value.trim();
    if (!escala) {
      alert('Ingrese el nombre del aeropuerto de escala.');
      return;
    }

    const origen = document.getElementById('origenPrincipal').value.trim();
    const destino = document.getElementById('destinoPrincipal').value.trim();

    if (escala.toLowerCase() === origen.toLowerCase()) {
      alert('La escala no puede ser igual al origen.');
      return;
    }
    if (destino && escala.toLowerCase() === destino.toLowerCase()) {
      alert('La escala no puede ser igual al destino final.');
      return;
    }
    if (this.escalasTemporales.some(e => e.toLowerCase() === escala.toLowerCase())) {
      alert('Esta escala ya fue agregada.');
      return;
    }

    this.escalasTemporales.push(escala);
    document.getElementById('escalaInput').value = '';
    this.renderizarEscalas();
    this.actualizarResumen();
    this.actualizarDatalist();
  }

  eliminarEscala(index) {
    this.escalasTemporales.splice(index, 1);
    this.renderizarEscalas();
    this.actualizarResumen();
  }

  renderizarEscalas() {
    const container = document.getElementById('escalasContainer');
    if (this.escalasTemporales.length === 0) {
      container.innerHTML = '<p style="color:#94a3b8;font-size:0.9rem;">Sin escalas — Vuelo directo</p>';
      return;
    }

    let html = '<div style="display:flex;flex-direction:column;gap:0.5rem;">';
    this.escalasTemporales.forEach((escala, index) => {
      html += `
        <div style="display:flex;align-items:center;gap:0.8rem;background:#f1f5f9;padding:0.7rem 0.8rem;border-radius:0.6rem;">
          <span style="font-weight:600;color:#64748b;">🛬 Escala ${index + 1}:</span>
          <span style="font-weight:500;">${escala}</span>
          <button class="danger" onclick="this.closest('#adminPanel').querySelector('#escalasContainer').dispatchEvent(new CustomEvent('eliminarEscala', {detail:${index}}))" style="margin-left:auto;padding:0.3rem 0.8rem;font-size:0.8rem;">✕</button>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;

    container.addEventListener('eliminarEscala', (e) => {
      this.eliminarEscala(e.detail);
    });

     const addBtn = document.getElementById('addEscalaBtn');
    if (addBtn) {
      const limite = this.escalasTemporales.length >= 2;
      addBtn.disabled = limite;
      addBtn.textContent = limite ? 'Máximo 2 escalas permitidas' : '➕ Agregar escala';
   
    }
  }

  actualizarResumen() {
    const resumen = document.getElementById('resumenRuta');
    const origen = document.getElementById('origenPrincipal').value.trim();
    const destino = document.getElementById('destinoPrincipal').value.trim();
    const horaSalida = document.getElementById('horaSalida').value;
    const duracion = parseInt(document.getElementById('duracionTotal').value);

    if (!origen || !destino) {
      resumen.textContent = 'Completa origen y destino para ver el resumen';
      resumen.style.color = '#94a3b8';
      return;
    }

    // Construir ruta completa
    const ruta = [origen, ...this.escalasTemporales, destino];
    const rutaStr = ruta.join(' → ');
    
    // Calcular hora de llegada
    let horaLlegada = '';
    if (horaSalida && duracion) {
      const [h, m] = horaSalida.split(':').map(Number);
      const fechaLlegada = new Date(2024, 0, 1, h, m + duracion);
      const hh = String(fechaLlegada.getHours()).padStart(2, '0');
      const mm = String(fechaLlegada.getMinutes()).padStart(2, '0');
      horaLlegada = `${hh}:${mm}`;
    }

    const horas = Math.floor(duracion / 60);
    const minutos = duracion % 60;
    const tipo = this.escalasTemporales.length > 0 ? 
      `${this.escalasTemporales.length} escala(s)` : 'Vuelo directo';

    resumen.innerHTML = `
      <strong style="color:#2563eb;">🌍 Ruta:</strong> ${rutaStr}<br>
      <strong style="color:#2563eb;">📌 Tipo:</strong> ${tipo}<br>
      <strong style="color:#2563eb;">⏱️ Duración:</strong> ${horas}h ${minutos}min<br>
      <strong style="color:#2563eb;">🕐 Llegada estimada:</strong> ${horaLlegada || '—'}
    `;
    resumen.style.color = '#334155';
  }

  crearVuelo() {
    const origen = document.getElementById('origenPrincipal').value.trim();
    const destino = document.getElementById('destinoPrincipal').value.trim();
    const fecha = document.getElementById('fechaInput').value;
    const horaSalida = document.getElementById('horaSalida').value;
    const duracionTotal = parseInt(document.getElementById('duracionTotal').value);

    // Validaciones
    if (!origen || !destino || !fecha || !horaSalida || !duracionTotal) {
      alert('Complete todos los campos obligatorios (origen, destino, fecha, hora y duración).');
      return;
    }

    if (origen.toLowerCase() === destino.toLowerCase()) {
      alert('El origen y destino no pueden ser iguales.');
      return;
    }

    // Crear vuelo
    const newId = this.manager.vuelos.length ? Math.max(...this.manager.vuelos.map(v => v.id)) + 1 : 1;
    const vuelo = new Vuelo(newId, fecha, 'programado');

    if (this.escalasTemporales.length === 0) {
      // Vuelo directo: un solo tramo
      vuelo.tramos = [new Tramo(origen, destino, horaSalida, duracionTotal)];
    } else {
      // Vuelo con escalas: dividir la duración total entre los tramos equitativamente
      const numTramos = this.escalasTemporales.length + 1;
      const duracionPorTramo = Math.floor(duracionTotal / numTramos);
      const duracionUltimo = duracionTotal - (duracionPorTramo * (numTramos - 1));

      const aeropuertos = [origen, ...this.escalasTemporales, destino];
      
      for (let i = 0; i < aeropuertos.length - 1; i++) {
        const duracion = (i === aeropuertos.length - 2) ? duracionUltimo : duracionPorTramo;
        
        // Calcular hora de salida para este tramo
        let horaTramo;
        if (i === 0) {
          horaTramo = horaSalida;
        } else {
          const tramoAnterior = vuelo.tramos[i - 1];
          const [h, m] = tramoAnterior.horaLlegada.split(':').map(Number);
          // Agregar 30 min de escala
          const fechaEscala = new Date(2024, 0, 1, h, m + 30);
          const hh = String(fechaEscala.getHours()).padStart(2, '0');
          const mm = String(fechaEscala.getMinutes()).padStart(2, '0');
          horaTramo = `${hh}:${mm}`;
        }

        vuelo.tramos.push(new Tramo(aeropuertos[i], aeropuertos[i + 1], horaTramo, duracion));
      }
    }

    this.manager.agregarVuelo(vuelo);

    // Limpiar formulario
    document.getElementById('origenPrincipal').value = '';
    document.getElementById('destinoPrincipal').value = '';
    this.escalasTemporales = [];
    this.renderizarEscalas();
    document.getElementById('resumenRuta').textContent = 'Completa los campos para ver el resumen de la ruta';
    document.getElementById('resumenRuta').style.color = '#94a3b8';
    document.getElementById('escalaInput').value = '';

    this.actualizarTabla();
    this.actualizarDatalist();

    if (window.refreshPassengerFlights) window.refreshPassengerFlights();
    
    alert(`✅ Vuelo #${newId} creado exitosamente.\nRuta: ${vuelo.descripcionRuta}\nLlegada estimada: ${vuelo.horaLlegada}`);
  }

  actualizarTabla() {
    const tabla = document.getElementById('adminFlightsTable');
    if (!tabla) return;

    if (this.manager.vuelos.length === 0) {
      tabla.innerHTML = '<p style="color:#64748b;">No hay vuelos programados.</p>';
      return;
    }

    // 🔄 OBTENER VUELOS EN ORDEN INVERSO (último creado primero)
    const vuelosInvertidos = [...this.manager.vuelos].reverse();

    let html = `<table class="flights-table"><thead><tr>
      <th>ID</th><th>Ruta</th><th>Tipo</th><th>Fecha</th><th>Salida</th><th>Llegada est.</th><th>Duración</th><th>Estado</th><th>Acción</th>
    </tr></thead><tbody>`;

    vuelosInvertidos.forEach(v => {
      let badge = '';
      if (v.estado === 'programado') badge = '<span class="badge">Programado</span>';
      else if (v.estado === 'en abordaje') badge = '<span class="badge warning">En abordaje</span>';
      else badge = '<span class="badge success">Finalizado</span>';

      let botones = '';
      if (v.estado === 'programado') {
        botones = `<button class="secondary" data-action="boarding" data-id="${v.id}">Iniciar abordaje</button>`;
      } else if (v.estado === 'en abordaje') {
        botones = `<button class="danger" data-action="finalize" data-id="${v.id}">Finalizar vuelo</button>`;
      }

      const duracionMin = v.duracionTotalMinutos;
      const h = Math.floor(duracionMin / 60);
      const m = duracionMin % 60;
      const esDirecto = v.escalas.length === 0;
      const tipoBadge = esDirecto ? '<span class="badge">Directo</span>' :
        `<span class="badge warning">${v.escalas.length} escala(s)</span>`;
      const rutaCompleta = esDirecto ? `${v.origen} → ${v.destino}` : v.descripcionRuta;

      html += `<tr>
        <td><strong>#${v.id}</strong></td>
        <td title="${v.descripcionRuta}">${rutaCompleta}</td>
        <td>${tipoBadge}</td>
        <td>${new Date(v.fecha + 'T00:00:00').toLocaleDateString('es-VE', {weekday:'short', day:'2-digit', month:'short'})}</td>
        <td>${v.horaSalida}</td>
        <td><strong>${v.horaLlegada}</strong></td>
        <td>${h}h ${m}m</td>
        <td>${badge}</td>
        <td>${botones}</td>
      </tr>`;
    });
    html += '</tbody></table>';
    tabla.innerHTML = html;

    tabla.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(btn.dataset.id);
        const action = btn.dataset.action;
        if (action === 'boarding') {
          this.manager.cambiarEstado(id, 'en abordaje');
        } else if (action === 'finalize') {
          this.manager.cambiarEstado(id, 'finalizado');
        }
        this.actualizarTabla();
        if (window.refreshPassengerFlights) window.refreshPassengerFlights();
      });
    });
  }
}