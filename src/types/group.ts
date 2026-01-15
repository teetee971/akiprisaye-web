export interface GroupEntry {
  groupe: string;
  indice: '🔴' | '🟠' | '🟢';
  ecart_moyen: string; // format: "+12%" or "-5%"
  territoires: string[];
}

// Example usage: import the JSON file and cast to `GroupEntry[]` or use a runtime JSON Schema validator (ajv) to validate at build/runtime.
