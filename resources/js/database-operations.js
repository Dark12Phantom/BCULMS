async function saveDB(source = "") {
  const fullDbPath = `${dbPath}/${dbFile}`.replace(/\\/g, "/");

  try {
    await Neutralino.filesystem.getStats(dbPath.replace(/\\/g, "/"));
  } catch (e) {
    console.log("Directory does not exist, creating:", dbPath);
    try {
      await Neutralino.filesystem.createDirectory(dbPath.replace(/\\/g, "/"));
    } catch (createErr) {
      console.error("Failed to create directory:", createErr);
      return;
    }
  }

  const dbData = db.export();
  console.log(`Attempting to save DB [${source}]:`, fullDbPath);
  console.log("Data size:", dbData.byteLength, "bytes");

  const saveAttempts = [
    () => Neutralino.filesystem.writeBinaryFile(fullDbPath, dbData),

    () =>
      Neutralino.filesystem.writeBinaryFile({ path: fullDbPath, data: dbData }),

    () =>
      Neutralino.filesystem.writeBinaryFile({
        directory: dbPath.replace(/\\/g, "/"),
        fileName: dbFile,
        data: dbData,
      }),
  ];

  for (let i = 0; i < saveAttempts.length; i++) {
    try {
      console.log(`Trying save method ${i + 1}...`);
      await saveAttempts[i]();
      console.log(
        `${dbFile} [source: ${source}] saved successfully using method ${i + 1}`
      );
      return;
    } catch (err) {
      console.error(`Save method ${i + 1} failed:`, err);
    }
  }

  console.error("All save methods failed");
}

async function insertDB(operation, table, data, whereClause = null) {

  try {
    let result;
    let hasChanges = false;

    switch (operation.toLowerCase()) {
      case "insert":
        result = await handleInsert(table, data);
        const idResult = await Neutralino.os.execCommand(
          `sqlite3 "${DB_PATH}" "SELECT last_insert_rowid();"`
        );
        const lastId = parseInt(idResult.stdOut.trim(), 10);

        result.lastId = lastId || null;
        hasChanges = result.changes > 0;
        break;

      case "update":
        if (!whereClause) {
          throw new Error("UPDATE operation requires whereClause parameter");
        }
        result = await handleUpdate(table, data, whereClause);
        hasChanges = result.changes > 0;
        break;

      case "delete":
        if (!whereClause) {
          throw new Error("DELETE operation requires whereClause parameter");
        }
        result = await handleDelete(table, whereClause);
        hasChanges = result.changes > 0;
        break;

      case "select":
        result = await handleSelect(table, data, whereClause);
        hasChanges = false;
        break;

      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }

    if (hasChanges) {
      await updateDB(`${operation} ${table}`, result);
    }

    return result;
  } catch (error) {
    console.error(`insertDB error: ${operation} on ${table}:`, error);
    throw error;
  }
}

async function updateDB(source = "manual update", operationResult = null) {
  console.log(`updateDB called from: ${source}`);

  try {
    if (operationResult) {
      console.log(`Operation result:`, {
        changes: operationResult.changes || 0,
        lastInsertRowid: operationResult.lastInsertRowid || null,
        rowsAffected: operationResult.changes || 0,
      });
    }

    if (!operationResult || operationResult.changes > 0) {
      await saveDB(source);
      console.log(`Database updated and saved: ${source}`);
      return true;
    } else {
      console.log(`No changes to save: ${source}`);
      return false;
    }
  } catch (error) {
    console.error(`updateDB error from ${source}:`, error);
    throw error;
  }
}

async function handleInsert(table, data) {
  if (!data || typeof data !== "object") {
    throw new Error("Insert data must be an object");
  }

  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = values.map(() => "?").join(", ");

  const query = `INSERT INTO ${table} (${columns.join(
    ", "
  )}) VALUES (${placeholders})`;

  console.log(`Executing INSERT:`, query, values);

  try {
    const stmt = db.prepare(query);
    stmt.run(values);
    stmt.free();

    // Fetch the last inserted ID properly
    const result = db.exec("SELECT last_insert_rowid() AS id;");
    const lastInsertRowid = result?.[0]?.values?.[0]?.[0] ?? null;

    return {
      changes: db.getRowsModified(),
      lastInsertRowid,
    };
  } catch (error) {
    console.error("INSERT error:", error);
    throw error;
  }
}
async function handleUpdate(table, data, whereClause) {
  if (!data || typeof data !== "object") {
    throw new Error("Update data must be an object");
  }

  if (!whereClause || typeof whereClause !== "object") {
    throw new Error("WHERE clause must be an object");
  }

  const setColumns = Object.keys(data);
  const setValues = Object.values(data);
  const whereColumns = Object.keys(whereClause);
  const whereValues = Object.values(whereClause);

  const setClause = setColumns.map((col) => `${col} = ?`).join(", ");
  const whereCondition = whereColumns.map((col) => `${col} = ?`).join(" AND ");

  const query = `UPDATE ${table} SET ${setClause} WHERE ${whereCondition}`;
  const allValues = [...setValues, ...whereValues];

  console.log(`Executing UPDATE:`, query, allValues);

  try {
    const stmt = db.prepare(query);
    stmt.run(allValues);

    const result = {
      changes: db.getRowsModified(),
    };

    stmt.free();
    return result;
  } catch (error) {
    console.error("UPDATE error:", error);
    throw error;
  }
}

async function handleDelete(table, whereClause) {
  if (!whereClause || typeof whereClause !== "object") {
    throw new Error("WHERE clause must be an object");
  }

  const whereColumns = Object.keys(whereClause);
  const whereValues = Object.values(whereClause);
  const whereCondition = whereColumns.map((col) => `${col} = ?`).join(" AND ");

  const query = `DELETE FROM ${table} WHERE ${whereCondition}`;

  console.log(`Executing DELETE:`, query, whereValues);

  try {
    const stmt = db.prepare(query);
    stmt.run(whereValues);

    const result = {
      changes: db.getRowsModified(),
    };

    stmt.free();
    return result;
  } catch (error) {
    console.error("DELETE error:", error);
    throw error;
  }
}

async function handleSelect(table, columns = "*", whereClause = null) {
  let query;
  let values = [];

  if (Array.isArray(columns)) {
    query = `SELECT ${columns.join(", ")} FROM ${table}`;
  } else if (typeof columns === "string") {
    query = `SELECT ${columns} FROM ${table}`;
  } else if (columns === null || columns === undefined) {
    query = `SELECT * FROM ${table}`;
  } else {
    query = `SELECT * FROM ${table}`;
  }

  if (whereClause && typeof whereClause === "object") {
    const whereColumns = Object.keys(whereClause);
    const whereValues = Object.values(whereClause);
    const whereCondition = whereColumns
      .map((col) => `${col} = ?`)
      .join(" AND ");

    query += ` WHERE ${whereCondition}`;
    values = whereValues;
  }

  try {
    const stmt = db.prepare(query);
    const results = [];

    if (values.length > 0) {
      stmt.bind(values);
    }

    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }

    stmt.free();

    return {
      data: results,
      count: results.length,
      changes: 0,
    };
  } catch (error) {
    console.error("SELECT error:", error);
    throw error;
  }
}