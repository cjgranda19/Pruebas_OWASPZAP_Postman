const express = require('express');
const Reserva = require('../models/Reserva');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Protege todas las rutas siguientes con autenticación
router.use(authMiddleware);

// Listar todas las reservas del usuario autenticado
router.get('/', async (req, res) => {
  const reservas = await Reserva.find({ usuario: req.userId });
  res.json(reservas);
});

// Crear nueva reserva
router.post('/', async (req, res) => {
  const { fecha, sala, hora } = req.body;

  // 1) Verificar sala
  if (!sala || !["A", "B", "C"].includes(sala)) {
    return res.status(400).json({ error: 'Sala inválida' });
  }

  // 2) Validar formato de hora: solo hh:mm AM/PM
  const formato12h = /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;
  if (!formato12h.test(hora)) {
    return res
      .status(400)
      .json({ error: 'Formato de hora inválido. Use hh:mm AM/PM' });
  }

// 3) Prohibir reservas los domingos
// Opción A: parse manual
const [yyyy, mm, dd] = fecha.split("-");
const d = new Date(+yyyy, +mm - 1, +dd);
// const d = new Date(fecha + "T00:00:00");  // Opción B
const diaSemana = d.getDay();  // 0 = domingo

if (diaSemana === 0) {
  return res
    .status(400)
    .json({ error: 'No se permiten reservas los domingos' });
}

  // Si pasaron todas las validaciones, crear y guardar
  const nueva = new Reserva({
    usuario: req.userId,
    fecha,
    sala,
    hora
  });

  await nueva.save();
  res.status(201).json(nueva);
});

// Eliminar una reserva (solo si pertenece al usuario)
router.delete('/:id', async (req, res) => {
  const resultado = await Reserva.deleteOne({ _id: req.params.id, usuario: req.userId });
  if (resultado.deletedCount === 0) {
    return res.status(404).json({ msg: 'Reserva no encontrada o no autorización' });
  }
  res.status(200).json({ msg: 'Reserva cancelada' });
});

module.exports = router;
