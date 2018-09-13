const util = require('../../utilities.js')
const fs = require('fs')
const createCollage = require('photo-collage-latest')
const moment = require('moment')
const Discord = require('discord.js')

let lastChallenge = moment(fs.readFileSync('modules/sola_challenge/lastChallenge.txt', 'utf8')).utc()
let lastPin = fs.readFileSync('modules/sola_challenge/lastPin.txt', 'utf8')
let channel

module.exports = {
  async reqs (client, db) {
    await util.checkData(client, 'challenges', {})
    db.prepare('CREATE TABLE IF NOT EXISTS urls (url TEXT, id TEXT, width INTEGER, height INTEGER)').run()
  },
  events: {
    async ready (client, db) {
      console.log('Bot is up!')
      channel = client.guilds.first().channels.find(c => c.name === 'solas-art-challenge')
      await channel.messages.fetch()

      if (moment().isSame(lastChallenge, 'day')) {
        console.log("Today's challenge has already been sent. Scheduling next one")

        let nextChallenge = lastChallenge.add(1, 'day').hour(12).minute(0)
        console.log(`Scheduling next challenge to ${nextChallenge}`)
        setTimeout(send, moment(nextChallenge).diff(moment().utc()), client, db)
      } else {
        console.log("Today's challenge hasn't been sent. Sending challenge...")
        send(client, db)
      }
    },

    async message (client, db, msg) {
      if (msg.channel.name === 'solas-art-challenge') {
        msg.attachments.forEach(a => {
          db.prepare('INSERT INTO urls (url,id,width,height) VALUES (?,?,?,?)').run(a.url, msg.author.id, a.width, a.height)
        })
      }
    }
  }
}

async function send (client, db) {
  if (client.data.challenges[moment().month() + 1] && client.data.challenges[moment().month() + 1][moment().date()]) {
    const embed = {
      content: `${client.guilds.get('405360375584915456').roles.find(r => r.name === 'ArtChallenge')}`,
      embed: {
        'title': ':sparkles: Welcome to the Weekly Art Challenge! :sparkles:',
        'description': `Every Friday I will post a new word prompt for everyone to try and make something creative to!\n\nCheck the pinned post in this channel to see what todays word is.\n\nTHIS WEEK'S WORD IS\n${client.data.challenges[moment().month() + 1][moment().date()]}\n\nWrite #weekly on your post so everyone can find it!`,
        'color': 7836572,
        'thumbnail': {
          'url': 'https://cdn.discordapp.com/avatars/434066657036730368/334d6ee6b5d30c2b32b25499cdfee9bd.png'
        }
      }
    }

    let sent = await channel.send(embed)
    await sent.pin()

    let pinMessage = channel.messages.get(lastPin)
    if (pinMessage) pinMessage.unpin()

    lastPin = sent.id
    fs.writeFileSync('lastPin.txt', lastPin)
    console.log('Challenge sent')

    try {
      let width = 0
      let height = 0
      let attachments = []
      let mentions = []

      let data = db.prepare('SELECT * FROM urls').all()
      data.forEach(a => {
        if (a.width > width) width = a.width
        if (a.height > height) height = a.height

        attachments.push(a.url)
        mentions.push(`<@${a.id}>`)
      })

      const options = {
        sources: attachments,
        height: Math.ceil(Math.sqrt(attachments.length)),
        width: Math.ceil(Math.sqrt(attachments.length)), // images per column
        imageWidth: width, // width of each image
        imageHeight: height // height of each image
        // backgroundColor: "#cccccc", // optional, defaults to #eeeeee.
      }

      createCollage(options)
        .then((canvas) => {
          channel.send(`Thank you for joining last weeks challenge! Every participant will receive 5,000 stars. ${mentions.join(' ')}`, new Discord.MessageAttachment(canvas.toBuffer(), 'challenge.jpg'))
        })
    } catch (e) {
      console.log(e.stack)
    }
  } else {
    console.log("There's no challenge for today")
  }

  let today = moment().utc()
  fs.writeFileSync('modules/sola_challenge/lastChallenge.txt', today.format('DD/MM/YYYY'))
  let nextChallenge = today.add(1, 'day').hour(12).minute(0)

  console.log(`Scheduling next challenge to ${nextChallenge}`)
  setTimeout(send, moment(nextChallenge).diff(moment().utc()), client, db)
}
