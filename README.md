# TSI RFID/NFC aplikacija (server)

## Uputstvo za pokretanje mock servera skenera

Dovoljno je imati instaliran Ubuntu da se jednostavno aplikacija pokrene.
Ukoliko korisnik repozitorija ne želi da instali Ubuntu, može da koristi
Ubuntu virtuelnu mašinu.
Da bi se aplikacija pokrenula dovoljno je pokrenuti sljedeće
komande:

    cd tsi-nfc-webapp/
    npm install
    sudo bash test/utilities/mosquitto-setup.sh

Bilješka: Preporučuje se korisnicima ovih komandi da provjere u
*test/utilities/mosquitto-setup.sh* skripti šta ona radi. Ova skripta
instalira prerekvizite za projekat, u kojima može biti neželjenih stvari od
strane samog korisnika.

## Uputstvo za pokretanje servera

### Podešavanje baze podataka

Server je usko ima usku komunikaciju sa MySQL bazom podataka. Dovoljno je
imati MySQL server instaliran, te na njemu izvršiti skriptu
*database/sql/v-1-nfc.sql*. Ova skripta instalira sve objekte potrebne
aplikaciji u bazi. Za instalaciju testnih podataka, nakon izvršenja skripte
*database/sql/v-1-nfc.sql*, izvršiti skriptu
*database/sql/v-2-testdata.sql*. Ovim će se instalirati svi testni
podaci
koji su trenutno korišteni u razvoju.


### Uputstvo za pokretanje servisa (API-a)

Da bi se servis pokrenuo, potrebno je imati instaliran Node.js i NPM (Node
Package Manager).
Koristiti sljedeće komande za pokretanje:

    cd tsi-nfc-webapp
    npm install
    node server/Server.js --dbhost <databaseb-host>
    --dbname <database-port>
    --dbuser <database-user>
    --dbpassword <datababse password>
    --dbname <database-name>

Podaci korišteni kao parametri za servis su podaci o prethodno instaliranoj
bazi.

# TSI RFID/NFC aplikacija (client)

## Uputstvo za pokretanje client aplikacije


Potrebno je podići jedan web server, te na njega kopirati sadržaj client/
direktorija. Startna stranica je *client/index.html*.


## Uputstvo za korištenje


Aplikacija se sastoji od:

*   Login stranica.
*   404 error stranica.
*   Dashboard administratorskog panela.
*   Administrator stranica za dodavanje RFID skenera.


Podaci za login se nalaze u bazi podataka.
Tri su testna korisnika:

<table>
    <thead>
    <tr>
        <th>Username</th>
        <th>Password</th>
        <th>Role</th>
    </tr>
    </thead>
    <tbody>
    <tr>
        <td>administrator</td>
        <td>password</td>
        <td>Administrator</td>
    </tr>
    <tr>
        <td>moderator</td>
        <td>password</td>
        <td>Moderator</td>
    </tr>
    <tr>
        <td>basic</td>
        <td>password</td>
        <td>Basic user</td>
    </tr>
    </tbody>
</table>

# Reference na tehnologije korištene kroz projekat

*   [Mosquitto documentation](http://mosquitto.org/documentation/)
*   [NPM documentation](https://www.npmjs.org/doc/)
*   [Node.js documentation](http://nodejs.org/api/)
*   [Node.js official Github page](https://github.com/joyent/node)
*   [MQTT module official Github page](https://github.com/adamvr/MQTT.js/)
*   [Node MySQL](https://github.com/felixge/node-mysql)
*   [Angular.js](https://angularjs.org/)
*   [Bootstrap](http://getbootstrap.com/getting-started/)
