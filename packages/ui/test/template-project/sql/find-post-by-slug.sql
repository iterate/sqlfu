select id, slug, title, published
from posts
where slug = :slug
limit 1;
