funcs = Object.create(null)
dict = new Object();
disFuncs = Object.create(null)
embeds = new Object()
config = new Object()
cmdDict = new Object()
Discord = require("discord.js")
client = new Discord.Client();
pine = require("../pineLang.js")
objDict = new Object();
dict.on = "specialForms"
funcs.on = (args, scope) => {
  if(args[0].type == "word") type = args[0].name
  else type = pine.evaluate(args[0], scope);
  if(type == "ready") {
    disFuncs.ready = () => {
      pine = require("../pineLang.js")
      pine.run(`load("discord")`)
      pine.evaluate(args[1], scope)
      
    }
  } else if(type == "message"){
    objDict.messageObj = args[1].args[0].name
    objDict.args = args[1].args[1].name
    console
    disFuncs.message = (message) => {
      pine = require("../pineLang.js")
      pine.run(`load("discord")`)
      pine.evaluate(args[2], scope)
    }
  }
}
funcs.setPrefix = (p) => {
  config.prefix = p
  pine.addTopScope("discord.prefix", p)
}
funcs.createEmbed = (args, scope) => {
  const embed = new Discord.MessageEmbed();
  title = args[1].value
  description = args[2].value
  color = args[3].name
  if(title) embed.setTitle(args[1].value)
  if(description) embed.setDescription(args[2].value)
  if(color) embed.setColor(parseInt(args[3].name))
  pine.addTopScope(args[0].name, embed)
  pine.addSpecialForms(`${args[0].name}.addField`, (args, scope) => {
    if(!args[0]) return console.log("Name is a required argument")
    if(!args[1]) return console.log("Value is a required argument")
    if(args[2]) value = pine.evaluate(args[2], scope)
    else value = false
    embed.addField(pine.evaluate(args[0], scope), pine.evaluate(args[1], scope), value)
  })
}
dict.createEmbed = "specialForms"
funcs.test = () => {
  const embed = new Discord.MessageEmbed();
  console.log(typeof(embed))
}
funcs.addCommand = (args, scope) => {
  if(args[0].type == "word") name = args[0].name
  else name = pine.evaluate(args[0], scope)
  cmdDict[name] = () => {
    pine.run(`load("discord")`)
    pine.evaluate(args[1], scope)
  }
}
funcs.processCommands = (msg) => {
  cmd = msg.content.split(" ")
  if(config.prefix.includes(" ")) cmd = cmd[1]
  else cmd = cmd[0].split(config.prefix)[1]
  if(cmd in cmdDict) cmdDict[cmd]()
  else return false
  return true
}
dict.addCommand = "specialForms"
funcs.login = (token) => {
  client.on('ready', () => {
    disFuncs.ready()
  })
  client.on('message', async message => {
    if(message.author.bot) return
    if(!disFuncs.message) return;
    var messagey = objDict.messageObj
    var args = objDict.args
    funcs['message.send'] = (msg) => {
      message.channel.send(msg)
    }
    msgArgs = message.content.split(" ")
    pine.addTopScope(args, msgArgs)
    pine.run(`def(${args}, ${args})`)
    pine.addTopScope(`${messagey}.delete`, () => {
      if(message.guild.me.hasPermission("DELETE_MESSAGES")) {
        message.delete();
        return true
      }
      else return false
    })
    func = () => {
      console.log(message.content)
      cmd = message.content.split(" ")
      if(config.prefix.includes(" ")) cmd = cmd[1]
      else {
        cmd = cmd[0].split(config.prefix)[1]
      }
      console.log(cmd)
    }
    pine.addTopScope(`${messagey}.content`, message.content)
    pine.addTopScope(`${messagey}.send`, funcs["message.send"])
    pine.addTopScope(`${messagey}`, message)
    pine.addTopScope(`${messagey}.content.startsWith`, (str) => {
      return message.content.startsWith(str)
    })
    funcs[`${messagey}.channel.purge`] = (amount) => {
      message.channel.bulkDelete(amount)
    }
    dict[`${messagey}.channel.purge`] = 'topScope'
    funcs[`${messagey}.content`] = message.content
    dict[`${messagey}.send`] = "topScope"
    dict[`${messagey}.content`] = 'topScope'
    disFuncs.message(message)
  })
  client.login(token)
}
module.exports.funcs = funcs
module.exports.config = dict 
