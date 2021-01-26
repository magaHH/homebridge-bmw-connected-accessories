U

download the repo to /usr/local/lib/node_modules/
goto to the directory "cd /usr/local/lib/node_modules/"
install the plugin with "sudo npm i ./homebridge-bmw-connected-accessories/"

add the a accessory to the config.json


{
    "accessory": "BMW-Connected-Accessories",
    "type": "lights",
    "name": "BMW Lights",
    "vin": "WBAJN51060xxxxxxx",
    "username": "a@b.com",
    "password": "password",
    "client_id": "dbf0a542-xxxx-xxxx-xxxx-55172fbfce35"
}


###########################################
