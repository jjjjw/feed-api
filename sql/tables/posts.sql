CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  content json,
  profile_id integer REFERENCES profiles
);
