CREATE TABLE users (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE groups_table (
  group_id    INT AUTO_INCREMENT PRIMARY KEY,
  group_name  VARCHAR(100) NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- bridge: which users are in which groups
CREATE TABLE group_members (
  group_id INT NOT NULL,
  user_id  INT NOT NULL,
  role     ENUM('member', 'admin') DEFAULT 'member',
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id, user_id),
  FOREIGN KEY (group_id) REFERENCES groups_table(group_id),
  FOREIGN KEY (user_id)  REFERENCES users(user_id)
);

CREATE TABLE expenses (
  expense_id INT AUTO_INCREMENT PRIMARY KEY,
  group_id   INT NOT NULL,
  payer_id   INT NOT NULL,
  date       DATE NOT NULL,
  category   VARCHAR(50),
  description VARCHAR(255),
  cost       DECIMAL(10,2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups_table(group_id),
  FOREIGN KEY (payer_id) REFERENCES users(user_id)
);

-- bridge between expense & user
CREATE TABLE expense_splits (
  expense_id INT NOT NULL,
  user_id    INT NOT NULL,
  share_type ENUM('equal', 'percentage', 'exact') DEFAULT 'equal',
  percentage DECIMAL(5,2) NULL,
  amount     DECIMAL(10,2) NULL,
  PRIMARY KEY (expense_id, user_id),
  FOREIGN KEY (expense_id) REFERENCES expenses(expense_id),
  FOREIGN KEY (user_id)    REFERENCES users(user_id)
);

CREATE TABLE settlements (
  settlement_id INT AUTO_INCREMENT PRIMARY KEY,
  group_id      INT NOT NULL,
  payer_id      INT NOT NULL,
  payee_id      INT NOT NULL,
  amount        DECIMAL(10,2) NOT NULL,
  date          DATE NOT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups_table(group_id),
  FOREIGN KEY (payer_id) REFERENCES users(user_id),
  FOREIGN KEY (payee_id) REFERENCES users(user_id)
);
