CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email varchar(80) NOT NULL UNIQUE,
  password varchar(80)
);
