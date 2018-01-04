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

kako.on('ready', () => {
  console.log('Kako.exe ready')

  chGeneral = kako.channels.find('name', 'general')
  chGeneral.send('**Kako.exe** ready to serve!')
})

kako.on('error', e => {
  console.log(e)
})

kako.login(config.token)
