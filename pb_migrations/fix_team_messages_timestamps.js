// pb_migrations/fix_team_messages_timestamps.js
// fix_system_timestamps.js ran before add_team_messages.js created the
// collection (migrations apply once, in filename order), so team_messages
// shipped without created/updated and every thread fetch 400s with
// `invalid sort field "created"`. Same idempotent backfill, fresh migration:
// any base collection still missing the timestamps gets them now.
migrate((app) => {
  for (const collection of app.findAllCollections()) {
    if (collection.type !== "base") {
      continue;
    }
    const names = collection.fields.map((f) => f.name);
    let changed = false;

    if (!names.includes("created")) {
      collection.fields.add(
        new AutodateField({
          name: "created",
          system: true,
          hidden: false,
          onCreate: true,
        })
      );
      changed = true;
    }
    if (!names.includes("updated")) {
      collection.fields.add(
        new AutodateField({
          name: "updated",
          system: true,
          hidden: false,
          onUpdate: true,
        })
      );
      changed = true;
    }

    if (changed) {
      app.save(collection);
    }
  }
});
