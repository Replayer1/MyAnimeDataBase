const path = require("path");
const express = require("express");
const { createStore } = require("./store");
const { fetchExternalShikiItem } = require("./external-source");

const PORT = Number.parseInt(process.env.PORT || "3000", 10);

function sendError(res, statusCode, message, code = "SERVER_ERROR") {
  res.status(statusCode).json({ error: message, code });
}

function getErrorStatus(error, fallback = 500) {
  if (Number.isInteger(error?.statusCode) && error.statusCode > 0) {
    return error.statusCode;
  }

  return fallback;
}

async function startServer() {
  const rootDir = path.resolve(__dirname, "..");
  const dbPath = path.join(rootDir, "data", "app.db");
  const seedSources = [
    { path: path.join(rootDir, "db", "anime-data.json"), mediaType: "anime" },
    { path: path.join(rootDir, "db", "manga-data.json"), mediaType: "manga" },
  ];

  const store = await createStore({ dbPath, seedSources });

  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get(["/api/items", "/items"], async (req, res) => {
    try {
      const payload = await store.listItems(req.query || {});
      res.json(payload);
    } catch (error) {
      sendError(
        res,
        getErrorStatus(error, 500),
        error.message || "Failed to list items",
        error.code,
      );
    }
  });

  app.get(["/api/items/:id", "/items/:id"], async (req, res) => {
    try {
      const item = await store.getItemById(req.params.id);
      if (!item) {
        sendError(res, 404, "Item not found", "ITEM_NOT_FOUND");
        return;
      }

      res.json(item);
    } catch (error) {
      sendError(
        res,
        getErrorStatus(error, 500),
        error.message || "Failed to get item",
        error.code,
      );
    }
  });

  app.post(["/api/items", "/items"], async (req, res) => {
    try {
      const created = await store.createItem(req.body || {});
      res.status(201).json(created);
    } catch (error) {
      sendError(
        res,
        getErrorStatus(error, 500),
        error.message || "Failed to create item",
        error.code,
      );
    }
  });

  app.put(["/api/items/:id", "/items/:id"], async (req, res) => {
    try {
      const updated = await store.updateItem(req.params.id, req.body || {});
      if (!updated) {
        sendError(res, 404, "Item not found", "ITEM_NOT_FOUND");
        return;
      }

      res.json(updated);
    } catch (error) {
      sendError(
        res,
        getErrorStatus(error, 500),
        error.message || "Failed to update item",
        error.code,
      );
    }
  });

  app.delete(["/api/items/:id", "/items/:id"], async (req, res) => {
    try {
      const deleted = await store.deleteItem(req.params.id, req.body || {});
      if (!deleted) {
        sendError(res, 404, "Item not found", "ITEM_NOT_FOUND");
        return;
      }

      res.status(204).send();
    } catch (error) {
      sendError(
        res,
        getErrorStatus(error, 500),
        error.message || "Failed to delete item",
        error.code,
      );
    }
  });

  app.get(["/api/change-log", "/change-log"], async (req, res) => {
    try {
      const payload = await store.listChangeLog(req.query || {});
      res.json(payload);
    } catch (error) {
      sendError(
        res,
        getErrorStatus(error, 500),
        error.message || "Failed to get change log",
        error.code,
      );
    }
  });

  app.get(["/api/external/shiki", "/external/shiki"], async (req, res) => {
    try {
      const source = String(req.query?.source || "").trim();
      const mediaTypeHint = String(req.query?.media_type || "").trim();

      if (!source) {
        sendError(res, 400, "source query param is required", "SOURCE_REQUIRED");
        return;
      }

      const item = await fetchExternalShikiItem({
        source,
        mediaTypeHint,
      });

      res.json(item);
    } catch (error) {
      sendError(
        res,
        getErrorStatus(error, 502),
        error.message || "Failed to fetch external source",
        error.code,
      );
    }
  });

  app.use(express.static(rootDir));

  app.get("*", (req, res) => {
    res.sendFile(path.join(rootDir, "index.html"));
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
