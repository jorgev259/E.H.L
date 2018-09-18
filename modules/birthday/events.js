const fs = require('fs')
const moment = require('moment')

let lastChallenge = moment(fs.readFileSync('modules/birthday/lastChallenge.txt', 'utf8'), 'DD/MM/YYYY').utc()

module.exports = {
  async reqs (client, db) {
    db.prepare('CREATE TABLE IF NOT EXISTS birthdays (id TEXT, date INTEGER, month INTEGER, year INTEGER, PRIMARY KEY (id))').run()
  },
  events: {
    async ready (client, db) {
      if (moment().isSame(lastChallenge, 'day')) {
        console.log("Today's birthdays already celebrated. Scheduling next one")

        let nextChallenge = lastChallenge.add(1, 'day').hour(12).minute(0)
        console.log(`Scheduling next birthdays to ${nextChallenge}`)
        setTimeout(send, moment(nextChallenge).diff(moment().utc()), client, db)
      } else {
        console.log("Today's birthdays hasn't been celebrated. Sending redguards...")
        send(client, db)
      }
    }
  }
}

async function send (client, db) {
  let guild = client.guilds.first()
  let role = guild.roles.find(r => r.name === 'Happy Birthday')
  console.log(role.name)
  let p = []
  guild.members.forEach(m => {
    p.push(new Promise((resolve, reject) => {
      m.roles.remove(role).then(() => {
        resolve()
      })
    }))
  })
  await Promise.all(p)
  console.log('Removed birthday roles!')

  let today = moment().utc()
  let bds = db.prepare('SELECT id FROM birthdays WHERE date=? AND month=?').all(today.date(), today.month())

  if (bds.length) {
    let promises = []
    bds.forEach(bd => {
      promises.push(new Promise((resolve, reject) => {
        guild.members.fetch(bd.id).then(member => {
          if (member) {
            member.roles.add([role]).then(member => {
              member.guild.channels.find(c => c.name === 'general').send(`Happy Birthday to :tada: ${member}!!! :tada: We hope you have a great day~ :yellow_heart:`).then(() => {
                resolve()
              })
            })
          }
        })
      }))
    })
    await Promise.all(promises)
    console.log('Finished sending birthday grettings')
  } else {
    console.log('There\'s no birthdays today')
  }

  fs.writeFileSync('modules/birthday/lastChallenge.txt', today.format('DD/MM/YYYY'))
  let nextChallenge = today.add(1, 'day').hour(12).minute(0)

  console.log(`Scheduling next birthday check to ${nextChallenge}`)
  setTimeout(send, moment(nextChallenge).diff(moment().utc()), client, db)
}
