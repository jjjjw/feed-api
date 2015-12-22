CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  name varchar(80) NOT NULL UNIQUE,
  user_id integer REFERENCES users
);
