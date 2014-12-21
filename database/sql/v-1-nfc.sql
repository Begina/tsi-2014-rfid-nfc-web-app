DELIMITER $$

CREATE SCHEMA IF NOT EXISTS nfc;

$$

################################################################################
## Users and NFCs.
################################################################################

CREATE TABLE IF NOT EXISTS roles (
  id          INT         NOT NULL,
  description VARCHAR(50) NOT NULL,
  PRIMARY KEY pk_roles(id),
  UNIQUE uq_roles_description(description)
);

$$

INSERT INTO roles (id, description)
VALUES (1, 'Administrator'),
  (2, 'Moderator'),
  (3, 'Basic');

$$

CREATE TABLE IF NOT EXISTS users (
  id       BIGINT       NOT NULL AUTO_INCREMENT,
  username VARCHAR(50)  NOT NULL,
  password VARCHAR(512) NOT NULL,
  role     INT          NOT NULL,
  PRIMARY KEY pk_users(id),
  FOREIGN KEY fk_users_roles(role) REFERENCES roles (id)
);

$$

CREATE TABLE IF NOT EXISTS nfcs (
  id          INT         NOT NULL AUTO_INCREMENT,
  tag         VARCHAR(30) NOT NULL,
  description VARCHAR(300),
  user        BIGINT,
  PRIMARY KEY pk_nfcs(id),
  UNIQUE uq_nfcs_user(user),
  FOREIGN KEY fk_nfcs_users(user) REFERENCES users (id)
);

$$

CREATE PROCEDURE createUser(
  username VARCHAR(50),
  password VARCHAR(512),
  role_id   INT,
  nfc_id    INT
)
  BEGIN
    DECLARE user_id BIGINT DEFAULT 0;

    INSERT INTO users (username, password, role)
    VALUES (username, password, role_id);

    SELECT LAST_INSERT_ID()
    INTO user_id;

    UPDATE nfcs
    SET user = user_id
    WHERE id = nfc_id AND user IS NULL;
  END

$$

CREATE VIEW users_all
AS
  SELECT
    users.id          AS user_id,
    users.username    AS user_username,
    users.password    AS user_password,
    roles.id          AS role_id,
    roles.description AS role_description,
    nfcs.id           AS nfc_id,
    nfcs.tag          AS nfc_tag,
    nfcs.description  AS nfc_description
  FROM users
    JOIN roles ON users.role = roles.id
    LEFT OUTER JOIN nfcs ON nfcs.user = users.id;

$$

CREATE PROCEDURE updateUser(
  user_id   BIGINT,
  username VARCHAR(50),
  password VARCHAR(512),
  role_id   INT,
  nfc_id    INT
)
  BEGIN
    START TRANSACTION;

    UPDATE users
    SET username = username,
      password   = password,
      role       = role_id
    WHERE id = user_id;

    UPDATE nfcs
    SET user = NULL
    WHERE user = user_id;

    UPDATE nfcs
    SET user = user_id
    WHERE id = nfc_id;

    COMMIT;
  END

$$

CREATE PROCEDURE deleteUser(
  user_id BIGINT
)
  BEGIN
    DECLARE nfc_id INT DEFAULT 0;
    START TRANSACTION;

    SELECT id
    INTO nfc_id
    FROM nfcs
    WHERE user = user_id;

    UPDATE nfcs
    SET user = NULL
    WHERE user = user_id;

    DELETE FROM users
    WHERE id = user_id;

    COMMIT;
  END

$$

CREATE PROCEDURE areLoginCredentialsCorrect(
  username VARCHAR(50),
  password VARCHAR(512)
)
  BEGIN
    SELECT COUNT(*) AS are_credentials_correct
    FROM users
    WHERE users.username = username AND
          users.password = password;
  END

$$

CREATE PROCEDURE getRole(
  username VARCHAR(50)
)
  BEGIN
    SELECT role
    FROM users
    WHERE users.username = username;
  END

$$

################################################################################
## RFIDs.
################################################################################

CREATE TABLE IF NOT EXISTS rfids (
  id          INT         NOT NULL AUTO_INCREMENT,
  uid         VARCHAR(30) NOT NULL,
  description VARCHAR(300),
  PRIMARY KEY pk_rfids(id),
  UNIQUE uq_rfids_uid(uid)
);

$$


# Either day or date should be set.
# If A day and a date is needed, add another row to the table.

CREATE TABLE IF NOT EXISTS rfid_commands (
  id          INT NOT NULL AUTO_INCREMENT,
  command     INT NOT NULL,
  description VARCHAR(50),
  PRIMARY KEY pk_nfc_rfid_scan_rules(id),
  UNIQUE uq_rfid_commands(command)
);

$$

################################################################################
## User RFID commands access rules
################################################################################

# If week_day is set then date should be null and vice versa.
# If A day and a date is needed, add another row to the table.
# week_day
#  0-Monday, 1-Tuesday, 2-Wednesday, 3-Thursday, 4-Friday, 5-Saturday, 6-Sunday
# time_start - The day time when this rules starts.
# time_end - The day time when this rule ends.
# Times must be in the range 00:00:00 - 23:59:59, start and end inclusive.

CREATE TABLE IF NOT EXISTS user_rfid_rules (
  id                   BIGINT NOT NULL AUTO_INCREMENT,
  user                 BIGINT NOT NULL,
  rfid                 INT    NOT NULL,
  allowed_rfid_command INT    NOT NULL,
  week_day             INT             DEFAULT NULL,
  date                 DATE            DEFAULT NULL,
  time_start           TIME,
  time_end             TIME,

  PRIMARY KEY pk_user_rfid_rules(id),

  FOREIGN KEY fk_user_rfid_rules_users(user)
  REFERENCES users (id),

  FOREIGN KEY fk_user_rfid_rules_rfids(rfid)
  REFERENCES rfids (id),

  FOREIGN KEY fk_user_rfid_rules_rfid_commands(allowed_rfid_command)
  REFERENCES rfid_commands (id)
);

$$

CREATE PROCEDURE createUserWeekdayDayRfidRule(
  user_id                 BIGINT,
  rfid_id                 INT,
  week_day                INT,
  time_start              TIME,
  time_end                TIME,
  allowed_rfid_command_id INT
)
  BEGIN
    INSERT INTO user_rfid_rules (user,
                                 rfid,
                                 week_day,
                                 time_start,
                                 time_end,
                                 allowed_rfid_command)
    VALUES (user_id,
            rfid_id,
            week_day,
            time_start,
            time_end,
            allowed_rfid_command_id);
  END

$$

CREATE PROCEDURE createUserDateRfidRule(
  user_id                 BIGINT,
  rfid_id                 INT,
  date                    DATE,
  time_start              TIME,
  time_end                TIME,
  allowed_rfid_command_id INT
)
  BEGIN
    INSERT INTO user_rfid_rules (user,
                                 rfid,
                                 date,
                                 time_start,
                                 time_end,
                                 allowed_rfid_command)
    VALUES (user_id,
            rfid_id,
            date,
            time_start,
            time_end,
            allowed_rfid_command_id);
  END

$$

CREATE VIEW user_rfid_rules_all
AS
  SELECT
    users.id                   AS user_id,
    users.username             AS user_username,
    users.password             AS user_password,
    rfids.id                   AS rfid_id,
    rfids.uid                  AS rfid_uid,
    rfids.description          AS rfid_description,
    rfid_commands.id           AS rfid_command_id,
    rfid_commands.command      AS rfid_command,
    rfid_commands.description  AS rfid_command_description,
    user_rfid_rules.id         AS user_rfid_rule_id,
    user_rfid_rules.week_day   AS user_rfid_rule_week_day,
    user_rfid_rules.date       AS user_rfid_rule_date,
    user_rfid_rules.time_start AS user_rfid_rule_time_start,
    user_rfid_rules.time_end   AS user_rfid_rule_time_end
  FROM users

    JOIN user_rfid_rules
      ON user_rfid_rules.user = users.id

    JOIN rfids
      ON user_rfid_rules.rfid = rfids.id

    JOIN rfid_commands
      ON user_rfid_rules.allowed_rfid_command = rfid_commands.id;

$$

# There is no need to have a modify for a rule.
# One rule will be revoke before another is given.

CREATE PROCEDURE deleteUserRfidRule(
  user_rfid_rule_id BIGINT
)
  BEGIN
    DELETE FROM user_rfid_rules
    WHERE id = user_rfid_rule_id;
  END

$$

################################################################################
## Users NFC/RFID scan times.
################################################################################

CREATE TABLE IF NOT EXISTS user_rfid_scan_times (
  id        BIGINT NOT NULL AUTO_INCREMENT,
  user      BIGINT NOT NULL,
  rfid      INT    NOT NULL,
  command   INT    NOT NULL,
  timestamp TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY pk_user_rfid_scan_times(id),

  FOREIGN KEY fk_user_rfid_scan_rules_users(user)
  REFERENCES users (id),

  FOREIGN KEY fk_user_rfid_scan_scan_times_rfids(rfid)
  REFERENCES rfids (id),

  FOREIGN KEY fk_user_rfid_scan_times_rfid_commands(command)
  REFERENCES rfid_commands (id)
);

$$

CREATE PROCEDURE getUserEntranceDepartureTimes(
  user_id   BIGINT,
  from_date DATE,
  to_date   DATE
)
  BEGIN
    SELECT *
    FROM users
      JOIN user_rfid_scan_times ON user_rfid_scan_times.user = users.id
      JOIN rfids ON user_rfid_scan_times.rfid = rfids.id;
  END

$$
