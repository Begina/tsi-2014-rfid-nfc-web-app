DELIMITER $$

INSERT INTO users(username, password, role)
VALUES ('administrator', 'password', 1),
  	   ('moderator', 'password', 2),
       ('basic', 'password', 3);

$$

CALL createScanner('RFIDEntranceDoor', 'RFID for the entrance door.',
                   'PERMIT,DENY,');

$$

CALL createScanner('RFIDTeachersFloor', 'RFID for the teachers floor.',
                   'PERMIT,DENY,');

$$

INSERT INTO tags(uid, description)
VALUES ('test', 'Test tag 1.'),
       ('test-02', 'Test tag 2.');

$$
