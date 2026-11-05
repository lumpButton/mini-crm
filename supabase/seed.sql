insert into public.profiles (id, display_name, role)
select u.id, v.display_name, v.role::public.user_role
from (values
    ('manager@example.com',   'Иван Постановщик', 'manager'),
    ('executor1@example.com', 'Пётр Исполнитель', 'executor'),
    ('executor2@example.com', 'Анна Исполнитель', 'executor')
) as v(email, display_name, role)
join auth.users u on u.email = v.email
on conflict (id) do update
    set display_name = excluded.display_name,
        role         = excluded.role;
