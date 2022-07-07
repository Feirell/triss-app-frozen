exports.AliasMap = class AliasMap {
    constructor() {
      this.originalToAlias = new Map();
      this.aliasToOriginal = new Map();
    }

    hasOriginal(original) {
      return this.originalToAlias.has(original);
    }

    hasAlias(alias) {
      return this.aliasToOriginal.has(alias);
    }

    getOriginal(alias) {
      if (!this.hasAlias(alias))
        throw new Error("No original registered for alias " + alias);

      return this.aliasToOriginal.get(alias);
    }

    getAliases(original) {
      if (!this.hasOriginal(original))
        throw new Error("No aliases registered for original " + original);

      return this.originalToAlias.get(original).slice();
    }

    assignAlias(original, alias) {
      if (this.hasAlias(alias)) {
        const existingOriginal = this.getOriginal(alias);
        if (existingOriginal === original)
          return false;
        else
          throw new Error("Tried to register the alias " + alias + " for the original " + original + " which is already in use by the original " + existingOriginal);
      }

      const existingAlias = this.hasOriginal(original) ?
        this.getAliases(original) : [];

      this.originalToAlias.set(original, [...existingAlias, alias]);
      this.aliasToOriginal.set(alias, original);
      return true;
    }

    allAliases() {
      return this.aliasToOriginal.keys();
    }
  }
