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
  (3, 'User');

$$

CREATE TABLE IF NOT EXISTS users (
  id       BIGINT       NOT NULL AUTO_INCREMENT,
  username VARCHAR(50)  NOT NULL,
  password VARCHAR(512) NOT NULL,
  role     INT          NOT NULL,
  token    VARCHAR(512)          DEFAULT NULL,
  PRIMARY KEY pk_users(id),
  FOREIGN KEY fk_users_roles(role) REFERENCES roles (id)
);

$$

CREATE TABLE IF NOT EXISTS tags (
  id   BIGINT      NOT NULL AUTO_INCREMENT,
  uid  VARCHAR(30) NOT NULL,
  user BIGINT,
  PRIMARY KEY pk_tags(id),
  UNIQUE uq_tags_user(user),
  FOREIGN KEY fk_tags_users(user) REFERENCES users (id)
    ON DELETE SET NULL
);

$$

################################################################################
## Scanners.
################################################################################

CREATE TABLE IF NOT EXISTS scanners (
  id          BIGINT      NOT NULL AUTO_INCREMENT,
  uid         VARCHAR(30) NOT NULL,
  description VARCHAR(300),
  PRIMARY KEY pk_scanners(id),
  UNIQUE uq_scanners_uid(uid)
);

$$

################################################################################
## User scan rules
################################################################################

# time_start - The day time when this rules starts.
# time_end - The day time when this rule ends.
# Times must be in the range 00:00:00 - 23:59:59, start and end inclusive.
# is_request = 0 if it is a scan rule
# is_request = 1 if it is a scan rule request

CREATE TABLE IF NOT EXISTS user_scan_rules (
  id         BIGINT NOT NULL         AUTO_INCREMENT,
  user       BIGINT NOT NULL,
  scanner    BIGINT NOT NULL,
  start_time TIME   NOT NULL,
  end_time   TIME   NOT NULL,
  start_date DATE   NOT NULL,
  end_date   DATE   NOT NULL,
  is_request INT    NOT NULL,

  PRIMARY KEY pk_user_scan_rules(id),

  FOREIGN KEY fk_user_scan_rules_users(user)
  REFERENCES users (id),

  FOREIGN KEY fk_user_scan_rules_scanners(scanner)
  REFERENCES scanners (id)
);

$$

#   1-Sunday,
#   2-Monday,
#   3-Tuesday,
#   4-Wednesday,
#   5-Thursday,
#   6-Friday,
#   7-Saturday
CREATE TABLE IF NOT EXISTS user_scan_rule_days (
  id             BIGINT NOT NULL         AUTO_INCREMENT,
  user_scan_rule BIGINT NOT NULL,
  day_of_week    INT    NOT NULL,

  PRIMARY KEY pk_user_scan_rule_days(id),

  FOREIGN KEY fk_user_scan_rule_days_user_scan_rule(user_scan_rule)
  REFERENCES user_scan_rules (id)
    ON DELETE CASCADE
);

$$

################################################################################
## Users NFC/RFID scan times.
################################################################################

CREATE TABLE IF NOT EXISTS user_scan_times (
  id               BIGINT       NOT NULL AUTO_INCREMENT,
  user             BIGINT       NOT NULL,
  scanner          BIGINT       NOT NULL,
  response_command VARCHAR(100) NOT NULL,
  scan_timestamp   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY pk_user_scan_times(id),

  FOREIGN KEY fk_user_scan_times_users(user)
  REFERENCES users (id),

  FOREIGN KEY fk_user_scan_times_scanners(scanner)
  REFERENCES scanners (id)
);

$$
