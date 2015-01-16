### Note

All instructions are written with Ubuntu in mind.

# TSI NFC/RFID application

## Environment setup instructions

To run the application, following prerequisites must be installed:

    1. Node.js
    2. npm
    3. Mosquitto server
   
To test the application Mosquito clients should be also installed.

Ubuntu install procedure:

    sudo apt-get install node
    sudo apt-get install npm
    sudo apt-get install mosquitto
    
    sudo apt-get install mosquitto-clients # Used for testing only.

## Application start instructions

For instructions on starting the server, run: 

    node server/Server.js -h

Note: Database should be configured correctly before running the server.

## Database setup

The application uses a MySQL server. It is important that the MySQL server time 
zone is set to UTC.

To instantiate a Database on the server, run the *database/sql/v-1-nfc.sql*

After running the script, there will be 2 users added:
    
    Username      | Password
    ------------------------
    administrator | password
    moderator     | password

It is highly recommended to log into the application as the administrator user, 
and change the credentials for these users.

Optionally, the database name can be changed inside the script. (The default
name is *nfcrfid*.) It is important to remember this name, because it is given 
to the application as a flag on startup.

# Application testing

Running the *database/sql/v-2-testdata.sql* script on MySQL, will install 
predefined test data.

After starting a test MySQL database instance using the 
*database/sql/v-1-nfc.sql* script, the user should start a Mosquitto server. 

After all that is set up, the application can be started. (Again, use 
*node server/Server.js -h* to see instructions for starting the application.)

In order to test the client side (website), the user does not need the 
Mosquitto server.

In order to test the MQTT listener features, the user needs to publish fake 
MQTT tag scan messages. This can be done using the mosquitto_pub client. For 
example:

    mosquitto_pub -h localhost -t iot/nfc/ScannerUid/tag -m "YYYYMMDDhhmmss tag_uid"

Another mosquitto_sub client should be started in order to see application 
response messages. For example:

    mosquitto_sub -h localhost -t iot/nfc/+/command

There are a couple of responses that need to be checked after sending this 
message:

    1. Check the administrator tags page. (A new tag should have been added if 
       the message contained a non-existing tag_uid.)
    2. Check the moderator entrance times reports. (A new entry should be shown 
       if the scan was successful. The scan is successful if the tag was 
       assigned to an user, and the user has a user scan rule that permitted 
       scanning on the time sent.)
    3. Check the mosquitto_pub client for the received command. (Should be 
       PERMIT or DENY.)


# References

*   [Mosquitto documentation](http://mosquitto.org/documentation/)
*   [NPM documentation](https://www.npmjs.org/doc/)
*   [Node.js documentation](http://nodejs.org/api/)
*   [Node.js official Github page](https://github.com/joyent/node)
*   [MQTT module official Github page](https://github.com/adamvr/MQTT.js/)
*   [MySQL](http://www.mysql.com/)
*   [Node MySQL](https://github.com/felixge/node-mysql)
*   [Minimist](https://github.com/substack/minimist)
*   [jQuery](http://jquery.com/)
*   [Angular.js](https://angularjs.org/)
*   [Bootstrap](http://getbootstrap.com/getting-started/)
*   [Angular UI Bootstrap](http://angular-ui.github.io/bootstrap/)
