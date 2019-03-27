# 控客的nodered节点

提供`发现`和`操作`两个节点

`发现`节点用于发现内网可操作的控客开关,获取相关信息用于操作节点操作用

`操作`节点用于直接操作配置好的控客开关,同时也提供去检查指定开关状态的功能

基于以上两个功能可完成局域网控客开关的操作

### 安装
```
# 去nodered目录
npm i node-red-contrib-konkeio
```


### nodered 范例流
请直接导入使用
```
[
    {
        "id": "eb21b7ea.649da8",
        "type": "konkeio-discover",
        "z": "f55b6e38.ef635",
        "timeout": 1000,
        "x": 310,
        "y": 340,
        "wires": [
            [
                "e8167b2c.cf2c38"
            ]
        ]
    },
    {
        "id": "30c0126f.cb394e",
        "type": "konkeio-action",
        "z": "f55b6e38.ef635",
        "name": "检查",
        "ip": "192.168.25.32",
        "mac": "28-d9-8a-8b-6d-f0",
        "password": "69:iv?tf",
        "status": "check",
        "x": 310,
        "y": 380,
        "wires": [
            [
                "c9345c8d.49554"
            ]
        ]
    },
    {
        "id": "e8167b2c.cf2c38",
        "type": "debug",
        "z": "f55b6e38.ef635",
        "name": "",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "true",
        "x": 450,
        "y": 340,
        "wires": []
    },
    {
        "id": "9b80127a.9c1a",
        "type": "inject",
        "z": "f55b6e38.ef635",
        "name": "按钮",
        "topic": "",
        "payload": "",
        "payloadType": "date",
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "x": 170,
        "y": 340,
        "wires": [
            [
                "eb21b7ea.649da8"
            ]
        ]
    },
    {
        "id": "719b1b1f.cd3054",
        "type": "inject",
        "z": "f55b6e38.ef635",
        "name": "定时",
        "topic": "",
        "payload": "",
        "payloadType": "date",
        "repeat": "1",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "x": 170,
        "y": 380,
        "wires": [
            [
                "30c0126f.cb394e"
            ]
        ]
    },
    {
        "id": "c9345c8d.49554",
        "type": "ui_switch",
        "z": "f55b6e38.ef635",
        "name": "",
        "label": "控客",
        "tooltip": "",
        "group": "44f9f573.c9844c",
        "order": 0,
        "width": 0,
        "height": 0,
        "passthru": true,
        "decouple": "false",
        "topic": "",
        "style": "",
        "onvalue": "true",
        "onvalueType": "bool",
        "onicon": "",
        "oncolor": "",
        "offvalue": "false",
        "offvalueType": "bool",
        "officon": "",
        "offcolor": "",
        "x": 450,
        "y": 380,
        "wires": [
            [
                "318135f1.7f664a"
            ]
        ]
    },
    {
        "id": "318135f1.7f664a",
        "type": "konkeio-action",
        "z": "f55b6e38.ef635",
        "name": "开关",
        "ip": "192.168.25.32",
        "mac": "28-d9-8a-8b-6d-f0",
        "password": "12345",
        "status": "auto",
        "x": 590,
        "y": 380,
        "wires": [
            []
        ]
    },
    {
        "id": "44f9f573.c9844c",
        "type": "ui_group",
        "z": "",
        "name": "插座",
        "tab": "c41a163c.ed1ae8",
        "disp": true,
        "width": "6",
        "collapse": false
    },
    {
        "id": "c41a163c.ed1ae8",
        "type": "ui_tab",
        "z": "",
        "name": "办公室",
        "icon": "dashboard",
        "disabled": false,
        "hidden": false
    }
]
```