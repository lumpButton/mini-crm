import { useState, type FormEvent } from "react";
import { Button, Group, Modal, Stack, TextInput } from "@mantine/core";
import { supabase } from "../lib/supabaseClient";
import { notifyError } from "../lib/errors";

type ObjectFields = { id: string; name: string; address: string };

type Props = {
  opened: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: ObjectFields;
};

export function ObjectFormModal({ opened, onClose, onSaved, initial }: Props) {
  return (
    <Modal opened={opened} onClose={onClose} title={initial ? "Редактировать объект" : "Новый объект"}>
      {/* Remount the form on every open so it starts from the current values. */}
      {opened && <ObjectForm initial={initial} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

function ObjectForm({ initial, onClose, onSaved }: Omit<Props, "opened">) {
  const [name, setName] = useState(initial?.name ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [saving, setSaving] = useState(false);

  const canSubmit = name.trim() !== "" && address.trim() !== "";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    const fields = { name: name.trim(), address: address.trim() };
    const { error } = initial
      ? await supabase.from("objects").update(fields).eq("id", initial.id)
      : await supabase.from("objects").insert(fields);
    setSaving(false);
    if (error) {
      notifyError(error);
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        <TextInput
          label="Название"
          required
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          data-autofocus
        />
        <TextInput
          label="Адрес"
          required
          value={address}
          onChange={(e) => setAddress(e.currentTarget.value)}
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
