const express = require('express')
const bodyParser = require('body-parser')
const API = require('./mockApi')
const dateFormat = require('dateformat')
const {
  dialogflow,
  BrowseCarousel,
  BrowseCarouselItem,
  Suggestions
} = require('actions-on-google')

const googleUrl = 'https://google.es'
dateFormat.i18n = {
  'dayNames': [
    'Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab',
    'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'
  ],
  'monthNames': [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ],
  'timeNames': [
    'a', 'p', 'am', 'pm', 'A', 'P', 'AM', 'PM'
  ]
}

const expressApp = express()
expressApp.use(bodyParser.json())
const app = dialogflow()

function showBasicSuggestions (conv) {
  conv.ask(new Suggestions('Ver mis citas', 'Pedir una cita'))
}

function extractUserFromContext (conv) {
  let userId = conv.contexts.input.is_verified.parameters.user_id
  return userId.replace(/\s+/g, '').toUpperCase()
}

app.intent('Default Welcome Intent', (conv) => {
  conv.ask('Primero necesitamos verificar tu identidad.')
  conv.ask('¿Has venido ya alguna vez antes?')
  conv.ask(new Suggestions('Si', 'No'))
})

app.intent('Default Welcome Intent - yes', (conv) => {
  conv.ask('Necesitaremos conocer tu fecha de nacimiento y tu DNI para poder atenderte.')
  conv.ask(new Suggestions('Fecha de nacimiento', 'DNI'))
})

app.intent('Default Welcome Intent - no', (conv) => {
  conv.ask('En ese caso, necesito darle de alta. Voy a necesitar que me proporcione una serie de datos, como su nombre y apellidos, fecha de nacimiento, DNI y dirección')
  conv.ask(new Suggestions('Nombre y apellidos', 'Fecha de nacimiento', 'DNI', 'Número de teléfono'))
})

app.intent('newUser', conv => {
  conv.ask('Nuevo usuario añadido, ya puede acceder al resto de funciones del sistema')
  showBasicSuggestions(conv)
})

app.intent('help', (conv) => {
  conv.ask('Puedes pedirme cosas como:\n Ver mis citas o Pedir una cita')
  showBasicSuggestions(conv)
})

app.intent('id_verify', (conv) => {
  let userId = conv.parameters.user_id

  userId = userId.replace(/\s+/g, '').toUpperCase()
  const date = conv.parameters.date

  if (!API.verify(userId, date)) {
    conv.close('Lo siento, no te hemos podido comprobar la información que nos has proporcionado. Vuelve a intentarlo.')
  } else {
    conv.ask(`Hola, ${API.getUser(userId).name}`)
    conv.ask('¿En qué te puedo ayudar hoy?')
    showBasicSuggestions(conv)
  }
})

app.intent('showCitas', (conv) => {
  const userId = extractUserFromContext(conv)
  const citas = API.getCitas(userId)

  if (citas && citas.length > 0) {
    conv.ask('Aquí tienes tus próximas citas:')
    if (!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
      let message = ''
      for (let cita of citas) {
        message = message + `El ${cita.date} tiene cita de ${cita.specialty} con ${cita.doctor}\n`
      }
      conv.ask(message)
    } else {
      const items = []
      for (let cita of citas) {
        items.push(new BrowseCarouselItem({
          'title': cita.specialty,
          'description': cita.doctor,
          'footer': cita.date,
          'url': googleUrl
        }))
      }
      conv.ask(new BrowseCarousel({ 'items': items }))
    }
  } else {
    conv.ask('No tienes ninguna cita programada.')
    conv.ask('Puedo ayudarte en algo más?')
  }
  showBasicSuggestions(conv)
})

app.intent('pedirCita', (conv) => {
  const date = Date.parse(conv.parameters.appointment_date)
  const time = Date.parse(conv.parameters.appointment_time)
  let specialty = conv.parameters.appointment_specialty

  if (specialty) {
    specialty = specialty.toLowerCase()
    specialty = specialty[0].toUpperCase() + specialty.substr(1)
  }

  const dateStr = dateFormat(date, "dddd, d 'de' mmmm 'de' yyyy")
  const timeStr = dateFormat(time, 'HH:MM')

  API.addNewCita({
    specialty: specialty, doctor: 'Dra. García', date: `${dateStr} a las ${timeStr}`
  }, extractUserFromContext(conv))

  conv.ask('Su cita ha sido añadida.')
  conv.ask(`Le esperamos el día: ${dateStr} a las ${timeStr}`)
  showBasicSuggestions(conv)
})

expressApp.post('/medicbot/webhook', app)
expressApp.listen(3345, () => {
  console.log('MedicBotApi listening on port 3345!')
})
