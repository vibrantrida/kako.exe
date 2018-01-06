const fs = require('fs')
const Discord = require('discord.js')

const moment = require('moment')
moment.locale('en')
require('console-stamp')(console, {
  formatter: () => {
    return moment().format('YYYY-MM-DD hh:mm:ss A')
  }
})

const config = require('./config.json')
const kako = new Discord.Client()

// -------- Kako.exe --------------
kako.on('ready', () => {
  console.log('Kako.exe ready')

  setInterval(() => {
    Japarimon.update()
  }, 30000) // 30s
}) // on 'ready'

kako.on('message', (msg) => {
  if (msg.author.bot) {
    return
  }
  
  Command.parse(msg)
})
// -------- end - Kako.exe --------

// -------- Japarimon -------------
const monsdb = require('./data/mons.json')
let playersdb = require('./data/players.json')

console.info('loaded players.json to playersdb:\n', JSON.stringify(playersdb, null, 4))

let Japarimon = {}
Japarimon.channels = config.channels
Japarimon.channel = null
Japarimon.chance = 0.05 // 0.05 - 5%
Japarimon.state = 0 // 0 - explore, 1 - encounter
Japarimon.tick = 0 // 1 tick is 30s
Japarimon.flee_tick = 4 // mons will flee after 2m
Japarimon.local_monsdb = []
Japarimon.local_playersdb = playersdb.slice()
Japarimon.encountered_mon = -1 // encountered mon
Japarimon.state_msg = -1 // message object of last state message for later deletion
Japarimon.shuffle = function (arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1))
    let temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
  }
} // shuffle
Japarimon.encounterMon = function () {
  let m = {
    files: [`./data/${Japarimon.encountered_mon.sprite}`]
  }
  Japarimon.channel.send(`A ${Japarimon.encountered_mon.name} appeared!`, m)
    .then(msg => {
      console.log('saving state message to state_msg')
      Japarimon.state_msg = msg
    })
  return
} // encounterMon
Japarimon.saveData = function () {
  if (Japarimon.local_playersdb.length > 0) {
    console.log('saving local_playersdb to storage as players.json')
    fs.writeFile('./data/players.json', JSON.stringify(Japarimon.local_playersdb), 'utf8', (err) => {
        if (err) {
          return console.error(`failed saving players data: ${err}`)
        }
        playersdb = require('./data/players.json')
        console.info('successfully saved players data to \'data/players.json\'')
        Japarimon.channel.send(`:floppy_disk: Data was successfully saved to  Japari Library.`)
      })
  }
}
Japarimon.pickChannel = function () {
  console.log('Picking a random channel')
  // doing this twice because Math.random() uses the same seed on start-up
  let ch = Japarimon.channels[Math.floor(Math.random()*Japarimon.channels.length)]
  ch = Japarimon.channels[Math.floor(Math.random()*Japarimon.channels.length)]
  Japarimon.channel = kako.channels.find('name', ch)
  console.info('Picked channel: ', ch)
} // pickChannel
Japarimon.explore = function () {
  console.log('Throw dice!')
  if (Math.random() < Japarimon.chance) {
    if (Japarimon.local_monsdb.length > 0) {
      console.log('local_monsdb is not empty, popping a mon to encountered_mon')
      Japarimon.encountered_mon = Japarimon.local_monsdb.pop()
      console.log(`\n${JSON.stringify(Japarimon.encountered_mon, null, 4)}`)
    } else {
      console.log('local_monsdb is empty, copying monsdb to local_monsdb')
      Japarimon.local_monsdb = monsdb.slice()

      console.log('shuffling local_monsdb... Fisher-Yates style!')
      Japarimon.shuffle(Japarimon.local_monsdb)
      Japarimon.shuffle(Japarimon.local_monsdb)

      console.log('local_monsdb has been shuffle, popping a mon to encountered_mon')
      Japarimon.encountered_mon = Japarimon.local_monsdb.pop()
    }
  } else {
    console.log('no dice')
    Japarimon.explore()
  }
} // explore
Japarimon.update = function () {
  switch (Japarimon.state) {
    case 0: // explore
      console.info('state is \'Explore\'')
      Japarimon.pickChannel()
      Japarimon.explore()
      Japarimon.encounterMon()
      console.log('setting state to \'Encounter\'')
      // switch to state 1
      Japarimon.state = 1
      break;
    case 1: // encounter
      console.info('state is \'Encounter\'')
      if (Japarimon.encountered_mon === undefined || Japarimon.encountered_mon === -1) {
        console.info('encountered_mon is invalid, switching back state to \'Explore\'')
        Japarimon.tick = 0;
        Japarimon.state = 0
      }
      console.info('encountered_mon has a name of ', Japarimon.encountered_mon.name)
      if (Japarimon.tick >= Japarimon.flee_tick) {
        console.info('tick is equal to flee_tick')
        if (Japarimon.state_msg !== -1) {
          console.log('deleting state_msg')
          Japarimon.state_msg.delete()
          Japarimon.state_msg = -1
        }
        let mon_name = Japarimon.encountered_mon.name
        Japarimon.encountered_mon = -1;
        console.log('encountered_mon has fled, encountered_mon is now equal to -1')

        Japarimon.channel.send(`:dash: The remaining ${mon_name} fled. Congrats to those who caught one!`)
        Japarimon.saveData()
        console.log('resetting tick to 0, switching state to \'Explore\'')
        Japarimon.tick = 0;
        Japarimon.state = 0;
      } else {
        console.log('incremeting tick')
        ++Japarimon.tick
        console.info(`${Japarimon.tick} ticks has elapsed`)
      }
      break;
  }
} // update
// -------- end - Japarimon -------

// -------- helpers ---------------
let Command = {}
Command.parse = function (msg) {
  let str = msg.content
  if (str.startsWith(config.prefix)) {
    console.log('message starts with a command prefix, checking validity')
    if (str === config.prefix + 'catch' ||
        str.startsWith(config.prefix + 'collection')) {
      console.log('message is a valid command, executing')
      Command.execute(msg)
    } else {
      console.log('message is not a valid command')
    }
  }
}
Command.execute = function (msg) {
  let p = {}
  switch (msg.content.split(/\s+/)[0]) {
    case config.prefix + 'catch':
      if (msg.channel === Japarimon.channel) {
      console.log('executing \'catch\' command')
      p.id = msg.author.id
      if (Japarimon.encountered_mon !== -1) {
        console.log('checking if player exists in local_playersdb')
        if (Japarimon.local_playersdb.find(o => o.id === p.id)) {
          console.info('player exists in local_playersdb')
          p = Japarimon.local_playersdb[Japarimon.local_playersdb.indexOf(Japarimon.local_playersdb.find(o => o.id === p.id))]
          console.log(JSON.stringify(p, null, 4))
          console.log('checking if player already have encountered_mon')
          if (!p.mons.includes(monsdb.indexOf(Japarimon.encountered_mon))) {
            console.info('player doesn\'t have this mon yet')
            console.log('pushing encountered_mon to player\'s collection')
            p.mons.push(monsdb.indexOf(Japarimon.encountered_mon))
            Japarimon.channel.send(`:gift: Got it! **${msg.member.displayName}** caught a **${Japarimon.encountered_mon.name}**!`)
            console.log('updating player\'s data in local_playersdb')
            Japarimon.local_playersdb[Japarimon.local_playersdb.find(o => o.id === msg.author.id)] = p
            console.info('player\'s data saved!\n', JSON.stringify(Japarimon.local_playersdb, null, 4))
          } else {
            Japarimon.channel.send(`:exclamation: **${msg.member.displayName}**, you already have a **${Japarimon.encountered_mon.name}**! give chance to others.`)
          }
        } else {
          console.info(`player with ID ${p.id} doesn't exists in local_playersdb`)
          console.log('pushing encountered_mon to player\'s collection')
          p.mons = []
          p.mons.push(monsdb.indexOf(Japarimon.encountered_mon))
          Japarimon.channel.send(`:gift: Got it! **${msg.member.displayName}** caught a **${Japarimon.encountered_mon.name}**!`)
          console.log('adding new player to local_playersdb')
          Japarimon.local_playersdb.push(p)
          console.info('player\'s data saved!\n', JSON.stringify(Japarimon.local_playersdb, null, 4))
        }
      } else {
        console.log('there is no mon to catch')
      }
      p = {}
      }
      break; // catch
    case config.prefix + 'collection':
      console.log('executing \'collection\' command')
      if (msg.content.split(/\s+/)[1] !== undefined) {
        let param = msg.content.split(/\s+/)[1]
        console.info(`received parameter '${param}' for command 'collection'`)
        console.log('checking if a valid parameter')
        if (msg.mentions.members.first() !== undefined) {
          let mentioned_name = msg.mentions.members.first().displayName
          console.info('given parameter is valid')
          console.log(`checking if ${param} has a collection`)
          p = Japarimon.local_playersdb[Japarimon.local_playersdb.indexOf(Japarimon.local_playersdb.find(o => o.id === msg.mentions.members.first().id))]
          if (p !== undefined) {
            if (p.mons.length > 0) {
              console.info(`${param} has a collection\n${JSON.stringify(p.mons, null, 4)}`)
              console.log(`announcing ${param}'s collection`)
              msg.channel.send(`**${mentioned_name}** has collected ${p.mons.length} Lucky Beast(s)!`)
            }
          } else {
            console.info(`${param} has no collection`)
            console.log(`informing ${param}`)
            msg.channel.send(`**${mentioned_name}** haven't collected any Lucky Beasts yet.`)
          }
        } else {
          console.info('given parameter is not a mentioned user, ignoring')
        }
      } else {
        console.info('no parameters received for command \'collection\'')
        p.id = msg.author.id
        p = Japarimon.local_playersdb[Japarimon.local_playersdb.indexOf(Japarimon.local_playersdb.find(o => o.id === p.id))]
        if (p !== undefined) {
          console.log('checking if player has a collection')
          if (p.mons.length > 0) {
            console.info('player has a collection\n', JSON.stringify(p.mons, null, 4))
            console.log('announcing player\'s collection')
            msg.channel.send(`**${msg.member.displayName}** has collected **${p.mons.length}** Lucky Beast(s)!`)
          }
        } else {
          console.info('player has no collection')
          console.log('informing player')
          msg.channel.send(`You haven't collected any Lucky Beasts yet, **${msg.member.displayName}**.`)
        }
      }
      p = {}
      break;
  }
}

// -------- error handlers --------
process.on('unhandledRejection', (reason) => {
  console.info('Reason: ' + reason)
})

kako.on('error', e => {
  console.error(e)
})

// kako's alive!
kako.login(config.token)
