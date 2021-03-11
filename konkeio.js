const crypto = require('crypto')
const dgram = require("dgram")

const key = Buffer.from('6664736c3b6d6577726a6f706534353666647334666276666e6a77617567666f', 'hex')
const port = 27431

const zeroPad = (data) => {
  if (data instanceof Buffer != true) { data = Buffer.from(data) }
  const bs = data.length % 16
  return data.length % 16 === 0 ? data : Buffer.concat([data, Buffer.alloc(16 - data.length % 16, 0)])
}
// aes256ecb加密,数据补0
const encrypt = message => {
  const cipher = crypto.createCipheriv('aes-256-ecb', key, '')
  cipher.setAutoPadding(false)
  const ciphertext = Buffer.concat([cipher.update(zeroPad(message)), cipher.final()])
  return ciphertext
}
// aes256ecb解密
const decrypt = message => {
  const cipher = crypto.createDecipheriv('aes-256-ecb', key, '')
  cipher.setAutoPadding(false)
  const ciphertext = Buffer.concat([cipher.update(message), cipher.final()])
  return ciphertext.toString('utf8')
}


// 广播探知局域网的设备信息
const discover = (timeout = 1000, ip = '255.255.255.255', speed = false) => new Promise((resolve, reject) => {
  // console.log('discover', timeout, ip)
  const list = []
  const socket = dgram.createSocket('udp4')
  socket.on('listening', () => socket.setBroadcast(true))
  socket.on('message', (message, rinfo) => {
    const data = decrypt(message)
    const ip = rinfo.address
    const [type, mac, password, info] = data.split('%')
    const [status] = info.split('#')
    list.push({ ip, mac, password, status })
    if(speed){
      resolve(list)
      socket.close()
    }
  })
  socket.send(encrypt('lan_phone%test%test%test%heart'), port, ip)
  if(!speed){
    setTimeout(() => {
      resolve(list)
      socket.close()
    }, timeout)
  }
})
// 变更状态和检查状态
// status取值可以为open,close,check
const action = (ip, mac, password, status, action_type) => new Promise((resolve, reject) => {
  // console.log('action', ip, mac, password, status)
  let timer = 0
  const socket = dgram.createSocket('udp4')
  const cmd = `lan_phone%${mac}%${password}%${status}%${action_type}`

  socket.on('listening', () => socket.setBroadcast(true))
  socket.on('message', (message, rinfo) => {
    const data = decrypt(message)
    const [type, mac, password, status] = data.split('%')
    socket.close()
    clearTimeout(timer)
    if (status == 'open'
      || status == 'close'
      || status.indexOf('operate') != -1
    ) { resolve(status) }
    else { reject(status) }
  })
  socket.send(encrypt(cmd), port, ip)
  timer = setTimeout(() => {
    reject('timeout')
    socket.close()
  }, 1000)
})


module.exports = RED => {
  RED.nodes.registerType("konkeio-discover", class {
    constructor(config) {
      RED.nodes.createNode(this, config)
      this.on('input', async msg => {
        const list = await discover(config.timeout)
        msg.payload = list
        msg.list = JSON.stringify(list, null, 2)
        this.send(msg)
      })
    }
  })
  RED.nodes.registerType("konkeio-action", class {
    constructor(config) {
      RED.nodes.createNode(this, config)
      this.on('input', async msg => {
        try {
          // 查询这个ip的相关信息
          const list = await discover(1000, config.ip, true)
          const { mac, password, status } = list[0] || {}

          if(status == null){
            throw 'check fail'
          }

          let result = status
          let act = ''
		      let action_type = 'relay'
          // 如果为自动模式则直接通过输入的流来决定动作
          if (config.sw == 'auto') {
            act = !!msg.payload ? 'open' : 'close'
          }
          // 如果配置的是开或关则直接配置动作
          else if (config.sw == 'open' || config.sw == 'close') {
            act = config.sw
          }
          else if (config.sw == 'ir_send') {
            act = 'operate#3031#emit#' + config.group + '#' + config.attr_id
            action_type = 'uart'
          }
          else if (config.sw == 'ir_learn') {
            act = 'operate#3031#learn#' + config.group + '#' + config.attr_id
            action_type = 'uart'
          }
          else if (config.sw == 'ir_stop_learn') {
            act = 'operate#3031#quit'
            action_type = 'uart'
          }
          else if (config.sw == 'ir_delete') {
            act = 'operate#3031#deletekey#' + config.group + '#' + config.attr_id
            action_type = 'uart'
          }
          else if (config.sw == 'ir_delete_group') {
            act = 'operate#3031#delete#' + config.group
            action_type = 'uart'
          }
          // 如果动作不为空则为自动模式或开关模式
          // 并且满足动作和查询到的状态不同则才调用
          if (act != '' && act != status) {
            result = await action(config.ip, mac, password, act, action_type)
          }

          msg.status = result
          msg.payload = result === 'open' ? true : false
          this.send(msg)
          this.status({ shape: 'dot', fill: 'green', text: `操作: ${config.sw} 状态:${result}` })
        } catch (err) {
          this.status({ shape: 'dot', fill: 'red', text: `操作: ${config.sw} 状态:${err}` })
          msg.payload = err
          this.send(msg)
        }
      })
    }
  })
}