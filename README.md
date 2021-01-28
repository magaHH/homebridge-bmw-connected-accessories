This Plugin can provide switches to remotely trigger flashing lights, horn, start climate, lock or unlock.

This plugin can NOT read the actual status of the functions or if the trigger was execute by BMW successfully. Thus the switch will be set to off after 5 seconds automatically.

You add multiple sections to the config.json if you want to use multiple functions

as type "lights" | "horn" | "climate" | "lock" | "unlock" can used.

# config.json

```
{
    "accessory": "BMW-Connected-Accessories",
    "type": "lights",
    "name": "BMW Lights",
    "vin": "WBAJN51060xxxxxxx",
    "username": "a@b.com",
    "password": "password",
    "client_id": "dbf0a542-xxxx-xxxx-xxxx-55172fbfce35"
},
{
    "accessory": "BMW-Connected-Accessories",
    "type": "climate",
    "name": "BMW Standheizung",
    "vin": "WBAJN51060xxxxxxx",
    "username": "a@b.com",
    "password": "password",
    "client_id": "dbf0a542-xxxx-xxxx-xxxx-55172fbfce35"
}
```

The plugin can be installed via config-ui-x or via "sudo npm install -g --unsafe-perm homebridge-bmw-connected-accessories"
