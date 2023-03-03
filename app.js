// app.js

const express = require('express');
const app = express();
const controller = require('./controller');


// Define tus rutas y asocialas a los métodos correspondientes del controlador
app.get('/crearToken', controller.crearToken);
app.get('/validarToken', controller.validarToken);
app.get('/testDB', controller.testDB);
app.get('/listarDB', controller.listarDB);

// Inicia el servidor
app.listen(3000, function() {
  console.log('Servidor iniciado en el puerto 3000');
});