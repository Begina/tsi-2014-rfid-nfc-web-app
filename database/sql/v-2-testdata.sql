DELIMITER $$

INSERT INTO users (username, password, role)
VALUES ('administrator', 'password', 1),
  ('moderator', 'password', 2),
  ('regular', 'password', 3);

$$

INSERT INTO scanners (uid, description)
VALUES ('RFIDEntranceDoor', 'RFID for the entrance door.'),
  ('RFIDTeachersFloor', 'RFID for the teachers floor.');

$$

INSERT INTO tags (uid)
VALUES ('test'),
  ('test-02');

$$
