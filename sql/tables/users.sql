CREATE TYPE role AS ENUM ('user', 'admin', 'anonymous');

CREATE TABLE users (
  email varchar(80) NOT NULL UNIQUE,
  id SERIAL PRIMARY KEY,
  password varchar(80),
  role role DEFAULT 'user'
);
