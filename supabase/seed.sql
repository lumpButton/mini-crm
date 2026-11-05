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

create or replace function pg_temp.seed_move(
    p_task_id uuid,
    p_user_id uuid,
    p_new_status public.task_status,
    p_comment text default null
)
returns void
language plpgsql
as $$
begin
    perform set_config(
        'request.jwt.claims',
        json_build_object('sub', p_user_id, 'role', 'authenticated')::text,
        true
    );
    perform public.change_task_status(p_task_id, p_new_status, p_comment);
end;
$$;

do $$
declare
    v_manager uuid;
    v_exec1 uuid;
    v_exec2 uuid;
    v_obj_north uuid;
    v_obj_meridian uuid;
    v_obj_east uuid;
    v_task uuid;
begin
    select id into v_manager from auth.users where email = 'manager@example.com';
    select id into v_exec1 from auth.users where email = 'executor1@example.com';
    select id into v_exec2 from auth.users where email = 'executor2@example.com';

    if v_manager is null or v_exec1 is null or v_exec2 is null then
        raise notice 'test users not found, skipping demo data';
        return;
    end if;

    if exists (select 1 from public.objects) then
        raise notice 'objects already exist, skipping demo data';
        return;
    end if;

    insert into public.objects (name, address, created_by)
    values ('ЖК «Северный»', 'ул. Ленина, 12', v_manager)
    returning id into v_obj_north;

    insert into public.objects (name, address, created_by)
    values ('БЦ «Меридиан»', 'пр. Мира, 45', v_manager)
    returning id into v_obj_meridian;

    insert into public.objects (name, address, created_by)
    values ('Склад «Восток»', 'Промышленная ул., 7', v_manager)
    returning id into v_obj_east;

    -- accepted
    insert into public.tasks (title, description, object_id, assignee_id, author_id)
    values ('Залить фундамент секции А', 'Бетон М300, уход за бетоном 7 дней.', v_obj_north, v_exec1, v_manager)
    returning id into v_task;
    perform pg_temp.seed_move(v_task, v_exec1, 'in_progress');
    perform pg_temp.seed_move(v_task, v_exec1, 'in_review');
    perform pg_temp.seed_move(v_task, v_manager, 'accepted');

    -- in_progress
    insert into public.tasks (title, description, object_id, assignee_id, author_id)
    values ('Смонтировать опалубку 2-го этажа', 'Щитовая опалубка, проверить вертикаль.', v_obj_north, v_exec1, v_manager)
    returning id into v_task;
    perform pg_temp.seed_move(v_task, v_exec1, 'in_progress');

    -- in_review
    insert into public.tasks (title, description, object_id, assignee_id, author_id)
    values ('Проверить армирование перекрытия', 'Шаг арматуры по проекту, фотоотчёт.', v_obj_north, v_exec2, v_manager)
    returning id into v_task;
    perform pg_temp.seed_move(v_task, v_exec2, 'in_progress');
    perform pg_temp.seed_move(v_task, v_exec2, 'in_review');

    -- rework
    insert into public.tasks (title, description, object_id, assignee_id, author_id)
    values ('Демонтировать перегородки 3-го этажа', 'Перегородки из ГКЛ, мусор вывезти.', v_obj_meridian, v_exec2, v_manager)
    returning id into v_task;
    perform pg_temp.seed_move(v_task, v_exec2, 'in_progress');
    perform pg_temp.seed_move(v_task, v_exec2, 'in_review');
    perform pg_temp.seed_move(v_task, v_manager, 'rework', 'В коридоре остался строительный мусор. Вывезти и сдать заново.');

    -- new
    insert into public.tasks (title, description, object_id, assignee_id, author_id)
    values ('Проложить кабель-каналы в серверной', 'Кабель-канал 100×60 по периметру.', v_obj_meridian, v_exec1, v_manager);

    -- rework -> in_progress
    insert into public.tasks (title, description, object_id, assignee_id, author_id)
    values ('Покрасить фасад со двора', 'Фасадная краска, два слоя.', v_obj_meridian, v_exec2, v_manager)
    returning id into v_task;
    perform pg_temp.seed_move(v_task, v_exec2, 'in_progress');
    perform pg_temp.seed_move(v_task, v_exec2, 'in_review');
    perform pg_temp.seed_move(v_task, v_manager, 'rework', 'Непрокрасы у водостока, перекрасить.');
    perform pg_temp.seed_move(v_task, v_exec2, 'in_progress');

    -- new
    insert into public.tasks (title, description, object_id, assignee_id, author_id)
    values ('Установить секционные ворота', 'Ворота 4×4 м с электроприводом.', v_obj_east, v_exec2, v_manager);

    perform set_config('request.jwt.claims', '', true);
end;
$$;

drop function pg_temp.seed_move(uuid, uuid, public.task_status, text);
