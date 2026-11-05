import { useState, type FormEvent } from "react";
import { Button, Group, Modal, Select, Stack, TextInput, Textarea } from "@mantine/core";
import { supabase } from "../lib/supabaseClient";
import { notifyError } from "../lib/errors";
import { useLoader } from "../lib/useLoader";
import { PageState } from "./PageState";

type TaskFields = {
  id: string;
  title: string;
  description: string;
  object_id: string;
  assignee_id: string;
};

type Props = {
  opened: boolean;
  onClose: () => void;
  onSaved: (taskId: string) => void;
  initial?: TaskFields;
  defaultObjectId?: string;
};

export function TaskFormModal({ opened, onClose, onSaved, initial, defaultObjectId }: Props) {
  return (
    <Modal opened={opened} onClose={onClose} title={initial ? "Редактировать задачу" : "Новая задача"} size="lg">
      {opened && (
        <TaskForm initial={initial} defaultObjectId={defaultObjectId} onClose={onClose} onSaved={onSaved} />
      )}
    </Modal>
  );
}

async function loadOptions() {
  const [executors, objects] = await Promise.all([
    supabase.from("profiles").select("id, display_name").eq("role", "executor").order("display_name"),
    supabase.from("objects").select("id, name").order("name"),
  ]);
  if (executors.error) throw executors.error;
  if (objects.error) throw objects.error;
  return {
    executors: executors.data.map((p) => ({ value: p.id, label: p.display_name })),
    objects: objects.data.map((o) => ({ value: o.id, label: o.name })),
  };
}

function TaskForm({ initial, defaultObjectId, onClose, onSaved }: Omit<Props, "opened">) {
  const options = useLoader(loadOptions, []);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [objectId, setObjectId] = useState<string | null>(initial?.object_id ?? defaultObjectId ?? null);
  const [assigneeId, setAssigneeId] = useState<string | null>(initial?.assignee_id ?? null);
  const [saving, setSaving] = useState(false);

  if (!options.data) {
    return <PageState loading={options.loading} error={options.error} />;
  }

  const canSubmit = title.trim() !== "" && objectId !== null && assigneeId !== null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit || !objectId || !assigneeId) return;
    setSaving(true);
    // Only the columns the API role may write: status, author_id and created_at come from the database.
    const fields = {
      title: title.trim(),
      description: description.trim(),
      object_id: objectId,
      assignee_id: assigneeId,
    };
    const result = initial
      ? await supabase.from("tasks").update(fields).eq("id", initial.id).select("id").single()
      : await supabase.from("tasks").insert(fields).select("id").single();
    setSaving(false);
    if (result.error) {
      notifyError(result.error);
      return;
    }
    onSaved(result.data.id);
    onClose();
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        <TextInput
          label="Название"
          required
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          data-autofocus
        />
        <Textarea
          label="Описание"
          autosize
          minRows={3}
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
        />
        <Select
          label="Объект"
          required
          data={options.data.objects}
          value={objectId}
          onChange={setObjectId}
          searchable
        />
        <Select
          label="Исполнитель"
          required
          data={options.data.executors}
          value={assigneeId}
          onChange={setAssigneeId}
          searchable
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" loading={saving} disabled={!canSubmit}>
            Сохранить
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
