const Discord = require('discord.js')
const fs = require('fs-extra')

module.exports = {
  async permCheck (message, commandName, client, db) {
    let dbPerms = db.prepare('SELECT item,type FROM perms WHERE command=? AND guild=?').all(commandName, message.guild.id)
    let perms = { role: [], user: [] }
    dbPerms.forEach(element => {
      perms[element.type].push(element.item)
    })
    if (dbPerms.length === 0) return true

    if (perms.role.length === 0 && perms.user.length === 0) { return true };

    if (perms.role.length > 0 && message.member.roles.some(r => perms.role.includes(r.name))) return true

    if (perms.user.length > 0 && perms.user.includes(message.author.id)) return true

    return false
  },

  async checkData (client, name, info) {
    if (!(await fs.pathExists(`data/${name}.json`))) {
      // file does not exist
      client.data[name] = info
      console.log(`data/${name}.json is missing, edit it and restart bot`)
      fs.writeFileSync(`data/${name}.json`, JSON.stringify(client.data[name], null, 4))
    }
  },

  async save (data, name) {
    await fs.writeFile('data/' + name + '.json', JSON.stringify(data, null, 4))
  },

  log: function (client, log) {
    console.log(log)
    if (client != null && client.channels.size > 0 && client.readyAt != null) {
      if (client.data.config.errorChannel && client.channels.some(c => c.name === client.data.config.errorChannel)) {
        client.channels.find(val => val.name === client.data.config.errorChannel).send({ embed: new Discord.MessageEmbed().setTimestamp().setDescription(log) })
      }
    }
  },

  async logEmbed (client, message, embed) {
    if (!client.data.moderation.logChannel || !message.guild.channels.some(c => c.name === client.data.moderation.logChannel)) {
      message.channel.send(embed)
    } else {
      message.guild.channels.find(c => c.name === client.data.moderation.logChannel).send(embed)
    }
  }
}
