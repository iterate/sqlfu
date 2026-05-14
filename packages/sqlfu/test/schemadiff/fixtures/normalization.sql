-- default config: {"allowDestructive": true}

-- #region: double-quoted view literals keep semantic case changes visible
-- baseline:
create view labels as select "Alpha" as label;
-- desired:
create view labels as select "alpha" as label;
-- output:
drop view labels;
create view labels as select "alpha" as label;
-- #endregion

-- #region: double-quoted trigger literals keep semantic case changes visible
-- baseline:
create table labels(label text);
create trigger labels_insert after insert on labels begin
  insert into labels(label) values ("Alpha");
end;
-- desired:
create table labels(label text);
create trigger labels_insert after insert on labels begin
  insert into labels(label) values ("alpha");
end;
-- output:
drop trigger labels_insert;
create trigger labels_insert after insert on labels begin
insert into labels(label) values ("alpha");
end;
-- #endregion

-- #region: tokenizer-unknown valid SQLite keeps a visible view diff
-- baseline:
CREATE VIEW unicode_alias AS select 1 as café;
-- desired:
CREATE VIEW unicode_alias AS select 2 as café;
-- output:
drop view unicode_alias;
CREATE VIEW unicode_alias AS select 2 as café;
-- #endregion

-- #region: redundant view predicate parentheses are a documented false positive
-- baseline:
create table labels(label text);
create view alpha_labels as select label from labels where label = 'alpha';
-- desired:
create table labels(label text);
create view alpha_labels as select label from labels where (label = 'alpha');
-- output:
drop view alpha_labels;
create view alpha_labels as select label from labels where (label = 'alpha');
-- #endregion

-- #region: optional trigger for each row is a documented false positive
-- baseline:
create table labels(label text);
create trigger labels_insert after insert on labels begin
  select new.label;
end;
-- desired:
create table labels(label text);
create trigger labels_insert after insert on labels for each row begin
  select new.label;
end;
-- output:
drop trigger labels_insert;
create trigger labels_insert after insert on labels for each row begin
select new.label;
end;
-- #endregion

-- #region: single-table qualified view columns are a documented false positive
-- baseline:
create table labels(label text);
create view label_names as select label from labels;
-- desired:
create table labels(label text);
create view label_names as select labels.label from labels;
-- output:
drop view label_names;
create view label_names as select labels.label from labels;
-- #endregion
