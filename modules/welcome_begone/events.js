const util = require('../../utilities.js')
module.exports = {
  async reqs (client, db) {
    await util.checkData(client, 'wconfig', {'minutes': 2})
    db.prepare('CREATE TABLE IF NOT EXISTS timers (user TEXT, msg TEXT, guild TEXT, timestamp TEXT)').run()
  },
  events: {
    async ready (client, db) {
      let rows = db.prepare('SELECT user,msg, guild, timestamp FROM timers').all()
      rows.forEach(row => {
        let time = (new Date()).getTime()
        if (time > row.timestamp) {
          check(row.user, db)
        } else {
          setTimeout(check, row.timestamp - time, row.user, db)
        }
      })
    },

    async message (client, db, msg) {
      if (msg.author.id === client.user.id && msg.content.startsWith('Welcome to Give Me Space')) {
        let time = (new Date()).getTime()
        db.prepare('INSERT INTO timers (user,msg,guild,timestamp) VALUES (?,?,?,?)').run(msg.mentions.users.first().id, msg.id, msg.guild.id, time + (client.data.wconfig.minutes * 60000))
        setTimeout(check, client.data.wconfig.minutes * 60000, msg.mentions.users.first().id, db)
        if (msg.content.length >= 600) msg.delete()
      }
    },

    async guildMemberRemove (client, db, member) {
      let info = db.prepare('SELECT msg,guild FROM timers WHERE user=?').get(member.id)

      if (info) {
        let guild = client.guilds.get(info.guild)
        let msg = await guild.channels.find(c => c.name === 'general').messages.fetch(info.msg)
        msg.delete()
      }
    }
  }
}

function check (id, db) {
  db.prepare('DELETE FROM timers WHERE user=?').run(id)
}
