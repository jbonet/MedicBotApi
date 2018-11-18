module.exports = {
  verify: (userId, date) => users[userId],
  getUser: userId => users[ userId ],
  getCitas: userId => citas[userId],
  addNewCita: (cita, userId) => {
    if (!citas[userId]) citas[userId] = []
    citas[userId].push(cita)
  }
}

const citas = {
  '12312312A': [
    {
      specialty: 'Traumatología',
      doctor: 'Dr. Martinez',
      date: 'jueves, 23 de abril de 2019 a las 16:15'
    },
    {
      specialty: 'Oncología',
      doctor: 'Dra. Fernández',
      date: 'viernes, 30 de julio de 2019 a las 16:40'
    }
  ]
}

const users = {
  '12312312A': { name: 'Pepe', DNI: '12312312A' },
  '00000000X': { name: 'Pisco', DNI: '00000000X' }
}
