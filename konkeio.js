const crypto = require('crypto')
const dgram = require("dgram")

const key = Buffer.from('6664736c3b6d6577726a6f706534353666647334666276666e6a77617567666f', 'hex')
const port = 27431

const zeroPad = (data) => {
  if(data instanceof Buffer != true) {data = Buffer.from(data)}
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
const discover = (timeout = 3000) => new Promise((resolve, reject) => {
  const list = []
  const socket = dgram.createSocket('udp4')
  socket.on('listening', () => socket.setBroadcast(true))
  socket.on('message', (message, rinfo) => {
    const data = decrypt(message)
    const ip = rinfo.address
    const [type, mac, password, info] = data.split('%')
    const [status] = info.split('#')
    list.push({ ip, mac, password, status })
  })
  socket.send(encrypt('lan_phone%test%test%test%heart'), port, '255.255.255.255')
  setTimeout(() => {
    resolve(list)
    socket.close()
  }, timeout)
})
// 变更状态和检查状态
// status取值可以为open,close,check
const action = (ip, mac, password, status) => new Promise((resolve, reject) => {
  let timer = 0
  const socket = dgram.createSocket('udp4')
  const cmd = `lan_phone%${mac}%${password}%${status}%relay`

  socket.on('listening', () => socket.setBroadcast(true))
  socket.on('message', (message, rinfo) => {
    const data = decrypt(message)
    const [type, mac, password, status] = data.split('%')
    socket.close()
    clearTimeout(timer)
    if (status == 'open' || status == 'close') { resolve(status) }
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
      console.log('config', config)
      this.on('input', async msg => {
        try{
          const status = await action(config.ip, config.mac, config.password, config.status)
          msg.payload = status
          this.send(msg)
        }catch(err) {
          msg.payload = err
          this.send(msg)
        }
      })
    }
  })
}