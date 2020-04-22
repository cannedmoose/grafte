// TODO(P1) MAKE NICER
// HACKEY HACKEY HACK!!!!
export class Deserializer {
  deserializers: Map<string, ((raw: { type: string }) => any)>;
  constructor() {
    this.deserializers = new Map();
    this.deserialize = this.deserialize.bind(this);
  }

  register(type: string, deserialize: ((raw: any, deserialize: ((raw: { type: string }) => any)) => any)) {
    this.deserializers.set(type, (raw: any) => {
      return deserialize(raw, this.deserialize)
    })
  }

  deserialize(raw: { type: string }): any {
    const t = this.deserializers.get(raw.type);
    if (!t) {
      throw "NO DESERIALIER FOR " + raw.type;
    }
    return t(raw);
  }
}