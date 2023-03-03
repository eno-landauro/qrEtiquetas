// app.js

const express = require('express');
const app = express();
const controller = require('./controller');

// Define una ruta para el archivo HTML y asígnale el método correspondiente de$
app.get('/', controller.index);

// Define tus otras rutas y asocialas a los métodos correspondientes del contro$
app.get('/crearToken', controller.crearToken);
app.get('/validarToken', controller.validarToken);
app.get('/testDB', controller.testDB);
app.get('/listarDB', controller.listarDB);

// Inicia el servidor
app.listen(3001, function() {
  console.log('Servidor iniciado en el puerto 3001');
});
