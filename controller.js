const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const http = require('http');
const fs = require('fs');
const QRCode = require('qrcode')
const path = require('path');
const uri = 'mongodb://adminmongo:x7fDQ37uMF4SSbuW@docdbpmsqa.cluster-cwmhnxdi6gn4.us-east-1.docdb.amazonaws.com/pms_dev?ssl=true';
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true, sslCA: './home/rds-combined-ca-bundle_EDI_QA.pem' });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Error de conexión a MongoDB:'));
db.once('open', function () {
    console.log('Conexión a MongoDB establecida correctamente');
});
const qrSchema = new mongoose.Schema({
    qr_code: String
});
const qrEstadisticaSchema = new mongoose.Schema({
    qr_code: String,
    ip: String,
    fecha: String
});
const Qr = mongoose.model('data_qr', qrSchema);
const QrEstadisticas = mongoose.model('data_qr_estadistica', qrEstadisticaSchema);
const secretKey = 'abc123$';
const baseUrl = "http://172.16.0.182:3000"
// const baseUrl = "http://localhost:3000"

exports.crearToken = async function (req, res) {

    try {
        id = createIdUnique()
        const payload = {
            "qr_code": id,
            "iat": Math.floor(Date.now() / 1000), // Marca de tiempo actual en segundos (opcional)
            "exp": Math.floor(Date.now() / 1000) + (50 * 365 * 24 * 60 * 60) // 50 anios

        };
        const token = jwt.sign(payload, secretKey);
        const data = new Qr({
            qr_code: id
        });

        try {
            const nuevo = await data.save();
            let url = `${baseUrl}/validarToken?token=${token}`
            QRCode.toFile(`qr/${id}.png`, url, {
                color: {
                    dark: '#000000',  // Color de los cuadrados oscuros del código QR
                    light: '#ffffff'  // Color de los cuadrados claros del código QR
                }
            }, (err) => {
                if (err) throw err
                console.log('Código QR generado')

                // Leer el archivo PNG generado
                fs.readFile(`qr/${id}.png`, (err, data) => {
                    if (err) throw err

                    // Descargar el archivo PNG en el cliente
                    res.setHeader('Content-Type', 'image/png')
                    res.setHeader('Content-Disposition', 'attachment; filename=codigo_qr.png')
                    res.send(data)
                })
            })
        } catch (err) {
            res.json({ err });
            console.error(err);
        }


    } catch (error) {
        res.status(401).send('Token inválido'); // Devuelve un error si el token es inválido
    }
    //res.send(`Parametros ${req.query.token}`);
};

exports.validarToken = function (req, res) {
    const token = req.query.token
    var ipAddress = req.socket.remoteAddress
    console.log("ip", ipAddress);
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log("ip2", ip);


    try {
        jwt.verify(token, secretKey, async (err, decoded) => {

            /* estadisticas */
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            const dataEstadistica = new QrEstadisticas({
                qr_code: decoded.qr_code,
                ip: ip,
                fecha: formattedDate
            });
            const nuevo = await dataEstadistica.save();

            if (err) {
                const archivo = path.join(__dirname, 'exito_no.html');
                fs.readFile(archivo, (error, contenido) => {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.write(contenido);
                    res.end();
                });
            } else {

                try {
                    const data = await Qr.find({ "qr_code": decoded.qr_code });
                    console.log(data);
                    if (data) {
                        const archivo = path.join(__dirname, 'exito.html');
                        fs.readFile(archivo, (error, contenido) => {
                            res.writeHead(200, { 'Content-Type': 'text/html' });
                            res.write(contenido);
                            res.end();
                        });
                    }
                    else {
                        const archivo = path.join(__dirname, 'exito_no.html');
                        fs.readFile(archivo, (error, contenido) => {
                            res.writeHead(200, { 'Content-Type': 'text/html' });
                            res.write(contenido);
                            res.end();
                        });
                    }

                } catch (err) {
                    console.error(err);
                }
            }
        });

    } catch (error) {
        const archivo = path.join(__dirname, 'exito_no.html');
        fs.readFile(archivo, (error, contenido) => {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(contenido);
            res.end();
        });
    }
};


exports.testDB = async function (req, res) {

    const data = new Qr({
        qr_code: 'Fredy2'
    });

    try {
        const savedUser = await data.save();
        console.log(savedUser);
    } catch (err) {
        console.error(err);
    } finally {
        db.close();
    }
};

exports.listarDB = async function (req, res) {
    url = "http://localhost:3000/validarToken?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJxcl9jb2RlIjoibTllOXY2cTJ1N2s0bDVlNEAyMDIzLTAzLTAyIiwiaWF0IjoxNjc3Nzg2MzA2LCJleHAiOjMyNTQ1ODYzMDZ9.MKg-wWmJ88lJqib1mBhJ1_pbC9szH_OGrjiMllEQdIs"
    QRCode.toFile('qr/codigo_qr.png', url, {
        color: {
            dark: '#000000',  // Color de los cuadrados oscuros del código QR
            light: '#ffffff'  // Color de los cuadrados claros del código QR
        }
    }, (err) => {
        if (err) throw err
        console.log('Código QR generado')

        // Leer el archivo PNG generado
        fs.readFile('qr/codigo_qr.png', (err, data) => {
            if (err) throw err

            // Descargar el archivo PNG en el cliente
            res.setHeader('Content-Type', 'image/png')
            res.setHeader('Content-Disposition', 'attachment; filename=codigo_qr.png')
            res.send(data)
        })
    })

};

function createIdUnique() {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    let id = ""
    for (let i = 0; i < 8; i++) {
        let randomNum = Math.floor(Math.random() * (Math.ceil(25) - Math.floor(1) + 1)) + 1;
        let randomNum2 = Math.floor(Math.random() * (Math.ceil(9) - Math.floor(1) + 1)) + 1;
        id += alphabet[randomNum]
        id += randomNum2
    }
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;
    id += "@" + formattedDate
    return id
}




