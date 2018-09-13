const moment = require('moment')

module.exports.commands = {
  birthday: {
    async execute (client, msg, param, db) {
      if (!param[1]) return msg.channel.send('You need to specify your birthday. >birthday 15/11/1979')
      let date = moment(param[1], 'DD/MM/YYYY')
      if (!date.isValid()) return msg.channel.send(`${param[1]} is not a valid date`)

      db.prepare('REPLACE INTO birthdays (id,date, month,year) VALUES (?,?,?,?)').run(msg.author.id, date.date(), date.month(), date.year())
      msg.channel.send('Birthday set correctly!')
    }
  }
}
