// pb_migrations/fix_system_timestamps.js
// PB 0.25 system fields (id/created/updated) are explicit AutodateFields in the
// collection schema. The original init_collections.js predates that and created
// every collection WITHOUT created/updated — which broke `sort=-created` on the
// matches inbox (400 "invalid sort field"). This migration backfills the two
// timestamp fields on every base collection that lacks them, so the API rules
// and client sorts behave exactly as documented in §8.
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
