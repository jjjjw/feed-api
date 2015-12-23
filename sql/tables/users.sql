CREATE TYPE role AS ENUM ('user', 'admin', 'anonymous');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email varchar(80) NOT NULL UNIQUE,
  password varchar(80),
  role role DEAFULT 'user'
);
