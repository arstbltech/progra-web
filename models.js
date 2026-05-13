// Modelos de datos del sistema

class Avion {
  constructor() {
    this.seats = new Map(); // clave "1A" -> { row, col, class, type, isExit }

    // Primera clase: filas 1 y 2, configuración A C | D F
    [1, 2].forEach(row => {
      this.seats.set(`${row}A`, { row, col:'A', class:'first', type:'window', isExit:false });
      this.seats.set(`${row}C`, { row, col:'C', class:'first', type:'aisle',  isExit:false });
      this.seats.set(`${row}D`, { row, col:'D', class:'first', type:'aisle',  isExit:false });
      this.seats.set(`${row}F`, { row, col:'F', class:'first', type:'window', isExit:false });
    });

    // Económica: filas 3 a 10, configuración A B C | D E F
    for (let row = 3; row <= 22; row++) {
      ['A','B','C','D','E','F'].forEach(col => {
        const type = (col === 'A' || col === 'F') ? 'window'
                   : (col === 'C' || col === 'D') ? 'aisle' : 'middle';
        const isExit = (row === 8 || row === 9); // filas de salida de emergencia
        this.seats.set(`${row}${col}`, { row, col, class:'economy', type, isExit });
      });
    }
  }

  getSeat(id) { return this.seats.get(id); }
  getAllSeats() { return Array.from(this.seats.values()); }
}

class Tramo {
  constructor(origen, destino, horaSalida, duracionMinutos) {
    this.origen = origen.trim();
    this.destino = destino.trim();
    this.horaSalida = horaSalida; // "HH:MM"
    this.duracionMinutos = parseInt(duracionMinutos, 10); // en minutos
    this.horaLlegada = this.calcularHoraLlegada();
  }

  calcularHoraLlegada() {
    const [h, m] = this.horaSalida.split(':').map(Number);
    const fechaSalida = new Date(2024, 0, 1, h, m);
    const fechaLlegada = new Date(fechaSalida.getTime() + this.duracionMinutos * 60000);
    const hh = String(fechaLlegada.getHours()).padStart(2, '0');
    const mm = String(fechaLlegada.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
}

class Vuelo {
  constructor(id, fecha, estado = 'programado') {
    this.id = id;
    this.fecha = fecha; // "YYYY-MM-DD"
    this.estado = estado; // 'programado', 'en abordaje', 'finalizado'
    this.tramos = []; // Array de Tramo
    this.avion = new Avion();
    this.reservas = []; // Reserva[]
  }

  get origen() { return this.tramos.length > 0 ? this.tramos[0].origen : ''; }
  get destino() { return this.tramos.length > 0 ? this.tramos[this.tramos.length - 1].destino : ''; }
  get horaSalida() { return this.tramos.length > 0 ? this.tramos[0].horaSalida : ''; }
  get horaLlegada() { return this.tramos.length > 0 ? this.tramos[this.tramos.length - 1].horaLlegada : ''; }
  get escalas() { return this.tramos.length > 1 ? this.tramos.slice(0, -1).map(t => t.destino) : []; }
  get duracionTotalMinutos() {
    return this.tramos.reduce((total, tramo) => total + tramo.duracionMinutos, 0);
  }
  
  get descripcionRuta() {
    if (this.tramos.length === 0) return 'Sin ruta';
    if (this.tramos.length === 1) return `${this.origen} → ${this.destino} (directo)`;
    const aeropuertos = [this.origen, ...this.escalas, this.destino];
    return `${aeropuertos.join(' → ')} (${this.escalas.length} escala${this.escalas.length > 1 ? 's' : ''})`;
  }
}

class Pasajero {
  constructor(nombre, edad, discapacidad, representante = '', datos = null) {
    this.nombre       = nombre;
    this.edad         = edad;
    this.discapacidad = discapacidad;
    this.representante = representante;
    this.datos        = datos; // { ssr, categoria: 'ADT'|'CHD'|'INF'|'SEN' }
  }

  puedeOcuparSalidaEmergencia() {
    const ssrRestringido = ['WCHR','WCHC','BLND','DEAF','MEDA']
      .includes(this.datos?.ssr);
    return this.edad >= 15 && !ssrRestringido;
  }
}
class Reserva {
  constructor(vueloId, seatId, pasajero) {
    this.vueloId = vueloId;
    this.seatId = seatId;
    this.pasajero = pasajero; // Pasajero
    this.fechaReserva = new Date().toISOString();
  }
}