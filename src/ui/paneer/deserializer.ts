interface Serialized {
  serialized: true,
  className: string,
  data: any
}

function isSerialized(data: any): data is Serialized {
  return data && data.serialized && data.className && data.data;
}

class SerializeHelper {
  deserializers: Map<string, (raw: any) => any>;
  serializers: Map<string, (raw: any) => any>;

  constructor() {
    this.deserializers = new Map();
    this.serializers = new Map();

    this.canSerialize = this.canSerialize.bind(this);
    this.register = this.register.bind(this);
    this.serialize = this.serialize.bind(this);
    this.deserialize = this.deserialize.bind(this);
  }
  
  register<T>(
    prototype: { new(...params: any[]): T },
    deserializer: (raw: any) => T,
    serializer: (raw: T) => any) {
    this.deserializers.set(prototype.name, deserializer);
    this.serializers.set(prototype.name, serializer);
  }

  deserialize<T>(raw: any): T {
    if (!isSerialized(raw)) {
      throw `Non Serialized input :(`;
    }

    const deserializer = this.deserializers.get(raw.className);
    if (!deserializer) {
      throw `No deserializer for ${raw.className}`;
    }

    return deserializer(raw.data);
  }

  serialize<T extends object>(raw: T): Serialized {
    const serializer = this.serializers.get(raw.constructor.name);
    if (!serializer) {
      throw `No serializer for ${raw.constructor.name}`;
    }

    return { serialized: true, className: raw.constructor.name, data: serializer(raw) };
  }

  canSerialize(raw: any) {
    return this.serializers.has(raw.constructor.name);
  }
}


// TODO(P2) describe serialized data structure for extra safety...
export const Serializer = new SerializeHelper(); 