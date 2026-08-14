// pb_migrations/fix_auth_timestamps.js
// The auth `users` collection was created by init_collections.js without
// created/updated — same gap as the base collections, fixed for type "auth".
migrate((app) => {
  for (const collection of app.findAllCollections()) {
    if (collection.type !== "auth") {
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
