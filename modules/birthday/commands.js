const moment = require('moment')
const hastebin = require('hastebin-gen')

module.exports.commands = {
  birthday: {
    async execute (client, msg, param, db) {
      if (!param[1]) return msg.channel.send('You need to specify your birthday. >birthday 15/11/1979')
      let date = moment(param[1], 'DD/MM/YYYY')
      if (!date.isValid()) return msg.channel.send(`${param[1]} is not a valid date`)

      db.prepare('REPLACE INTO birthdays (id,date, month,year) VALUES (?,?,?,?)').run(msg.author.id, date.date(), date.month(), date.year())
      msg.channel.send('Birthday set correctly!')
    }
  },

  checkBirthdays: {
    async execute (client, msg, param, db) {
      let bds = db.prepare('SELECT id,date,month,year FROM birthdays').all().map(row => {
        return new Promise((resolve, reject) => {
          msg.guild.members.fetch(row.id).then(user => {
            resolve({
              id: row.id,
              name: user.user.tag,
              birthday: `${row.date}/${row.month}/${row.year}`
            })
          })
        })
      })

      hastebin(JSON.stringify(bds, null, 4), 'json').then(r => {
        msg.channel.send(r)
      })
    }
  }
}
