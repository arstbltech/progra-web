// Gestor de vuelos y persistencia en localStorage

class FlightManager {
  constructor() {
    this.vuelos = [];
    this.cargar();
  }

  cargar() {
    const data = localStorage.getItem('vuelos_universidad');
    if (data) {
      try {
        const raw = JSON.parse(data);
        this.vuelos = raw.map(v => {
          // Reconstruir el vuelo
          const vuelo = new Vuelo(v.id, v.fecha, v.estado);
          
          // Reconstruir los tramos
          vuelo.tramos = (v.tramos || []).map(t => 
            new Tramo(t.origen, t.destino, t.horaSalida, t.duracionMinutos)
          );
          
          // Si no hay tramos pero hay datos antiguos (compatibilidad hacia atrás)
          if (vuelo.tramos.length === 0 && v.origen && v.destino && v.horaSalida) {
            const duracion = v.duracionMinutos || 120;
            vuelo.tramos = [new Tramo(v.origen, v.destino, v.horaSalida, duracion)];
          }
          
          // Reconstruir las reservas
          vuelo.reservas = (v.reservas || []).map(r => {
            const pasajero = new Pasajero(
              r.pasajero.nombre,
              r.pasajero.edad,
              r.pasajero.tieneDiscapacidad,
              r.pasajero.representante || r.pasajero.representanteNombre || ''
            );
            return new Reserva(r.vueloId, r.seatId, pasajero);
          });
          
          return vuelo;
        });
        
        console.log(`✅ Cargados ${this.vuelos.length} vuelos desde localStorage`);
      } catch (error) {
        console.error('❌ Error al cargar vuelos:', error);
        this.vuelos = [];
        localStorage.removeItem('vuelos_universidad');
      }
    } else {
      console.log('📦 No hay vuelos guardados en localStorage');
      this.vuelos = [];
    }
  }

  guardar() {
    try {
      const data = this.vuelos.map(v => ({
        id: v.id,
        fecha: v.fecha,
        estado: v.estado,
        tramos: v.tramos.map(t => ({
          origen: t.origen,
          destino: t.destino,
          horaSalida: t.horaSalida,
          duracionMinutos: t.duracionMinutos
        })),
        // Incluir también los campos directos para compatibilidad
        origen: v.origen,
        destino: v.destino,
        horaSalida: v.horaSalida,
        duracionMinutos: v.duracionTotalMinutos,
        reservas: v.reservas.map(r => ({
          vueloId: r.vueloId,
          seatId: r.seatId,
          pasajero: {
            nombre: r.pasajero.nombre,
            edad: r.pasajero.edad,
            tieneDiscapacidad: r.pasajero.tieneDiscapacidad,
            representante: r.pasajero.representante
          }
        }))
      }));
      
      localStorage.setItem('vuelos_universidad', JSON.stringify(data));
      console.log(`💾 Guardados ${this.vuelos.length} vuelos en localStorage`);
      return true;
    } catch (error) {
      console.error('❌ Error al guardar vuelos:', error);
      return false;
    }
  }

  agregarVuelo(vuelo) {
    if (!vuelo || !vuelo.tramos || vuelo.tramos.length === 0) {
      console.error('❌ Intento de agregar vuelo inválido');
      return false;
    }
    
    this.vuelos.push(vuelo);
    const guardado = this.guardar();
    
    if (guardado) {
      console.log(`✅ Vuelo #${vuelo.id} agregado y guardado: ${vuelo.descripcionRuta}`);
    }
    
    return guardado;
  }

  getVuelo(id) {
    const vuelo = this.vuelos.find(v => v.id == id);
    if (!vuelo) {
      console.warn(`⚠️ Vuelo #${id} no encontrado`);
    }
    return vuelo;
  }

  vuelosDisponibles() {
    const disponibles = this.vuelos.filter(v => v.estado === 'programado');
    console.log(`🔍 Vuelos disponibles: ${disponibles.length}`);
    return disponibles;
  }

  cambiarEstado(id, nuevoEstado) {
    const v = this.getVuelo(id);
    if (!v) return false;
    
    const estadosValidos = ['programado', 'en abordaje', 'finalizado'];
    if (!estadosValidos.includes(nuevoEstado)) {
      console.error(`❌ Estado inválido: ${nuevoEstado}`);
      return false;
    }
    
    // Validar transiciones de estado
    const transiciones = {
      'programado': ['en abordaje'],
      'en abordaje': ['finalizado'],
      'finalizado': []
    };
    
    if (!transiciones[v.estado].includes(nuevoEstado)) {
      console.error(`❌ Transición inválida: ${v.estado} → ${nuevoEstado}`);
      return false;
    }
    
    const estadoAnterior = v.estado;
    v.estado = nuevoEstado;
    const guardado = this.guardar();
    
    if (guardado) {
      console.log(`✅ Vuelo #${id}: ${estadoAnterior} → ${nuevoEstado}`);
    }
    
    return guardado;
  }

  reservar(vueloId, seatId, pasajero) {
    const vuelo = this.getVuelo(vueloId);
    if (!vuelo || vuelo.estado !== 'programado') {
      console.warn('⚠️ Vuelo no disponible para reservas');
      return { exito: false, mensaje: 'El vuelo no admite reservas.' };
    }

    if (vuelo.reservas.some(r => r.seatId === seatId)) {
      console.warn(`⚠️ Asiento ${seatId} ya ocupado`);
      return { exito: false, mensaje: 'Asiento ya ocupado.' };
    }

    const info = vuelo.avion.getSeat(seatId);
    if (!info) {
      console.warn(`⚠️ Asiento ${seatId} inválido`);
      return { exito: false, mensaje: 'Asiento inválido.' };
    }

    // Validar restricciones de salida de emergencia
    if (info.isExit && !pasajero.puedeOcuparSalidaEmergencia()) {
      console.warn('⚠️ Pasajero no puede ocupar salida de emergencia');
      return { exito: false, mensaje: 'No puede ocupar salida de emergencia (menor, tercera edad o discapacidad).' };
    }

    // Validar menor con representante
    if (pasajero.esMenor && !pasajero.representante) {
      console.warn('⚠️ Menor sin representante');
      return { exito: false, mensaje: 'Menor de edad debe tener un representante.' };
    }

    // Eliminar reserva anterior del mismo pasajero en este vuelo (permitir cambio de asiento)
    const reservaAnterior = vuelo.reservas.find(
      r => r.pasajero.nombre.toLowerCase() === pasajero.nombre.toLowerCase()
    );
    
    if (reservaAnterior) {
      console.log(`🔄 Cambiando asiento de ${pasajero.nombre}: ${reservaAnterior.seatId} → ${seatId}`);
      vuelo.reservas = vuelo.reservas.filter(r => r !== reservaAnterior);
    }

    // Crear nueva reserva
    const nuevaReserva = new Reserva(vueloId, seatId, pasajero);
    vuelo.reservas.push(nuevaReserva);
    
    const guardado = this.guardar();
    
    if (guardado) {
      console.log(`✅ Reserva confirmada: ${pasajero.nombre} en asiento ${seatId} del vuelo #${vueloId}`);
      return { exito: true, mensaje: 'Reserva confirmada exitosamente.' };
    } else {
      // Revertir si no se pudo guardar
      vuelo.reservas.pop();
      console.error('❌ No se pudo guardar la reserva');
      return { exito: false, mensaje: 'Error al guardar la reserva.' };
    }
  }

  getReserva(vueloId, nombrePasajero) {
    const vuelo = this.getVuelo(vueloId);
    if (!vuelo) return null;
    
    const reserva = vuelo.reservas.find(
      r => r.pasajero.nombre.toLowerCase() === nombrePasajero.toLowerCase()
    );
    
    if (reserva) {
      console.log(`🔍 Reserva encontrada: ${nombrePasajero} en asiento ${reserva.seatId}`);
    }
    
    return reserva || null;
  }

  cancelarReserva(vueloId, nombrePasajero) {
    const vuelo = this.getVuelo(vueloId);
    if (!vuelo || vuelo.estado !== 'programado') {
      console.warn('⚠️ No se puede cancelar en este momento');
      return { exito: false, mensaje: 'No se puede cancelar la reserva en este momento.' };
    }

    const cantidadAntes = vuelo.reservas.length;
    vuelo.reservas = vuelo.reservas.filter(
      r => r.pasajero.nombre.toLowerCase() !== nombrePasajero.toLowerCase()
    );
    
    const cancelada = cantidadAntes > vuelo.reservas.length;
    
    if (cancelada) {
      const guardado = this.guardar();
      if (guardado) {
        console.log(`❌ Reserva cancelada: ${nombrePasajero} del vuelo #${vueloId}`);
        return { exito: true, mensaje: 'Reserva cancelada exitosamente.' };
      } else {
        console.error('❌ No se pudo guardar la cancelación');
        return { exito: false, mensaje: 'Error al cancelar la reserva.' };
      }
    }
    
    console.warn(`⚠️ No se encontró reserva para ${nombrePasajero}`);
    return { exito: false, mensaje: 'No se encontró una reserva activa a tu nombre.' };
  }

  // Obtener estadísticas del vuelo
  getEstadisticasVuelo(vueloId) {
    const vuelo = this.getVuelo(vueloId);
    if (!vuelo) return null;
    
    const totalAsientos = vuelo.avion.getAllSeats().length;
    const asientosOcupados = vuelo.reservas.length;
    const asientosDisponibles = totalAsientos - asientosOcupados;
    
    return {
      totalAsientos,
      asientosOcupados,
      asientosDisponibles,
      porcentajeOcupacion: ((asientosOcupados / totalAsientos) * 100).toFixed(1),
      ruta: vuelo.descripcionRuta,
      horaLlegada: vuelo.horaLlegada,
      duracionTotal: vuelo.duracionTotalMinutos
    };
  }

  // Obtener todos los aeropuertos disponibles (para sugerencias)
  getAeropuertosDisponibles() {
    const aeropuertos = new Set();
    
    this.vuelos.forEach(v => {
      v.tramos.forEach(t => {
        if (t.origen) aeropuertos.add(t.origen);
        if (t.destino) aeropuertos.add(t.destino);
      });
    });
    
    // Agregar aeropuertos comunes si no hay datos
    if (aeropuertos.size === 0) {
      ['Caracas', 'Miami', 'Panamá', 'Bogotá', 'Lima', 'Madrid', 'México DF', 'Buenos Aires']
        .forEach(a => aeropuertos.add(a));
    }
    
    return Array.from(aeropuertos).sort();
  }

  // Método para depuración
  mostrarEstado() {
    console.log('📊 Estado del sistema:');
    console.log(`   Total vuelos: ${this.vuelos.length}`);
    this.vuelos.forEach(v => {
      console.log(`   #${v.id}: ${v.descripcionRuta} [${v.estado}] - ${v.reservas.length} reservas`);
    });
  }
}