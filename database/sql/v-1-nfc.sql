DELIMITER $$

CREATE SCHEMA IF NOT EXISTS nfcrfid;

$$

################################################################################
## Users and tags.
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

CREATE TABLE IF NOT EXISTS tags (
  id          INT         NOT NULL AUTO_INCREMENT,
  uid         VARCHAR(30) NOT NULL,
  description VARCHAR(300),
  user        BIGINT,
  PRIMARY KEY pk_tags(id),
  UNIQUE uq_tags_user(user),
  FOREIGN KEY fk_tags_users(user) REFERENCES users (id)
);

$$

CREATE PROCEDURE createUser(
  username VARCHAR(50),
  password VARCHAR(512),
  role_id   INT,
  tag_id    INT
)
  BEGIN
    DECLARE user_id BIGINT DEFAULT 0;

    INSERT INTO users (username, password, role)
    VALUES (username, password, role_id);

    SELECT LAST_INSERT_ID()
    INTO user_id;

    UPDATE tags
    SET user = user_id
    WHERE id = tag_id AND user IS NULL;
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
    tags.id           AS tag_id,
    tags.uid          AS tag_uid,
    tags.description  AS tag_description
  FROM users
    JOIN roles ON users.role = roles.id
    LEFT OUTER JOIN tags ON tags.user = users.id;

$$

CREATE PROCEDURE updateUser(
  user_id   BIGINT,
  username VARCHAR(50),
  password VARCHAR(512),
  role_id   INT,
  tag_id    INT
)
  BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION ROLLBACK;
    START TRANSACTION;
      UPDATE users
      SET username = username,
          password = password,
          role     = role_id
      WHERE id = user_id;

      UPDATE tags
      SET user = NULL
      WHERE user = user_id;

      UPDATE tags
      SET user = user_id
      WHERE id = tag_id;

    COMMIT;
  END

$$

CREATE PROCEDURE deleteUser(
  user_id BIGINT
)
  BEGIN
    DECLARE tag_id INT DEFAULT 0;
    START TRANSACTION;

    SELECT id
    INTO tag_id
    FROM tags
    WHERE user = user_id;

    UPDATE tags
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
## Scanners.
################################################################################

CREATE TABLE IF NOT EXISTS scanners (
  id          INT         NOT NULL AUTO_INCREMENT,
  uid         VARCHAR(30) NOT NULL,
  description VARCHAR(300),
  commands    VARCHAR(1000) NOT NULL,
  PRIMARY KEY pk_scanners(id),
  UNIQUE uq_scanners_uid(uid)
);

$$

CREATE TABLE IF NOT EXISTS scanner_commands (
  id      INT NOT NULL AUTO_INCREMENT,
  command VARCHAR(50),
  scanner INT NOT NULL,
  PRIMARY KEY pk_scanner_commands(id),
  FOREIGN KEY fk_scanner_commands_scanners(scanner) REFERENCES scanners(id)
);

$$

# Commands is a comma separated list.
# Must end with a comma.
CREATE PROCEDURE createScanner(
  uid         VARCHAR(30),
  description VARCHAR(300),
  commands    VARCHAR(1000)
)
  BEGIN
    DECLARE scanner_id INT DEFAULT NULL;
    DECLARE i INT DEFAULT 1;
    DECLARE last_occurrence INT DEFAULT 1;

    INSERT INTO scanners(uid, description, commands)
    VALUES (uid, description, SUBSTRING(commands, 1, CHAR_LENGTH(commands)-1));

    SELECT LAST_INSERT_ID()
    INTO scanner_id;

    indefinite_loop: WHILE i > 0 DO
      SELECT LOCATE(',', commands, i+1)
      INTO i;

      IF i=0 THEN
        LEAVE indefinite_loop;
      END IF;

      # 'PERMIT,DENY,'
      INSERT INTO scanner_commands(command, scanner)
      VALUES (SUBSTRING(commands, last_occurrence, i-last_occurrence), 
              scanner_id);

      SELECT i+1
      INTO last_occurrence;
    END WHILE indefinite_loop;
  END

$$

CREATE PROCEDURE updateScanner(
  scanner_id  INT,
  uid         VARCHAR(30),
  description VARCHAR(300),
  commands    VARCHAR(1000)
)
  BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE last_occurrence INT DEFAULT 1;

    UPDATE scanners 
    SET scanners.uid = uid, 
        scanners.description = description,
        scanners.commands = SUBSTRING(commands, 1, CHAR_LENGTH(commands)-1)
    WHERE scanners.id = scanner_id;

    DELETE FROM scanner_commands
    WHERE scanner_commands.scanner = scanner_id;

    indefinite_loop: WHILE i > 0 DO
      SELECT LOCATE(',', commands, i+1)
      INTO i;

      IF i=0 THEN
        LEAVE indefinite_loop;
      END IF;

      INSERT INTO scanner_commands(command, scanner)
      VALUES (SUBSTRING(commands, last_occurrence, i-last_occurrence), 
              scanner_id);

      SELECT i+1
      INTO last_occurrence;
    END WHILE indefinite_loop;
  END

$$

################################################################################
## User scanner commands access rules
################################################################################

# If week_day is set then date should be null and vice versa.
# If a day and a date is needed, add another row to the table.
# week_day
#   0-Monday, 
#   1-Tuesday, 
#   2-Wednesday, 
#   3-Thursday, 
#   4-Friday, 
#   5-Saturday, 
#   6-Sunday
# time_start - The day time when this rules starts.
# time_end - The day time when this rule ends.
# Times must be in the range 00:00:00 - 23:59:59, start and end inclusive.

CREATE TABLE IF NOT EXISTS user_scanner_rules (
  id                       BIGINT NOT NULL AUTO_INCREMENT,
  user                     BIGINT NOT NULL,
  scanner                  INT    NOT NULL,
  response_scanner_command INT    NOT NULL,
  week_day                 INT             DEFAULT NULL,
  time_start               TIME,
  time_end                 TIME,
  valid_from               DATE,
  valid_to                 DATE,

  PRIMARY KEY pk_user_scanner_rules(id),

  FOREIGN KEY fk_user_scanner_rules_users(user)
  REFERENCES users (id),

  FOREIGN KEY fk_user_scanner_rules_scanners(scanner)
  REFERENCES scanners (id),

  FOREIGN KEY fk_user_scanner_rules_scanner_commands(response_scanner_command)
  REFERENCES scanner_commands (id)
);

$$

CREATE PROCEDURE createUserDayOfWeekScanRule(
  user_id                     BIGINT,
  scanner_id                  INT,
  week_day                    INT,
  time_start                  TIME,
  time_end                    TIME,
  response_scanner_command_id INT,
  valid_from                  DATE,
  valid_to                    DATE
)
  BEGIN
    INSERT INTO user_scanner_rules (user,
                                    scanner,
                                    week_day,
                                    time_start,
                                    time_end,
                                    response_scanner_command,
                                    valid_from,
                                    valid_to)
    VALUES (user_id,
            scanner_id,
            week_day,
            time_start,
            time_end,
            response_scanner_command_id,
            valid_from,
            valid_to);
  END

$$

CREATE PROCEDURE createUserDateScanRule(
  user_id                     BIGINT,
  scanner_id                  INT,
  date                        DATE,
  time_start                  TIME,
  time_end                    TIME,
  response_scanner_command_id INT
)
  BEGIN
    INSERT INTO user_scanner_rules (user,
                                    scanner,
                                    time_start,
                                    time_end,
                                    response_scanner_command,
                                    valid_from,
                                    valid_to)
    VALUES (user_id,
            scanner_id,
            time_start,
            time_end,
            response_scanner_command_id,
            date,
            date);
  END

$$

CREATE VIEW user_scanner_rules_all
AS
  SELECT
    users.id                         AS user_id,
    users.username                   AS user_username,
    users.password                   AS user_password,
    scanners.id                      AS scanner_id,
    scanners.uid                     AS scanner_uid,
    scanners.description             AS scanner_description,
    scanner_commands.id              AS scanner_command_id,
    scanner_commands.command         AS scanner_command,
    user_scanner_rules.id            AS user_scanner_rule_id,
    user_scanner_rules.week_day      AS user_scanner_rule_week_day,
    user_scanner_rules.time_start    AS user_scanner_rule_time_start,
    user_scanner_rules.time_end      AS user_scanner_rule_time_end,
    user_scanner_rules.valid_from    AS user_scanner_rules_valid_from,
    user_scanner_rules.valid_to      AS user_scanner_rules_valid_to
  FROM users
    JOIN user_scanner_rules
      ON user_scanner_rules.user = users.id
    JOIN scanners
      ON user_scanner_rules.scanner = scanners.id
    JOIN scanner_commands
      ON user_scanner_rules.response_scanner_command = scanner_commands.id;

$$

# There is no need to have a modify for a rule.
# One rule will be revoke before another is given.

CREATE PROCEDURE deleteUserScannerRule(
  user_scanner_rule_id BIGINT
)
  BEGIN
    DELETE FROM user_scanner_rules
    WHERE id = user_scanner_rule_id;
  END

$$

################################################################################
## Users NFC/RFID scan times.
################################################################################

CREATE TABLE IF NOT EXISTS user_scan_times (
  id        BIGINT    NOT NULL AUTO_INCREMENT,
  user      BIGINT    NOT NULL,
  scanner   INT       NOT NULL,
  command   INT       NOT NULL,
  timestamp TIMESTAMP                          DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY pk_user_scan_times(id),

  FOREIGN KEY fk_user_scan_times_users(user)
  REFERENCES users (id),

  FOREIGN KEY fk_user_scan_times_scanners(scanner)
  REFERENCES scanners (id),

  FOREIGN KEY fk_user_scan_times_scanner_commands(command)
  REFERENCES scanner_commands (id)
);

$$
