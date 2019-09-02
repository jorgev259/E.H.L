module.exports = {
  reqs (client, db) {
    db.prepare('CREATE TABLE IF NOT EXISTS boosts (id TEXT, server TEXT, lastBoost INTEGER, PRIMARY KEY (id, server))').run()
  },
  events: {
    ready (client, db) {
      console.log('Synchronizing server boost database')
      client.guilds.forEach(async guild => {
        let guildCount = 0
        let members = await guild.members.fetch()
        members.forEach(member => {
          try {
            let row = db.prepare('SELECT lastBoost FROM boosts WHERE id = ? AND server = ?').get(member.id, member.guild.id)
            if (row) {
              if (row.lastBoost !== member.premiumSinceTimestamp) {
                db.prepare('UPDATE boosts SET lastBoost = ? WHERE id = ? AND server = ?').run(member.premiumSinceTimestamp)
                if (member.premiumSinceTimestamp !== null) {
                  console.log(`Synced ${member.user.tag} on guild "${member.guild.name}" (Found change!)`)
                  guild.channels.find(c => c.name === 'general').send(`A huge thanks to ${member} for boosting the server! :tada:`)
                }
              }
            } else {
              db.prepare('INSERT INTO boosts (id,server,lastBoost) VALUES (?,?,?)').run(member.id, member.guild.id, member.premiumSinceTimestamp)
              console.log(`Synced ${member.user.tag} on guild "${member.guild.name}"`)
            }
          } finally {
            console.log(`Progress (${member.guild.name}): ${guildCount}/${members.size}`)
            guildCount++
          }
        })
      })
    }
  }
}
