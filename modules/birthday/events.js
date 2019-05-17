const fs = require('fs-extra')
const moment = require('moment')

let lastChallenge

module.exports = {
  async reqs (client, db) {
    if (!(await fs.pathExists('data/lastBirthday.txt'))) fs.writeFileSync('data/lastBirthday.txt', moment().subtract(1, 'day').utc())
    lastChallenge = moment(fs.readFileSync('data/lastBirthday.txt', 'utf8'), 'DD/MM/YYYY').utc()

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

  let today = moment().utc()
  let bds = db.prepare('SELECT id FROM birthdays WHERE date=? AND month=?').all(today.date(), today.month()).map(e => e.id)

  let members = await guild.members.fetch()
  let membersBd = members.filter(m => !bds.includes(m.id))
  let membersOld = members.filter(m => m.roles.has(role.id))

  membersOld.forEach(member => {
    if (member) {
      member.roles.remove(role)
    }
  })

  membersBd.forEach(member => {
    if (member) {
      member.roles.add([role]).then(member => {
        member.guild.channels.find(c => c.name === 'general').send(`Happy Birthday to :tada: ${member}!!! :tada: We hope you have a great day~ :yellow_heart:`)
      })
    }
  })

  fs.writeFileSync('data/lastBirthday.txt', today.format('DD/MM/YYYY'))
  let nextChallenge = today.add(1, 'day').hour(12).minute(0)

  console.log(`Scheduling next birthday check to ${nextChallenge}`)
  setTimeout(send, moment(nextChallenge).diff(moment().utc()), client, db)
}
