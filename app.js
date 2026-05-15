// Punto de entrada: crea la aplicación y los paneles
// Exponer variables globalmente para depuración y acceso desde consola
let app, flightManager, adminPanel, passengerPanel;

class App {
  constructor() {
    this.manager = new FlightManager();
    this.adminPanel = new AdminPanel(this.manager);
    this.passengerPanel = new PassengerPanel(this.manager);
    this.root = document.getElementById('app');
  }

  iniciar() {
    const container = document.createElement('div');
    container.className = 'app-container';

    const h1 = document.createElement('h1');
    h1.innerHTML = '✈️ Programación de vuelos';
    container.appendChild(h1);

    const tabs = document.createElement('div');
    tabs.className = 'role-tabs';
    const btnAdmin = document.createElement('button');
    btnAdmin.className = 'role-btn active';
    btnAdmin.textContent = '🔧 Programar vuelos';
    const btnPass = document.createElement('button');
    btnPass.className = 'role-btn';
    btnPass.textContent = '🧑‍✈️ Reservar vuelo';
    tabs.appendChild(btnAdmin);
    tabs.appendChild(btnPass);
    container.appendChild(tabs);

    this.root.appendChild(container);

    this.adminPanel.render(container);
    this.passengerPanel.render(container);

    this.passengerPanel.actualizarSelectVuelos();
    window.refreshPassengerFlights = () => this.passengerPanel.actualizarSelectVuelos();

    btnAdmin.addEventListener('click', () => {
      btnAdmin.classList.add('active');
      btnPass.classList.remove('active');
      document.getElementById('adminPanel').classList.add('active');
      document.getElementById('passengerPanel').classList.remove('active');
      this.adminPanel.actualizarTabla();
    });

    btnPass.addEventListener('click', () => {
      btnPass.classList.add('active');
      btnAdmin.classList.remove('active');
      document.getElementById('passengerPanel').classList.add('active');
      document.getElementById('adminPanel').classList.remove('active');
      this.passengerPanel.actualizarSelectVuelos();
      this.passengerPanel.vueloActual = null;
      document.getElementById('seatSection').style.display = 'none';
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  app = new App();
  app.iniciar();
  
  // Exponer globalmente
  window.app = app;
  window.flightManager = app.manager;
  window.adminPanel = app.adminPanel;
  window.passengerPanel = app.passengerPanel;
})
