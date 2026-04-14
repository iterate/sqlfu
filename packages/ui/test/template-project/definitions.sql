create table posts (
  id integer primary key,
  slug text not null unique,
  title text not null,
  body text not null,
  published integer not null
);

create view post_cards as
select id, slug, title, published
from posts;
