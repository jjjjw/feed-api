CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  slug varchar(80) NOT NULL UNIQUE,
  name varchar(80) NOT NULL UNIQUE,
  user_default BOOL NOT NULL DEFAULT FALSE,
  user_id integer REFERENCES users
);
