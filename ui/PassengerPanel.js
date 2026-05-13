class PassengerPanel {
  constructor(manager) {
    this.manager = manager;
    this.container = null;
    this.vueloActual = null;
    this.pasajeros = [];
    this.pasajeroActivoIndex = 0;
  }

  // ─── Categorías IATA ─────────────────────────────────────────────────────
  static CATEGORIAS = [
    { codigo: 'ADT', label: 'Adultos',  rango: '13 a 59 años',  color: '#22c55e', edadMin: 13, edadMax: 59  },
    { codigo: 'CHD', label: 'Niños',    rango: 'De 3 a 12 años', color: '#0ea5e9', edadMin: 3,  edadMax: 12  },
    { codigo: 'INF', label: 'Infantes', rango: 'De 0 a 2 años',  color: '#8b5cf6', edadMin: 0,  edadMax: 2   },
    { codigo: 'SEN', label: 'Mayores',  rango: '60 años o más',  color: '#f97316', edadMin: 60, edadMax: 120 },
  ];

  get contadores() {
    return {
      ADT: parseInt(document.getElementById('cnt_ADT')?.value || 0),
      CHD: parseInt(document.getElementById('cnt_CHD')?.value || 0),
      INF: parseInt(document.getElementById('cnt_INF')?.value || 0),
      SEN: parseInt(document.getElementById('cnt_SEN')?.value || 0),
    };
  }

  get totalPasajeros() {
    const c = this.contadores;
    return c.ADT + c.CHD + c.INF + c.SEN;
  }

  get totalConAsiento() {
    const c = this.contadores;
    return c.ADT + c.CHD + c.SEN;
  }

  // ─── Render principal ─────────────────────────────────────────────────────
  render(contenedorPadre) {
    this.container = document.createElement('div');
    this.container.id = 'passengerPanel';
    this.container.className = 'panel';

    // Paso 1: vuelo + contadores
    const cardPaso1 = document.createElement('div');
    cardPaso1.className = 'card';
    cardPaso1.innerHTML = `<h2 style="margin-bottom:1.2rem;">🔍 Seleccionar vuelo y pasajeros</h2>`;
    cardPaso1.appendChild(this._seccionVuelo());
    cardPaso1.appendChild(this._seccionContadores());
    cardPaso1.insertAdjacentHTML('beforeend', `
      <div style="margin-top:1.5rem;">
        <button id="loadFlightBtn" style="width:100%;">🎫 Continuar</button>
      </div>
      <div id="passengerMessage" class="message-box" style="display:none;"></div>
    `);
    this.container.appendChild(cardPaso1);

    // Paso 2: datos de pasajeros
    const cardPaso2 = document.createElement('div');
    cardPaso2.id = 'cardPasajeros';
    cardPaso2.className = 'card';
    cardPaso2.style.display = 'none';
    cardPaso2.innerHTML = `
      <h2 style="margin-bottom:1.2rem;">👥 Datos de los pasajeros</h2>
      <div id="formsContainer"></div>
      <div style="margin-top:1.5rem;">
        <button id="irAsientosBtn" style="width:100%;">🪑 Seleccionar asientos →</button>
      </div>
    `;
    this.container.appendChild(cardPaso2);

    // Paso 3: mapa de asientos
    const cardPaso3 = document.createElement('div');
    cardPaso3.id = 'cardAsientos';
    cardPaso3.className = 'card';
    cardPaso3.style.display = 'none';
    cardPaso3.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:1rem;">
        <h2 style="margin:0;">🪑 Asignación de asientos</h2>
        <span id="currentSeatDisplay" class="badge"></span>
      </div>
      <div id="pasajerosTabs" style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem;"></div>
      <div id="seatMapContainer" class="seat-map-container"></div>
      <div class="legend" style="margin-top:0.8rem;">
        <span style="color:#eab308;">● Primera clase</span>
        <span style="color:#f97316;">● Salida emergencia</span>
        <span style="color:#ef4444;">● Ocupado</span>
        <span style="color:#2563eb;">● Seleccionado</span>
        <span style="color:#cbd5e1;">● Restringido</span>
      </div>
      <div style="margin-top:1.2rem;display:flex;gap:1rem;flex-wrap:wrap;">
        <button id="confirmReservationBtn" style="display:none;">✅ Confirmar asiento</button>
        <button id="cancelReservationBtn" class="danger" style="display:none;">❌ Cancelar mi reserva</button>
      </div>
      <div id="resumenReservas" style="display:none;margin-top:1.2rem;padding:1rem;background:#f0fdf4;border:1px solid #86efac;border-radius:0.8rem;font-size:0.9rem;"></div>
    `;
    this.container.appendChild(cardPaso3);

    contenedorPadre.appendChild(this.container);
    this.setupEvents();
  }

  // ─── Secciones del paso 1 ─────────────────────────────────────────────────
  _seccionVuelo() {
    const sec = document.createElement('div');
    sec.style.cssText = 'margin-bottom:1.5rem;padding-bottom:1.5rem;border-bottom:1px solid #e2e8f0;';
    sec.innerHTML = `
      <h3 style="margin:0 0 0.8rem;color:#334155;font-size:0.9rem;text-transform:uppercase;letter-spacing:0.05em;">
        ✈️ Vuelo
      </h3>
      <div class="form-grid">
        <div class="form-group">
          <label>Vuelo disponible</label>
          <select id="flightSelect"></select>
        </div>
      </div>
    `;
    return sec;
  }

  _seccionContadores() {
    const sec = document.createElement('div');
    sec.innerHTML = `
      <h3 style="margin:0 0 1rem;color:#334155;font-size:0.9rem;text-transform:uppercase;letter-spacing:0.05em;">
        👥 Pasajeros
      </h3>
      <div id="contadoresGrid" style="display:flex;flex-direction:column;gap:0.6rem;"></div>
      <div id="contadorResumen" style="display:none;margin-top:0.8rem;font-size:0.85rem;color:#64748b;">
        Total: <strong id="totalPaxLabel">0</strong> pasajero(s) —
        <strong id="totalAsientosLabel">0</strong> asiento(s)
      </div>
    `;
    const grid = sec.querySelector('#contadoresGrid');
    PassengerPanel.CATEGORIAS.forEach(cat => {
      const fila = document.createElement('div');
      fila.style.cssText = `
        display:flex;align-items:center;justify-content:space-between;
        padding:0.7rem 1rem;background:#f8fafc;border-radius:0.8rem;border:1px solid #e2e8f0;
      `;
      fila.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.8rem;">
          <div style="width:0.35rem;height:2.2rem;border-radius:9999px;background:${cat.color};"></div>
          <div>
            <div style="font-weight:600;color:#334155;">${cat.label}</div>
            <div style="font-size:0.78rem;color:#94a3b8;">${cat.rango}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:0.8rem;">
          <button class="secondary cnt-btn" data-cat="${cat.codigo}" data-dir="-1"
            style="width:2rem;height:2rem;padding:0;font-size:1.1rem;border-radius:50%;
                   display:flex;align-items:center;justify-content:center;">−</button>
          <input type="number" id="cnt_${cat.codigo}" value="0" min="0" max="9" readonly
            style="width:2.2rem;text-align:center;border:none;background:transparent;
                   font-size:1.1rem;font-weight:700;color:#334155;">
          <button class="cnt-btn" data-cat="${cat.codigo}" data-dir="1"
            style="width:2rem;height:2rem;padding:0;font-size:1.1rem;border-radius:50%;
                   display:flex;align-items:center;justify-content:center;">+</button>
        </div>
      `;
      grid.appendChild(fila);
    });
    return sec;
  }

  // ─── Eventos ──────────────────────────────────────────────────────────────
  setupEvents() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.cnt-btn');
      if (!btn) return;
      this.cambiarContador(btn.dataset.cat, parseInt(btn.dataset.dir));
    });
    document.getElementById('loadFlightBtn').addEventListener('click', () => this.cargarVuelo());
    document.getElementById('irAsientosBtn').addEventListener('click', () => this.irAAsientos());
    document.getElementById('confirmReservationBtn').addEventListener('click', () => this.confirmarAsiento());
    document.getElementById('cancelReservationBtn').addEventListener('click', () => this.cancelarReserva());
  }

  cambiarContador(codigo, dir) {
    const input = document.getElementById(`cnt_${codigo}`);
    if (!input) return;
    const c = this.contadores;
    let val = parseInt(input.value) + dir;

    if (val < 0) return;
    if (this.totalPasajeros + dir > 9) {
      this.mostrarMensaje('Máximo 9 pasajeros por reserva.', 'error'); return;
    }
    if (codigo === 'INF') {
      const tutores = c.ADT + c.SEN;
      if (val > tutores) {
        this.mostrarMensaje('Cada infante requiere un adulto o mayor acompañante.', 'error'); return;
      }
    }
    if ((codigo === 'ADT' || codigo === 'SEN') && dir === -1) {
      if (c.INF > (c.ADT + c.SEN - 1)) {
        this.mostrarMensaje('No puedes reducir adultos: hay infantes sin tutor.', 'error'); return;
      }
    }

    input.value = val;
    const total = this.totalPasajeros;
    const resumen = document.getElementById('contadorResumen');
    resumen.style.display = total > 0 ? 'block' : 'none';
    document.getElementById('totalPaxLabel').textContent = total;
    document.getElementById('totalAsientosLabel').textContent = this.totalConAsiento;
  }

  // ─── Paso 1 → 2 ───────────────────────────────────────────────────────────
  cargarVuelo() {
    const vueloId = parseInt(document.getElementById('flightSelect').value);
    if (!vueloId) { this.mostrarMensaje('Seleccione un vuelo.', 'error'); return; }

    const vuelo = this.manager.getVuelo(vueloId);
    if (!vuelo || vuelo.estado !== 'programado') {
      this.mostrarMensaje('Vuelo no disponible.', 'error'); return;
    }

    const c = this.contadores;
    if (this.totalPasajeros === 0) {
      this.mostrarMensaje('Seleccione al menos un pasajero.', 'error'); return;
    }
    if (c.ADT + c.SEN === 0) {
      this.mostrarMensaje('Debe haber al menos 1 adulto o mayor en la reserva.', 'error'); return;
    }

    this.vueloActual = vuelo;
    this._generarFormsPasajeros();
    document.getElementById('cardPasajeros').style.display = 'block';
    document.getElementById('cardPasajeros').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('passengerMessage').style.display = 'none';
  }

  // ─── Paso 2: formularios por pasajero ─────────────────────────────────────
  _generarFormsPasajeros() {
    const c = this.contadores;
    this.pasajeros = [];
    let index = 0;
    PassengerPanel.CATEGORIAS.forEach(cat => {
      for (let i = 0; i < c[cat.codigo]; i++) {
        this.pasajeros.push({
          categoria: cat.codigo,
          catInfo: cat,
          index,
          datos: null,
          nombreCompleto: null,
          pasajeroObj: null,
          asientoSeleccionado: null,
          reservaExistente: null,
        });
        index++;
      }
    });

    const container = document.getElementById('formsContainer');
    container.innerHTML = '';

    this.pasajeros.forEach((pax, i) => {
      const label  = this._paxLabel(pax, i);
      const isInf  = pax.categoria === 'INF';
      const needsRep = pax.categoria === 'CHD' || isInf;

      const card = document.createElement('div');
      card.style.cssText = `
        background:#f8fafc;border:1px solid #e2e8f0;border-radius:0.8rem;
        padding:1.2rem;margin-bottom:1rem;
      `;
      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:1rem;">
          <div style="width:0.3rem;height:1.8rem;border-radius:9999px;background:${pax.catInfo.color};"></div>
          <strong style="color:#334155;">${label}</strong>
          <span class="badge" style="background:${pax.catInfo.color};color:#fff;font-size:0.75rem;">${pax.categoria}</span>
          ${isInf ? '<span style="font-size:0.8rem;color:#8b5cf6;margin-left:auto;">🧸 No ocupa asiento</span>' : ''}
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>Nombre(s) <span style="color:#ef4444;">*</span></label>
            <input type="text" id="pax_nombre_${i}" placeholder="Nombre">
          </div>
          <div class="form-group">
            <label>Apellido(s) <span style="color:#ef4444;">*</span></label>
            <input type="text" id="pax_apellido_${i}" placeholder="Apellido">
          </div>
          <div class="form-group">
            <label>Género <span style="color:#ef4444;">*</span></label>
            <select id="pax_genero_${i}">
              <option value="">-- Seleccionar --</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
          <div class="form-group">
            <label>Tipo documento <span style="color:#ef4444;">*</span></label>
            <select id="pax_tipoDoc_${i}">
              <option value="">-- Seleccionar --</option>
              <option value="PASAPORTE">Pasaporte</option>
              <option value="CEDULA">Cédula</option>
              ${needsRep ? '<option value="PARTIDA">Partida de nacimiento</option>' : ''}
            </select>
          </div>
          <div class="form-group">
            <label>Nº documento <span style="color:#ef4444;">*</span></label>
            <input type="text" id="pax_numDoc_${i}" placeholder="Nº documento"
              style="text-transform:uppercase;">
          </div>
          ${!isInf ? `
          <div class="form-group">
            <label>Asistencia especial (SSR)</label>
            <select id="pax_ssr_${i}">
              <option value="NONE">Sin necesidades especiales</option>
              <option value="WCHR">🦽 Silla de ruedas (WCHR)</option>
              <option value="WCHC">🦽 No puede caminar (WCHC)</option>
              <option value="BLND">👁️ Discapacidad visual (BLND)</option>
              <option value="DEAF">🦻 Discapacidad auditiva (DEAF)</option>
              <option value="MEDA">🏥 Asistencia médica (MEDA)</option>
            </select>
          </div>` : ''}
        </div>
        ${needsRep ? `
        <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:0.6rem;
                    padding:0.8rem;margin-top:0.8rem;">
          <div style="font-size:0.85rem;font-weight:600;color:#92400e;margin-bottom:0.5rem;">
            👪 ${isInf ? 'Tutor del infante' : 'Representante legal'}
            <span style="color:#ef4444;">*</span>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label>Nombre del representante</label>
              <input type="text" id="pax_repNombre_${i}" placeholder="Nombre completo">
            </div>
            <div class="form-group">
              <label>Nº documento representante</label>
              <input type="text" id="pax_repDoc_${i}" placeholder="Nº documento">
            </div>
          </div>
        </div>` : ''}
      `;
      container.appendChild(card);

      // ++ VALIDACIÓN ++ // Restricción en tiempo real para el campo Nº documento
      const docInput = document.getElementById(`pax_numDoc_${i}`);
      const tipoSelect = document.getElementById(`pax_tipoDoc_${i}`);
      if (docInput && tipoSelect) {
        const restringirDoc = () => {
          const tipo = tipoSelect.value;
          let valor = docInput.value;
          // Cédula y Partida: solo números
          if (tipo === 'CEDULA' || tipo === 'PARTIDA') {
            valor = valor.replace(/\D/g, '');
          }
          // Pasaporte: letras y números (y quizás guiones, según el país)
          else {
            valor = valor.replace(/[^a-zA-Z0-9]/g, '');
          }
          docInput.value = valor;
        };
        tipoSelect.addEventListener('change', restringirDoc);
        docInput.addEventListener('input', restringirDoc);
      }

      // ++ VALIDACIÓN ++ // Restricción para nombres y apellidos (solo letras y espacios)
      const nombreInput = document.getElementById(`pax_nombre_${i}`);
      const apellidoInput = document.getElementById(`pax_apellido_${i}`);
      if (nombreInput) {
        nombreInput.addEventListener('input', () => {
          nombreInput.value = nombreInput.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
        });
      }
      if (apellidoInput) {
        apellidoInput.addEventListener('input', () => {
          apellidoInput.value = apellidoInput.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
        });
      }
    });
  }

  _paxLabel(pax, i) {
    const mismo = this.pasajeros.slice(0, i).filter(p => p.categoria === pax.categoria).length + 1;
    return { ADT:'Adulto', CHD:'Niño', INF:'Infante', SEN:'Mayor' }[pax.categoria] + ` ${mismo}`;
  }

  // ─── Paso 2 → 3: validar y armar objetos Pasajero ────────────────────────
  irAAsientos() {
    for (let i = 0; i < this.pasajeros.length; i++) {
      const pax      = this.pasajeros[i];
      const label    = this._paxLabel(pax, i);
      const nombre   = document.getElementById(`pax_nombre_${i}`)?.value.trim();
      const apellido = document.getElementById(`pax_apellido_${i}`)?.value.trim();
      const genero   = document.getElementById(`pax_genero_${i}`)?.value;
      const tipoDoc  = document.getElementById(`pax_tipoDoc_${i}`)?.value;
      const numDoc   = document.getElementById(`pax_numDoc_${i}`)?.value.trim();
      const ssr      = document.getElementById(`pax_ssr_${i}`)?.value || 'NONE';

      if (!nombre || !apellido) {
        this.mostrarMensaje(`${label}: ingrese nombre y apellido.`, 'error'); return;
      }
      // ++ VALIDACIÓN ++ // Caracteres no permitidos en nombre/apellido
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(nombre) || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(apellido)) {
        this.mostrarMensaje(`${label}: nombre y apellido solo pueden contener letras y espacios.`, 'error'); return;
      }

      if (!genero) {
        this.mostrarMensaje(`${label}: seleccione el género.`, 'error'); return;
      }
      if (!tipoDoc || !numDoc) {
        this.mostrarMensaje(`${label}: complete los datos del documento.`, 'error'); return;
      }

      // ++ VALIDACIÓN ++ // Formato del documento según tipo
      if (!this._validarDocumento(tipoDoc, numDoc, label)) {
        return; // _validarDocumento ya muestra el mensaje de error
      }

      const needsRep = pax.categoria === 'CHD' || pax.categoria === 'INF';
      let representante = null;
      if (needsRep) {
        const repNombre = document.getElementById(`pax_repNombre_${i}`)?.value.trim();
        const repDoc    = document.getElementById(`pax_repDoc_${i}`)?.value.trim();
        if (!repNombre || !repDoc) {
          this.mostrarMensaje(`${label}: complete los datos del representante.`, 'error'); return;
        }
        representante = { nombre: repNombre, doc: repDoc };
      }

      const edadMedia = Math.round((pax.catInfo.edadMin + pax.catInfo.edadMax) / 2);
      pax.datos         = { nombre, apellido, genero, tipoDoc, numDoc, ssr, representante };
      pax.nombreCompleto = `${nombre} ${apellido}`;
      pax.pasajeroObj   = new Pasajero(
        pax.nombreCompleto, edadMedia, ssr !== 'NONE',
        representante?.nombre || '',
        { ssr, categoria: pax.categoria }
      );
      pax.reservaExistente    = this.manager.getReserva(this.vueloActual.id, pax.nombreCompleto);
      pax.asientoSeleccionado = pax.reservaExistente?.seatId ?? null;
    }

    const conAsiento = this._paxConAsiento();
    if (conAsiento.length === 0) {
      this._mostrarComprobante(); return;
    }

    this.pasajeroActivoIndex = 0;
    document.getElementById('cardAsientos').style.display = 'block';
    document.getElementById('cardAsientos').scrollIntoView({ behavior: 'smooth' });
    this._renderizarTabs();
    this.renderizarMapa();
    this._actualizarBotonesAsiento();
  }

  // ++ VALIDACIÓN ++ // Método para verificar el formato del número de documento
  _validarDocumento(tipo, numero, label) {
    switch (tipo) {
      case 'CEDULA':
        // Solo dígitos, longitud mínima 6, máxima 10 (ajustable según país)
        if (!/^\d+$/.test(numero)) {
          this.mostrarMensaje(`${label}: la cédula debe contener solo números.`, 'error');
          return false;
        }
        if (numero.length < 6 || numero.length > 10) {
          this.mostrarMensaje(`${label}: la cédula debe tener entre 6 y 10 dígitos.`, 'error');
          return false;
        }
        break;
      case 'PASAPORTE':
        // Letras y números, sin espacios, longitud 5-20
        if (!/^[a-zA-Z0-9]+$/.test(numero)) {
          this.mostrarMensaje(`${label}: el pasaporte solo permite letras y números.`, 'error');
          return false;
        }
        if (numero.length < 5 || numero.length > 20) {
          this.mostrarMensaje(`${label}: verifique la longitud del pasaporte (5-20 caracteres).`, 'error');
          return false;
        }
        break;
      case 'PARTIDA':
        // Similar a cédula (generalmente numérica)
        if (!/^\d+$/.test(numero)) {
          this.mostrarMensaje(`${label}: la partida de nacimiento debe contener solo números.`, 'error');
          return false;
        }
        if (numero.length < 6 || numero.length > 15) {
          this.mostrarMensaje(`${label}: la partida de nacimiento debe tener entre 6 y 15 dígitos.`, 'error');
          return false;
        }
        break;
      default:
        this.mostrarMensaje(`${label}: tipo de documento no reconocido.`, 'error');
        return false;
    }
    return true;
  }

  // ─── Paso 3: asientos ────────────────────────────────────────────────────
  _paxConAsiento() {
    return this.pasajeros.filter(p => p.categoria !== 'INF');
  }

  _renderizarTabs() {
    const tabs = document.getElementById('pasajerosTabs');
    tabs.innerHTML = '';
    this._paxConAsiento().forEach((pax, i) => {
      const activo  = i === this.pasajeroActivoIndex;
      const asLabel = pax.reservaExistente
        ? ` ✓ ${pax.asientoSeleccionado}`
        : pax.asientoSeleccionado ? ` · ${pax.asientoSeleccionado}` : ' —';
      const btn = document.createElement('button');
      btn.style.cssText = `
        padding:0.4rem 1rem;border-radius:9999px;font-size:0.85rem;font-weight:600;cursor:pointer;
        border:2px solid ${activo ? pax.catInfo.color : '#e2e8f0'};
        background:${activo ? pax.catInfo.color : '#fff'};
        color:${activo ? '#fff' : '#64748b'};transition:all 0.15s;
      `;
      btn.textContent = `${this._paxLabel(pax, this.pasajeros.indexOf(pax))}${asLabel}`;
      btn.addEventListener('click', () => {
        this.pasajeroActivoIndex = i;
        this._renderizarTabs();
        this.renderizarMapa();
        this._actualizarBotonesAsiento();
      });
      tabs.appendChild(btn);
    });
  }

  _actualizarBotonesAsiento() {
    const pax        = this._paxConAsiento()[this.pasajeroActivoIndex];
    const confirmBtn = document.getElementById('confirmReservationBtn');
    const cancelBtn  = document.getElementById('cancelReservationBtn');
    const display    = document.getElementById('currentSeatDisplay');
    if (!pax) return;

    confirmBtn.style.display = (pax.asientoSeleccionado && !pax.reservaExistente)
      ? 'inline-flex' : 'none';
    cancelBtn.style.display  = pax.reservaExistente ? 'inline-flex' : 'none';
    display.textContent = pax.asientoSeleccionado
      ? `${this._paxLabel(pax, this.pasajeros.indexOf(pax))}: ${pax.asientoSeleccionado}`
      : `${this._paxLabel(pax, this.pasajeros.indexOf(pax))}: sin asiento`;
  }

  confirmarAsiento() {
    const pax = this._paxConAsiento()[this.pasajeroActivoIndex];
    if (!pax?.asientoSeleccionado) return;

    const resultado = this.manager.reservar(this.vueloActual.id, pax.asientoSeleccionado, pax.pasajeroObj);
    if (resultado.exito) {
      pax.reservaExistente = this.manager.getReserva(this.vueloActual.id, pax.nombreCompleto);
      this._renderizarTabs();
      this.renderizarMapa();
      this._actualizarBotonesAsiento();
      this.mostrarMensaje(resultado.mensaje, 'info');
      this._verificarTodosConfirmados();
    } else {
      this.mostrarMensaje(resultado.mensaje, 'error');
    }
  }

  cancelarReserva() {
    const pax = this._paxConAsiento()[this.pasajeroActivoIndex];
    if (!pax?.reservaExistente) return;

    const res = this.manager.cancelarReserva(this.vueloActual.id, pax.nombreCompleto);
    if (res.exito) {
      pax.reservaExistente    = null;
      pax.asientoSeleccionado = null;
      this._renderizarTabs();
      this.renderizarMapa();
      this._actualizarBotonesAsiento();
      this.mostrarMensaje(res.mensaje, 'info');
    } else {
      this.mostrarMensaje(res.mensaje, 'error');
    }
  }

  _verificarTodosConfirmados() {
    const todos = this._paxConAsiento();
    if (todos.every(p => p.reservaExistente)) {
      this._mostrarComprobante();
    }
  }

  // ─── Mapa de asientos ─────────────────────────────────────────────────────
  renderizarMapa() {
    const container = document.getElementById('seatMapContainer');
    container.innerHTML = '';
    if (!this.vueloActual) return;

    const avion     = this.vueloActual.avion;
    const ocupados  = new Set(this.vueloActual.reservas.map(r => r.seatId));
    const paxActivo = this._paxConAsiento()[this.pasajeroActivoIndex];
    const ssr       = paxActivo?.datos?.ssr ?? 'NONE';
    const categoria = paxActivo?.categoria ?? 'ADT';

    const ssrRestringido = ['WCHR','WCHC','BLND','DEAF','MEDA'].includes(ssr);
    const restriccionEmergencia =
      categoria === 'CHD' ||
      categoria === 'SEN' ||
      ssrRestringido;

    const airplane = document.createElement('div');
    airplane.className = 'airplane-body';

    for (let row = 1; row <= 22; row++) {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'seat-row';
      const rowNum = document.createElement('div');
      rowNum.className = 'row-number';
      rowNum.textContent = row;
      rowDiv.appendChild(rowNum);

      if (row <= 2) {
        rowDiv.appendChild(this._crearGrupo([`${row}A`,`${row}C`], avion, ocupados, paxActivo, restriccionEmergencia, categoria));
        rowDiv.appendChild(this._crearPasillo());
        rowDiv.appendChild(this._crearGrupo([`${row}D`,`${row}F`], avion, ocupados, paxActivo, restriccionEmergencia, categoria));
      } else {
        rowDiv.appendChild(this._crearGrupo([`${row}A`,`${row}B`,`${row}C`], avion, ocupados, paxActivo, restriccionEmergencia, categoria));
        rowDiv.appendChild(this._crearPasillo());
        rowDiv.appendChild(this._crearGrupo([`${row}D`,`${row}E`,`${row}F`], avion, ocupados, paxActivo, restriccionEmergencia, categoria));
      }
      airplane.appendChild(rowDiv);
    }
    container.appendChild(airplane);
    this._actualizarContadorAsientos(ocupados);
  }

  _actualizarContadorAsientos(ocupados) {
    let el = document.getElementById('seatCounter');
    if (!el) {
      el = document.createElement('div');
      el.id = 'seatCounter';
      el.style.cssText = `
        display:flex;gap:1.2rem;flex-wrap:wrap;margin-top:0.8rem;
        padding:0.7rem 1rem;background:#f8fafc;border-radius:0.8rem;font-size:0.85rem;font-weight:600;
      `;
      document.getElementById('seatMapContainer').after(el);
    }
    const total      = 8 + 120;
    const disponibles = total - ocupados.size;
    const enGrupo    = this._paxConAsiento()
      .filter((p, i) => i !== this.pasajeroActivoIndex && p.asientoSeleccionado).length;

    el.innerHTML = `
      <span style="color:#ef4444;">🔴 Ocupados: ${ocupados.size}</span>
      <span style="color:#22c55e;">🟢 Disponibles: ${disponibles}</span>
      ${enGrupo > 0 ? `<span style="color:#2563eb;">🔵 En este grupo: ${enGrupo}</span>` : ''}
    `;
  }

  _crearGrupo(asientos, avion, ocupados, paxActivo, restriccionEmergencia, categoria) {
    const g = document.createElement('div');
    g.className = 'seat-group';
    asientos.forEach(id => {
      const info = avion.getSeat(id);
      if (!info) return;
      g.appendChild(this._crearAsiento(id, info, ocupados, paxActivo, restriccionEmergencia, categoria));
    });
    return g;
  }

  _crearPasillo() {
    const p = document.createElement('div');
    p.className = 'aisle';
    p.textContent = '⬆️';
    return p;
  }

  _crearAsiento(id, info, ocupados, paxActivo, restriccionEmergencia, categoria) {
    const el = document.createElement('div');
    el.className = 'seat';
    el.textContent = id;

    if (info.class === 'first') el.classList.add('first-class');
    if (info.isExit)            el.classList.add('exit-row');

    const ocupadosPorGrupo = new Set(
      this._paxConAsiento()
        .filter((p, i) => i !== this.pasajeroActivoIndex && p.asientoSeleccionado)
        .map(p => p.asientoSeleccionado)
    );

    const ocupado   = ocupados.has(id) || ocupadosPorGrupo.has(id);
    const esMio     = paxActivo?.asientoSeleccionado === id;
    const bloqueado = info.isExit && restriccionEmergencia;

    if (ocupado && !esMio) el.classList.add('occupied');
    if (esMio)             el.classList.add('selected');
    if (bloqueado)         el.classList.add('restricted');

    if (bloqueado) {
      el.title = categoria === 'SEN' ? 'No disponible: tercera edad'
        : categoria === 'CHD'        ? 'No disponible: menor de edad'
        : 'No disponible: necesidades especiales (SSR)';
    } else if (ocupado && !esMio) {
      el.title = 'Asiento ocupado';
    }

    el.addEventListener('click', () => {
      if (!this.vueloActual || this.vueloActual.estado !== 'programado') {
        this.mostrarMensaje('El vuelo ya no permite modificaciones.', 'error'); return;
      }
      if (ocupado && !esMio) {
        this.mostrarMensaje('Asiento ocupado. Selecciona otro.', 'error'); return;
      }
      if (paxActivo?.reservaExistente && id === paxActivo.reservaExistente.seatId) {
        this.mostrarMensaje('Ya tienes este asiento confirmado.', 'info'); return;
      }
      if (bloqueado) {
        const msg = categoria === 'SEN'
          ? 'Las salidas de emergencia no están disponibles para personas de tercera edad (60+).'
          : categoria === 'CHD'
          ? 'Las salidas de emergencia no están disponibles para menores de edad.'
          : 'Las salidas de emergencia no están disponibles para pasajeros con necesidades especiales.';
        this.mostrarMensaje(msg, 'error'); return;
      }

      document.querySelectorAll('.seat.selected').forEach(s => s.classList.remove('selected'));
      el.classList.add('selected');
      if (paxActivo) paxActivo.asientoSeleccionado = id;
      document.getElementById('confirmReservationBtn').style.display = 'inline-flex';
      document.getElementById('currentSeatDisplay').textContent =
        `${this._paxLabel(paxActivo, this.pasajeros.indexOf(paxActivo))}: ${id}`;
      this._renderizarTabs();
    });

    return el;
  }

  // ─── Comprobante imprimible ───────────────────────────────────────────────
  _mostrarComprobante() {
    document.getElementById('modalComprobante')?.remove();

    const v           = this.vueloActual;
    const ahora       = new Date().toLocaleString('es-VE');
    const localizador = `CV${v.id}${Date.now().toString(36).toUpperCase().slice(-5)}`;

    const filasPax = this.pasajeros.map((pax, i) => {
      const label   = this._paxLabel(pax, i);
      const asiento = pax.categoria === 'INF'
        ? '<em style="color:#8b5cf6;">En regazo</em>'
        : `<strong>${pax.asientoSeleccionado || '—'}</strong>`;
      const ssrBadge = pax.datos?.ssr && pax.datos.ssr !== 'NONE'
        ? `<span style="font-size:0.75rem;color:#f97316;"> · ${pax.datos.ssr}</span>` : '';
      const repStr = pax.datos?.representante
        ? `<br><span style="font-size:0.77rem;color:#64748b;">Rep: ${pax.datos.representante.nombre} · ${pax.datos.representante.doc}</span>` : '';
      return `
        <tr>
          <td style="padding:0.6rem 0.8rem;border-bottom:1px solid #e2e8f0;">
            ${label}${ssrBadge}
            <span style="display:inline-block;padding:0.1rem 0.5rem;border-radius:9999px;
              background:${pax.catInfo.color};color:#fff;font-size:0.72rem;margin-left:0.3rem;">
              ${pax.categoria}
            </span>
          </td>
          <td style="padding:0.6rem 0.8rem;border-bottom:1px solid #e2e8f0;">
            ${pax.nombreCompleto}${repStr}
          </td>
          <td style="padding:0.6rem 0.8rem;border-bottom:1px solid #e2e8f0;text-align:center;">
            ${pax.datos?.genero === 'M' ? 'Masc.' : 'Fem.'}
          </td>
          <td style="padding:0.6rem 0.8rem;border-bottom:1px solid #e2e8f0;">
            ${pax.datos?.tipoDoc} ${pax.datos?.numDoc}
          </td>
          <td style="padding:0.6rem 0.8rem;border-bottom:1px solid #e2e8f0;text-align:center;">
            ${asiento}
          </td>
        </tr>`;
    }).join('');

    const tramosHtml = v.tramos.length > 1
      ? `<div style="margin-top:0.8rem;padding:0.7rem;background:#f8fafc;border-radius:0.6rem;font-size:0.83rem;color:#334155;">
          <strong>Tramos:</strong><br>
          ${v.tramos.map(t =>
            `${t.origen} → ${t.destino} &nbsp;|&nbsp; Salida: <strong>${t.horaSalida}</strong> &nbsp;·&nbsp; Llegada: <strong>${t.horaLlegada}</strong> (${t.duracionMinutos} min)`
          ).join('<br>')}
        </div>` : '';

    const modal = document.createElement('div');
    modal.id = 'modalComprobante';
    modal.style.cssText = `
      position:fixed;inset:0;background:rgba(15,23,42,0.75);
      display:flex;align-items:flex-start;justify-content:center;
      z-index:9999;overflow-y:auto;padding:2rem 1rem;
    `;
    modal.innerHTML = `
      <div id="comprobanteContenido" style="
        background:#fff;border-radius:1.2rem;width:100%;max-width:800px;
        box-shadow:0 25px 60px rgba(0,0,0,0.35);overflow:hidden;
      ">
        <div style="background:linear-gradient(135deg,#1e40af,#2563eb);padding:2rem;color:#fff;">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
            <div>
              <div style="font-size:1.4rem;font-weight:800;">✈️ Comprobante de Reserva</div>
              <div style="opacity:0.75;font-size:0.85rem;margin-top:0.3rem;">Emitido: ${ahora}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:0.75rem;opacity:0.7;text-transform:uppercase;letter-spacing:0.05em;">Localizador</div>
              <div style="font-size:1.9rem;font-weight:900;letter-spacing:0.18em;">${localizador}</div>
            </div>
          </div>
        </div>

        <div style="padding:1.5rem 2rem;border-bottom:1px solid #e2e8f0;">
          <div style="font-size:0.78rem;text-transform:uppercase;letter-spacing:0.07em;
                      color:#64748b;font-weight:700;margin-bottom:0.8rem;">📋 Datos del vuelo</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:0.8rem;">
            <div>
              <div style="font-size:0.76rem;color:#94a3b8;">Vuelo</div>
              <div style="font-weight:700;color:#1e40af;font-size:1.15rem;">#${v.id}</div>
            </div>
            <div>
              <div style="font-size:0.76rem;color:#94a3b8;">Ruta</div>
              <div style="font-weight:600;">${v.origen} → ${v.destino}</div>
              ${v.escalas.length > 0
                ? `<div style="font-size:0.76rem;color:#f97316;">${v.escalas.length} escala(s): ${v.escalas.join(', ')}</div>`
                : '<div style="font-size:0.76rem;color:#22c55e;">✓ Vuelo directo</div>'}
            </div>
            <div>
              <div style="font-size:0.76rem;color:#94a3b8;">Fecha</div>
              <div style="font-weight:600;">
                ${new Date(v.fecha + 'T00:00:00').toLocaleDateString('es-VE',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
              </div>
            </div>
            <div>
              <div style="font-size:0.76rem;color:#94a3b8;">Horario</div>
              <div style="font-weight:600;">${v.horaSalida} → ${v.horaLlegada}</div>
            </div>
          </div>
          ${tramosHtml}
        </div>

        <div style="padding:1.5rem 2rem;">
          <div style="font-size:0.78rem;text-transform:uppercase;letter-spacing:0.07em;
                      color:#64748b;font-weight:700;margin-bottom:0.8rem;">👥 Pasajeros y asientos</div>
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:0.87rem;">
              <thead>
                <tr style="background:#f1f5f9;">
                  <th style="padding:0.6rem 0.8rem;text-align:left;font-size:0.76rem;
                             text-transform:uppercase;color:#64748b;">Categoría</th>
                  <th style="padding:0.6rem 0.8rem;text-align:left;font-size:0.76rem;
                             text-transform:uppercase;color:#64748b;">Nombre</th>
                  <th style="padding:0.6rem 0.8rem;text-align:center;font-size:0.76rem;
                             text-transform:uppercase;color:#64748b;">Gén.</th>
                  <th style="padding:0.6rem 0.8rem;text-align:left;font-size:0.76rem;
                             text-transform:uppercase;color:#64748b;">Documento</th>
                  <th style="padding:0.6rem 0.8rem;text-align:center;font-size:0.76rem;
                             text-transform:uppercase;color:#64748b;">Asiento</th>
                </tr>
              </thead>
              <tbody>${filasPax}</tbody>
            </table>
          </div>
        </div>

        <div style="padding:0 2rem 1rem;font-size:0.78rem;color:#94a3b8;">
          ⚠️ La reserva puede cancelarse antes de que el vuelo pase a "En abordaje".
          Preséntese con documento de identidad original.
        </div>

        <div style="padding:1.2rem 2rem 1.8rem;display:flex;gap:1rem;flex-wrap:wrap;
                    border-top:1px solid #e2e8f0;">
          <button onclick="window.print()">🖨️ Imprimir comprobante</button>
          <button class="secondary"
            onclick="document.getElementById('modalComprobante').remove()">✕ Cerrar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  }

  // ─── Helpers públicos ─────────────────────────────────────────────────────
  actualizarSelectVuelos() {
    const select = document.getElementById('flightSelect');
    if (!select) return;
    select.innerHTML = '<option value="">-- Seleccione vuelo --</option>';
    this.manager.vuelosDisponibles().forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = `#${v.id} | ${v.origen} → ${v.destino} | ${v.fecha} ${v.horaSalida}–${v.horaLlegada}`;
      select.appendChild(opt);
    });
  }

  mostrarMensaje(texto, tipo = 'info') {
    const msg = document.getElementById('passengerMessage');
    if (!msg) return;
    msg.style.display = 'block';
    msg.textContent   = texto;
    msg.className     = `message-box ${tipo === 'error' ? 'message-error' : 'message-info'}`;
  }
}