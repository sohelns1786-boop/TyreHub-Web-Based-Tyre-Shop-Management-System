const fs = require('fs');
const path = require('path');

class MockQuery {
  constructor(promise) {
    this.promise = promise;
  }
  then(onfulfilled, onrejected) {
    return this.promise.then(onfulfilled, onrejected);
  }
  catch(onrejected) {
    return this.promise.catch(onrejected);
  }
  select() {
    return this;
  }
  sort(sortObj) {
    if (sortObj) {
      const key = Object.keys(sortObj)[0];
      const order = sortObj[key];
      this.promise = this.promise.then(data => {
        if (!Array.isArray(data)) return data;
        return [...data].sort((a, b) => {
          let valA = a[key];
          let valB = b[key];
          if (typeof valA === 'string') {
            return valA.localeCompare(valB) * order;
          }
          if (valA < valB) return -1 * order;
          if (valA > valB) return 1 * order;
          return 0;
        });
      });
    }
    return this;
  }
  limit(n) {
    this.promise = this.promise.then(data => {
      if (!Array.isArray(data)) return data;
      return data.slice(0, n);
    });
    return this;
  }
}

class MockModel {
  constructor(name, defaultData = []) {
    this.name = name;
    this.filePath = path.join(__dirname, '..', 'data', `${name.toLowerCase()}s.json`);
    this.defaultData = defaultData;
    this._ensureFileExists();
  }

  _ensureFileExists() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify(this.defaultData, null, 2));
    }
  }

  _read() {
    this._ensureFileExists();
    try {
      return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
    } catch (e) {
      return [];
    }
  }

  _write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  _wrapDoc(doc) {
    if (!doc) return null;
    const model = this;
    const wrappedDoc = {
      ...doc,
      save: async function() {
        const data = model._read();
        const idx = data.findIndex(item => String(item._id) === String(doc._id));
        if (idx !== -1) {
          const { save, remove, ...docFields } = this;
          data[idx] = { ...docFields, updatedAt: new Date().toISOString() };
          model._write(data);
        }
        return this;
      },
      remove: async function() {
        const data = model._read();
        const filtered = data.filter(item => String(item._id) !== String(doc._id));
        model._write(filtered);
        return this;
      }
    };
    return wrappedDoc;
  }

  find(filters = {}) {
    let data = this._read();
    
    const filtered = data.filter(item => {
      for (let key in filters) {
        const filterVal = filters[key];
        
        if (key === '$or' && Array.isArray(filterVal)) {
          const matchOr = filterVal.some(orFilter => {
            for (let subKey in orFilter) {
              const regexInfo = orFilter[subKey];
              if (regexInfo && regexInfo.$regex) {
                const searchStr = regexInfo.$regex;
                if (item[subKey] && String(item[subKey]).toLowerCase().includes(searchStr.toLowerCase())) {
                  return true;
                }
              }
            }
            return false;
          });
          if (!matchOr) return false;
          continue;
        }

        if (filterVal && typeof filterVal === 'object') {
          if (filterVal.$gte !== undefined && item[key] < filterVal.$gte) return false;
          if (filterVal.$lte !== undefined && item[key] > filterVal.$lte) return false;
          continue;
        }

        if (item[key] !== filterVal) {
          return false;
        }
      }
      return true;
    });

    const docs = filtered.map(item => this._wrapDoc(item));
    return new MockQuery(Promise.resolve(docs));
  }

  findOne(filters = {}) {
    const p = this.find(filters).promise.then(docs => docs[0] || null);
    return new MockQuery(p);
  }

  findById(id) {
    const p = Promise.resolve().then(() => {
      const data = this._read();
      const found = data.find(item => String(item._id) === String(id));
      return this._wrapDoc(found);
    });
    return new MockQuery(p);
  }

  async create(obj) {
    const data = this._read();
    const newDoc = {
      _id: Math.random().toString(36).substring(2, 9),
      ...obj,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.push(newDoc);
    this._write(data);
    return this._wrapDoc(newDoc);
  }

  async countDocuments(filters = {}) {
    const docs = await this.find(filters).promise;
    return docs.length;
  }

  async distinct(field) {
    const data = this._read();
    const values = data.map(item => item[field]).filter(val => val !== undefined && val !== null);
    return [...new Set(values)];
  }

  async deleteMany() {
    this._write([]);
    return { deletedCount: 0 };
  }

  async insertMany(arr) {
    const data = this._read();
    const added = arr.map(item => ({
      _id: Math.random().toString(36).substring(2, 9),
      ...item,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    data.push(...added);
    this._write(data);
    return added.map(item => this._wrapDoc(item));
  }
}

module.exports = MockModel;
