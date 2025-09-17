Neutralino.init();

class LibraryManager {
  constructor(SQL) {
    this.SQL = SQL;
    this.db = null;
  }

  async loadDatabase() {
    const file = await Neutralino.filesystem.readFile(
      "database/library.db3",
      "B"
    );
    console.log(file);
    const intArray = new Uint8Array(file);
    console.log(intArray.slice(0, 16));
    this.db = new this.SQL.Database(intArray);
    this.render();
  }
  render() {
    if (!this.db) return;
    const tables = this.db.exec(
      "SELECT name FROM sqlite_master WHERE type='table';"
    );
    console.log("Tables in DB:", tables);
  }
}

initSqlJs({
  locateFile: (file) => "../modules/sql-wasm.wasm",
}).then((SQL) => {
  window.app = new LibraryManager(SQL);
  app.loadDatabase();
});
